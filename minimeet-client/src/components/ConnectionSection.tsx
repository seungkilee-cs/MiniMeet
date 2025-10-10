import React, { useState, useEffect } from "react";
import { apiClient } from "../services/api";
import { Room as ApiRoom } from "../types/message.types";
import RoomSearchBar from "./RoomSearchBar";
import "../style/ConnectionSection.css";

interface Room {
  id: string;
  name: string;
  maxParticipants: number;
  createdAt: string;
}

interface ConnectionSectionProps {
  onConnect: () => void;
  roomId: string;
  onRoomIdChange: (roomId: string) => void;
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  isConnected: boolean;
}

const ConnectionSection: React.FC<ConnectionSectionProps> = ({
  onConnect,
  roomId,
  onRoomIdChange,
  onJoinRoom,
  onLeaveRoom,
  isConnected,
}) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomSearch, setRoomSearch] = useState("");
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [showRoomDropdown, setShowRoomDropdown] = useState(false);
  const [useSearch, setUseSearch] = useState(false);

  // Load rooms for search
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const data = await apiClient.getRooms();
        // Convert ApiRoom to our Room interface
        const convertedRooms: Room[] = (data as ApiRoom[]).map(room => ({
          id: room.id,
          name: room.name,
          maxParticipants: 10, // Default value since API doesn't provide this
          createdAt: new Date().toISOString() // Default value since API doesn't provide this
        }));
        setRooms(convertedRooms);
      } catch (error) {
        // Silently fail if rooms can't be loaded
        console.log("Could not load rooms for search");
      }
    };
    
    if (useSearch) {
      loadRooms();
    }
  }, [useSearch]);

  // Filter rooms based on search
  useEffect(() => {
    if (roomSearch.trim() && rooms.length > 0) {
      const filtered = rooms.filter(room => 
        room.name.toLowerCase().includes(roomSearch.toLowerCase()) ||
        room.id.toLowerCase().includes(roomSearch.toLowerCase())
      );
      setFilteredRooms(filtered);
      setShowRoomDropdown(filtered.length > 0);
    } else {
      setFilteredRooms([]);
      setShowRoomDropdown(false);
    }
  }, [roomSearch, rooms]);

  const handleRoomSelect = (room: Room) => {
    onRoomIdChange(room.id);
    setRoomSearch(`${room.name} (${room.id.substring(0, 8)}...)`);
    setShowRoomDropdown(false);
  };

  return (
    <div className="connection-section">
      <h3 className="connection-title">2. Connect & Join Room</h3>
      <div className="connection-controls">
        <button onClick={onConnect} className="connect-button" disabled={isConnected}>
          {isConnected ? "✓ Connected" : "Connect to Server"}
        </button>
        
        <div className="room-input-toggle">
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
            Search Rooms
          </button>
        </div>
        
        {useSearch ? (
          <RoomSearchBar
            searchValue={roomSearch}
            onSearchChange={setRoomSearch}
            filteredRooms={filteredRooms}
            showDropdown={showRoomDropdown}
            onRoomSelect={handleRoomSelect}
            onDropdownClose={() => setShowRoomDropdown(false)}
            placeholder="Search rooms by name or ID..."
          />
        ) : (
          <input
            type="text"
            value={roomId}
            onChange={(e) => onRoomIdChange(e.target.value)}
            placeholder="Enter Room ID"
            className="connection-input"
          />
        )}
        
        <div className="room-controls">
          <button onClick={onJoinRoom} className="join-button" disabled={!isConnected}>
            Join Room
          </button>
          <button onClick={onLeaveRoom} className="leave-button" disabled={!isConnected}>
            Leave Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionSection;
