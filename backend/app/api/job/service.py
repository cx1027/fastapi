import json
import time
import re
import os
from pathlib import Path
from dotenv import load_dotenv

import ollama

import jsbeautifier
from langchain.schema import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from .config import job_config
from .prompts import fn_job_analysis, system_prompt_job
# from utils import LOGGER
from groq import Groq
from app.models import JobResponseSchema
# from app.api.utils import parse_response_to_schema
from app.api.utils import LOGGER

env_path = Path(__file__).parents[3] / '.env'
load_dotenv(dotenv_path=env_path)

def output2json(output):
    """GPT Output Object >>> json"""
    opts = jsbeautifier.default_options()
    return json.loads(jsbeautifier.beautify(output["tool_calls"][0]["function"]["arguments"], opts)) 

def analyse_job(job_data):
    start = time.time()
    
    print("job data:\n", job_data)

    llm = ChatOpenAI(
        openai_api_base=os.getenv("GROQ_API_BASE"),  # Groq endpoint
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        model=job_config.MODEL_NAME,
        temperature=0.5
        )
    completion = llm.predict_messages(
        [
            SystemMessage(content=system_prompt_job),
            HumanMessage(content=job_data.description),
        ],
        functions=fn_job_analysis,
    )
    output_analysis = completion.additional_kwargs
    print("job_data.description:\n", job_data.description)
    # print("job_data output_analysis:\n", output_analysis)
    json_output = output2json(output_analysis)
    print("Parsed JSON output:", json_output)

    return json_output



# def analyse_job(job_data):
#     start = time.time()
    
#     print("job data:\n", job_data)

#     llm = ChatOpenAI(
#         base_url="http://localhost:11434/v1",
#         api_key="ollama",  # Ollama ignores the key, but LangChain requires it
#         model="gemma:2b"  # or "mixtral:8x7b" or any model you have pulled
#     )
#     completion = llm.predict_messages(
#         [
#             SystemMessage(content=system_prompt_job),
#             HumanMessage(content=job_data.description),
#         ],
#         functions=fn_job_analysis,
#     )
#     output_analysis = completion.content
#     print("job_data.description:\n", job_data.description)
#     # print("job_data output_analysis:\n", output_analysis)
#     json_output = output_analysis
#     print("Parsed JSON output:", json_output)

#     return json_output

# # def analyse_job(job_data):
# #     start = time.time()
    
# #     print("job data:\n", job_data)

# #     response = ollama.chat(model="gemma:2b", messages=[
# #         {
# #             'role': 'system',
# #             'content': system_prompt_job
# #         },
# #         {
# #             'role': 'user',
# #             'content': job_data.description,
# #         },
# #     ])
# #     output_analysis = response['message']['content']
# #     json_output = output2json(output=output_analysis)

# #     LOGGER.info("Done analyse candidate")
# #     LOGGER.info(f"Time analyse candidate: {time.time() - start}")

# #     return json_output




