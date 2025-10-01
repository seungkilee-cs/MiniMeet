import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// Conditionally import App or AppDevOnly based on environment
// In production builds, AppDevOnly will be tree-shaken out completely
const AppComponent =
  process.env.NODE_ENV === "development"
    ? require("./App.DevOnly").default
    : require("./App").default;

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>
    <AppComponent />
  </React.StrictMode>,
);
