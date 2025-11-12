// src/api/reviewService.js

const BASE_URL = "/api";

/**
 * AI 코드 리뷰 요청
 * @param {string} code - 리뷰할 코드 문자열
 * @returns {Promise<object>} - { review: "..."} 형태
 */
export const fetchCodeReview = async (code) => {
  const formData = new FormData();
  formData.append("code", code);

  const res = await fetch(`${BASE_URL}/review/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `AI 리뷰 요청 실패: ${res.statusText || res.status}`);
  }

  return await res.json();
};
