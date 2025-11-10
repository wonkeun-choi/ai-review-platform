import os
import re
import json
import uuid
import random
import logging
import httpx
import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ----------------------------------------------------
# App & Logging
# ----------------------------------------------------
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("coding-service")

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# Gemini 설정
# ----------------------------------------------------
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")

try:
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    model = genai.GenerativeModel(MODEL_NAME)
    log.info(f"Gemini model configured: {MODEL_NAME}")
except Exception as e:
    log.error(f"Error configuring Gemini: {e}")
    model = None

# ----------------------------------------------------
# Judge0 HTTP 클라이언트
# ----------------------------------------------------
problem_cache: dict[str, list[dict]] = {}

try:
    judge0_url = os.environ.get("JUDGE0_URL", "http://judge0-api:2358")
    http_client = httpx.AsyncClient(base_url=judge0_url)
    log.info(f"Judge0 base URL = {judge0_url}")
except Exception as e:
    log.error(f"Error initializing httpx client: {e}")
    http_client = None

LANGUAGE_IDS = {
    "python": 71,
    "javascript": 93,
    "c": 7,
    "cpp": 12,
    "java": 25,
    "swift": 44,
    "kotlin": 27,
}

# ----------------------------------------------------
# 유틸: Gemini 응답에서 JSON만 안전 추출
# ----------------------------------------------------
def extract_json(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE)
    m = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
    if not m:
        raise ValueError("No JSON object found in model output")
    return json.loads(m.group(0))

# Gemini 응답에서 텍스트 안전 추출
def _safe_extract_text(resp) -> str:
    try:
        if not getattr(resp, "candidates", None):
            return ""
        parts = getattr(resp.candidates[0].content, "parts", None) or []
        texts = []
        for p in parts:
            t = getattr(p, "text", None)
            if t:
                texts.append(t)
        return "\n".join(texts).strip()
    except Exception:
        return ""

# ----------------------------------------------------
# 요청 모델
# ----------------------------------------------------
class ProblemRequest(BaseModel):
    difficulty: str = "Medium"
    topic: str = None

# ----------------------------------------------------
# 문제 생성 API
# ----------------------------------------------------
@app.post("/api/coding/problem/generate")
async def generate_ai_coding_problem(request: ProblemRequest):
    if not model:
        return {"error": "Gemini AI model is not configured."}

    possible_topics = [
        "Algorithms", "Data Structures", "Graphs",
        "Dynamic Programming", "Greedy", "Search", "Simulation"
    ]
    topic = request.topic or random.choice(possible_topics)
    difficulty = request.difficulty or random.choice(["Easy", "Medium", "Hard"])

    prompt = f"""
You are a professional algorithm problem creator for technical interviews.

Generate one completely new and original coding problem in Korean.

Requirements:
1) 난이도: {difficulty} (대기업 코딩 테스트 수준, 예: 삼성, 네이버, 카카오, 쿠팡)
2) 문제 유형: {topic}
3) 모든 텍스트(제목, 설명, 제약, 예제)를 반드시 한국어로 작성할 것
4) 이전에 나온 문제와 유사하지 않게 새롭게 생성할 것
5) 아래 JSON 형식만 반환 (코드펜스, 영어, 설명, 주석 없이)

반환 형식(JSON만 출력):
{{
  "title": "문제 제목",
  "description": "문제 설명 (입력/출력 형식 포함)",
  "constraints": ["제약 조건 1", "제약 조건 2"],
  "examples": [
    {{"input": "예제 입력", "output": "예제 출력", "explanation": "설명"}}
  ],
  "hiddenTestCases": [
    {{"input": "히든 입력 1", "expectedOutput": "출력 1"}},
    {{"input": "히든 입력 2", "expectedOutput": "출력 2"}},
    {{"input": "히든 입력 3", "expectedOutput": "출력 3"}},
    {{"input": "히든 입력 4", "expectedOutput": "출력 4"}},
    {{"input": "히든 입력 5", "expectedOutput": "출력 5"}}
  ]
}}
""".strip()

    gen_cfgs = [
        GenerationConfig(temperature=0.9, top_p=0.9, top_k=40, max_output_tokens=2048),
        GenerationConfig(temperature=0.6, top_p=0.8, top_k=32, max_output_tokens=1536),
    ]

    last_err = None
    for attempt, gen_cfg in enumerate(gen_cfgs, start=1):
        try:
            resp = model.generate_content(prompt, generation_config=gen_cfg)
            fr = None
            if getattr(resp, "candidates", None):
                fr = getattr(resp.candidates[0], "finish_reason", None)
            log.info(f"[Gemini] attempt={attempt} finish_reason={fr}")

            raw = _safe_extract_text(resp)
            if not raw:
                raise ValueError(f"Empty response (attempt={attempt}, finish_reason={fr})")

            log.info("Gemini raw (first 300): %s", raw[:300])

            full_problem_data = extract_json(raw)
            hidden = full_problem_data.get("hiddenTestCases") or []
            if not isinstance(hidden, list) or len(hidden) == 0:
                raise ValueError("AI did not provide valid hiddenTestCases")

            problem_id = str(uuid.uuid4())
            problem_cache[problem_id] = hidden

            public_problem_data = {
                "id": problem_id,
                "title": full_problem_data.get("title"),
                "description": full_problem_data.get("description"),
                "constraints": full_problem_data.get("constraints") or [],
                "examples": full_problem_data.get("examples") or [],
            }

            log.info("✅ Final problem: %s", json.dumps(public_problem_data, ensure_ascii=False)[:300])
            return {"problem": public_problem_data}

        except Exception as e:
            last_err = str(e)
            log.warning(f"[Gemini] attempt={attempt} failed: {last_err}")

    log.error("Problem generation failed after retries: %s", last_err)
    return {"error": "Problem generation failed", "detail": last_err}

