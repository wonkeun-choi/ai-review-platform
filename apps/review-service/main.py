import os
import logging
from typing import Optional

import google.generativeai as genai
from google.generativeai.types import GenerationConfig
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# ----------------------------------------------------
# 로그 설정
# ----------------------------------------------------
logging.basicConfig(level=logging.INFO)
log = logging.getLogger("review-service")

# ----------------------------------------------------
# FastAPI 앱 & CORS
# ----------------------------------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    # allow_origins는 실제 배포 환경에 맞게 수정하세요.
    allow_origins=["http://localhost", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------------------------------
# Gemini 설정
# ----------------------------------------------------
MODEL_NAME = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash-latest") # 최신 모델 권장

try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(MODEL_NAME)
    log.info(f"Gemini 모델이 성공적으로 설정되었습니다: {MODEL_NAME}")
except Exception as e:
    log.error(f"Gemini 설정 중 오류 발생: {e}")
    model = None

# ----------------------------------------------------
# 코드 리뷰용 베이스 프롬프트 (한국어 + 간결 요약)
# ----------------------------------------------------
REVIEWER_PROMPT = """
당신은 시니어 소프트웨어 엔지니어이자 코드 리뷰어입니다.
다음 요구사항을 지켜 **한국어로 아주 간결하게** 코드 리뷰를 작성하세요.

- 전체 분량은 15줄 이내로 요약합니다.
- 아래 4가지 관점으로만 평가합니다.
  1) 목적 부합성 및 설계
  2) 정확성 및 견고성
  3) 성능 및 효율성
  4) 유지보수성 및 가독성
- 각 관점마다 **Issue 0~2개, Suggestion 0~2개**만 적고, 가장 중요한 것부터 써주세요.
- 불필요한 장문 설명, 장황한 예시는 넣지 않습니다.
- 코드 전체를 다시 붙여쓰지 말고, 필요한 경우에만 한두 줄 정도의 예시만 사용하세요.
- 말투는 “~입니다 / ~해 주세요” 형태로 정중하고 담백하게 작성합니다.

출력 형식:

[요약]
- 한 줄로 전체 평가

[1. 목적 부합성 및 설계]
- Issue: ...
- Suggestion: ...

[2. 정확성 및 견고성]
- Issue: ...
- Suggestion: ...

[3. 성능 및 효율성]
- Issue: ...
- Suggestion: ...

[4. 유지보수성 및 가독성]
- Issue: ...
- Suggestion: ...
"""

# ----------------------------------------------------
# 헬스 체크
# ----------------------------------------------------
@app.get("/")
def read_root():
    return {"status": "Review Service is running.", "model": MODEL_NAME}


# ----------------------------------------------------
# 코드 리뷰 엔드포인트
# ----------------------------------------------------
@app.post("/api/review/")
async def handle_code_review(
    code: str = Form(...),
    comment: Optional[str] = Form(None),
    repo_url: Optional[str] = Form(None),
):
    if not model:
        raise HTTPException(
            status_code=503,
            detail="Gemini AI 모델이 설정되지 않았습니다. 서버 로그를 확인하세요.",
        )

    if not code.strip():
        raise HTTPException(
            status_code=400,
            detail="리뷰할 코드가 비어 있습니다.",
        )

    # 추가 컨텍스트 정리
    extra_context_parts = []
    if comment:
        extra_context_parts.append(
            "사용자가 중점적으로 보고 싶은 부분 / 요구사항:\n"
            f"{comment.strip()}"
        )
    if repo_url:
        extra_context_parts.append(
            "참고용 GitHub Repository URL:\n"
            f"{repo_url.strip()}"
        )
    
    extra_context = ("\n\n".join(extra_context_parts)
                     if extra_context_parts
                     else "별도 요구사항 없음")

    # 프롬프트 구성
    full_prompt = f"""{REVIEWER_PROMPT}

[프로젝트/코드 맥락]
{extra_context}

[리뷰 대상 코드]
```text
{code}
```
"""
    # --- ★★★ 여기가 수정된 지점입니다 ★★★ ---
    # 1. full_prompt 변수가 `"""`로 위에서 완전히 끝났습니다.
    # 2. `try` 블록이 `handle_code_review` 함수 내부에
    #    올바르게 '들여쓰기' 되었습니다.
    
    try:
        response = await model.generate_content_async( # 비동기(async) 호출
            full_prompt,
            generation_config=GenerationConfig(
                temperature=0.4,
                max_output_tokens=2048, # 약간 여유 있게 늘림
            ),
        )
        
        # response.text가 비어있거나 없는 경우를 더 안전하게 처리
        review_text = (response.text or "").strip()
        
        if not review_text:
            log.warning("Gemini에서 빈 응답을 반환했습니다.")
            # prompt가 차단되었을 수 있음
            if response.prompt_feedback and response.prompt_feedback.block_reason:
                log.error(f"프롬프트가 차단되었습니다: {response.prompt_feedback.block_reason}")
                raise HTTPException(status_code=400, detail=f"프롬프트가 차단되었습니다: {response.prompt_feedback.block_reason}")
            raise RuntimeError("Gemini에서 빈 응답을 받았습니다.")
            
        return {"review": review_text}

    except Exception as e:
        log.error(f"리뷰 생성 중 오류 발생: {e}")
        # API 키 오류 등 구체적인 예외 처리를 추가하면 더 좋습니다.
        raise HTTPException(
            status_code=500,
            detail=f"리뷰 생성에 실패했습니다: {str(e)}",
        )