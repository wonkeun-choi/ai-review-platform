# coding-service와 동일한 Python 3.11-slim 사용
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip && pip install --no-cache-dir -r requirements.txt

COPY . .

# 동일하게 appuser로 실행
RUN useradd -ms /bin/bash appuser
USER appuser

# (주의) coding-service(8000)와 겹치지 않도록 8001 포트 사용
EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]