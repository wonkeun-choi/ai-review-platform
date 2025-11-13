import { useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowLeft,
  IconSparkles,
  IconLoader2,
  IconAlertTriangle,
  IconCopy,
} from "@tabler/icons-react";
import Particles from "@tsparticles/react";
import { fetchCodeReview } from "../api/reviewService";

const particlesOptions = {
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  interactivity: {
    events: {
      resize: true,
    },
  },
  particles: {
    color: { value: "#8eb5ff" },
    links: { enable: true, opacity: 0.22, width: 1 },
    move: { enable: true, speed: 0.45 },
    number: { value: 42 },
    opacity: { value: 0.25 },
    size: { value: { min: 1, max: 3 } },
  },
};

export default function Review() {
  const [code, setCode] = useState("");
  const [userComment, setUserComment] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [review, setReview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    setError(null);
    setReview("");

    try {
      // reviewService.js에서 fetchCodeReview를 (code, comment, repoUrl) 받도록 맞춰주면 됨
      const data = await fetchCodeReview(code, userComment, repoUrl);
      if (data?.review) {
        setReview(data.review);
      } else {
        throw new Error(data?.error || "Unknown error");
      }
    } catch (err) {
      setError(err.message || "Failed to fetch review");
    } finally {
      setIsLoading(false);
    }
  };

  const copyReview = async () => {
    try {
      await navigator.clipboard.writeText(review || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="relative min-h-screen bg-app text-white px-6 py-10">
      {/* 배경 입자 */}
      <Particles
        options={particlesOptions}
        className="pointer-events-none absolute inset-0 z-0"
      />

      {/* 콘텐츠 래퍼 */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* 헤더 */}
        <header className="flex items-center justify-between mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
          >
            <IconArrowLeft size={18} />
            <span>Home</span>
          </Link>

          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
            <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
              AI Code Review
            </span>
          </h1>

          <div className="w-16 md:w-24" />
        </header>

        {/* 메인 그리드: 높이 고정 + 내부 스크롤 */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[540px] max-w-6xl mx-auto">
          {/* LEFT: Code input */}
          <section className="flex flex-col h-full">
            <div className="gcard h-full">
              <div className="ginner glass-sheen h-full flex flex-col overflow-hidden">
                <div className="gheader flex items-center justify-between">
                  <span>Paste Your Code</span>
                </div>

                {/* 코드 입력 영역 */}
                <div className="flex-1 p-5 pt-4 pb-3 overflow-y-auto custom-scrollbar">
                  <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="여기에 리뷰할 코드를 붙여넣으세요..."
                    className="w-full h-full bg-transparent text-sm md:text-[15px] leading-relaxed text-slate-100 placeholder:text-slate-500/80 resize-none focus:outline-none"
                    spellCheck="false"
                  />
                </div>

                {/* 하단 입력 (코멘트 / GitHub URL) + 버튼 */}
                <form
                  onSubmit={handleSubmit}
                  className="border-t border-white/5 px-5 pt-3 pb-4 space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-300/80 mb-1">
                        사용자 코멘트 (선택)
                      </label>
                      <textarea
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        placeholder="직접 생각한 개선 포인트나 고민되는 부분을 적어주세요."
                        className="w-full h-[72px] rounded-xl bg-slate-900/40 border border-slate-700/60 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500/80 resize-none focus:outline-none focus:border-sky-400/80 custom-scrollbar"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-300/80 mb-1">
                        GitHub Repository URL (선택)
                      </label>
                      <input
                        type="url"
                        value={repoUrl}
                        onChange={(e) => setRepoUrl(e.target.value)}
                        placeholder="예: https://github.com/username/repo"
                        className="w-full rounded-xl bg-slate-900/40 border border-slate-700/60 px-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500/80 focus:outline-none focus:border-sky-400/80"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading || !code.trim()}
                      className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-medium shadow-lg shadow-sky-500/25 hover:from-sky-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {isLoading ? (
                        <>
                          <IconLoader2 size={18} className="animate-spin" />
                          Reviewing...
                        </>
                      ) : (
                        <>
                          <IconSparkles size={18} />
                          AI 리뷰 요청
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>

          {/* RIGHT: Feedback */}
          <section className="flex flex-col h-full">
            <div className="gcard h-full">
              <div className="ginner glass-sheen h-full flex flex-col overflow-hidden">
                <div className="gheader flex items-center justify-between">
                  <span>Review Feedback</span>
                  <button
                    type="button"
                    onClick={copyReview}
                    className="flex items-center gap-1 text-slate-300/90 hover:text-sky-300 transition-colors disabled:opacity-50"
                    disabled={!review}
                    title={copied ? "복사됨!" : "복사"}
                  >
                    <IconCopy size={18} />
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                  {isLoading && !review && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <IconLoader2 size={40} className="animate-spin mb-4" />
                      <p className="text-base md:text-lg mb-1">
                        AI가 코드를 분석 중입니다...
                      </p>
                      <p className="text-sm text-slate-400">
                        잠시만 기다려주세요.
                      </p>
                    </div>
                  )}

                  {error && (
                    <div className="p-4 bg-red-900/50 border border-red-700/60 rounded-lg text-red-200">
                      <div className="flex items-center gap-2 font-semibold">
                        <IconAlertTriangle size={18} />
                        <span>Error</span>
                      </div>
                      <p className="mt-2 text-sm">{error}</p>
                    </div>
                  )}

                  {review && (
                    <div className="whitespace-pre-wrap text-sm md:text-[15px] leading-relaxed text-slate-100">
                      {review}
                    </div>
                  )}

                  {!isLoading && !error && !review && (
                    <div className="h-full flex items-center justify-center text-slate-400/90 text-sm md:text-[15px] text-center">
                      코드를 제출하면 AI 리뷰가 여기에 표시됩니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
