import React, { useState, useEffect } from "react";
import { apiClient } from "../services/api";
import { User as ApiUser } from "../types/message.types";
import UserSearchBar from "./UserSearchBar";
import "../style/AuthSection.css";

interface User {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
}

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
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [useSearch, setUseSearch] = useState(false);

  // Load users for search
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await apiClient.getUsers();
        // Convert ApiUser to our User interface
        const convertedUsers: User[] = (data as ApiUser[]).map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          isActive: true // Default value since API doesn't provide this
        }));
        setUsers(convertedUsers);
      } catch (error) {
        // Silently fail if users can't be loaded
        console.log("Could not load users for search");
      }
    };
    
    if (useSearch) {
      loadUsers();
    }
  }, [useSearch]);

  // Filter users based on search
  useEffect(() => {
    if (userSearch.trim() && users.length > 0) {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearch.toLowerCase())
      );
      setFilteredUsers(filtered);
      setShowUserDropdown(filtered.length > 0);
    } else {
      setFilteredUsers([]);
      setShowUserDropdown(false);
    }
  }, [userSearch, users]);

  const handleUserSelect = (user: User) => {
    onUserIdChange(user.id);
    setUserSearch(`${user.username} (${user.email})`);
    setShowUserDropdown(false);
  };

  return (
    <div className="auth-section">
      <h3 className="auth-title">1. Get Authentication Token</h3>
      <div className="auth-controls">
        <div className="auth-input-toggle">
          <button
            type="button"
            className={`toggle-btn ${!useSearch ? 'active' : ''}`}
            onClick={() => setUseSearch(false)}
          >
            Manual ID
          </button>
          <button
            type="button"
            className={`toggle-btn ${useSearch ? 'active' : ''}`}
            onClick={() => setUseSearch(true)}
          >
            Search Users
          </button>
        </div>
        
        {useSearch ? (
          <UserSearchBar
            searchValue={userSearch}
            onSearchChange={setUserSearch}
            filteredUsers={filteredUsers}
            showDropdown={showUserDropdown}
            onUserSelect={handleUserSelect}
            onDropdownClose={() => setShowUserDropdown(false)}
            placeholder="Search users by name or email..."
          />
        ) : (
          <input
            type="text"
            value={userId}
            onChange={(e) => onUserIdChange(e.target.value)}
            placeholder="Enter User ID"
            className="auth-input"
          />
        )}
        
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
