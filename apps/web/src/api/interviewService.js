// src/api/interviewService.js

const BASE_URL = "/api";

/**
 * AI 면접관과 대화를 주고받습니다.
 * (main.py의 /api/interview/chat 엔드포인트를 호출합니다)
 *
 * @param {string} topic - 면접 주제 (e.g., "React")
 * @param {Array<object>} history - 이전 대화 기록 (e.g., [{ role: "user", text: "..." }, { role: "model", text: "..." }])
 * @param {string} userMessage - 사용자의 현재 답변
 * @returns {Promise<string>} - AI 면접관의 응답 텍스트
 */
export const sendChatRequest = async (topic, history, userMessage) => {
  const response = await fetch(`${BASE_URL}/interview/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // main.py의 ChatRequest 모델에 맞는 데이터 전송
    body: JSON.stringify({
      topic: topic,
      history: history,
      user_message: userMessage
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI 면접관 응답에 실패했습니다.`);
  }

  const data = await response.json();

  // main.py가 반환하는 { response: "..." } 객체에서 텍스트를 추출
  return data.response;
};