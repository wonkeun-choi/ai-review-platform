import { useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowLeft, IconSparkles, IconLoader2, IconAlertTriangle, IconCopy
} from "@tabler/icons-react";
import Particles from "@tsparticles/react";
import { fetchCodeReview } from "../api/reviewService";

const particlesOptions = {
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  interactivity: { events: { resize: true } },
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
      const data = await fetchCodeReview(code);
      if (data?.review) setReview(data.review);
      else throw new Error(data?.error || "Unknown error");
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
    } catch {}
  };

  return (
    <div className="bg-app text-white px-6 py-10">
      {/* 배경 입자: 배경 레이어(z-0)로 */}
      <Particles
        options={particlesOptions}
        className="pointer-events-none absolute inset-0 z-0"
      />

      {/* Header */}
      <header className="max-w-7xl mx-auto flex items-center justify-between mb-10 relative z-10">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-300/90 hover:text-sky-300 transition-colors rounded-full p-2 hover:bg-white/5"
        >
          <IconArrowLeft size={20} /> <span>Home</span>
        </Link>

        <h1
          className="title-glow text-4xl md:text-5xl font-extrabold"
          data-text="AI Code Review"
        >
          AI Code Review
        </h1>

        <div className="w-24" />
      </header>

      {/* Main */}
      <main
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-1 relative z-10"
        style={{ height: "calc(100vh - 170px)" }}
      >
        {/* LEFT: Code input */}
        <section className="flex flex-col h-full">
          <div className="gcard h-full">
            <div className="ginner glass-sheen h-full flex flex-col overflow-hidden">
              <div className="gheader flex items-center justify-between">
                <span>Paste Your Code</span>
              </div>

              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="여기에 리뷰할 코드를 붙여넣으세요..."
                className="flex-1 w-full p-5 bg-transparent text-slate-200/95 leading-6 resize-none focus:outline-none custom-scrollbar"
                spellCheck="false"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="btn-neon mt-4 w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <IconLoader2 size={20} className="animate-spin" />
                  Reviewing...
                </>
              ) : (
                <>
                  <IconSparkles size={20} />
                  AI 리뷰 요청
                </>
              )}
            </button>
          </form>
        </section>

        {/* RIGHT: Feedback */}
        <section className="flex flex-col h-full">
          <div className="gcard h-full">
            <div className="ginner glass-sheen h-full flex flex-col">
              <div className="gheader flex items-center justify-between">
                <span>Review Feedback</span>
                <button
                  onClick={copyReview}
                  className="flex items-center gap-1 text-slate-300/90 hover:text-sky-300 transition-colors disabled:opacity-50"
                  disabled={!review}
                  title={copied ? "복사됨!" : "복사"}
                >
                  <IconCopy size={18} /> {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                {isLoading && !review && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <IconLoader2 size={40} className="animate-spin mb-4" />
                    <p className="text-lg">AI가 코드를 분석 중입니다...</p>
                    <p>잠시만 기다려주세요.</p>
                  </div>
                )}

                {error && (
                  <div className="p-4 bg-red-900/50 border border-red-700/60 rounded-lg text-red-200">
                    <div className="flex items-center gap-2 font-semibold">
                      <IconAlertTriangle size={18} /> Error
                    </div>
                    <p className="mt-2 text-sm">{error}</p>
                  </div>
                )}

                {review && (
                  <article className="prose prose-invert prose-elite max-w-none leading-relaxed">
                    <pre className="whitespace-pre-wrap">{review}</pre>
                  </article>
                )}

                {!isLoading && !error && !review && (
                  <div className="text-center text-slate-400/90">
                    코드를 제출하면 AI 리뷰가 여기에 표시됩니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
