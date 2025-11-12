// src/hooks/useInterviewFlow.js
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { getRandomQuestions } from "@/data/interviewQuestions";

/**
 * AI 면접 흐름 제어 훅
 * - 질문 랜덤 생성
 * - 현재 문항 인덱스 관리
 * - 답변 리스트 관리
 * - 마지막에 결과 페이지 이동
 */
export default function useInterviewFlow() {
  const navigate = useNavigate();

  // 상태 관리
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState([]);

  /** 면접 시작 (Intro.jsx에서 호출) */
  const startInterview = () => {
    const qs = getRandomQuestions(); // 기술3 + 인성2 랜덤
    setQuestions(qs);
    setCurrentIndex(0);
    setAnswers([]);
    navigate("/interview/session");
  };

  /** 현재 문항에 대한 답변 저장 후 다음 문항으로 이동 */
  const submitAnswer = (answerObj) => {
    setAnswers((prev) => [...prev, answerObj]);
    const next = currentIndex + 1;

    if (next < questions.length) {
      setCurrentIndex(next);
    } else {
      // 모든 문항 완료 → 결과 페이지로 이동
      navigate("/interview/result", { state: { questions, answers: [...answers, answerObj] } });
    }
  };

  /** 면접 리셋 */
  const resetInterview = () => {
    setQuestions([]);
    setAnswers([]);
    setCurrentIndex(0);
  };

  return {
    questions,
    currentIndex,
    currentQuestion: questions[currentIndex],
    answers,
    startInterview,
    submitAnswer,
    resetInterview,
  };
}
