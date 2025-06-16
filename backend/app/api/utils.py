import re
from app.models import JobResponseSchema
import json

def parse_response_to_schema(response_text: str) -> JobResponseSchema:
    # Extract the JSON part from the response by finding content between curly braces
    json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
    print("json_match:", json_match)
    
    if json_match:
        json_str = json_match.group(0)
        print("Extracted JSON string:", json_str)  # Debug print
        try:
            data = json.loads(json_str)
            print("Parsed JSON data:", data)  # Debug print, must contains "name"!!!
            # Extract the parameters from the response
            params = data.get('parameters', {})
            print("params", params, "params.degree: ")
            print(params.get('degree', []))
            return JobResponseSchema(
                degree=params.get('degree', []),
                experience=params.get('experience', []),
                technical_skill=params.get('technical_skill', []),
                responsibility=params.get('responsibility', []),
                certificate=params.get('certificate', []),
                soft_skill=params.get('soft_skill', [])
            )
        except json.JSONDecodeError as e:
            print("JSON decode error:", e)  # Debug print
            pass
    
    # If JSON parsing fails, try to extract lists from the text
    return JobResponseSchema(
        degree=[],
        experience=[],
        technical_skill=[],
        responsibility=[],
        certificate=[],
        soft_skill=[]
    )