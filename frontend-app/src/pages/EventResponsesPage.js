import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api';

const RollNumberName = ({ rollNumberText }) => {
  const [names, setNames] = useState(rollNumberText);

  useEffect(() => {
    const fetchNames = async () => {
      if (!rollNumberText) return;
      // Split assuming comma-separated, space-separated, or newline-separated roll numbers.
      const rolls = rollNumberText.split(/[\s,]+/).filter(Boolean);
      const results = await Promise.all(
        rolls.map(async (roll) => {
          try {
            const res = await fetch('https://auth1.nittfest.in/api/auth/check-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roll_number: roll }),
            });
            const data = await res.json();
            if (data.success && data.data && data.data.name) {
              return `${data.data.name} (${roll})`;
            }
          } catch (e) {
            console.error('Failed to fetch roll number name', e);
          }
          return roll;
        })
      );
      setNames(results.join(', '));
    };
    fetchNames();
  }, [rollNumberText]);

  return <span>{names}</span>;
}

export function EventResponsesPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [responses, setResponses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [editAnswers, setEditAnswers] = useState([]);
  const [savingId, setSavingId] = useState(null);
  const [saveMsg, setSaveMsg] = useState('');

  useEffect(() => {
    apiRequest(`/events/${id}`).then(setEvent);
    apiRequest(`/events/${id}/responses`).then(setResponses);
  }, [id]);

  const toggleExpand = (responseId) => {
    if (editingId) return; // Prevent collapse while editing
    setExpandedId(expandedId === responseId ? null : responseId);
  };

  const handleStartEdit = (e, r) => {
    e.stopPropagation();
    setEditingId(r._id);
    setExpandedId(r._id);
    setEditTeamName(r.teamName || '');
    // Ensure editAnswers is fully populated mapped to event questions
    const answersMap = event.questions.map((q, idx) => {
      const existing = r.answers.find((a) => a.questionIndex === idx);
      return existing ? existing.text : '';
    });
    setEditAnswers(answersMap);
    setSaveMsg('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSaveMsg('');
  };

  const handleChangeEditAnswer = (index, value) => {
    const next = [...editAnswers];
    next[index] = value;
    setEditAnswers(next);
  };

  const handleSaveEdit = async (rId) => {
    setSavingId(rId);
    setSaveMsg('');
    try {
      const answersPayload = editAnswers.map((text, idx) => ({ questionIndex: idx, text }));
      await apiRequest(`/events/${id}/responses/${rId}`, {
        method: 'PUT',
        body: JSON.stringify({
          teamName: editTeamName,
          answers: answersPayload,
        }),
      });
      setSaveMsg('✅ Response updated');
      setEditingId(null);
      // Refresh responses
      const updatedResponses = await apiRequest(`/events/${id}/responses`);
      setResponses(updatedResponses);
    } catch (err) {
      setSaveMsg('❌ Error updating');
    } finally {
      setSavingId(null);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  if (!event) {
    return (
      <div className="page" style={{ textAlign: 'center', marginTop: 60 }}>
        <span style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--grey-text)' }}>
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>{event.name} Responses</h2>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span className="status-badge success" style={{ background: 'rgba(48, 209, 88, 0.1)' }}>
          {responses.length} Response{responses.length !== 1 ? 's' : ''}
        </span>
        {saveMsg && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: saveMsg.includes('✅') ? 'var(--green)' : 'var(--red)' }}>{saveMsg}</span>}
      </div>
      {responses.length === 0 && (
        <div className="card" style={{ textAlign: 'center', maxWidth: '100%' }}>
          <p style={{ fontWeight: 600, fontSize: '1.2rem' }}>
            No responses yet.
          </p>
          <p className="muted">Responses will appear here when Department Coordinators fill the form.</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {responses.map((r, rIdx) => {
          const isEditing = editingId === r._id;
          return (
            <div
              key={r._id}
              style={{
                border: isEditing ? '1px solid var(--gold)' : '1px solid var(--border)',
                borderRadius: '16px',
                background: 'var(--bg-card)',
                overflow: 'hidden',
                transition: 'border-color 0.2s'
              }}
            >
              <div
                onClick={() => toggleExpand(r._id)}
                style={{
                  padding: '20px',
                  cursor: isEditing ? 'default' : 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: expandedId === r._id ? 'var(--bg-input)' : 'transparent',
                  userSelect: 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                  <span style={{
                    color: 'var(--gold)',
                    border: '1px solid var(--gold)',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    flexShrink: 0,
                  }}>
                    {rIdx + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    {isEditing ? (
                      <input
                        value={editTeamName}
                        onChange={(e) => setEditTeamName(e.target.value)}
                        placeholder="Team Name"
                        style={{ padding: '8px 12px', fontSize: '1.1rem', marginBottom: 4, width: '100%', maxWidth: '300px' }}
                      />
                    ) : (
                      <strong style={{ fontSize: '1.15rem', color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>
                        {r.teamName || 'Unnamed Team'}
                      </strong>
                    )}
                    <span className="muted">
                      {r.dcUser?.name || 'Unknown Department Coordinator'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {!isEditing && (
                    <button
                      onClick={(e) => handleStartEdit(e, r)}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px' }}
                    >
                      Edit
                    </button>
                  )}
                  {isEditing && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSaveEdit(r._id); }}
                        disabled={savingId === r._id}
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        {savingId === r._id ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'transparent', color: 'var(--grey-text)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {!isEditing && (
                    <span style={{
                      fontSize: '1.2rem',
                      color: 'var(--gold)',
                      transition: 'transform 0.2s',
                      transform: expandedId === r._id ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}>
                      ▼
                    </span>
                  )}
                </div>
              </div>

              {expandedId === r._id && (
                <div style={{ padding: '0 20px 24px', borderTop: '1px solid var(--border)' }}>
                  {event.questions.map((q, idx) => {
                    const ans = r.answers.find((a) => a.questionIndex === idx);
                    return (
                      <div key={idx} style={{ marginTop: 24 }}>
                        <div style={{
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          marginBottom: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}>
                          <span style={{
                            background: 'var(--bg-input)',
                            color: 'var(--gold)',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                          }}>
                            Q{idx + 1}
                          </span>
                          {q.text} {q.isRollNumber && <span className="muted" style={{ fontSize: '0.8rem' }}>(Roll No)</span>}
                        </div>

                        {isEditing ? (
                          <textarea
                            value={editAnswers[idx] || ''}
                            onChange={(e) => handleChangeEditAnswer(idx, e.target.value)}
                            rows={3}
                            style={{ width: '100%', border: '1px solid var(--border)' }}
                          />
                        ) : (
                          <div style={{
                            color: 'var(--grey-text)',
                            background: 'var(--bg-dark)',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            fontSize: '0.95rem',
                            lineHeight: 1.5,
                          }}>
                            {ans?.text ? (
                              q.isRollNumber ? (
                                <RollNumberName rollNumberText={ans.text} />
                              ) : (
                                ans.text
                              )
                            ) : (
                              <span className="muted" style={{ fontStyle: 'italic' }}>No answer</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
