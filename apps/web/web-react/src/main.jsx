import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import Home from "./pages/Home";
import Coding from "./pages/Coding";
import Review from "./pages/Review";
import Interview from "./pages/Interview";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/coding", element: <Coding /> },
  { path: "/review", element: <Review /> },
  { path: "/interview", element: <Interview /> },
  { path: "*", element: <div style={{ padding: 24 }}>Not Found</div> },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
