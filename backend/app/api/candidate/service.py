import json
import os
import time
from pathlib import Path
from datetime import datetime

import jsbeautifier
from langchain.schema import HumanMessage, SystemMessage
from langchain_community.document_loaders import Docx2txtLoader, PyPDFLoader
from langchain_openai import ChatOpenAI
from .config import candidate_config
from .prompts import fn_candidate_analysis, system_prompt_candidate
from app.api.utils import LOGGER

from dotenv import load_dotenv
import ollama

env_path = Path(__file__).parents[3] / '.env'
load_dotenv(dotenv_path=env_path)

async def save_cv_candidate(file):
    try:
        # Ensure the upload directory exists
        os.makedirs(candidate_config.CV_UPLOAD_DIR, exist_ok=True)

        # Prepend the current datetime to the filename
        file_name = datetime.now().strftime("%Y%m%d%H%M%S-") + file.filename

        # Construct the full file path
        file_path = os.path.join(candidate_config.CV_UPLOAD_DIR, file_name)

        # Read the contents of the uploaded file asynchronously
        contents = await file.read()

        # Write the uploaded contents to the specified file path
        with open(file_path, "wb") as f:
            f.write(contents)

        LOGGER.info(f"File saved successfully: {file_path}")
        return file_name
    except Exception as e:
        LOGGER.error(f"Error saving file: {str(e)}")
        raise


def output2json(output):
    """GPT Output Object >>> json"""
    opts = jsbeautifier.default_options()
    return json.loads(jsbeautifier.beautify(output["tool_calls"][0]["function"]["arguments"], opts))


def load_pdf_docx(file_path):
    # Determine the file type and choose the appropriate loader
    if os.path.basename(file_path).lower().endswith((".pdf", ".docx")):
        loader = (
            PyPDFLoader(file_path)
            if file_path.lower().endswith(".pdf")
            else Docx2txtLoader(file_path)
        )

    # Load and split the document using the selected loader
    documents = loader.load_and_split()

    return documents


def read_cv_candidate(file_name):
    file_path = candidate_config.CV_UPLOAD_DIR + '/' + file_name

    documents = load_pdf_docx(file_path=file_path)
    content = ""
    for page in documents:
        content += page.page_content
    return content


def analyse_candidate(cv_content):
    start = time.time()
    LOGGER.info("Start analyse candidate")

    llm = ChatOpenAI(
        openai_api_base=os.getenv("GROQ_API_BASE"),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        model=candidate_config.MODEL_NAME,
        temperature=0.5
        )
    completion = llm.predict_messages(
        [
            SystemMessage(content=system_prompt_candidate),
            HumanMessage(content=cv_content),
        ],
        functions=fn_candidate_analysis,
    )

    output_analysis = completion.additional_kwargs
    json_output = output2json(output=output_analysis)

    LOGGER.info("Done analyse candidate")
    LOGGER.info(f"Time analyse candidate: {time.time() - start}")

    return json_output

# def analyse_candidate(cv_content):
#     start = time.time()
#     LOGGER.info("Start analyse candidate")

#     llm = ChatOpenAI(
#         base_url="http://localhost:11434/v1",
#         api_key="ollama",  # Ollama ignores the key, but LangChain requires it
#         model="gemma:2b"  # or "mixtral:8x7b" or any model you have pulled
#     )
#     completion = llm.predict_messages(
#         [
#             SystemMessage(content=system_prompt_candidate),
#             HumanMessage(content=cv_content),
#         ],
#         functions=fn_candidate_analysis,
#     )

#     print("\n !!!!!!candidate completion:\n", completion)
#     output_analysis = completion.content
#     print("\n !!!!!!candidate output_analysis:\n", output_analysis)
#     json_output = output_analysis

#     LOGGER.info("Done analyse candidate")
#     LOGGER.info(f"Time analyse candidate: {time.time() - start}")

#     return json_output

# # def analyse_candidate(cv_content):
# #     start = time.time()
# #     LOGGER.info("Start analyse candidate")

# #     # model_name = os.getenv("CANDIDATE_MODEL_NAME", "mixtral:8x7b")
# #     response = ollama.chat(model="gemma:2b", messages=[
# #         {
# #             'role': 'system',
# #             'content': system_prompt_candidate
# #         },
# #         {
# #             'role': 'user',
# #             'content': cv_content,
# #         },
# #     ])
# #     print("\n !!!!!!response:\n", response)
# #     output_analysis = response['message']['content']
# #     print("\n !!!!!!candidateoutput_analysis:\n", output_analysis)
# #     json_output = output2json(output=output_analysis)

# #     LOGGER.info("Done analyse candidate")
# #     LOGGER.info(f"Time analyse candidate: {time.time() - start}")

# #     return json_output
