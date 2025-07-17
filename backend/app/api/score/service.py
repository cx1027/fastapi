import json
import time
import os
from pathlib import Path
from dotenv import load_dotenv

import jsbeautifier
from langchain.schema import HumanMessage, SystemMessage
from langchain_openai import ChatOpenAI
from .config import score_config
from .prompts import fn_matching_analysis, system_prompt_matching
from app.api.utils import LOGGER

env_path = Path(__file__).parents[3] / '.env'
load_dotenv(dotenv_path=env_path)


def output2json(output):
    """GPT Output Object >>> json"""
    opts = jsbeautifier.default_options()
    return json.loads(jsbeautifier.beautify(output["tool_calls"][0]["function"]["arguments"], opts))


def generate_content(job, candidate):
    content = "\nRequirement:" + str(job) + "\nCandidate:" + str(candidate)
    return content


# def analyse_score(job_candidate_data):
#     start = time.time()
#     LOGGER.info("Start analyse scoring")
    
#     print("job_candidate_data.job!!!!!!!!!!!!!!:\n", job_candidate_data.job)
#     print("\njob_candidate_data.candidate!!!!!!!!!!!!!!:\n", job_candidate_data.candidate)

#     content = generate_content(job=job_candidate_data.job, candidate=job_candidate_data.candidate)

#     llm = ChatOpenAI(
#         base_url="http://localhost:11434/v1",
#         api_key="ollama",  # Ollama ignores the key, but LangChain requires it
#         model="gemma:2b"  # or "mixtral:8x7b" or any model you have pulled
#     )
#     completion = llm.predict_messages(
#         [
#             SystemMessage(content=system_prompt_matching),
#             HumanMessage(content=content),
#         ],
#         functions=fn_matching_analysis,
#     )
#     output_analysis = completion.content

#     json_output = output_analysis

#     # Extract scores and store them in a list
#     weights = {
#         "degree": 0.1,  # The importance of the candidate's degree
#         "experience": 0.2,  # The weight given to the candidate's relevant work experience
#         "technical_skill": 0.3,  # Weight for technical skills and qualifications
#         "responsibility": 0.25,  # How well the candidate's past responsibilities align with the job
#         "certificate": 0.1,  # The significance of relevant certifications
#         "soft_skill": 0.05,  # Importance of soft skills like communication, teamwork, etc.
#     }
#     total_weight = 0
#     weighted_score = 0

#     for section in json_output:
#         if section != "summary_comment":
#             weighted_score += int(json_output[section]["score"]) * weights[section]
#             total_weight += weights[section]

#     final_score = weighted_score / total_weight

#     json_output["score"] = final_score

#     LOGGER.info("Done analyse matching")
#     LOGGER.info(f"Time analyse matching: {time.time() - start}")

#     return json_output


def analyse_score(job_candidate_data):
    start = time.time()
    LOGGER.info("Start analyse matching")
    
    print("job_candidate_data.job!!!!!!!!!!!!!!:\n", job_candidate_data.job)
    print("\njob_candidate_data.candidate!!!!!!!!!!!!!!:\n", job_candidate_data.candidate)

    content = generate_content(job=job_candidate_data.job, candidate=job_candidate_data.candidate)

    llm = ChatOpenAI(
        openai_api_base=os.getenv("GROQ_API_BASE"),  # Groq endpoint
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        model=score_config.MODEL_NAME,
        temperature=0.5
        )
    completion = llm.predict_messages(
        [
            SystemMessage(content=system_prompt_matching),
            HumanMessage(content=content),
        ],
        functions=fn_matching_analysis,
    )
    output_analysis = completion.additional_kwargs

    json_output = output2json(output=output_analysis)

    # Extract scores and store them in a list
    weights = {
        "degree": 0.1,  # The importance of the candidate's degree
        "experience": 0.2,  # The weight given to the candidate's relevant work experience
        "technical_skill": 0.3,  # Weight for technical skills and qualifications
        "responsibility": 0.25,  # How well the candidate's past responsibilities align with the job
        "certificate": 0.1,  # The significance of relevant certifications
        "soft_skill": 0.05,  # Importance of soft skills like communication, teamwork, etc.
    }
    total_weight = 0
    weighted_score = 0

    for section in json_output:
        if section != "summary_comment":
            weighted_score += int(json_output[section]["score"]) * weights[section]
            total_weight += weights[section]

    final_score = weighted_score / total_weight

    json_output["score"] = final_score

    LOGGER.info("Done analyse matching")
    LOGGER.info(f"Time analyse matching: {time.time() - start}")

    return json_output