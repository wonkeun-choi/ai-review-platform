import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Form
from fastapi import HTTPException

MAX_CODE_LEN = 4000

# ---- 환경값 로드 (세션에서 덮어쓸 수 있음) ----
APP_MODEL = os.getenv("REVIEW_MODEL", "mistral:7b-instruct")
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434")

app = FastAPI(title="review-engine:diagnostics")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.get("/healthz")
def healthz():
    # 최소 헬스: 서버 살아있는지
    return {"ok": True, "service": "review-engine", "model": APP_MODEL}

@app.get("/debug/config")
def debug_config():
    # 서버가 실제로 어떤 값으로 올라왔는지 확인
    return {
        "model": APP_MODEL,
        "ollama_base_url": OLLAMA_BASE_URL,
    }

@app.get("/debug/ollama")
def debug_ollama():
    """
    1) Ollama 접속 가능?
    2) 모델 목록에서 대상 모델 존재?
    3) 간단 generate 호출 성공?
    """
    out = {
        "reachable": False,
        "has_model": False,
        "generate_ok": False,
        "error": None,
    }
    try:
        # 1) 태그 확인
        r = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        r.raise_for_status()
        out["reachable"] = True
        data = r.json()
        models = [m.get("name") for m in data.get("models", [])]
        out["models"] = models
        out["has_model"] = APP_MODEL in models

        # 2) 모델이 있으면 간단 호출
        if out["has_model"]:
            g = requests.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={"model": APP_MODEL, "prompt": "ping", "stream": False},
                timeout=20
            )
            if g.ok:
                gj = g.json()
                out["generate_ok"] = bool(gj.get("response"))
                out["generate_sample"] = gj.get("response", "")[:120]
            else:
                out["error"] = f"Ollama HTTP {g.status_code}"
    except Exception as e:
        out["error"] = str(e)
    return out

@app.post("/review")
def review_code(code: str = Form(...)):
    prompt = f"""
아래 코드를 검토하고, 개선점/보안/성능/가독성 관점에서 핵심 피드백을 항목별로 간결하게 작성해줘.
가능하면 구체적 코드 예시도 포함해줘.

코드:
{code}
"""
    try:
        r = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": APP_MODEL, "prompt": prompt, "stream": False},
            timeout=120
        )
        if not r.ok:
            # Ollama가 에러를 주면 그 메시지를 그대로 보여주자
            ct = r.headers.get("content-type","")
            err = r.json().get("error") if ct.startswith("application/json") else r.text
            return {"status":"error","message": err or f"Ollama HTTP {r.status_code}"}
        review_text = r.json().get("response", "").strip()
        if not review_text:
            return {"status":"error","message":"Empty response from model"}
        return {"status":"success","review": review_text}
    except Exception as e:
        return {"status":"error","message": str(e)}
    
@app.post("/review")
def review_code(code: str = Form(...)):
    if not code or not code.strip():
        raise HTTPException(status_code=400, detail="code is empty")

    if len(code) > MAX_CODE_LEN:
        raise HTTPException(status_code=413, detail=f"code too long (>{MAX_CODE_LEN} chars)")

    prompt = f"""
아래 코드를 검토하고, 개선점/보안/성능/가독성 관점에서 핵심 피드백을 항목별로 간결하게 작성해줘.
가능하면 구체적 코드 예시도 포함해줘.

코드:
{code}
"""
    try:
        r = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={"model": APP_MODEL, "prompt": prompt, "stream": False},
            timeout=120
        )
        if not r.ok:
            # Ollama가 주는 오류 메시지 최대한 그대로 전달
            msg = ""
            try:
                msg = r.json().get("error", "")
            except Exception:
                msg = r.text
            raise HTTPException(status_code=502, detail=msg or f"Ollama HTTP {r.status_code}")

        data = r.json()
        review_text = (data.get("response") or "").strip()
        if not review_text:
            raise HTTPException(status_code=502, detail="Empty response from model")
        return {"status": "success", "review": review_text}

    except HTTPException:
        raise
    except requests.Timeout:
        raise HTTPException(status_code=504, detail="Ollama timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))