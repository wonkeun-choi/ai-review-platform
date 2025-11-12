// src/api/interviewApi.js
// 게이트웨이(Nginx)에서 `/api/interview/*` 프록시된다고 가정
const BASE_URL = "/api/interview";

/**
 * 5문항(기술3+인성2) 랜덤 세트 가져오기
 * GET /api/interview/start  → { questions: [{type,text}] }
 */
export async function fetchQuestions() {
  const res = await fetch(`${BASE_URL}/start`);
  if (!res.ok) throw new Error(`질문 요청 실패: ${res.status} ${res.statusText}`);
  return res.json(); // { questions }
}

/**
 * 면접 결과 분석 요청 (multipart/form-data)
 * POST /api/interview/analyze
 *
 * @param {{questions: Array<{type:string,text:string}>, answers: Array<{text:string|null,durationSec:number}>}} meta
 * @param {Blob[]} [audioBlobs]  // 길이 5, 없으면 생략 가능
 * @returns {Promise<{summary:string, scores: Record<string,number>, detail:any}>}
 */
export async function analyzeInterview(meta, audioBlobs = []) {
  const form = new FormData();
  form.append("meta", JSON.stringify(meta)); // {questions, answers}

  // audio_0..audio_4 형식으로 첨부 (선택)
  audioBlobs.forEach((blob, idx) => {
    if (blob) form.append(`audio_${idx}`, blob, `q${idx}.webm`);
  });

  const res = await fetch(`${BASE_URL}/analyze`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    // 서버가 {error:"..."}를 주는 경우 대비
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `분석 요청 실패: ${res.status} ${res.statusText}`);
  }
  return res.json(); // { summary, scores, detail }
}
