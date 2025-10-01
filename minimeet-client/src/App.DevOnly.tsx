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
    <div className="app">
      {/* Dev mode header with integrated admin button */}
      <header className="app-header">
        <h1>MiniMeet {showAdmin && "- Admin Panel"}</h1>
        <button
          onClick={() => setShowAdmin(!showAdmin)}
          className="admin-toggle-button"
          title={showAdmin ? "Back to App" : "Open Admin Panel"}
        >
          {showAdmin ? "Back to App" : "Admin Panel"}
        </button>
      </header>

      {/* Show either admin panel or main app */}
      <div style={{ flex: 1, overflow: showAdmin ? "auto" : "hidden" }}>
        {showAdmin ? <AdminPanel /> : <App />}
      </div>
    </div>
  );
};

export default AppDevOnly;
