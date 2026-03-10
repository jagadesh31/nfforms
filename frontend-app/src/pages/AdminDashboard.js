import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../AuthContext';

export function AdminDashboard() {
  const { user } = useAuth();
  const isMasterAdmin = user?.role === 'masterAdmin';

  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState(['']);
  const [deadline, setDeadline] = useState('');
  const [pocUsers, setPocUsers] = useState([]);
  const [selectedPocIds, setSelectedPocIds] = useState([]);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('dc');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

  // User management (master admin)
  const [allUsers, setAllUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  // Event editing
  const [editingEvent, setEditingEvent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editQuestions, setEditQuestions] = useState([]);
  const [editDeadline, setEditDeadline] = useState('');
  const [editPocIds, setEditPocIds] = useState([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  const loadEvents = async () => {
    const data = await apiRequest('/events');
    setEvents(data);
  };

  const loadLogs = async () => {
    const data = await apiRequest('/events/admin/logs');
    setLogs(data);
  };

  const loadUsers = async () => {
    try {
      const data = await apiRequest('/auth/admin/users');
      setAllUsers(data);
    } catch {
      setAllUsers([]);
    }
  };

  useEffect(() => {
    loadEvents();
    apiRequest('/auth/users/poc').then(setPocUsers).catch(() => { });
  }, []);

  const updateQuestion = (index, value) => {
    const next = [...questions];
    next[index] = value;
    setQuestions(next);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addQuestion = () => setQuestions([...questions, '']);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiRequest('/events', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          questions: questions
            .filter((q) => q.trim())
            .map((q) => ({ text: q.trim(), required: true })),
          pocUserIds: selectedPocIds,
          deadline: deadline || undefined,
        }),
      });
      setName('');
      setDescription('');
      setQuestions(['']);
      setSelectedPocIds([]);
      setDeadline('');
      await loadEvents();
    } catch (err) {
      setError('Failed to create event');
    }
  };

  const handleToggleLogs = () => {
    if (!showLogs) loadLogs();
    setShowLogs(!showLogs);
  };

  const handleToggleUsers = () => {
    if (!showUsers) loadUsers();
    setShowUsers(!showUsers);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');
    try {
      const data = await apiRequest('/auth/admin/create-user', {
        method: 'POST',
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
        }),
      });
      const roleLabel = data.role === 'dc' ? 'Department Coordinator' : data.role === 'poc' ? 'Person of Contact' : data.role.toUpperCase();
      setUserSuccess(`✅ ${roleLabel} "${data.name}" created successfully!`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('dc');
      if (data.role === 'poc') {
        apiRequest('/auth/users/poc').then(setPocUsers).catch(() => { });
      }
      if (showUsers) loadUsers();
    } catch (err) {
      try {
        const msg = JSON.parse(err.message);
        setUserError(msg.message || 'Failed to create user');
      } catch {
        setUserError(err.message || 'Failed to create user');
      }
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"?`)) return;
    setDeleteLoading(userId);
    try {
      await apiRequest(`/auth/admin/delete-user/${userId}`, { method: 'DELETE' });
      await loadUsers();
      apiRequest('/auth/users/poc').then(setPocUsers).catch(() => { });
    } catch (err) {
      try {
        const msg = JSON.parse(err.message);
        alert(msg.message || 'Failed to delete user');
      } catch {
        alert(err.message || 'Failed to delete user');
      }
    } finally {
      setDeleteLoading(null);
    }
  };

  // ─── Event editing ─────────────────────────────────────────────
  const startEditEvent = async (eventId) => {
    const data = await apiRequest(`/events/${eventId}`);
    setEditingEvent(data);
    setEditName(data.name || '');
    setEditDescription(data.description || '');
    setEditQuestions(data.questions.map((q) => q.text));
    setEditDeadline(data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '');
    setEditPocIds((data.pocUsers || []).map((p) => p._id || p));
    setEditMsg('');
  };

  const cancelEditEvent = () => {
    setEditingEvent(null);
    setEditMsg('');
  };

  const updateEditQuestion = (idx, val) => {
    const next = [...editQuestions];
    next[idx] = val;
    setEditQuestions(next);
  };

  const addEditQuestion = () => setEditQuestions([...editQuestions, '']);

  const removeEditQuestion = (idx) => setEditQuestions(editQuestions.filter((_, i) => i !== idx));

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditMsg('');
    try {
      await apiRequest(`/events/${editingEvent._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          questions: editQuestions
            .filter((q) => q.trim())
            .map((q) => ({ text: q.trim(), required: true })),
          pocUserIds: editPocIds,
          deadline: editDeadline || undefined,
        }),
      });
      setEditMsg('✅ Event updated successfully!');
      await loadEvents();
    } catch {
      setEditMsg('❌ Failed to save changes');
    } finally {
      setEditSaving(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString();
  };

  const getRoleBadge = (role) => {
    const colors = {
      masterAdmin: '#a855f7',
      admin: '#F2A332',
      poc: '#4ecdc4',
      dc: '#F2A332',
    };
    const labels = {
      masterAdmin: 'MASTER',
      admin: 'ADMIN',
      poc: 'POC',
      dc: 'DC',
    };
    return (
      <span className="comic-badge" style={{
        background: colors[role] || '#ccc',
        color: role === 'dc' ? '#222' : '#fff',
      }}>
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div className="page">
      <h2>{isMasterAdmin ? '👑 Master Admin HQ' : '🛡️ Admin HQ'}</h2>
      <div className="layout-two">
        <div className="card" style={{ maxWidth: '100%' }}>
          <h3>📝 Create New Event</h3>
          <form onSubmit={handleCreateEvent}>
            <label>
              Event Name
              <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Give your event a name..." />
            </label>
            <label>
              Description
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Describe this event..."
              />
            </label>
            <label>
              ⏰ Deadline
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
            </label>
            <div>
              <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontSize: '0.95rem' }}>
                ❓ Questions
              </div>
              {questions.map((q, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <span style={{
                    fontFamily: "'Bangers', cursive", background: '#222', color: '#F2A332',
                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '0.9rem', border: '2px solid #000',
                  }}>{idx + 1}</span>
                  <input value={q} onChange={(e) => updateQuestion(idx, e.target.value)} placeholder={`Question ${idx + 1}`} style={{ flex: 1 }} />
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(idx)} style={{ background: '#dc2626', color: '#fff', padding: '4px 10px', fontSize: '0.8rem' }}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addQuestion} style={{ fontSize: '0.85rem' }}>+ Add Question</button>
            </div>
            <div>
              <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontSize: '0.95rem' }}>
                👤 Assign Person of Contact(s)
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '3px solid #1a1a2e', padding: 10, background: '#1e1e1e' }}>
                {pocUsers.length === 0 && <div className="muted">No Person of Contact users found</div>}
                {pocUsers.map((poc) => (
                  <label key={poc._id} className="label-inline">
                    <input
                      type="checkbox"
                      checked={selectedPocIds.includes(poc._id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedPocIds([...selectedPocIds, poc._id]);
                        else setSelectedPocIds(selectedPocIds.filter((id) => id !== poc._id));
                      }}
                    />
                    <span style={{ fontWeight: 700 }}>{poc.name}</span>
                    <span className="muted">{poc.email}</span>
                  </label>
                ))}
              </div>
            </div>
            {error && <div className="error">💥 {error}</div>}
            <button type="submit">🚀 Create Event!</button>
          </form>
        </div>
        <div>
          <h3>📋 Active Events</h3>
          {events.length === 0 && <p className="muted">No events created yet.</p>}
          <ul className="list">
            {events.map((ev) => (
              <li key={ev._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{ev.name}</strong>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => startEditEvent(ev._id)} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                      ✏️ Edit
                    </button>
                    <a href={`/events/${ev._id}/responses`}>View Responses</a>
                  </div>
                </div>
                {ev.description && <div className="muted">{ev.description}</div>}
                {ev.deadline && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={`comic-badge ${new Date() > new Date(ev.deadline) ? 'expired' : ''}`}>
                      ⏰ {formatDate(ev.deadline)}
                    </span>
                    {new Date() > new Date(ev.deadline) && (
                      <span className="comic-badge expired">Expired</span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Edit Event Section */}
      {editingEvent && (
        <div className="card" style={{ marginTop: 24, maxWidth: 600 }}>
          <h3>✏️ Edit Event: {editingEvent.name}</h3>
          <form onSubmit={handleSaveEdit}>
            <label>
              Event Name
              <input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </label>
            <label>
              Description
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3} />
            </label>
            <label>
              ⏰ Deadline
              <input type="datetime-local" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
            </label>
            <div>
              <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontSize: '0.95rem' }}>
                ❓ Questions (add, edit, or remove)
              </div>
              {editQuestions.map((q, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <span style={{
                    fontFamily: "'Bangers', cursive", background: '#222', color: '#F2A332',
                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '0.9rem', border: '2px solid #000',
                  }}>{idx + 1}</span>
                  <input value={q} onChange={(e) => updateEditQuestion(idx, e.target.value)} placeholder={`Question ${idx + 1}`} style={{ flex: 1 }} />
                  {editQuestions.length > 1 && (
                    <button type="button" onClick={() => removeEditQuestion(idx)} style={{ background: '#dc2626', color: '#fff', padding: '4px 10px', fontSize: '0.8rem' }}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addEditQuestion} style={{ fontSize: '0.85rem' }}>+ Add Question</button>
            </div>
            <div>
              <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontSize: '0.95rem' }}>
                👤 Assign Person of Contact(s)
              </div>
              <div style={{ maxHeight: 160, overflowY: 'auto', border: '3px solid #1a1a2e', padding: 10, background: '#1e1e1e' }}>
                {pocUsers.length === 0 && <div className="muted">No Person of Contact users found</div>}
                {pocUsers.map((poc) => (
                  <label key={poc._id} className="label-inline">
                    <input
                      type="checkbox"
                      checked={editPocIds.includes(poc._id)}
                      onChange={(e) => {
                        if (e.target.checked) setEditPocIds([...editPocIds, poc._id]);
                        else setEditPocIds(editPocIds.filter((id) => id !== poc._id));
                      }}
                    />
                    <span style={{ fontWeight: 700 }}>{poc.name}</span>
                    <span className="muted">{poc.email}</span>
                  </label>
                ))}
              </div>
            </div>
            {editMsg && (
              <div style={{
                padding: '8px 14px', fontWeight: 700, fontSize: '0.9rem',
                background: editMsg.startsWith('✅') ? '#4ecdc4' : '#dc2626',
                color: '#fff', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e',
              }}>
                {editMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={editSaving}>{editSaving ? '⏳ Saving...' : '💾 Save Changes'}</button>
              <button type="button" onClick={cancelEditEvent} style={{ background: '#999' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Add User Section */}
      <div style={{ marginTop: 40 }}>
        <button onClick={() => setShowAddUser(!showAddUser)}>
          {showAddUser ? '🙈 Hide User Form' : '👥 Add New User'}
        </button>
        {showAddUser && (
          <div className="card" style={{ marginTop: 16, maxWidth: 500 }}>
            <h3>👥 Add New User</h3>
            <form onSubmit={handleCreateUser}>
              <label>
                Name
                <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required placeholder="Full name" />
              </label>
              <label>
                📧 Email
                <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required placeholder="user@nitt.edu" />
              </label>
              <label>
                🎭 Role
                <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} style={{
                  padding: '10px 14px', border: '3px solid #1a1a2e', background: '#1e1e1e',
                  fontSize: '1rem', fontFamily: "'Inter', cursive",
                }}>
                  <option value="dc">Department Coordinator (DC)</option>
                  <option value="poc">Person of Contact (POC)</option>
                  {isMasterAdmin && <option value="admin">Admin</option>}
                </select>
              </label>
              {userError && <div className="error">💥 {userError}</div>}
              {userSuccess && (
                <div style={{
                  background: '#4ecdc4', color: '#fff', border: '3px solid #1a1a2e',
                  padding: '8px 14px', fontWeight: 700, fontSize: '0.9rem', boxShadow: '3px 3px 0 #1a1a2e',
                }}>
                  {userSuccess}
                </div>
              )}
              <button type="submit">🚀 Create User!</button>
            </form>
          </div>
        )}
      </div>

      {/* Manage Users (master admin only) */}
      {isMasterAdmin && (
        <div style={{ marginTop: 40 }}>
          <button onClick={handleToggleUsers}>
            {showUsers ? '🙈 Hide Users' : '👥 Manage Users'}
          </button>
          {showUsers && (
            <div style={{ marginTop: 16 }}>
              <button onClick={loadUsers} style={{ marginBottom: 12, fontSize: '0.85rem' }}>🔄 Refresh</button>
              {allUsers.length === 0 && <p className="muted">No users found.</p>}
              {allUsers.length > 0 && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>👤 Name</th>
                        <th>📧 Email</th>
                        <th>🎭 Role</th>
                        <th>📅 Created</th>
                        <th>⚡ Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u._id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>{getRoleBadge(u.role)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(u.createdAt)}</td>
                          <td>
                            {u.role !== 'masterAdmin' ? (
                              <button
                                onClick={() => handleDeleteUser(u._id, u.name)}
                                disabled={deleteLoading === u._id}
                                style={{ background: '#dc2626', color: '#fff', padding: '4px 10px', fontSize: '0.8rem' }}
                              >
                                {deleteLoading === u._id ? '⏳' : '🗑️ Delete'}
                              </button>
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Activity Logs */}
      <div style={{ marginTop: 40 }}>
        <button onClick={handleToggleLogs}>
          {showLogs ? '🙈 Hide Logs' : '📜 View Activity Logs'}
        </button>
        {showLogs && (
          <div style={{ marginTop: 16 }}>
            <button onClick={loadLogs} style={{ marginBottom: 12, fontSize: '0.85rem' }}>🔄 Refresh</button>
            {logs.length === 0 && <p className="muted">No activity logged yet.</p>}
            {logs.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>⏰ Time</th>
                      <th>⚡ Action</th>
                      <th>👤 User</th>
                      <th>📋 Event</th>
                      <th>📝 Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l._id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{formatDate(l.createdAt)}</td>
                        <td><span className="comic-badge success">{l.action}</span></td>
                        <td>{l.user?.name} <span className="muted">({l.user?.role})</span></td>
                        <td>{l.event?.name || '—'}</td>
                        <td>{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
