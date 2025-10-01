import React, { useState, useEffect, useCallback } from 'react';
import ThemeToggle from './ThemeToggle';
import { apiClient } from "../services/api";

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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">🔧 Admin Panel</h1>
              <p className="text-secondary mt-1">Manage users, rooms, and participants</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <span className="badge badge-warning font-semibold">
                DEVELOPMENT ONLY
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="card border-danger">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="text-xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-danger">Error</h3>
                <p className="text-secondary">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="card border-success">
          <div className="card-body">
            <div className="flex items-center gap-3">
              <div className="text-xl">✅</div>
              <div>
                <h3 className="font-semibold text-success">Success</h3>
                <p className="text-secondary">{success}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-1">
            <button
              className={`flex-1 btn ${activeTab === "users" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("users")}
            >
              👥 Users
            </button>
            <button
              className={`flex-1 btn ${activeTab === "rooms" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("rooms")}
            >
              🏠 Rooms
            </button>
            <button
              className={`flex-1 btn ${activeTab === "participants" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("participants")}
            >
              👨‍👩‍👧‍👦 Participants
            </button>
          </div>
        </div>
      </div>

      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Create/Edit User Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">{isEditingUser ? "Edit User" : "Create New User"}</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Username</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) =>
                      setUserForm({ ...userForm, username: e.target.value })
                    }
                    className="input"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Email</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) =>
                      setUserForm({ ...userForm, email: e.target.value })
                    }
                    className="input"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="user-active"
                  checked={userForm.isActive}
                  onChange={(e) =>
                    setUserForm({ ...userForm, isActive: e.target.checked })
                  }
                  className="rounded border-secondary"
                />
                <label htmlFor="user-active" className="text-sm font-medium">Active</label>
              </div>
            </div>
            <div className="card-footer justify-between">
              <div></div>
              {isEditingUser ? (
                <div className="flex gap-2">
                  <button onClick={cancelEdit} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleUpdateUser} className="btn btn-primary">
                    Update User
                  </button>
                </div>
              ) : (
                <button onClick={handleCreateUser} className="btn btn-primary">
                  Create User
                </button>
              )}
            </div>
          </div>

          {/* Users List Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">All Users ({users.length})</h2>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                  <span className="ml-2 text-secondary">Loading...</span>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th className="text-left p-3 text-sm font-semibold text-secondary">ID</th>
                        <th className="text-left p-3 text-sm font-semibold text-secondary">Username</th>
                        <th className="text-left p-3 text-sm font-semibold text-secondary">Email</th>
                        <th className="text-left p-3 text-sm font-semibold text-secondary">Status</th>
                        <th className="text-left p-3 text-sm font-semibold text-secondary">Created</th>
                        <th className="text-left p-3 text-sm font-semibold text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-border-subtle hover:bg-bg-tertiary">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-bg-tertiary px-2 py-1 rounded text-secondary">
                                {user.id.substring(0, 8)}...
                              </code>
                              <button
                                onClick={() => copyToClipboard(user.id, "User ID")}
                                className="btn btn-sm btn-ghost p-1"
                                title="Copy full ID"
                              >
                                📋
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-medium">{user.username}</td>
                          <td className="p-3 text-secondary">{user.email}</td>
                          <td className="p-3">
                            <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                              {user.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="p-3 text-secondary text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditUser(user)}
                                className="btn btn-sm btn-ghost"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="btn btn-sm btn-danger"
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
        <div className="space-y-6">
          {/* Create/Edit Room Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">{isEditingRoom ? "Edit Room" : "Create New Room"}</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Room Name</label>
                  <input
                    type="text"
                    value={roomForm.name}
                    onChange={(e) =>
                      setRoomForm({ ...roomForm, name: e.target.value })
                    }
                    className="input"
                    placeholder="Enter room name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Max Participants</label>
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
                    className="input"
                  />
                </div>
              </div>
            </div>
            <div className="card-footer justify-between">
              <div></div>
              {isEditingRoom ? (
                <div className="flex gap-2">
                  <button onClick={cancelEdit} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleUpdateRoom} className="btn btn-primary">
                    Update Room
                  </button>
                </div>
              ) : (
                <button onClick={handleCreateRoom} className="btn btn-primary">
                  Create Room
                </button>
              )}
            </div>
          </div>

          {/* Rooms List Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">All Rooms ({rooms.length})</h2>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                  <span className="ml-2 text-secondary">Loading...</span>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th className="text-left p-3 text-sm font-semibold text-secondary">ID</th>
                        <th className="text-left p-3 text-sm font-semibold text-secondary">Name</th>
                        <th className="text-left p-3 text-sm font-semibold text-secondary">Max Participants</th>
                        <th className="text-left p-3 text-sm font-semibold text-secondary">Created</th>
                        <th className="text-left p-3 text-sm font-semibold text-secondary">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rooms.map((room) => (
                        <tr key={room.id} className="border-b border-border-subtle hover:bg-bg-tertiary">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <code className="text-xs bg-bg-tertiary px-2 py-1 rounded text-secondary">
                                {room.id.substring(0, 8)}...
                              </code>
                              <button
                                onClick={() => copyToClipboard(room.id, "Room ID")}
                                className="btn btn-sm btn-ghost p-1"
                                title="Copy full ID"
                              >
                                📋
                              </button>
                            </div>
                          </td>
                          <td className="p-3 font-medium">{room.name}</td>
                          <td className="p-3 text-secondary">{room.maxParticipants}</td>
                          <td className="p-3 text-secondary text-sm">
                            {new Date(room.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditRoom(room)}
                                className="btn btn-sm btn-ghost"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRoom(room.id)}
                                className="btn btn-sm btn-danger"
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
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Room Participants</h2>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="loading-spinner"></div>
                  <span className="ml-2 text-secondary">Loading...</span>
                </div>
              ) : (
                <div className="grid gap-6">
                  {rooms.map((room) => (
                    <div key={room.id} className="card border-border-subtle">
                      <div className="card-header">
                        <h3 className="text-base font-semibold">{room.name}</h3>
                        <span className="badge badge-primary">
                          {room.participants?.length || 0} / {room.maxParticipants}
                        </span>
                      </div>
                      <div className="card-body">
                        {room.participants && room.participants.length > 0 ? (
                          <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b border-border-subtle">
                                  <th className="text-left p-3 text-sm font-semibold text-secondary">Username</th>
                                  <th className="text-left p-3 text-sm font-semibold text-secondary">Email</th>
                                  <th className="text-left p-3 text-sm font-semibold text-secondary">Status</th>
                                  <th className="text-left p-3 text-sm font-semibold text-secondary">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {room.participants.map((participant) => (
                                  <tr key={participant.id} className="border-b border-border-subtle hover:bg-bg-tertiary">
                                    <td className="p-3 font-medium">{participant.username}</td>
                                    <td className="p-3 text-secondary">{participant.email}</td>
                                    <td className="p-3">
                                      <span className={`badge ${participant.isActive ? 'badge-success' : 'badge-danger'}`}>
                                        {participant.isActive ? "Active" : "Inactive"}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <button
                                        onClick={() =>
                                          handleEvictUser(
                                            room.id,
                                            participant.id,
                                            participant.username
                                          )
                                        }
                                        className="btn btn-sm btn-danger"
                                      >
                                        Evict
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-secondary">
                            <div className="text-2xl mb-2">👥</div>
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
