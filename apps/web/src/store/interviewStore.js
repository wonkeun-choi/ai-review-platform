import { create } from "zustand";

export const useInterviewStore = create((set) => ({
  questions: [],            // [{ type, text }]
  currentIndex: 0,           // 진행 중인 질문 인덱스
  answers: [],               // [{ blob, durationSec }]
  result: null,              // 분석 결과

  // 액션들
  setQuestions: (qs) => set({ questions: qs, currentIndex: 0, answers: [], result: null }),
  setCurrentIndex: (i) => set({ currentIndex: i }),
  addAnswer: (a) => set((s) => ({ answers: [...s.answers, a] })),
  setResult: (r) => set({ result: r }),
  reset: () => set({ questions: [], currentIndex: 0, answers: [], result: null }),
}));
