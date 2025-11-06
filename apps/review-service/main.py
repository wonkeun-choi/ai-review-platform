import os
import logging
import asyncio
import httpx
from typing import List, Optional

from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

# ----------------------------
# 기본 설정
# ----------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

MAX_CODE_LEN = 4000

# --- [Gemini 설정] ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY 환경변수를 설정해야 합니다.")

GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"
APP_MODEL = "gemini-2.5-pro"

GEN_TIMEOUT = int(os.getenv("GEN_TIMEOUT", "180"))
HTTPX_TIMEOUT = httpx.Timeout(timeout=GEN_TIMEOUT, connect=30.0, read=GEN_TIMEOUT, write=GEN_TIMEOUT)

# ----------------------------
# (중요) FastAPI 앱 생성
# ----------------------------
app = FastAPI(title="review-engine:gemini")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ----------------------------
# 전역 HTTP 클라이언트
# ----------------------------
_async_client: Optional[httpx.AsyncClient] = None

@app.on_event("startup")
async def _startup():
    global _async_client
    _async_client = httpx.AsyncClient(
        timeout=HTTPX_TIMEOUT,
        limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
        headers={"Accept": "application/json"},
    )

@app.on_event("shutdown")
async def _shutdown():
    global _async_client
    if _async_client is not None:
        await _async_client.aclose()
        _async_client = None

