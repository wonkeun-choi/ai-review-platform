// src/api/reviewService.js

const BASE_URL = "/api";

/**
 * AI 코드 리뷰를 요청합니다.
 * (main.py의 /api/review 엔드포인트를 호출합니다)
 *
 * @param {string} code - 리뷰를 요청할 코드
 * @returns {Promise<object>} - AI 리뷰 결과 (e.g., { review: "..." })
 */
export const fetchCodeReview = async (code) => {
  // Review.jsx는 FormData를 사용합니다
  const formData = new FormData();
  formData.append("code", code);

  const response = await fetch(`${BASE_URL}/review`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `AI 리뷰 요청에 실패했습니다.`);
  }

  // main.py가 반환하는 { review: "..." } 객체를 반환
  return await response.json();
};