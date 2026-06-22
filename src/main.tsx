import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { inicializarErrorLogger } from "./lib/errorLogger";
import { inicializarSentry } from "./lib/sentry";

inicializarSentry();
inicializarErrorLogger();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
