import React, { useState } from "react";
import App from "./App";
import AdminPanel from "./components/AdminPanel";
import "./App.css";

/**
 * Development-only wrapper that adds admin panel
 * This file is only imported in development mode
 */
const AppDevOnly: React.FC = () => {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <div>
      {/* Dev mode toggle button */}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 9999,
        }}
      >
        <button
          onClick={() => setShowAdmin(!showAdmin)}
          style={{
            background: showAdmin
              ? "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)"
              : "linear-gradient(135deg, #4a9eff 0%, #3a8eef 100%)",
            color: "white",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.3)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.2)";
          }}
        >
          {showAdmin ? "🔙 Back to App" : "🔧 Admin Panel"}
        </button>
      </div>

      {/* Show either admin panel or main app */}
      {showAdmin ? <AdminPanel /> : <App />}
    </div>
  );
};

export default AppDevOnly;
