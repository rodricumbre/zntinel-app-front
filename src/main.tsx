// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./lib/auth";
import App from "/src/App";
import "/src/index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
