// src/pages/Review.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconSparkles } from "@tabler/icons-react";
import Particles from "@tsparticles/react";
import { particlesOptions, particlesVersion } from "@/config/particles";
import { useParticlesInit } from "../hooks/useParticlesInit";

// 1. (신규) formatters.js에서 함수 임포트
import { formatAiResponse } from "../utils/formatters.jsx";
// 2. (신규) api/reviewService.js에서 함수 임포트
import { fetchCodeReview } from "../api/reviewService";

export default function Review() {
  const [code, setCode] = useState("");
  const [review, setReview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const init = useParticlesInit();

  // 3. (수정) handleSubmit 함수가 fetchCodeReview를 사용하도록 변경
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setReview("");

    try {
      // API 모듈을 통해 요청
      const data = await fetchCodeReview(code);
      
      if (data.review) {
        setReview(data.review);
      } else {
        throw new Error(data.error || "Unknown error occurred.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. (삭제) 기존 formatReviewText 함수를 여기서 삭제합니다.
  
  if (!init) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden text-white p-8">
      {/* ... (Particles, header UI는 동일) ... */}
      
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 z-10">
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* ... (textarea, button UI는 동일) ... */}
        </form>
        
        <div className="h-[calc(60vh+68px)] flex flex-col rounded-lg ...">
          <h2 className="text-xl ...">Review Feedback</h2>
          <div className="flex-1 p-6 overflow-y-auto">
            {/* ... (isLoading, error UI는 동일) ... */}
            
            {/* 5. (수정) formatAiResponse 훅을 직접 호출 */}
            {review && (
              <div className="prose prose-invert max-w-none ...">
                {formatAiResponse(review)}
              </div>
            )}
            
            {!isLoading && !error && !review && (
              <p className="text-gray-500">코드를 제출하면 AI 리뷰가 여기에 표시됩니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}