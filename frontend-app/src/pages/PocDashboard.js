import React, { useEffect, useState } from 'react';
import { apiRequest } from '../api';

const toLocalISOString = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

export function PocDashboard() {
  const [events, setEvents] = useState([]);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editQuestions, setEditQuestions] = useState([]);
  const [editMaxDcSubmissions, setEditMaxDcSubmissions] = useState(1);
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
    setEditQuestions(data.questions.map((q) => ({
      text: q.text,
      isRollNumber: q.isRollNumber || false,
      isAudio: q.isAudio || false,
      isVideo: q.isVideo || false,
    })));
    setEditMaxDcSubmissions(data.maxDcSubmissions || 1);
    setEditDeadline(data.deadline ? toLocalISOString(data.deadline) : '');
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

  const addEditQuestion = () => setEditQuestions([...editQuestions, { text: '', isRollNumber: false, isAudio: false, isVideo: false }]);

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
            .map((q) => ({
              text: q.text.trim(),
              required: true,
              isRollNumber: q.isRollNumber,
              isAudio: q.isAudio,
              isVideo: q.isVideo,
            })),
          maxDcSubmissions: editMaxDcSubmissions,
          deadline: editDeadline ? new Date(editDeadline).toISOString() : null,
        }),
      });
      setSaveMsg('Form updated successfully.');
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
              <div className="list-item-header">
                <strong style={{ fontSize: '1.1rem' }}>{ev.name}</strong>
                <div className="list-item-actions">
                  <button onClick={() => startEdit(ev._id)} className="btn-small">
                    Edit Form
                  </button>
                  <a href={`/events/${ev._id}/responses`} className="btn-small btn-outline">Responses</a>
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
            <label>
              Max Submissions per DC
              <input
                type="number"
                min="1"
                value={editMaxDcSubmissions}
                onChange={(e) => setEditMaxDcSubmissions(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--grey-text)', marginBottom: 12 }}>
                Questions
              </div>
              {editQuestions.map((q, idx) => (
                <div key={idx} className="question-row">
                  <span className="question-number">{idx + 1}</span>
                  <div className="question-row-fields">
                    <input value={q.text} onChange={(e) => updateEditQuestion(idx, 'text', e.target.value)} placeholder={`Question ${idx + 1}`} className="question-input" />
                    <div className="question-toggles">
                      <label className="toggle-label">
                        <input type="checkbox" checked={q.isRollNumber} onChange={(e) => updateEditQuestion(idx, 'isRollNumber', e.target.checked)} />
                        <span className="toggle-text">Roll No</span>
                      </label>
                      <label className="toggle-label toggle-audio">
                        <input type="checkbox" checked={q.isAudio} onChange={(e) => updateEditQuestion(idx, 'isAudio', e.target.checked)} />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                        <span className="toggle-text">Audio</span>
                      </label>
                      <label className="toggle-label toggle-video">
                        <input type="checkbox" checked={q.isVideo} onChange={(e) => updateEditQuestion(idx, 'isVideo', e.target.checked)} />
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                        <span className="toggle-text">Video</span>
                      </label>
                      {editQuestions.length > 1 && (
                        <button type="button" onClick={() => removeEditQuestion(idx)} style={{ color: 'var(--red)', background: 'transparent', padding: '4px 8px', fontSize: '1rem' }}>✕</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addEditQuestion} className="btn-add-question">+ Add Question</button>
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
