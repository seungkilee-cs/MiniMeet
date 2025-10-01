import React from "react";
import "../style/AuthSection.css";

interface AuthSectionProps {
  userId: string;
  onUserIdChange: (userId: string) => void;
  onGetToken: () => void;
  token: string;
}

const AuthSection: React.FC<AuthSectionProps> = ({
  userId,
  onUserIdChange,
  onGetToken,
  token,
}) => {
  return (
    <div className="auth-section">
      <h3 className="auth-title">1. Get Authentication Token</h3>
      <div className="auth-controls">
        <input
          type="text"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          placeholder="Enter User ID"
          className="auth-input"
        />
        <button onClick={onGetToken} className="auth-button">
          Get Token
        </button>
      </div>
      {token && (
        <div className="token-display">
          <strong>Token:</strong> {token.substring(0, 50)}...
        </div>
      )}
    </div>
  );
};

export default AuthSection;
