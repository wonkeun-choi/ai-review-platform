import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowLeft, IconCheck, IconX, IconSparkles,
  IconPlayerPlay, IconSend, IconCodeCircle, IconTerminal2, IconCopy,
} from "@tabler/icons-react";
import { fetchAiCodingProblem, runCode, submitCode } from "../api/codingService";

/* Toast */
const Toast = ({ message, type }) => {
  if (!message) return null;
  const bg = type === "success" ? "bg-green-500" : "bg-red-500";
  const icon = type === "success" ? <IconCheck size={18} /> : <IconX size={18} />;
  return (
    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-white flex items-center gap-2 ${bg} z-50`}>
      {icon}
      <span className="text-sm">{message}</span>
    </div>
  );
};

/* Code Editor */
const CodeEditor = ({
  code, setCode, language, setLanguage,
  onRun, onSubmit, isExecuting, isSubmitting, problemLoaded,
}) => {
  const placeholderText = problemLoaded
    ? "AI가 생성한 문제를 풀어보세요."
    : "‘AI 문제 생성’ 버튼을 눌러주세요.";

  return (
    <div className="h-full flex flex-col rounded-lg border border-blue-800/50 bg-[#0e111c] shadow-lg">
      <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-800/30">
        <select
          className="bg-gray-700 text-white p-2 rounded-md border border-gray-600"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="python">Python 3</option>
          <option value="javascript">JavaScript</option>
          <option value="c">C</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="swift">Swift</option>
          <option value="kotlin">Kotlin</option>
        </select>

        <div className="flex gap-2">
          <button
            onClick={onRun}
            disabled={isExecuting || isSubmitting}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-3 rounded-md disabled:bg-gray-700 disabled:opacity-60 text-sm"
          >
            {isExecuting ? (
              <>
                <IconPlayerPlay size={16} className="animate-pulse" /> 실행 중…
              </>
            ) : (
              <>
                <IconPlayerPlay size={16} /> 코드 실행
              </>
            )}
          </button>
          <button
            onClick={onSubmit}
            disabled={isExecuting || isSubmitting || !problemLoaded}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-md disabled:bg-gray-700 disabled:opacity-60 text-sm"
          >
            {isSubmitting ? (
              <>
                <IconSend size={16} className="animate-pulse" /> 채점 중…
              </>
            ) : (
              <>
                <IconSend size={16} /> 제출
              </>
            )}
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        {!code && (
          <div className="absolute top-4 left-4 text-gray-500 pointer-events-none">
            {placeholderText}
          </div>
        )}
        <textarea
          className="w-full h-full bg-transparent text-white border-none focus:ring-0 resize-none font-mono p-4 text-sm leading-relaxed"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          readOnly={!problemLoaded}
          spellCheck="false"
        />
      </div>
    </div>
  );
};

/* Run Panel (no scroll, toggle long output) */
function RunPanel({ inputData, setInputData, isExecuting, runError, runResult }) {
  const [expand, setExpand] = useState(false);

  return (
    <div className="rounded-lg border border-blue-800/50 bg-[#0b0f19] p-4 h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-2">
        <IconTerminal2 size={18} className="text-blue-300" />
        <h3 className="font-semibold">실행 결과</h3>
      </div>

      <label className="text-xs text-gray-400">표준 입력(옵션)</label>
      <textarea
        className="mt-1 w-full h-16 bg-gray-900 text-white border border-gray-700 rounded p-2 font-mono text-xs"
        placeholder="여기에 실행 입력값을 넣을 수 있어요."
        value={inputData}
        onChange={(e) => setInputData(e.target.value)}
      />

      <div className="flex-1 mt-3 relative min-h-0">
        {isExecuting && (
          <div className="p-3 bg-blue-900/30 text-blue-300 rounded text-xs">코드를 실행 중입니다…</div>
        )}

        {!isExecuting && runError && (
          <div className="p-3 bg-red-900/40 border border-red-700 rounded text-red-300 text-xs whitespace-pre-wrap">
            {runError}
          </div>
        )}

        {!isExecuting && !runError && runResult && (
          <div className="relative h-full min-h-0">
            <div
              className={
                "h-full text-xs font-mono bg-gray-900 border border-gray-700 rounded p-3 whitespace-pre-wrap overflow-auto " +
                (expand ? "" : "line-clamp-10 pr-10")
              }
            >
              {runResult.output || "(출력 없음)"}
            </div>
            {!expand && (
              <>
                <div className="fade-bottom pointer-events-none" />
                <button
                  onClick={() => setExpand(true)}
                  className="absolute right-2 bottom-2 text-[11px] px-2 py-1 rounded bg-blue-700/80 hover:bg-blue-700 text-white"
                >
                  전체 보기
                </button>
              </>
            )}
            {expand && (
              <button
                onClick={() => setExpand(false)}
                className="absolute right-2 bottom-2 text-[11px] px-2 py-1 rounded bg-gray-700/80 hover:bg-gray-700 text-white"
              >
                접기
              </button>
            )}
          </div>
        )}

        {!isExecuting && !runError && !runResult && (
          <div className="text-gray-500 text-xs">
            아직 실행 결과가 없습니다. 상단의 <b>코드 실행</b>을 눌러보세요.
          </div>
        )}
      </div>
    </div>
  );
}

/* Main Page */
export default function Coding() {
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState("Medium");
  const [topic, setTopic] = useState("Algorithms");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [inputData, setInputData] = useState("");
  const [runResult, setRunResult] = useState(null);
  const [runError, setRunError] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type) => {
    setToast({ message, type });
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, []);

  const handleGenerateProblem = async () => {
    try {
      setLoading(true);
      setProblem(null);
      setRunResult(null);
      setRunError(null);
      const p = await fetchAiCodingProblem(difficulty, topic);
      setProblem(p);
      setCode("");
    } catch (e) {
      showToast(`문제 생성 실패: ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!problem) return showToast("문제를 먼저 생성해주세요.", "error");
    setIsExecuting(true);
    setRunError(null);
    setRunResult(null);
    try {
      const res = await runCode(code, language, inputData);
      if (res.error) setRunError(res.error);
      else setRunResult(res);
      showToast("코드 실행 완료", "success");
    } catch (e) {
      setRunError(e.message);
      showToast(`실행 오류: ${e.message}`, "error");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!problem) return showToast("문제를 먼저 생성해주세요.", "error");
    setIsSubmitting(true);
    try {
      const res = await submitCode(problem.id, code, language);
      if (res.status === "success") showToast("모든 테스트 통과 🎉", "success");
      else showToast(res.message || "테스트 실패 ❌", "error");
    } catch (e) {
      showToast(`제출 실패: ${e.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-app text-white p-6 md:p-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4 p-4 rounded-xl border border-blue-700/40 bg-[#0a0d16]/70 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-blue-300">
          <IconArrowLeft size={18} />
          <span className="text-sm">Home</span>
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-sm text-gray-300 mr-2">난이도</label>
            <select
              className="p-2 bg-gray-700 border border-gray-600 rounded-md"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300 mr-2">유형</label>
            <select
              className="p-2 bg-gray-700 border border-gray-600 rounded-md"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="Algorithms">알고리즘</option>
              <option value="Data Structures">자료구조</option>
            </select>
          </div>
          <button
            onClick={handleGenerateProblem}
            disabled={loading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold py-2 px-4 rounded-md disabled:opacity-60"
          >
            {loading ? (
              <>
                <IconSparkles size={18} className="animate-spin" /> 생성 중…
              </>
            ) : (
              <>
                <IconSparkles size={18} /> AI 문제 생성
              </>
            )}
          </button>
        </div>

        <h1 className="text-xl md:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-blue-300 md:absolute md:left-1/2 md:-translate-x-1/2">
          AI Coding Test
        </h1>
      </div>

      {/* === Full-width main area === */}
      <div
        className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 px-2 min-h-0"
        style={{ height: "calc(100vh - 170px)" }}
      >
        {/* LEFT: Problem panel */}
        <div className="rounded-xl border border-blue-700/40 bg-[#0a0d16]/70 overflow-hidden h-full min-h-0 flex flex-col">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-white p-5 border-b border-blue-700/40 bg-blue-900/20">
            <IconCodeCircle size={22} className="text-blue-400" /> 문제
          </h2>
          <div className="flex-1 overflow-auto p-6 text-gray-200 min-h-0">
            {!problem && !loading && (
              <p className="text-gray-500 text-center py-10">
                옵션을 선택하고 ‘AI 문제 생성’을 눌러주세요.
              </p>
            )}
            {loading && (
              <p className="text-blue-300 text-center py-10 animate-pulse">
                새로운 문제를 생성 중입니다…
              </p>
            )}
            {problem && (
              <div className="prose prose-invert max-w-none">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-blue-300">{problem.title}</h3>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${problem.title}\n\n${problem.description}\n\n제약 조건:\n${(problem.constraints || []).join("\n")}`
                      )
                    }
                    className="text-gray-400 hover:text-blue-400"
                    title="문제 복사"
                  >
                    <IconCopy size={18} />
                  </button>
                </div>
                <p className="whitespace-pre-line text-gray-300">
                  {problem.description}
                </p>
                {problem.constraints?.length > 0 && (
                  <>
                    <h4 className="mt-6 font-semibold text-blue-200">제약 조건</h4>
                    <ul className="list-disc list-inside text-gray-300">
                      {problem.constraints.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Editor (2/3) + Run (1/3) */}
        <div className="grid grid-rows-[2fr_1fr] gap-4 h-full min-h-0">
          <div className="min-h-0 overflow-hidden">
            <CodeEditor
              code={code}
              setCode={setCode}
              language={language}
              setLanguage={setLanguage}
              onRun={handleRunCode}
              onSubmit={handleSubmitCode}
              isExecuting={isExecuting}
              isSubmitting={isSubmitting}
              problemLoaded={!!problem}
            />
          </div>
          <RunPanel
            inputData={inputData}
            setInputData={setInputData}
            isExecuting={isExecuting}
            runError={runError}
            runResult={runResult}
          />
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}
    </div>
  );
}
