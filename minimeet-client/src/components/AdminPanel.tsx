import React, { useState, useEffect } from "react";
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
    maxParticipants: 4,
  });
  const [isEditingRoom, setIsEditingRoom] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
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
  };

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

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>🔧 Admin Panel</h1>
        <div className="dev-badge">DEVELOPMENT ONLY</div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Users
        </button>
        <button
          className={`tab ${activeTab === "rooms" ? "active" : ""}`}
          onClick={() => setActiveTab("rooms")}
        >
          🏠 Rooms
        </button>
        <button
          className={`tab ${activeTab === "participants" ? "active" : ""}`}
          onClick={() => setActiveTab("participants")}
        >
          👨‍👩‍👧‍👦 Participants
        </button>
      </div>

      {activeTab === "users" && (
        <div className="admin-content">
          <div className="admin-form">
            <h2>{isEditingUser ? "Edit User" : "Create New User"}</h2>
            <div className="form-group">
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
            <div className="form-group">
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
            <div className="form-group checkbox">
              <label>
                <input
                  type="checkbox"
                  checked={userForm.isActive}
                  onChange={(e) =>
                    setUserForm({ ...userForm, isActive: e.target.checked })
                  }
                />
                Active
              </label>
            </div>
            <div className="form-actions">
              {isEditingUser ? (
                <>
                  <button onClick={handleUpdateUser} className="btn-primary">
                    Update User
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={handleCreateUser} className="btn-primary">
                  Create User
                </button>
              )}
            </div>
          </div>

          <div className="admin-list">
            <h2>All Users ({users.length})</h2>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
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
                        <div className="id-cell">
                          <code>{user.id.substring(0, 8)}...</code>
                          <button
                            onClick={() => copyToClipboard(user.id, "User ID")}
                            className="btn-copy"
                            title="Copy full ID"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span
                          className={`status ${user.isActive ? "active" : "inactive"}`}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="btn-small btn-edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn-small btn-delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === "rooms" && (
        <div className="admin-content">
          <div className="admin-form">
            <h2>{isEditingRoom ? "Edit Room" : "Create New Room"}</h2>
            <div className="form-group">
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
            <div className="form-group">
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
            <div className="form-actions">
              {isEditingRoom ? (
                <>
                  <button onClick={handleUpdateRoom} className="btn-primary">
                    Update Room
                  </button>
                  <button onClick={cancelEdit} className="btn-secondary">
                    Cancel
                  </button>
                </>
              ) : (
                <button onClick={handleCreateRoom} className="btn-primary">
                  Create Room
                </button>
              )}
            </div>
          </div>

          <div className="admin-list">
            <h2>All Rooms ({rooms.length})</h2>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
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
                        <div className="id-cell">
                          <code>{room.id.substring(0, 8)}...</code>
                          <button
                            onClick={() => copyToClipboard(room.id, "Room ID")}
                            className="btn-copy"
                            title="Copy full ID"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                      <td>{room.name}</td>
                      <td>{room.maxParticipants}</td>
                      <td>{new Date(room.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="btn-small btn-edit"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          className="btn-small btn-delete"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === "participants" && (
        <div className="admin-content-full">
          <div className="admin-list">
            <h2>Room Participants</h2>
            {loading ? (
              <div className="loading">Loading...</div>
            ) : (
              <div className="participants-grid">
                {rooms.map((room) => (
                  <div key={room.id} className="room-card">
                    <div className="room-card-header">
                      <h3>{room.name}</h3>
                      <span className="participant-count">
                        {room.participants?.length || 0} / {room.maxParticipants}
                      </span>
                    </div>
                    {room.participants && room.participants.length > 0 ? (
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {room.participants.map((participant) => (
                            <tr key={participant.id}>
                              <td>{participant.username}</td>
                              <td>{participant.email}</td>
                              <td>
                                <span
                                  className={`status ${participant.isActive ? "active" : "inactive"}`}
                                >
                                  {participant.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>
                                <button
                                  onClick={() =>
                                    handleEvictUser(
                                      room.id,
                                      participant.id,
                                      participant.username
                                    )
                                  }
                                  className="btn-small btn-delete"
                                >
                                  Evict
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="empty-state">No participants in this room</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
