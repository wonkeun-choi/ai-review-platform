import os
import httpx
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- CORS 허용 (web에서 요청 가능하게)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 환경변수 설정
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
APP_MODEL = os.getenv("APP_MODEL", "gemini-1.5-flash-latest")

if not GEMINI_API_KEY:
    raise ValueError("환경변수 GEMINI_API_KEY가 설정되어 있지 않습니다!")

# --- 코드 리뷰 엔드포인트
@app.post("/review")
async def review_code(code: str = Form(...)):
    prompt = f"""
아래 코드를 검토하고, 가독성 / 보안 / 성능 관점에서 핵심 피드백을 항목별로 작성해줘.
각 항목마다 bullet point로 정리하고, 필요시 간단한 수정 예시를 포함해줘.

코드:
{code}
"""
    url = f"{GEMINI_BASE_URL}/{APP_MODEL}:generateContent?key={GEMINI_API_KEY}"

    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
        data = resp.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception:
        text = f"오류가 발생했습니다: {data}"

    return {"status": "success", "review": text}

# --- 헬스체크
@app.get("/healthz")
def health():
    return {"ok": True, "service": "review-service"}
