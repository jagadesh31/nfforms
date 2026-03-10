import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';
import { useAuth } from '../AuthContext';

const Icons = {
  Events: () => (
    <svg className="nav-icon" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Create: () => (
    <svg className="nav-icon" viewBox="0 0 24 24">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Users: () => (
    <svg className="nav-icon" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Logs: () => (
    <svg className="nav-icon" viewBox="0 0 24 24">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
};

export function AdminDashboard() {
  const { user } = useAuth();
  const isMasterAdmin = user?.role === 'masterAdmin';

  const [activeTab, setActiveTab] = useState('events'); // events | create | users | logs

  const [events, setEvents] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([{ text: '', isRollNumber: false }]);
  const [deadline, setDeadline] = useState('');
  const [pocUsers, setPocUsers] = useState([]);
  const [selectedPocIds, setSelectedPocIds] = useState([]);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);

  // User Management
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('dc');
  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');
  const [allUsers, setAllUsers] = useState([]);
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

  useEffect(() => {
    if (activeTab === 'logs') loadLogs();
    if (activeTab === 'users' && isMasterAdmin) loadUsers();
    if (activeTab === 'events') loadEvents();
  }, [activeTab, isMasterAdmin]);

  const updateQuestion = (index, field, value) => {
    const next = [...questions];
    next[index] = { ...next[index], [field]: value };
    setQuestions(next);
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addQuestion = () => setQuestions([...questions, { text: '', isRollNumber: false }]);

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
            .filter((q) => q.text.trim())
            .map((q) => ({ text: q.text.trim(), required: true, isRollNumber: q.isRollNumber })),
          pocUserIds: selectedPocIds,
          deadline: deadline || undefined,
        }),
      });
      setName('');
      setDescription('');
      setQuestions([{ text: '', isRollNumber: false }]);
      setSelectedPocIds([]);
      setDeadline('');
      setActiveTab('events');
      await loadEvents();
    } catch (err) {
      setError('Failed to create event');
    }
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
      setUserSuccess(`${roleLabel} "${data.name}" created successfully.`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('dc');
      if (data.role === 'poc') {
        apiRequest('/auth/users/poc').then(setPocUsers).catch(() => { });
      }
      loadUsers();
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

  const startEditEvent = async (eventId) => {
    const data = await apiRequest(`/events/${eventId}`);
    setEditingEvent(data);
    setEditName(data.name || '');
    setEditDescription(data.description || '');
    setEditQuestions(data.questions.map((q) => ({ text: q.text, isRollNumber: q.isRollNumber || false })));
    setEditDeadline(data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '');
    setEditPocIds((data.pocUsers || []).map((p) => p._id || p));
    setEditMsg('');
    setActiveTab('create'); // reuse create tab for edit form
  };

  const cancelEditEvent = () => {
    setEditingEvent(null);
    setEditMsg('');
    setActiveTab('events');
  };

  const updateEditQuestion = (idx, field, val) => {
    const next = [...editQuestions];
    next[idx] = { ...next[idx], [field]: val };
    setEditQuestions(next);
  };

  const addEditQuestion = () => setEditQuestions([...editQuestions, { text: '', isRollNumber: false }]);
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
            .filter((q) => q.text.trim())
            .map((q) => ({ text: q.text.trim(), required: true, isRollNumber: q.isRollNumber })),
          pocUserIds: editPocIds,
          deadline: editDeadline || undefined,
        }),
      });
      setEditMsg('Event updated successfully.');
      await loadEvents();
      setTimeout(() => {
        cancelEditEvent();
      }, 1500);
    } catch {
      setEditMsg('Failed to save changes.');
    } finally {
      setEditSaving(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString();
  };

  const getRoleBadge = (role) => {
    const labels = {
      masterAdmin: 'MASTER',
      admin: 'ADMIN',
      poc: 'POC',
      dc: 'DC',
    };
    return (
      <span className="status-badge" style={{ backgroundColor: '#2C2C2E', color: role === 'masterAdmin' || role === 'admin' ? '#F2A332' : '#ffffff' }}>
        {labels[role] || role}
      </span>
    );
  };

  return (
    <div className="page">
      {/* Desktop Sidebar */}
      <div className="desktop-sidebar">
        <button className={`sidebar-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          <Icons.Events /> Active Events
        </button>
        <button className={`sidebar-item ${activeTab === 'create' ? 'active' : ''}`} onClick={() => { setEditingEvent(null); setActiveTab('create'); }}>
          <Icons.Create /> Create Event
        </button>
        {isMasterAdmin && (
          <button className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Icons.Users /> Manage Users
          </button>
        )}
        <button className={`sidebar-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <Icons.Logs /> Activity Logs
        </button>
      </div>

      <div className="desktop-main-with-sidebar">
        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div>
            <h2>Active Events</h2>
            {events.length === 0 && <p className="muted">No events created yet.</p>}
            <ul className="list">
              {events.map((ev) => (
                <li key={ev._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{ev.name}</strong>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <button onClick={() => startEditEvent(ev._id)} style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                        Edit
                      </button>
                      <a href={`/events/${ev._id}/responses`} style={{ padding: '8px 12px', fontSize: '0.85rem', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)' }}>Responses</a>
                    </div>
                  </div>
                  {ev.description && <div className="muted">{ev.description}</div>}
                  {ev.deadline && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`status-badge ${new Date() > new Date(ev.deadline) ? 'expired' : ''}`}>
                        Deadline: {formatDate(ev.deadline)}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CREATE / EDIT TAB */}
        {activeTab === 'create' && !editingEvent && (
          <div className="card">
            <h2>Create New Event</h2>
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
                Deadline
                <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </label>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--grey-text)', marginBottom: 12 }}>
                  Questions
                </div>
                {questions.map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                    <span style={{
                      color: 'var(--gold)',
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: '0.9rem', border: '1px solid var(--gold)', borderRadius: '50%'
                    }}>{idx + 1}</span>
                    <input value={q.text} onChange={(e) => updateQuestion(idx, 'text', e.target.value)} placeholder={`Question ${idx + 1}`} style={{ flex: 1 }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '0.85rem', flexDirection: 'row' }}>
                      <input type="checkbox" checked={q.isRollNumber} onChange={(e) => updateQuestion(idx, 'isRollNumber', e.target.checked)} />
                      Roll No
                    </label>
                    {questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(idx)} style={{ color: 'var(--red)', background: 'transparent', padding: '8px' }}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addQuestion} style={{ fontSize: '0.85rem', padding: '8px 16px', background: 'var(--bg-card)' }}>+ Add Question</button>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--grey-text)', marginBottom: 12, marginTop: 12 }}>
                  Assign Person of Contact(s)
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: 16, background: 'var(--bg-input)' }}>
                  {pocUsers.length === 0 && <div className="muted">No Person of Contact users found</div>}
                  {pocUsers.map((poc) => (
                    <label key={poc._id} className="label-inline" style={{ marginBottom: 12 }}>
                      <input
                        type="checkbox"
                        checked={selectedPocIds.includes(poc._id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedPocIds([...selectedPocIds, poc._id]);
                          else setSelectedPocIds(selectedPocIds.filter((id) => id !== poc._id));
                        }}
                      />
                      <span style={{ fontWeight: 600 }}>{poc.name}</span>
                      <span className="muted" style={{ marginLeft: 'auto' }}>{poc.email}</span>
                    </label>
                  ))}
                </div>
              </div>
              {error && <div className="error">{error}</div>}
              <button type="submit" style={{ marginTop: 12 }}>Create Event</button>
            </form>
          </div>
        )}

        {/* EDIT EVENT FORM */}
        {activeTab === 'create' && editingEvent && (
          <div className="card">
            <h2>Edit Event: {editingEvent.name}</h2>
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
                Deadline
                <input type="datetime-local" value={editDeadline} onChange={(e) => setEditDeadline(e.target.value)} />
              </label>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--grey-text)', marginBottom: 12 }}>
                  Questions
                </div>
                {editQuestions.map((q, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                    <span style={{
                      color: 'var(--gold)',
                      width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, fontSize: '0.9rem', border: '1px solid var(--gold)', borderRadius: '50%'
                    }}>{idx + 1}</span>
                    <input value={q.text} onChange={(e) => updateEditQuestion(idx, 'text', e.target.value)} placeholder={`Question ${idx + 1}`} style={{ flex: 1 }} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '0.85rem', flexDirection: 'row' }}>
                      <input type="checkbox" checked={q.isRollNumber} onChange={(e) => updateEditQuestion(idx, 'isRollNumber', e.target.checked)} />
                      Roll No
                    </label>
                    {editQuestions.length > 1 && (
                      <button type="button" onClick={() => removeEditQuestion(idx)} style={{ color: 'var(--red)', background: 'transparent', padding: '8px' }}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addEditQuestion} style={{ fontSize: '0.85rem', padding: '8px 16px', background: 'var(--bg-card)' }}>+ Add Question</button>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--grey-text)', marginBottom: 12, marginTop: 12 }}>
                  Assign Person of Contact(s)
                </div>
                <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '12px', padding: 16, background: 'var(--bg-input)' }}>
                  {pocUsers.length === 0 && <div className="muted">No POCs found</div>}
                  {pocUsers.map((poc) => (
                    <label key={poc._id} className="label-inline" style={{ marginBottom: 12 }}>
                      <input
                        type="checkbox"
                        checked={editPocIds.includes(poc._id)}
                        onChange={(e) => {
                          if (e.target.checked) setEditPocIds([...editPocIds, poc._id]);
                          else setEditPocIds(editPocIds.filter((id) => id !== poc._id));
                        }}
                      />
                      <span style={{ fontWeight: 600 }}>{poc.name}</span>
                      <span className="muted" style={{ marginLeft: 'auto' }}>{poc.email}</span>
                    </label>
                  ))}
                </div>
              </div>
              {editMsg && (
                <div className={editMsg.includes('success') ? 'success-msg' : 'error'}>
                  {editMsg}
                </div>
              )}
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <button type="submit" disabled={editSaving} style={{ flex: 1 }}>{editSaving ? 'Saving...' : 'Save Changes'}</button>
                <button type="button" onClick={cancelEditEvent} style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', flex: 1 }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && isMasterAdmin && (
          <div className="layout-two">
            <div className="card">
              <h2>Add New User</h2>
              <form onSubmit={handleCreateUser}>
                <label>
                  Name
                  <input value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required placeholder="Full name" />
                </label>
                <label>
                  Email
                  <input type="email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required placeholder="user@nitt.edu" />
                </label>
                <label>
                  Role
                  <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
                    <option value="dc">Department Coordinator (DC)</option>
                    <option value="poc">Person of Contact (POC)</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                {userError && <div className="error">{userError}</div>}
                {userSuccess && <div className="success-msg">{userSuccess}</div>}
                <button type="submit">Create User</button>
              </form>
            </div>
            <div>
              <h3>Manage Users</h3>
              {allUsers.length === 0 && <p className="muted">No users found.</p>}
              {allUsers.length > 0 && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div style={{ fontWeight: 500 }}>{u.name}</div>
                            <div className="muted">{u.email}</div>
                          </td>
                          <td>{getRoleBadge(u.role)}</td>
                          <td>
                            {u.role !== 'masterAdmin' && (
                              <button
                                onClick={() => handleDeleteUser(u._id, u.name)}
                                disabled={deleteLoading === u._id}
                                style={{ color: 'var(--red)', background: 'transparent', padding: '8px 12px', fontSize: '0.85rem' }}
                              >
                                {deleteLoading === u._id ? '⏳' : 'Delete'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div>
            <h2>Activity Logs</h2>
            {logs.length === 0 && <p className="muted">No activity logged yet.</p>}
            {logs.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Action</th>
                      <th>User</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((l) => (
                      <tr key={l._id}>
                        <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--grey-text)' }}>{formatDate(l.createdAt)}</td>
                        <td><span className="status-badge success" style={{ background: 'rgba(48, 209, 88, 0.1)' }}>{l.action}</span></td>
                        <td>
                          <div style={{ fontWeight: 500 }}>{l.user?.name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--grey-text)' }}>{l.user?.role}</div>
                        </td>
                        <td style={{ fontSize: '0.9rem' }}>{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="bottom-nav">
        <button className={`nav-item ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
          <Icons.Events />
          <span>Events</span>
        </button>
        <button className={`nav-item ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
          <Icons.Create />
          <span>Create</span>
        </button>
        {isMasterAdmin && (
          <button className={`nav-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <Icons.Users />
            <span>Users</span>
          </button>
        )}
        <button className={`nav-item ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
          <Icons.Logs />
          <span>Logs</span>
        </button>
      </div>
    </div>
  );
}
