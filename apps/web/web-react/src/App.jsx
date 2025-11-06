// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Coding from "./pages/Coding";
import Review from "./pages/Review";
import Interview from "./pages/Interview";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/coding" element={<Coding />} />
        <Route path="/review" element={<Review />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
