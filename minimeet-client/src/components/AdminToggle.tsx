import React from "react";

interface AdminToggleProps {
  onClick: () => void;
}

const AdminToggle: React.FC<AdminToggleProps> = ({ onClick }) => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className="admin-toggle-button"
      aria-label="Toggle admin panel"
      title="Admin Panel (Dev Only)"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
      </svg>
    </button>
  );
};

export default AdminToggle;