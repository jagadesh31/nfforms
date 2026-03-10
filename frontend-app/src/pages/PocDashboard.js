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
    setEditQuestions(data.questions.map((q) => ({ text: q.text, isRollNumber: q.isRollNumber || false })));
    setEditDeadline(data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '');
    setSaveMsg('');
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setSaveMsg('');
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
    setSaving(true);
    setSaveMsg('');
    try {
      await apiRequest(`/events/${editingEvent._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          questions: editQuestions
            .filter((q) => q.text.trim())
            .map((q) => ({ text: q.text.trim(), required: true, isRollNumber: q.isRollNumber })),
          deadline: editDeadline || undefined,
        }),
      });
      setSaveMsg('Form updated successfully.');
      // Refresh events list
      const updated = await apiRequest('/events');
      setEvents(updated);
      setTimeout(() => setEditingEvent(null), 1500);
    } catch {
      setSaveMsg('Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h2>Person of Contact Dashboard</h2>
      {!editingEvent && events.length === 0 && (
        <div className="card" style={{ textAlign: 'center', maxWidth: '100%' }}>
          <p style={{ fontWeight: 600, fontSize: '1.2rem' }}>
            No events assigned to you yet.
          </p>
          <p className="muted">Ask an admin to assign you to an event.</p>
        </div>
      )}
      {!editingEvent && events.length > 0 && (
        <ul className="list">
          {events.map((ev) => (
            <li key={ev._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.1rem' }}>{ev.name}</strong>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => startEdit(ev._id)} style={{ fontSize: '0.85rem', padding: '8px 12px' }}>
                    Edit Form
                  </button>
                  <a href={`/events/${ev._id}/responses`} style={{ padding: '8px 12px', fontSize: '0.85rem', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>Responses</a>
                </div>
              </div>
              {ev.description && <div className="muted">{ev.description}</div>}
            </li>
          ))}
        </ul>
      )}

      {/* Edit Form Modal */}
      {editingEvent && (
        <div className="card">
          <h2>Edit Form: {editingEvent.name}</h2>
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
                    color: 'var(--gold)', border: '1px solid var(--gold)', borderRadius: '50%',
                    width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: '0.9rem'
                  }}>{idx + 1}</span>
                  <input value={q.text} onChange={(e) => updateEditQuestion(idx, 'text', e.target.value)} placeholder={`Question ${idx + 1}`} style={{ flex: 1 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0, fontSize: '0.85rem', flexDirection: 'row' }}>
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
            {saveMsg && (
              <div className={saveMsg.includes('success') ? 'success-msg' : 'error'}>
                {saveMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <button type="submit" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={cancelEdit} style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', flex: 1 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
