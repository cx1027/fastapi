import json
import time
import re

import jsbeautifier
# from langchain.schema import HumanMessage, SystemMessage
# from langchain_openai import ChatOpenAI
# from config import job_config
from .prompts import fn_job_analysis, system_prompt_job
# from utils import LOGGER
from groq import Groq
from app.models import JobResponseSchema
from app.api.utils import parse_response_to_schema

client = Groq(api_key = 'Groq Key')


def output2json(output):
    """GPT Output Object >>> json"""
    opts = jsbeautifier.default_options()
    return json.loads(jsbeautifier.beautify(output["function_call"]["arguments"], opts))


# def analyse_job(job_data):
#     start = time.time()
#     LOGGER.info("Start analyse job")

#     llm = ChatOpenAI(model=job_config.MODEL_NAME, temperature=0.5)
#     completion = llm.predict_messages(
#         [
#             SystemMessage(content=system_prompt_job),
#             HumanMessage(content=job_data.job_description),
#         ],
#         functions=fn_job_analysis,
#     )
#     output_analysis = completion.additional_kwargs

#     json_output = output2json(output=output_analysis)

#     LOGGER.info("Done analyse job")
#     LOGGER.info(f"Time analyse job: {time.time() - start}")

#     return json_output

# def parse_response_to_schema(response_text: str) -> JobResponseSchema:
#     # Extract the JSON part from the response
#     json_match = re.search(r'``````', response_text, re.DOTALL)
#     if not json_match:
#         json_match = re.search(r'```\n(.*?)\n```', response_text, re.DOTALL)
    
#     if json_match:
#         json_str = json_match.group(1)
#         try:
#             data = json.loads(json_str)
#             # Extract the parameters from the response
#             params = data.get('parameters', {})
#             return JobResponseSchema(
#                 degree=params.get('degree', []),
#                 experience=params.get('experience', []),
#                 technical_skill=params.get('technical_skill', []),
#                 responsibility=params.get('responsibility', []),
#                 certificate=params.get('certificate', []),
#                 soft_skill=params.get('soft_skill', [])
#             )
#         except json.JSONDecodeError:
#             pass
    
#     # If JSON parsing fails, try to extract lists from the text
#     return JobResponseSchema(
#         degree=[],
#         experience=[],
#         technical_skill=[],
#         responsibility=[],
#         certificate=[],
#         soft_skill=[]
#     )

def analyse_job(job_data):
    start = time.time()
    # LOGGER.info("Start analyse job")

    # llm = ChatOpenAI(model=job_config.MODEL_NAME, temperature=0.5)
    prompt = f"{system_prompt_job}\n\nJob Description:\n{job_data.description}\n\nPlease analyze the above job description and provide the following information:\n{json.dumps(fn_job_analysis, indent=2)}"
    
    completion = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}]
                )
    
    # Note: if the response does not contains a parameters key, then the returns body is empty!!! todo: update prompt        
    response = completion.choices[0].message
    
    
    # Parse the response into the correct schema format
    result = parse_response_to_schema(response.content)
    return result
    # completion = llm.predict_messages(
    #     [
    #         SystemMessage(content=system_prompt_job),
    #         HumanMessage(content=job_data.job_description),
    #     ],
    #     functions=fn_job_analysis,
    # )
    # output_analysis = completion.additional_kwargs

    # json_output = output2json(output=output_analysis)

    # LOGGER.info("Done analyse job")
    # LOGGER.info(f"Time analyse job: {time.time() - start}")

    # return json_output





