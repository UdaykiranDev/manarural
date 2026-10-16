import React from "react";
import { createRoot } from "react-dom/client";
import App from "./landing/App.jsx";
import AdminPanel from "./admin/AdminPanel.jsx";

const Page = window.location.pathname.replace(/\/+$/, "") === "/admin" ? AdminPanel : App;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
