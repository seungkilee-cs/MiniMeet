import React, { useEffect, useRef } from "react";

interface ConsoleLogProps {
  logs: string[];
}

const ConsoleLog: React.FC<ConsoleLogProps> = ({ logs }) => {
  const logsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ marginTop: "20px" }}>
      <h3>Console Logs:</h3>
      <div
        ref={logsRef}
        style={{
          height: "200px",
          overflowY: "scroll",
          background: "#000",
          color: "#0f0",
          padding: "10px",
          fontFamily: "monospace",
        }}
      >
        {logs.map((log, index) => (
          <div key={index}>{log}</div>
        ))}
      </div>
    </div>
  );
};

export default ConsoleLog;
