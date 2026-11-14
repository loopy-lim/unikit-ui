import React from "react";
import ReactDOM from "react-dom/client";
import { UnikitThemeProvider } from "@unikit-bridge/ui";
import App from "./App";
import "@unikit-bridge/ui/editor-prose.css";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <UnikitThemeProvider>
      <App />
    </UnikitThemeProvider>
  </React.StrictMode>,
);
