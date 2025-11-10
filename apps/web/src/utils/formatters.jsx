// src/utils/formatters.js
import React from 'react';

/**
 * AI가 생성한 마크다운 응답을 React 엘리먼트로 변환합니다.
 * Review.jsx와 Interview.jsx에서 재사용됩니다.
 * @param {string} text - AI가 보낸 마크다운 형식의 텍스트
 * @returns {React.ReactElement} - 포맷팅된 JSX
 */
export function formatAiResponse(text) {
  const formattedText = text
    .replace(/</g, "&lt;").replace(/>/g, "&gt;") // HTML 태그 이스케이프
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
    .replace(/`(.*?)`/g, '<code class="bg-gray-700 rounded px-1 py-0.5">$1</code>') // Inline code
    .replace(/^\* (.*$)/gm, "<li>$1</li>") // Unordered list
    .replace(/^\s*-\s(.*$)/gm, "<li>$1</li>") // Unordered list (hyphen)
    .replace(/\n/g, "<br />") // Newlines
    .replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>") // Wrap LIs in UL
    .replace(/<\/ul><br \/><ul>/g, ""); // Merge adjacent lists

  return <div dangerouslySetInnerHTML={{ __html: formattedText }} />;
}