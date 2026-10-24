import React from "react";
import { createRoot } from "react-dom/client";
import App from "./landing/App.jsx";
import AdminPanel from "./admin/AdminPanel.jsx";
import { PoliciesPage, SignInPage, SignUpPage } from "./pages/AccountPages.jsx";
import { getDemoSession } from "./shared/demoAuth.js";

const basePath = import.meta.env.BASE_URL;
const appPath = window.location.pathname.startsWith(basePath)
  ? `/${window.location.pathname.slice(basePath.length)}`
  : window.location.pathname;
const route = appPath.replace(/\/+$/, "") || "/";
const demoSession = getDemoSession();
const Page = route === "/admin"
  ? demoSession?.role === "admin" ? AdminPanel : SignInPage
  : route === "/signin" ? SignInPage
    : route === "/signup" ? SignUpPage
      : route === "/policies" ? PoliciesPage
        : App;

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>,
);
