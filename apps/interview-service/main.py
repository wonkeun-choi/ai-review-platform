import os
import google.generativeai as genai
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

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
# 🚀 (신규) AI 면접관 역할 부여 (System Prompt)
# ----------------------------------------------------
INTERVIEWER_PROMPT = """
You are a senior technical interviewer at a major tech company. 
Your role is to conduct a technical interview based on the user's chosen topic.

Your task:
1.  Start by asking a foundational question about the chosen topic.
2.  Receive the user's answer.
3.  Provide brief, constructive feedback on their answer (e.g., "That's correct," "That's partially right, but you missed...", "Could you elaborate on...").
4.  After giving feedback, ask ONE clear follow-up question that builds upon their answer or explores a related concept.
5.  Maintain a professional, encouraging, yet challenging tone.
6.  Do NOT provide the full correct answer yourself, but guide the user toward it.
"""

# ----------------------------------------------------
# API Pydantic 모델 정의
# ----------------------------------------------------
class ChatMessage(BaseModel):
    role: str  # "user" or "model"
    text: str

class ChatRequest(BaseModel):
    topic: str               # e.g., "React", "Python", "Data Structures"
    history: List[ChatMessage] # 이전 대화 내용
    user_message: str        # 사용자의 현재 답변

# ----------------------------------------------------
# API 엔드포인트 정의
# ----------------------------------------------------
@app.post("/api/interview/chat")
async def handle_interview_chat(request: ChatRequest):
    if not model:
        return {"error": "Gemini AI model is not configured."}

    try:
        # 1. 대화 맥락(History) 구성
        #    [시스템 프롬프트] + [이전 대화] + [현재 사용자 메시지]
        formatted_history = [
            {"role": "user", "parts": [INTERVIEWER_PROMPT + f"\nThe chosen topic is: {request.topic}"]} ,
            {"role": "model", "parts": ["Understood. I will act as a senior technical interviewer. Let's begin."]}
        ]
        
        for msg in request.history:
            formatted_history.append({"role": msg.role, "parts": [msg.text]})
        
        # 현재 사용자 메시지 추가
        formatted_history.append({"role": "user", "parts": [request.user_message]})
        
        # 2. Gemini API 호출
        chat_session = model.start_chat(history=formatted_history[:-1]) # 마지막 메시지 제외하고 히스토리로 시작
        response = chat_session.send_message(request.user_message) # 마지막 메시지 전송
        
        # 3. AI의 응답 (다음 질문 또는 피드백) 반환
        return {"response": response.text}

    except Exception as e:
        return {"error": f"Failed to get chat response: {str(e)}"}

@app.get("/")
def read_root():
    return {"status": "Interview Service is running."}