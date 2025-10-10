import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from "../services/api";
import "../style/AdminPanel.css";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminRoom {
  id: string;
  name: string;
  maxParticipants: number;
  createdAt: string;
  participants?: AdminUser[];
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"users" | "rooms" | "participants">("users");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [rooms, setRooms] = useState<AdminRoom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // User form state
  const [userForm, setUserForm] = useState({
    id: "",
    username: "",
    email: "",
    isActive: true,
  });
  const [isEditingUser, setIsEditingUser] = useState(false);

  // Room form state
  const [roomForm, setRoomForm] = useState({
    id: "",
    name: "",
    maxParticipants: 10,
  });
  const [isEditingRoom, setIsEditingRoom] = useState(false);



  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (activeTab === "users") {
        const data = await apiClient.getUsers();
        setUsers(data as AdminUser[]);
      } else if (activeTab === "rooms" || activeTab === "participants") {
        const data = await apiClient.getRooms();
        setRooms(data as unknown as AdminRoom[]);
      }
    } catch (err: any) {
      setError(`Failed to load ${activeTab}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);



  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(""), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(""), 5000);
  };

  // User CRUD operations
  const handleCreateUser = async () => {
    if (!userForm.username || !userForm.email) {
      showError("Username and email are required");
      return;
    }

    try {
      await apiClient.createUser({
        username: userForm.username,
        email: userForm.email,
        isActive: userForm.isActive,
      });
      showSuccess("User created successfully");
      setUserForm({ id: "", username: "", email: "", isActive: true });
      loadData();
    } catch (err: any) {
      showError(`Failed to create user: ${err.message}`);
    }
  };

  const handleUpdateUser = async () => {
    if (!userForm.id) return;

    try {
      await apiClient.updateUser(userForm.id, {
        username: userForm.username,
        email: userForm.email,
        isActive: userForm.isActive,
      });
      showSuccess("User updated successfully");
      setUserForm({ id: "", username: "", email: "", isActive: true });
      setIsEditingUser(false);
      loadData();
    } catch (err: any) {
      showError(`Failed to update user: ${err.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await apiClient.deleteUser(userId);
      showSuccess("User deleted successfully");
      loadData();
    } catch (err: any) {
      showError(`Failed to delete user: ${err.message}`);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setUserForm({
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive,
    });
    setIsEditingUser(true);
  };

  // Room CRUD operations
  const handleCreateRoom = async () => {
    if (!roomForm.name) {
      showError("Room name is required");
      return;
    }

    try {
      await apiClient.createRoom({
        name: roomForm.name,
        maxParticipants: roomForm.maxParticipants,
      });
      showSuccess("Room created successfully");
      setRoomForm({ id: "", name: "", maxParticipants: 4 });
      loadData();
    } catch (err: any) {
      showError(`Failed to create room: ${err.message}`);
    }
  };

  const handleUpdateRoom = async () => {
    if (!roomForm.id) return;

    try {
      await apiClient.updateRoom(roomForm.id, {
        name: roomForm.name,
        maxParticipants: roomForm.maxParticipants,
      });
      showSuccess("Room updated successfully");
      setRoomForm({ id: "", name: "", maxParticipants: 4 });
      setIsEditingRoom(false);
      loadData();
    } catch (err: any) {
      showError(`Failed to update room: ${err.message}`);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;

    try {
      await apiClient.deleteRoom(roomId);
      showSuccess("Room deleted successfully");
      loadData();
    } catch (err: any) {
      showError(`Failed to delete room: ${err.message}`);
    }
  };

  const handleEditRoom = (room: AdminRoom) => {
    setRoomForm({
      id: room.id,
      name: room.name,
      maxParticipants: room.maxParticipants,
    });
    setIsEditingRoom(true);
  };

  const cancelEdit = () => {
    setUserForm({ id: "", username: "", email: "", isActive: true });
    setRoomForm({ id: "", name: "", maxParticipants: 4 });
    setIsEditingUser(false);
    setIsEditingRoom(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showSuccess(`${label} copied to clipboard!`);
    }).catch(() => {
      showError("Failed to copy to clipboard");
    });
  };



  const handleEvictUser = async (roomId: string, userId: string, username: string) => {
    if (!window.confirm(`Are you sure you want to evict ${username} from this room?`)) return;

    try {
      await apiClient.removeUserFromRoom(roomId, userId);
      showSuccess(`${username} evicted successfully`);
      loadData();
    } catch (err: any) {
      showError(`Failed to evict user: ${err.message}`);
    }
  };

  const handleEvictAllUsers = async (roomId: string, roomName: string, participants: AdminUser[]) => {
    if (!window.confirm(`Are you sure you want to evict ALL ${participants.length} users from "${roomName}"?`)) return;

    try {
      setLoading(true);
      const evictPromises = participants.map(participant =>
        apiClient.removeUserFromRoom(roomId, participant.id)
      );
      await Promise.all(evictPromises);
      showSuccess(`All users evicted from "${roomName}" successfully`);
      loadData();
    } catch (err: any) {
      showError(`Failed to evict all users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-panel-container">
      {/* Alerts */}
      {error && (
        <div className="admin-alert admin-alert-error">
          <div className="admin-alert-icon">⚠️</div>
          <div className="admin-alert-content">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="admin-alert admin-alert-success">
          <div className="admin-alert-icon">✅</div>
          <div className="admin-alert-content">
            <h3>Success</h3>
            <p>{success}</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <span className="admin-tab-icon">👥</span>
          <span className="admin-tab-text">Users</span>
        </button>
        <button
          className={`admin-tab ${activeTab === "rooms" ? "active" : ""}`}
          onClick={() => setActiveTab("rooms")}
        >
          <span className="admin-tab-icon">🏠</span>
          <span className="admin-tab-text">Rooms</span>
        </button>
        <button
          className={`admin-tab ${activeTab === "participants" ? "active" : ""}`}
          onClick={() => setActiveTab("participants")}
        >
          <span className="admin-tab-icon">👨‍👩‍👧‍👦</span>
          <span className="admin-tab-text">Participants</span>
        </button>
      </div>

      {activeTab === "users" && (
        <div className="admin-content">
          {/* Create/Edit User Form */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>{isEditingUser ? "Edit User" : "Create New User"}</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form">
                <div className="admin-form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm({ ...userForm, username: e.target.value })
                    }
                    placeholder="Enter username"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    placeholder="Enter email"
                  />
                </div>
                <div className="admin-checkbox-group">
                  <input
                    type="checkbox"
                    id="user-active"
                    checked={userForm.isActive}
                    onChange={(e) =>
                      setUserForm({ ...userForm, isActive: e.target.checked })
                    }
                  />
                  <label htmlFor="user-active">Active User</label>
                </div>
              </div>
            </div>
            <div className="admin-card-footer">
              {isEditingUser ? (
                <div className="admin-button-group">
                  <button onClick={cancelEdit} className="admin-btn admin-btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleUpdateUser} className="admin-btn admin-btn-primary">
                    Update User
                  </button>
                </div>
              ) : (
                <button onClick={handleCreateUser} className="admin-btn admin-btn-primary">
                  Create User
                </button>
              )}
            </div>
          </div>

          {/* Users List */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>All Users ({users.length})</h3>
            </div>
            <div className="admin-card-body">
              {loading ? (
                <div className="admin-loading">
                  <div className="admin-spinner"></div>
                  <span>Loading users...</span>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div className="admin-id-cell">
                              <code>{user.id.substring(0, 8)}...</code>
                              <button
                                onClick={() => copyToClipboard(user.id, "User ID")}
                                className="admin-copy-btn"
                                title="Copy full ID"
                              >
                                📋
                              </button>
                            </div>
                          </td>
                          <td className="admin-username">{user.username}</td>
                          <td className="admin-email">{user.email}</td>
                          <td>
                            <span className={`admin-badge ${user.isActive ? 'success' : 'danger'}`}>
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="admin-date">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="admin-btn admin-btn-small admin-btn-ghost"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="admin-btn admin-btn-small admin-btn-danger"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "rooms" && (
        <div className="admin-content">
          {/* Create/Edit Room Form */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>{isEditingRoom ? "Edit Room" : "Create New Room"}</h3>
            </div>
            <div className="admin-card-body">
              <div className="admin-form">
                <div className="admin-form-group">
                  <label>Room Name</label>
                  <input
                    type="text"
                    value={roomForm.name}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, name: e.target.value })
                    }
                    placeholder="Enter room name"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Max Participants</label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={roomForm.maxParticipants}
                    onChange={(e) =>
                      setRoomForm({
                        ...roomForm,
                        maxParticipants: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>
            <div className="admin-card-footer">
              {isEditingRoom ? (
                <div className="admin-button-group">
                  <button onClick={cancelEdit} className="admin-btn admin-btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleUpdateRoom} className="admin-btn admin-btn-primary">
                    Update Room
                  </button>
                </div>
              ) : (
                <button onClick={handleCreateRoom} className="admin-btn admin-btn-primary">
                  Create Room
                </button>
              )}
            </div>
          </div>

          {/* Rooms List */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>All Rooms ({rooms.length})</h3>
            </div>
            <div className="admin-card-body">
              {loading ? (
                <div className="admin-loading">
                  <div className="admin-spinner"></div>
                  <span>Loading rooms...</span>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Max Participants</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room) => (
                        <tr key={room.id}>
                          <td>
                            <div className="admin-id-cell">
                              <code>{room.id.substring(0, 8)}...</code>
                              <button
                                onClick={() => copyToClipboard(room.id, "Room ID")}
                                className="admin-copy-btn"
                                title="Copy full ID"
                              >
                                📋
                              </button>
                            </div>
                          </td>
                          <td className="admin-room-name">{room.name}</td>
                          <td className="admin-max-participants">{room.maxParticipants}</td>
                          <td className="admin-date">
                            {new Date(room.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <div className="admin-actions">
                              <button
                                onClick={() => handleEditRoom(room)}
                                className="admin-btn admin-btn-small admin-btn-ghost"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(room.id)}
                                className="admin-btn admin-btn-small admin-btn-danger"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "participants" && (
        <div className="admin-content">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3>Room Participants</h3>
            </div>
            <div className="admin-card-body">
              {loading ? (
                <div className="admin-loading">
                  <div className="admin-spinner"></div>
                  <span>Loading participants...</span>
                </div>
              ) : (
                <div className="admin-rooms-grid">
                  {rooms.map((room) => (
                    <div key={room.id} className="admin-room-card">
                      <div className="admin-room-header">
                        <div>
                          <h4>{room.name}</h4>
                          <span className="admin-badge primary">
                            {room.participants?.length || 0} / {room.maxParticipants}
                          </span>
                        </div>
                        {room.participants && room.participants.length > 0 && (
                          <button
                            onClick={() => handleEvictAllUsers(room.id, room.name, room.participants!)}
                            className="admin-btn admin-btn-small admin-btn-evict-all"
                            disabled={loading}
                          >
                            Evict All ({room.participants.length})
                          </button>
                        )}
                      </div>
                      <div className="admin-room-body">
                        {room.participants && room.participants.length > 0 ? (
                          <div className="admin-participants-grid">
                            {room.participants.map((participant) => (
                              <div key={participant.id} className="admin-participant-card">
                                <div className="admin-participant-info">
                                  <div className="admin-participant-name">{participant.username}</div>
                                  <div className="admin-participant-email">{participant.email}</div>
                                  <span className={`admin-badge ${participant.isActive ? 'success' : 'danger'}`}>
                                    {participant.isActive ? "Active" : "Inactive"}
                                  </span>
                                </div>
                                <div className="admin-participant-actions">
                                  <button
                                    onClick={() =>
                                      handleEvictUser(
                                        room.id,
                                        participant.id,
                                        participant.username
                                      )
                                    }
                                    className="admin-btn admin-btn-small admin-btn-danger"
                                  >
                                    Evict
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="admin-empty-state">
                            <div className="admin-empty-icon">👥</div>
                            <p>No participants in this room</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
