import React from "react";

interface Room {
  id: string;
  name: string;
  maxParticipants: number;
  createdAt: string;
}

interface RoomSearchBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filteredRooms: Room[];
  showDropdown: boolean;
  onRoomSelect: (room: Room) => void;
  onDropdownClose: () => void;
  placeholder?: string;
}

const RoomSearchBar: React.FC<RoomSearchBarProps> = ({
  searchValue,
  onSearchChange,
  filteredRooms,
  showDropdown,
  onRoomSelect,
  onDropdownClose,
  placeholder = "Search rooms by name or ID..."
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
            {filteredRooms.map((room) => (
              <div
                key={room.id}
                className="search-dropdown-item"
                onClick={() => onRoomSelect(room)}
              >
                <div className="search-item-main">
                  <div className="search-item-name">{room.name}</div>
                  <div className="search-item-id">ID: {room.id.substring(0, 12)}...</div>
                </div>
                <div className="search-item-status">
                  <span className="search-badge participants">
                    Max: {room.maxParticipants}
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

export default RoomSearchBar;