import { useEffect, useState } from "react";

export default function Session() {
  // 질문 상태
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 페이지 로드 시 랜덤 질문 생성
  useEffect(() => {
    const tech = [
      "비동기 처리(Promise/async-await)의 차이와 에러 핸들링 전략을 설명해 주세요.",
      "상태관리(Context, Redux, Zustand 등)를 선택할 때 기준은 무엇인가요?",
      "HTTP/REST와 WebSocket의 차이점을 설명해 주세요.",
      "데이터베이스 정규화와 비정규화의 차이점을 설명해 주세요.",
    ];

    const beh = [
      "최근 가장 도전적이었던 경험은 무엇이었나요?",
      "팀 내 갈등이 발생했을 때 어떻게 해결했나요?",
      "실패 경험과 그 이후의 학습 과정을 말해 주세요.",
      "압박 상황에서 자신을 어떻게 관리하나요?",
    ];

    // 기술 3 + 인성 2 랜덤 섞기
    const randomTech = tech.sort(() => 0.5 - Math.random()).slice(0, 3);
    const randomBeh = beh.sort(() => 0.5 - Math.random()).slice(0, 2);
    const combined = [...randomTech, ...randomBeh].sort(() => 0.5 - Math.random());

    setQuestions(combined);
  }, []);

  // 질문 아직 없을 때
  if (questions.length === 0) {
    return (
      <div className="bg-app min-h-screen flex items-center justify-center text-white">
        질문 불러오는 중...
      </div>
    );
  }

  // 현재 질문 표시
  const question = questions[currentIndex];

  return (
    <div className="bg-app min-h-screen flex items-center justify-center p-6 text-white">
      <div className="gcard max-w-3xl w-full">
        <div className="ginner glass-sheen">
          <div className="gheader">면접 진행</div>

          <div className="p-6 space-y-6">
            <div className="text-slate-400 text-sm">
              {currentIndex + 1} / {questions.length} 문항
            </div>

            <div className="rounded-xl p-6 bg-slate-800/60 border border-slate-700 text-lg leading-relaxed">
              {question}
            </div>

            <div className="flex gap-4">
              {currentIndex > 0 && (
                <button
                  onClick={() => setCurrentIndex((i) => i - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600"
                >
                  이전
                </button>
              )}

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="btn-neon"
                >
                  다음 질문
                </button>
              ) : (
                <a
                  href="/interview/result"
                  className="btn-neon text-center inline-block"
                >
                  결과 보기
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
