import React from "react";
import { createRoot } from "react-dom/client";
import App from "./landing/App.jsx";
import AdminPanel from "./admin/AdminPanel.jsx";

const basePath = import.meta.env.BASE_URL;
const appPath = window.location.pathname.startsWith(basePath)
  ? `/${window.location.pathname.slice(basePath.length)}`
  : window.location.pathname;
const Page = appPath.replace(/\/+$/, "") === "/admin" ? AdminPanel : App;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
