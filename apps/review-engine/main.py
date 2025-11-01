import os
import logging
import requests
import asyncio
import httpx
from typing import List, Optional

from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ----------------------------
# 기본 설정
# ----------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

MAX_CODE_LEN = 4000
APP_MODEL = os.getenv("REVIEW_MODEL", "mistral:7b-instruct")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
GEN_TIMEOUT = int(os.getenv("GEN_TIMEOUT", "120"))

app = FastAPI(title="review-engine:diagnostics")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

# ----------------------------
# 공용 유틸
# ----------------------------
def call_ollama_generate(prompt: str) -> str:
    """
    Ollama /api/generate 호출. 에러는 HTTPException으로 승격.
    """
    try:
        r = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": APP_MODEL, "prompt": prompt, "stream": False},
            timeout=GEN_TIMEOUT,
        )
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Ollama timeout")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ollama connection error: {e}")

    if not r.ok:
        # 가능한 한 Ollama 메시지를 그대로 노출
        try:
            msg = r.json().get("error", "")
        except Exception:
            msg = r.text
        raise HTTPException(status_code=502, detail=msg or f"Ollama HTTP {r.status_code}")

    data = r.json()
    review_text = (data.get("response") or "").strip()
    if not review_text:
        raise HTTPException(status_code=502, detail="Empty response from model")
    return review_text


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
    return {"model": APP_MODEL, "ollama_base_url": OLLAMA_BASE_URL, "timeout_sec": GEN_TIMEOUT}

@app.get("/debug/ollama")
def debug_ollama():
    """
    1) Ollama 접속 가능?
    2) 모델 목록에 대상 모델 존재?
    3) 간단 generate 호출 성공?
    """
    out = {
        "reachable": False,
        "has_model": False,
        "generate_ok": False,
        "error": None,
        "models": [],
    }
    try:
        r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        r.raise_for_status()
        out["reachable"] = True
        tags = r.json()
        models = [m.get("name") for m in tags.get("models", [])]
        out["models"] = models
        out["has_model"] = APP_MODEL in models

        if out["has_model"]:
            g = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={"model": APP_MODEL, "prompt": "ping", "stream": False},
                timeout=20,
            )
            if g.ok:
                gj = g.json()
                out["generate_ok"] = bool(gj.get("response"))
                out["generate_sample"] = (gj.get("response") or "")[:120]
            else:
                out["error"] = f"Ollama HTTP {g.status_code}"
    except Exception as e:
        out["error"] = str(e)
    return out


# ----------------------------
# 리뷰 (Form)
# ----------------------------
@app.post("/review")
def review_code_form(code: str = Form(...)):
    code = validate_code_or_400(code)
    prompt = build_prompt(code)
    logging.info("Review request (form) len=%d", len(code))
    review_text = call_ollama_generate(prompt)
    return {"status": "success", "review": review_text}

# ----------------------------
# 리뷰 (JSON)
# ----------------------------
@app.post("/review.json")
def review_code_json(body: ReviewRequest):
    code = validate_code_or_400(body.code)
    prompt = build_prompt(code)
    logging.info("Review request (json) len=%d", len(code))
    review_text = call_ollama_generate(prompt)
    return {"status": "success", "review": review_text}

# === personas: 역할별 가이드 ===
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
    """
    같은 코드라도 persona에 따라 관점/톤이 달라지도록 지시문을 생성한다.
    - persona: "ai" | "peer" | "mentor"
    - 반환: LLM에 보낼 프롬프트 문자열 (모델 호출은 아직 안 함)
    """
    guide = PERSONA_GUIDES.get(persona, PERSONA_GUIDES["ai"])
    return f"""
{guide}

[출력 형식]
- bullet 목록(최대 5개)
- 각 bullet: 문제요약 → 원인/영향 → 간단 패치 예시(필요 시 코드블록)

[입력 코드]
{code}

""".strip()

# === [ADD] 프롬프트 미리보기: 모델 호출 없이 프롬프트만 반환 ===

class PromptPreviewRequest(BaseModel):
    code: str
    personas: Optional[List[str]] = ["ai", "peer", "mentor"]

@app.post("/debug/prompt")
def debug_prompt(body: PromptPreviewRequest):
    """
    입력 코드와 personas 배열을 받아, 각 persona에 대해 생성될 '프롬프트'를 미리 보여준다.
    - 실제 모델 호출은 하지 않는다.
    """
    # 기존에 이미 정의해 둔 입력 검증 함수 재사용 (없다면 아래 두 줄로 대체)
    # code = validate_code_or_400(body.code)
    # -> 만약 validate_code_or_400이 없다면:
    code = body.code
    if not code or not code.strip():
        raise HTTPException(status_code=400, detail="code is empty")

    personas = body.personas or ["ai", "peer", "mentor"]

    # 허용된 페르소나만 남기기
    allowed = set(PERSONA_GUIDES.keys())
    personas = [p for p in personas if p in allowed]
    if not personas:
        raise HTTPException(status_code=400, detail="no valid personas; allowed: ai, peer, mentor")

    prompts = {p: build_persona_prompt(code, p) for p in personas}
    return {"ok": True, "personas": personas, "prompts": prompts}

class MultiReviewRequest(BaseModel):
    code: str
    personas: Optional[List[str]] = ["ai", "peer", "mentor"]  # 기본 3종
    
# === [ADD] 멀티플렉스 리뷰: 페르소나별로 모델 호출해 묶어서 반환 ===
@app.post("/review/multi")
async def review_multi(body: MultiReviewRequest):
    # 1) 입력 검증
    code = validate_code_or_400(body.code)
    personas = body.personas or ["ai", "peer", "mentor"]

    # 2) 허용 페르소나만 필터
    allowed = set(PERSONA_GUIDES.keys())
    personas = [p for p in personas if p in allowed]
    if not personas:
        raise HTTPException(status_code=400, detail="no valid personas; allowed: ai, peer, mentor")

    # 3) 프롬프트 만들기
    prompts = {p: build_persona_prompt(code, p) for p in personas}

    # 4) 병렬 호출
    tasks = [call_ollama_generate_async(prompts[p]) for p in personas]
    results = await asyncio.gather(*tasks)

    # 5) 매핑
    reviews = {p: text for p, text in zip(personas, results)}
    return {"status": "success", "personas": personas, "reviews": reviews}

async def call_ollama_generate_async(prompt: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=GEN_TIMEOUT) as client:
            r = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={"model": APP_MODEL, "prompt": prompt, "stream": False},
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama timeout")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Ollama connection error: {e}")

    if r.status_code >= 400:
        try:
            msg = r.json().get("error", "")
        except Exception:
            msg = r.text
        raise HTTPException(status_code=502, detail=msg or f"Ollama HTTP {r.status_code}")

    data = r.json()
    review_text = (data.get("response") or "").strip()
    if not review_text:
        raise HTTPException(status_code=502, detail="Empty response from model")
    return review_text