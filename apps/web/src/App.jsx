// apps/web/src/App.jsx
import { Routes, Route } from "react-router-dom";

// 기존 페이지 (그대로 유지)
import Home from "./pages/Home";
import Coding from "./pages/Coding";
import Review from "./pages/Review";

// 새로 만든 인터뷰 분리 페이지들
import Intro from "./pages/interview/Intro";
import Session from "./pages/interview/Session";
import Result from "./pages/interview/Result";

export default function App() {
  return (
    <Routes>
      {/* 기본 */}
      <Route path="/" element={<Home />} />

      {/* 기존 기능 유지 */}
      <Route path="/coding" element={<Coding />} />
      <Route path="/review" element={<Review />} />

      {/* 인터뷰: 단일 /interview → 3개 라우트로 분리 */}
      <Route path="/interview" element={<Intro />} />
      <Route path="/interview/session" element={<Session />} />
      <Route path="/interview/result" element={<Result />} />

      {/* 404 */}
      <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
    </Routes>
  );
}