# ----------------------------
# 공용 유틸 (Gemini API 호출)
# ----------------------------
async def call_gemini_generate_async(prompt: str) -> str:
    """
    Gemini API (Google AI Studio) 비동기 호출. 전역 AsyncClient 재사용.
    """
    if _async_client is None:
        raise HTTPException(status_code=500, detail="HTTP client not ready")

    url = f"{GEMINI_BASE_URL}/{APP_MODEL}:generateContent?key={GEMINI_API_KEY}"

    payload = {
        "contents": [
            {"parts": [{"text": prompt}]}
        ],
        "generationConfig": {
            "maxOutputTokens": 8192,
            "temperature": 0.2,
            "topP": 0.9,
            "topK": 40
        },
        "safetySettings": [
            {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
            {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
        ]
    }

    try:
        r = await _async_client.post(url, json=payload)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Gemini API timeout")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API connection error: {e}")

    if r.status_code >= 400:
        try:
            msg = r.json().get("error", {}).get("message", r.text)
        except Exception:
            msg = r.text
        if r.status_code == 429:
            msg = "Gemini API rate limit (60 RPM) exceeded. (무료 티어 속도 제한 초과)"
        logging.error(f"Gemini API Error: {msg}")
        raise HTTPException(status_code=502, detail=msg or f"Gemini API HTTP {r.status_code}")

    try:
        data = r.json()
        out = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        if not out:
            raise HTTPException(status_code=502, detail="Empty response from Gemini model")
        return out
    except Exception as e:
        logging.error(f"Gemini response parsing error: {e}\nResponse: {r.text}")
        raise HTTPException(status_code=502, detail=f"Gemini response parsing error: {e}")

# ----------------------------
# (이하 기존 코드들)
# ----------------------------

def validate_code_or_400(code: Optional[str]) -> str:
    if not code or not code.strip():
        raise HTTPException(status_code=400, detail="code is empty")
    if len(code) > MAX_CODE_LEN:
        raise HTTPException(status_code=413, detail=f"code too long (>{MAX_CODE_LEN} chars)")
    return code


def build_prompt(code: str) -> str:
    return f"""
아래 코드를 검토하고, 개선점/보안/성능/가독성 관점에서 핵심 피드백을 항목별로 간결하게 작성해줘.
가능하면 구체적 코드 예시도 포함해줘.

코드:
{code}
""".strip()

# ----------------------------
# 모델 (JSON용)
# ----------------------------
class ReviewRequest(BaseModel):
    code: str = Field(..., description="Source code to review")

# ----------------------------
# 헬스/디버그
# ----------------------------
@app.get("/healthz")
def healthz():
    return {"ok": True, "service": "review-engine", "model": APP_MODEL}

@app.get("/debug/config")
def debug_config():
    return {"model": APP_MODEL, "gemini_base_url": GEMINI_BASE_URL, "timeout_sec": GEN_TIMEOUT}

# ----------------------------
# 리뷰 (Form/JSON) - 비동기
# ----------------------------
@app.post("/review")
async def review_code_form(code: str = Form(...)): 
    code = validate_code_or_400(code)
    prompt = build_prompt(code)
    logging.info("Review request (form) len=%d", len(code))
    review_text = await call_gemini_generate_async(prompt)
    return {"status": "success", "review": review_text}

@app.post("/review.json")
async def review_code_json(body: ReviewRequest):
    code = validate_code_or_400(body.code)
    prompt = build_prompt(code)
    logging.info("Review request (json) len=%d", len(code))
    review_text = await call_gemini_generate_async(prompt)
    return {"status": "success", "review": review_text}

# ----------------------------
# 페르소나 프롬프트
# ----------------------------
PERSONA_GUIDES = {
    "ai": (
        "너는 기술적으로 엄격한 코드리뷰어다. 오류/비효율/안정성/일관성 중심으로 "
        "핵심 5개 이하 bullet로 간결히 피드백하라. 가능하면 짧은 코드패치 예시를 포함하라."
    ),
    "peer": (
        "너는 같은 팀 동료다. 협업 관점에서 읽기 쉬움, 네이밍, 모듈성, 테스트 용이성, "
        "팀 컨벤션 일치 여부를 중점으로 피드백하라. 제안은 부드럽게, 근거는 구체적으로."
    ),
    "mentor": (
        "너는 시니어 멘토다. '왜'를 설명하고 학습 포인트를 제공하라. 대안을 단계별로 안내하고 "
        "초보자도 이해할 수 있도록 친절하게 설명하라. 필요하면 작은 예시 코드를 포함하라."
    ),
}

def build_persona_prompt(code: str, persona: str) -> str:
    guide = PERSONA_GUIDES.get(persona, PERSONA_GUIDES["ai"])
    return f"""{guide}

[출력 형식]
- bullet 목록(최대 5개)
- 각 bullet: 문제요약 → 원인/영향 → 간단 패치 예시(필요 시 코드블록)

[입력 코드]
{code}
""".strip()

# 프롬프트 미리보기
class PromptPreviewRequest(BaseModel):
    code: str
    personas: Optional[List[str]] = ["ai", "peer", "mentor"]

@app.post("/debug/prompt")
def debug_prompt(body: PromptPreviewRequest):
    code = validate_code_or_400(body.code)
    personas = body.personas or ["ai", "peer", "mentor"]

    allowed = set(PERSONA_GUIDES.keys())
    personas = [p for p in personas if p in allowed]
    if not personas:
        raise HTTPException(status_code=400, detail="no valid personas; allowed: ai, peer, mentor")

    prompts = {p: build_persona_prompt(code, p) for p in personas}
    return {"ok": True, "personas": personas, "prompts": prompts}

# ----------------------------
# 멀티 리뷰 (병렬 호출)
# ----------------------------
class MultiReviewRequest(BaseModel):
    code: str
    personas: Optional[List[str]] = ["ai", "peer", "mentor"]

@app.post("/review/multi")
async def review_multi(body: MultiReviewRequest):
    code = validate_code_or_400(body.code)
    personas = body.personas or ["ai", "peer", "mentor"]

    allowed = set(PERSONA_GUIDES.keys())
    personas = [p for p in personas if p in allowed]
    if not personas:
        raise HTTPException(status_code=400, detail="no valid personas; allowed: ai, peer, mentor")

    prompts = {p: build_persona_prompt(code, p) for p in personas}
    tasks = [call_gemini_generate_async(prompts[p]) for p in personas]
    results = await asyncio.gather(*tasks)
    reviews = {p: text for p, text in zip(personas, results)}
    return {"status": "success", "personas": personas, "reviews": reviews}

# ----------------------------
# Interview (비동기)
# ----------------------------
class InterviewPromptRequest(BaseModel):
    code: str
    level: Optional[str] = "mix"
    n: Optional[int] = 5

def build_interview_prompt(code: str, level: str = "mix", n: int = 5) -> str:
    level = (level or "mix").lower()
    n = max(1, min(int(n or 5), 10))
    return f"""
너는 시니어 면접관이다. 아래 코드를 기반으로 {n}개의 기술 면접 질문을 생성하라.
- 레벨: {level} (mix면 난이도 분배: easy/medium/hard 고르게)
- 각 질문 형식:
  - Q: (짧고 명확한 질문)
  - Why-it-matters: (현업 관점 한 줄)
  - Hints: (키워드 2~4개)
  - Model Answer: (핵심만 3~6줄)
  - Follow-up: (꼬리질문 1개)
--- 코드 ---
{code}
""".strip()

@app.post("/debug/interview-prompt")
def debug_interview_prompt(body: InterviewPromptRequest):
    code = validate_code_or_400(body.code)
    prompt = build_interview_prompt(code, body.level, body.n)
    return {"ok": True, "level": body.level, "n": body.n, "prompt": prompt}

@app.post("/interview")
async def interview(body: InterviewPromptRequest):
    code = validate_code_or_400(body.code)
    prompt = build_interview_prompt(code, body.level, body.n)
    logging.info("Interview gen (n=%s, level=%s)", body.n, body.level)
    text = await call_gemini_generate_async(prompt) 
    return {"status": "success", "level": body.level, "n": body.n, "qa": text}

# ----------------------------
# 홈 (간단 데모 UI) - (중요) 파일 맨 마지막에 위치
# ----------------------------
@app.get("/", response_class=HTMLResponse)
def home():
    return """
<!doctype html>
<meta charset="utf-8" />
<title>AI Code Review – Multi Persona (Gemini)</title>
<style>
  body { font-family: ui-sans-serif, system-ui, Arial; max-width: 980px; margin: 40px auto; padding: 0 16px; }
  textarea { width: 100%; height: 180px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
  button { padding: 10px 14px; margin-right: 8px; }
  .row { display:flex; gap:12px; }
  .col { flex:1; min-width: 0; }
  pre { background:#0f172a; color:#e2e8f0; padding:12px; border-radius:8px; overflow:auto; white-space:pre-wrap; word-break:break-word; }
  label { font-size: 14px; margin-right: 6px; }
  input, select { padding: 6px 8px; }
  #status { margin-left: 8px; font-size: 14px; color: #16a34a; }
</style>

<h2>AI Code Review (AI / Peer / Mentor) - Gemini API</h2>
<p>코드를 입력하고 <b>Review</b> 또는 <b>Interview</b> 버튼을 눌러보세요.</p>

<textarea id="code">def add(a,b): return a+b</textarea><br/>

<div style="margin:8px 0 16px 0;">
  <button id="btnReview">Review</button>
  <span id="status"></span>
</div>

<div style="margin:8px 0 16px 0;">
  <label for="level">Level</label>
  <select id="level">
    <option value="mix" selected>mix</option>
    <option value="easy">easy</option>
    <option value="medium">medium</option>
    <option value="hard">hard</option>
  </select>
  <label for="count">Questions</label>
  <input id="count" type="number" min="1" max="10" value="5" style="width:70px" />
  <button id="btnInterview">Interview</button>
  <span id="istatus" style="margin-left:8px; color:#2563eb;"></span>
</div>

<div class="row">
  <div class="col"><h3>AI</h3><pre id="ai"></pre></div>
  <div class="col"><h3>Peer</h3><pre id="peer"></pre></div>
  <div class="col"><h3>Mentor</h3><pre id="mentor"></pre></div>
</div>

<h3 style="margin-top:20px">Interview Q/A</h3>
<pre id="qa"></pre>

<script>
const $ = (s)=>document.querySelector(s);

// 리뷰 호출
$("#btnReview").onclick = async () => {
  const code = $("#code").value;
  $("#status").textContent = "요청 중...";
  $("#ai").textContent = $("#peer").textContent = $("#mentor").textContent = "";
  try {
    const res = await fetch("/api/review/multi", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ code, personas:["ai","peer","mentor"] })
    });
    const json = await res.json();
    if(json.status !== "success") throw new Error(JSON.stringify(json));
    $("#ai").textContent = json.reviews.ai || "";
    $("#peer").textContent = json.reviews.peer || "";
    $("#mentor").textContent = json.reviews.mentor || "";
    $("#status").textContent = "완료";
  } catch (e) {
    $("#status").textContent = "에러";
    $("#ai").textContent = String(e);
  }
};

// 인터뷰 호출
$("#btnInterview").onclick = async () => {
  const code = $("#code").value;
  const level = $("#level").value || "mix";
  const n = Math.max(1, Math.min(parseInt($("#count").value || "5", 10), 10));
  $("#istatus").textContent = "질문 생성 중...";
  $("#qa").textContent = "";
  try {
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ code, level, n })
    });
    const json = await res.json();
    if(json.status !== "success") throw new Error(JSON.stringify(json));
    $("#qa").textContent = json.qa || "";
    $("#istatus").textContent = "완료";
  } catch (e) {
    $("#istatus").textContent = "에러";
    $("#qa").textContent = String(e);
  }
};
</script>
"""