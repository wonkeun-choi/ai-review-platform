import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // 1. 추가된 부분
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 2. <BrowserRouter>로 감싼 부분 */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);