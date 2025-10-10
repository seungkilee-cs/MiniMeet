import React from "react";

interface User {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
}

interface UserSearchBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filteredUsers: User[];
  showDropdown: boolean;
  onUserSelect: (user: User) => void;
  onDropdownClose: () => void;
  placeholder?: string;
}

const UserSearchBar: React.FC<UserSearchBarProps> = ({
  searchValue,
  onSearchChange,
  filteredUsers,
  showDropdown,
  onUserSelect,
  onDropdownClose,
  placeholder = "Search users by name or email..."
}) => {
  return (
    <div className="search-container">
      <div className="search-input-wrapper">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="search-input"
        />
        <div className="search-icon">🔍</div>
      </div>
      
      {showDropdown && (
        <>
          <div className="search-overlay" onClick={onDropdownClose} />
          <div className="search-dropdown">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="search-dropdown-item"
                onClick={() => onUserSelect(user)}
              >
                <div className="search-item-main">
                  <div className="search-item-name">{user.username}</div>
                  <div className="search-item-email">{user.email}</div>
                </div>
                <div className="search-item-status">
                  <span className={`search-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default UserSearchBar;