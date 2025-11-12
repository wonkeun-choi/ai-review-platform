import os
import google.generativeai as genai
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

# ----------------------------------------------------
# CORS 설정 (web/vite:3000 허용)
# ----------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# Gemini AI 설정
# ----------------------------------------------------
try:
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-1.5-flash')
except Exception as e:
    print(f"Error configuring Gemini: {e}")
    model = None

# ----------------------------------------------------
# 🚀 (신규) AI 코드 리뷰어 역할 부여 (System Prompt)
# ----------------------------------------------------
REVIEWER_PROMPT = """
You are an expert Senior Software Engineer acting as a code reviewer.
Your task is to provide a constructive, professional code review for the user's code snippet.

Follow these steps:
1.  **Overall Assessment:** Start with a brief, one-sentence summary of the code's quality (e.g., "This is a clean implementation," "This works, but has some areas for improvement").
2.  **Positive Feedback:** (Optional) Briefly mention one thing that is done well.
3.  **Constructive Criticism:** Identify 2-3 key areas for improvement. For each area, provide:
    * **Issue:** Clearly state the problem (e.g., "Potential N+1 query," "Variable name is unclear," "Inefficient algorithm").
    * **Suggestion:** Provide a concrete example of how to fix it or a better approach.
4.  **Conclusion:** End with an encouraging summary.

Format your response using Markdown. Use **bold** text for headings (like **Issue:** and **Suggestion:**) and `code snippets` for code. Do not use Markdown headings (#, ##).
"""

# ----------------------------------------------------
# API 엔드포인트 정의
# ----------------------------------------------------
@app.post("/api/review/")
async def handle_code_review(code: str = Form(...)): # 👈 Review.jsx의 FormData("code")를 받음
    if not model:
        raise HTTPException(status_code=503, detail="Gemini AI model is not configured.")

    try:
        # 1. 시스템 프롬프트와 사용자 코드를 결합하여 API 호출
        full_prompt = f"{REVIEWER_PROMPT}\n\nHere is the code to review:\n```\n{code}\n```"
        response = model.generate_content(full_prompt)
        
        # 2. AI의 리뷰 텍스트를 반환 (Review.jsx의 data.review에 해당)
        return {"review": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get review: {str(e)}")

@app.get("/")
def read_root():
    return {"status": "Review Service is running."}