import json
import time
import re
import os
from pathlib import Path
from dotenv import load_dotenv

import jsbeautifier
from langchain.schema import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from .config import job_config
from .prompts import fn_job_analysis, system_prompt_job
# from utils import LOGGER
from groq import Groq
from app.models import JobResponseSchema
# from app.api.utils import parse_response_to_schema

env_path = Path(__file__).parents[3] / '.env'
load_dotenv(dotenv_path=env_path)

def output2json(output):
    """GPT Output Object >>> json"""
    opts = jsbeautifier.default_options()
    return json.loads(jsbeautifier.beautify(output["tool_calls"][0]["function"]["arguments"], opts)) 

def analyse_job(job_data):
    start = time.time()

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
    json_output = output2json(output_analysis)
    print("Parsed JSON output:", json_output)

    return json_output





