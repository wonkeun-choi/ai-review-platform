// src/api/codingService.js

/**
 * Vite 프록시 설정을 통해 백엔드 API 서버와 통신합니다.
 * vite.config.js에 설정된 '/api' 경로를 사용합니다.
 */
const BASE_URL = "/api";

/**
 * AI 코딩 문제를 동적으로 생성하여 가져옵니다.
 * (main.py의 /api/coding/problem/generate 엔드포인트를 호출합니다)
 *
 * @param {string} difficulty - 문제 난이도 (e.g., "Easy", "Medium", "Hard")
 * @param {string} topic - 문제 주제 (e.g., "Hash Map", "DP", "Graph")
 * @returns {Promise<object>} - AI가 생성한 파싱된 문제 JSON 객체
 */
export const fetchAiCodingProblem = async (difficulty, topic) => {
  const response = await fetch(`${BASE_URL}/coding/problem/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Pydantic 모델(ProblemRequest)이 기대하는 형식으로 데이터를 전송합니다.
    body: JSON.stringify({ difficulty, topic }),
  });

  if (!response.ok) {
    // 백엔드(FastAPI)가 보낸 에러 메시지를 우선적으로 사용합니다.
    const errorData = await response.json().catch(() => ({})); // JSON 파싱 실패 대비
    throw new Error(errorData.error || `AI 문제 생성에 실패했습니다. (상태: ${response.status})`);
  }

  const data = await response.json();

  // main.py에서 이미 {"problem": {...}} 형식으로 반환하므로
  // data.problem을 바로 반환합니다.
  return data.problem;
};

/**
 * 사용자가 작성한 코드를 백엔드에서 안전하게 실행합니다.
 * (main.py의 /api/coding/run 엔드포인트를 호출합니다)
 *
 * @param {string} code - 사용자 작성 코드
 * @param {string} language - 사용된 언어 (e.g., "python", "javascript")
 * @param {string} inputData - 코드 실행 시 표준 입력(stdin)으로 전달될 값
 * @returns {Promise<object>} - { output: "...", error: "...", exit_code: 0 }
 */
export const runCode = async (code, language, inputData) => {
  const response = await fetch(`${BASE_URL}/coding/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // main.py의 CodeExecutionRequest 모델에 맞는 데이터 전송
    body: JSON.stringify({ code, language, input_data: inputData }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `코드 실행에 실패했습니다.`);
  }

  // main.py가 반환하는 { output, error, exit_code } 객체를 반환
  return await response.json();
};

/**
 * 코드를 백엔드로 제출하여 모든 숨겨진 테스트 케이스로 채점합니다.
 * (main.py의 /api/coding/submit 엔드포인트를 호출합니다)
 *
 * @param {string} problemId - AI가 생성한 문제의 고유 ID
 * @param {string} code - 사용자 작성 코드
 * @param {string} language - 사용된 언어
 * @returns {Promise<object>} - 채점 결과 (e.g., { status: "success", message: "..." })
 */
export const submitCode = async (problemId, code, language) => {
  const response = await fetch(`${BASE_URL}/coding/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // main.py의 SubmitRequest 모델에 맞는 데이터 전송
    body: JSON.stringify({ problem_id: problemId, code, language }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `채점에 실패했습니다.`);
  }

  // main.py가 반환하는 { status, message, ... } 객체를 반환
  return await response.json();
};