# ----------------------------------------------------
# 코드 실행 / 채점
# ----------------------------------------------------
async def execute_code(code: str, language: str, input_data: str) -> dict:
    if not http_client:
        return {"error": "Judge0 http client not initialized.", "output": ""}

    language_id = LANGUAGE_IDS.get(language.lower())
    if not language_id:
        return {"error": f"Unsupported language: {language}", "output": ""}

    payload = {
        "source_code": code,
        "language_id": language_id,
        "stdin": input_data,
        "wait": "true",
    }

    try:
        resp = await http_client.post("/submissions", json=payload, timeout=10.0)
        resp.raise_for_status()
        result = resp.json()

        output = result.get("stdout") or ""
        stderr = result.get("stderr") or ""
        status_desc = (result.get("status") or {}).get("description")
        status_id = (result.get("status") or {}).get("id")

        if status_desc not in ["Accepted", "Wrong Answer"] and not stderr:
            stderr = status_desc or ""

        return {
            "output": output,
            "error": stderr,
            "exit_code": 0 if status_id == 3 else 1,
        }

    except httpx.ReadTimeout:
        return {"error": "Execution timed out (10s)", "output": ""}
    except httpx.HTTPStatusError as e:
        return {"error": f"Judge0 API Error: {e.response.text}", "output": ""}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}", "output": ""}

# ----------------------------------------------------
# 코드 실행 엔드포인트
# ----------------------------------------------------
class CodeExecutionRequest(BaseModel):
    code: str
    language: str
    input_data: str = ""

@app.post("/api/coding/run")
async def run_code_endpoint(request: CodeExecutionRequest):
    return await execute_code(request.code, request.language, request.input_data)

# ----------------------------------------------------
# 코드 제출 (채점)
# ----------------------------------------------------
class SubmitRequest(BaseModel):
    problem_id: str
    code: str
    language: str

@app.post("/api/coding/submit")
async def submit_code(request: SubmitRequest):
    if request.problem_id not in problem_cache:
        return {"status": "error", "message": "Problem not found or has expired."}

    test_cases = problem_cache[request.problem_id]

    for i, case in enumerate(test_cases):
        input_data = case["input"]
        expected_output = case["expectedOutput"]

        exec_result = await execute_code(request.code, request.language, input_data)

        if exec_result.get("error"):
            return {
                "status": "fail",
                "message": f"Runtime Error on test case {i+1}",
                "details": exec_result["error"],
            }

        user_output = exec_result["output"].strip()
        if user_output != expected_output.strip():
            return {
                "status": "fail",
                "message": f"Wrong Answer on test case {i+1}",
                "input": input_data,
                "output": user_output,
                "expected": expected_output,
            }

    del problem_cache[request.problem_id]
    return {
        "status": "success",
        "message": f"모든 {len(test_cases)}개 테스트를 통과했습니다 🎉",
    }

# ----------------------------------------------------
# 루트
# ----------------------------------------------------
@app.get("/")
def read_root():
    return {"status": "Coding Service is running."}
