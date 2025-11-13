const BASE_URL = "/api";

/**
 * AI 코드 리뷰 요청
 * @param {string} code
 * @param {string} [comment]
 * @param {string} [repoUrl]
 */
export const fetchCodeReview = async (code, comment, repoUrl) => {
  const formData = new FormData();
  formData.append("code", code);

  if (comment) formData.append("comment", comment);
  if (repoUrl) formData.append("repo_url", repoUrl);

  const res = await fetch(`${BASE_URL}/review/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.detail ||
        err.error ||
        `AI 리뷰 요청 실패: ${res.statusText || res.status}`,
    );
  }

  return await res.json();
};
