from fastapi import FastAPI
app = FastAPI()

@app.get("/healthz")
def health():
    return {"ok": True}

@app.get("/review")
def review():
    return {"review": "LGTM: 기본 연결 OK (Windows)"}