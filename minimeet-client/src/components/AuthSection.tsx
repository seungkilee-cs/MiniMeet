import React from "react";

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
    <div className="controls">
      <h3>1. Get Authentication Token</h3>
      <input
        type="text"
        value={userId}
        onChange={(e) => onUserIdChange(e.target.value)}
        placeholder="Enter User ID"
        style={{ width: "300px" }}
      />
      <button onClick={onGetToken}>Get Token</button>
      {token && (
        <div className="token-display">
          <strong>Token:</strong> {token.substring(0, 50)}...
        </div>
      )}
    </div>
  );
};

export default AuthSection;
