import React from "react";

interface StatusDisplayProps {
  status: string;
  error: string;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, error }) => {
  return (
    <>
      <div className="status">{status}</div>
      {error && (
        <div className="error" style={{ display: "block" }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </>
  );
};

export default StatusDisplay;
