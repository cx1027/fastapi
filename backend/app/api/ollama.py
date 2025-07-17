import ollama
from pydantic_settings import BaseSettings


class ModelConfig(BaseSettings):
    JOB_MODEL_NAME: str = "mixtral:8x7b"
    CANDIDATE_MODEL_NAME: str = "mixtral:8x7b"
    SCORE_MODEL_NAME: str = "mixtral:8x7b"


# def meeting_summary():
#     try:
#         conversation_string = load_conversation_data()
#         response = ollama.chat(model='gemma:2b', messages=[
#             {
#                 'role': 'system',
#                 'content': 'Your goal is to summarize the text that is given to you in roughly 300 words. It is from a meeting between one or more people. Only output the summary without any additional text. Focus on providing a summary in freeform text with a summary of what people said and the action items coming out of it.'
#             },
#             {
#                 'role': 'user',
#                 'content': conversation_string,
#             },
#         ])
#         return response['message']['content']
#     except Exception as e:
#         print(f"Error generating summary: {str(e)}")
#        return "Error generating summary"