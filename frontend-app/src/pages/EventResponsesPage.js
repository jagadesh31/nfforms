import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../api';

export function EventResponsesPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [responses, setResponses] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    apiRequest(`/events/${id}`).then(setEvent);
    apiRequest(`/events/${id}/responses`).then(setResponses);
  }, [id]);

  const toggleExpand = (responseId) => {
    setExpandedId(expandedId === responseId ? null : responseId);
  };

  if (!event) {
    return (
      <div className="page" style={{ textAlign: 'center', marginTop: 60 }}>
        <span style={{ fontFamily: "'Bangers', cursive", fontSize: '1.5rem', letterSpacing: '2px' }}>
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>📊 {event.name}</h2>
      <div style={{ marginBottom: 16 }}>
        <span className="comic-badge success">
          {responses.length} Response{responses.length !== 1 ? 's' : ''}
        </span>
      </div>
      {responses.length === 0 && (
        <div className="card" style={{ textAlign: 'center', maxWidth: '100%' }}>
          <p style={{ fontFamily: "'Bangers', cursive", fontSize: '1.3rem', letterSpacing: '1px' }}>
            No responses yet!
          </p>
          <p className="muted">Responses will appear here when Department Coordinators fill the form.</p>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {responses.map((r, rIdx) => (
          <div
            key={r._id}
            style={{
              border: '3px solid #1a1a2e',
              boxShadow: expandedId === r._id ? '6px 6px 0 #1a1a2e' : '4px 4px 0 #1a1a2e',
              background: '#fff',
              transition: 'all 0.15s',
              transform: expandedId === r._id ? 'translate(-2px, -2px)' : 'none',
            }}
          >
            <div
              onClick={() => toggleExpand(r._id)}
              style={{
                padding: '14px 18px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: expandedId === r._id ? '#F2A332' : 'transparent',
                transition: 'background 0.2s',
                userSelect: 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{
                  fontFamily: "'Bangers', cursive",
                  background: '#222',
                  color: '#F2A332',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.95rem',
                  border: '2px solid #000',
                  flexShrink: 0,
                }}>
                  {rIdx + 1}
                </span>
                <div>
                  <strong style={{ fontFamily: "'Bangers', cursive", fontSize: '1.1rem', letterSpacing: '1px' }}>
                    {r.teamName || 'Unnamed Team'}
                  </strong>
                  <span className="muted" style={{ marginLeft: 12 }}>
                    — {r.dcUser?.name || 'Unknown Department Coordinator'}
                  </span>
                </div>
              </div>
              <span style={{
                fontFamily: "'Bangers', cursive",
                fontSize: '1.2rem',
                transition: 'transform 0.2s',
                transform: expandedId === r._id ? 'rotate(180deg)' : 'rotate(0deg)',
                color: '#222',
              }}>
                ▼
              </span>
            </div>
            {expandedId === r._id && (
              <div style={{ padding: '0 18px 18px', borderTop: '3px solid #1a1a2e' }}>
                {event.questions.map((q, idx) => {
                  const ans = r.answers.find((a) => a.questionIndex === idx);
                  return (
                    <div key={idx} style={{ marginTop: 14 }}>
                      <div style={{
                        fontWeight: 700,
                        marginBottom: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <span style={{
                          fontFamily: "'Bangers', cursive",
                          background: '#F2A332',
                          color: '#fff',
                          width: 24,
                          height: 24,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          border: '2px solid #000',
                          flexShrink: 0,
                        }}>
                          Q{idx + 1}
                        </span>
                        {q.text}
                      </div>
                      <div style={{
                        paddingLeft: 36,
                        color: '#333',
                        background: '#1e1e1e',
                        padding: '8px 12px 8px 36px',
                        border: '2px dashed #d1d5db',
                        fontSize: '0.95rem',
                      }}>
                        {ans?.text || <span className="muted">No answer</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
