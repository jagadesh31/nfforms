import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

export function PocDashboard() {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editQuestions, setEditQuestions] = useState([]);
  const [editDeadline, setEditDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    apiRequest('/events').then(setEvents);
  }, []);

  const startEdit = async (eventId) => {
    const data = await apiRequest(`/events/${eventId}`);
    setEditingEvent(data);
    setEditName(data.name || '');
    setEditDescription(data.description || '');
    setEditQuestions(data.questions.map((q) => q.text));
    setEditDeadline(data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '');
    setSaveMsg('');
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setSaveMsg('');
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
    setSaving(true);
    setSaveMsg('');
    try {
      await apiRequest(`/events/${editingEvent._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          questions: editQuestions
            .filter((q) => q.trim())
            .map((q) => ({ text: q.trim(), required: true })),
          deadline: editDeadline || undefined,
        }),
      });
      setSaveMsg('✅ Form updated successfully!');
      // Refresh events list
      const updated = await apiRequest('/events');
      setEvents(updated);
    } catch {
      setSaveMsg('❌ Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h2>👁️ Person of Contact Dashboard</h2>
      {events.length === 0 && (
        <div className="card" style={{ textAlign: 'center', maxWidth: '100%' }}>
          <p style={{ fontFamily: "'Bangers', cursive", fontSize: '1.3rem', letterSpacing: '1px' }}>
            No events assigned to you yet!
          </p>
          <p className="muted">Ask an admin to assign you to an event.</p>
        </div>
      )}
      <ul className="list">
        {events.map((ev) => (
          <li key={ev._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{ev.name}</strong>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => startEdit(ev._id)} style={{ fontSize: '0.85rem', padding: '4px 12px' }}>
                  ✏️ Edit Form
                </button>
                <a href={`/events/${ev._id}/responses`}>📊 View Responses</a>
              </div>
            </div>
            {ev.description && <div className="muted">{ev.description}</div>}
          </li>
        ))}
      </ul>

      {/* Edit Form Modal */}
      {editingEvent && (
        <div className="card" style={{ marginTop: 24, maxWidth: 600 }}>
          <h3>✏️ Edit Form: {editingEvent.name}</h3>
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
                ❓ Questions
              </div>
              {editQuestions.map((q, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <span style={{
                    fontFamily: "'Bangers', cursive",
                    background: '#222',
                    color: '#F2A332',
                    width: 28, height: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
            {saveMsg && (
              <div style={{ padding: '8px 14px', fontWeight: 700, fontSize: '0.9rem', background: saveMsg.startsWith('✅') ? '#4ecdc4' : '#dc2626', color: '#fff', border: '3px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}>
                {saveMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving}>{saving ? '⏳ Saving...' : '💾 Save Changes'}</button>
              <button type="button" onClick={cancelEdit} style={{ background: '#999' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
