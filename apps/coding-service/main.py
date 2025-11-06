import os
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# ----------------------------------------------------
# CORS 설정 (프론트엔드 http://localhost:3000 에서 오는 요청 허용)
# ----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# Gemini AI 설정 (.env 파일에서 키 읽어오기)
# ----------------------------------------------------
try:
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    model = None

# ----------------------------------------------------
# AI 코딩 문제 생성 프롬프트
# ----------------------------------------------------
CODING_PROBLEM_PROMPT = """
You are an expert algorithm problem creator for a tech company's coding test.
Please generate one new programming problem.
The problem should be at an 'easy' to 'medium' difficulty level.

Provide the output ONLY in the following JSON format, with no other text or markdown formatting before or after the JSON block:

{
  "title": "Problem Title",
  "description": "A clear problem description.",
  "constraints": [
    "Constraint 1 (e.g., Input array size)",
    "Constraint 2 (e.g., Time complexity)"
  ],
  "examples": [
    {
      "input": "Example input 1",
      "output": "Example output 1",
      "explanation": "Brief explanation for example 1."
    }
  ]
}
"""

# ----------------------------------------------------
# API 엔드포인트 정의
# ----------------------------------------------------
@app.get("/api/coding/problem/ai")
async def get_ai_coding_problem():
    if not model:
        return {"error": "Gemini AI model is not configured."}
    
    try:
        response = model.generate_content(CODING_PROBLEM_PROMPT)
        
        # AI가 반환한 텍스트 (JSON 형식)
        ai_response_text = response.text
        
        # (중요) AI 응답은 순수 텍스트이므로, 프론트엔드에서 
        # JSON.parse()를 사용하기 쉽도록 텍스트 그대로 반환합니다.
        # 또는 여기서 JSON으로 파싱해서 반환할 수도 있습니다.
        
        return {"ai_generated_problem": ai_response_text}

    except Exception as e:
        return {"error": f"Failed to generate problem: {str(e)}"}

@app.get("/")
def read_root():
    return {"status": "Coding Service is running."}