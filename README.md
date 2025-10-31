# 🚀 AI Review Engine

FastAPI + Ollama 기반의 **코드 자동 리뷰 서버**

---

## ⚙️ 실행 방법
```bash
# review-engine 폴더로 이동
cd apps/review-engine

# 서버 실행
python -m uvicorn main:app --host 127.0.0.1 --port 8000
서버가 실행되면 Swagger 문서에서 바로 테스트 가능:
👉 http://127.0.0.1:8000/docs

🌐 API 엔드포인트
메서드	경로	설명
GET	/healthz	서버 및 모델 상태 확인
POST	/review	코드 리뷰 요청 (code 필드로 전송)

예시 요청
bash
코드 복사
curl -X POST http://127.0.0.1:8000/review -F "code=print('hi')"
예상 응답:

json
코드 복사
{
  "status": "success",
  "review": "1. 함수화: 중복되는 코드를 줄이고..."
}
🧩 환경변수
변수명	설명	기본값
REVIEW_MODEL	Ollama 모델명	mistral:7b-instruct
OLLAMA_BASE_URL	Ollama 서버 URL	http://127.0.0.1:11434

.env 파일은 .gitignore로 제외되어야 합니다.

📁 디렉토리 구조
bash
코드 복사
apps/review-engine/
├── main.py
├── Dockerfile
├── requirements.txt
└── README.md
🧠 참고
Ollama 모델 설치:

bash
코드 복사
ollama pull mistral:7b-instruct
CORS가 열려 있으므로 프론트엔드와 바로 연동 가능.

yaml
코드 복사

---

### 📦 커밋 & 푸시
```bash
cd C:\Users\wonke\dev\ai-review-platform
git add apps/review-engine/README.md
git commit -m "Add concise README for review-engine"
git push
푸시 끝나면 GitHub에서 apps/review-engine/README.md 열어서
맨 위에 🚀 AI Review Engine 이 보이면 성공 ✅
