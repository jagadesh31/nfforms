import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../api';

export function DcDashboard() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    apiRequest('/events').then(setEvents);
  }, []);

  const isDeadlinePassed = (deadline) => {
    return deadline && new Date() > new Date(deadline);
  };

  return (
    <div className="page">
      <h2>📋 Department Coordinator — Registration Events</h2>
      {events.length === 0 && (
        <div className="card" style={{ textAlign: 'center', maxWidth: '100%' }}>
          <p style={{ fontFamily: "'Bangers', cursive", fontSize: '1.3rem', letterSpacing: '1px' }}>
            No events available right now!
          </p>
          <p className="muted">Check back later for new events.</p>
        </div>
      )}
      <ul className="list">
        {events.map((ev) => (
          <li key={ev._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{ev.name}</strong>
              {isDeadlinePassed(ev.deadline) ? (
                <span className="comic-badge expired">🔒 Closed</span>
              ) : (
                <Link to={`/events/${ev._id}/fill`} style={{
                  background: '#4ecdc4',
                  color: '#fff',
                  padding: '6px 16px',
                  border: '3px solid #1a1a2e',
                  boxShadow: '3px 3px 0 #1a1a2e',
                  fontFamily: "'Bangers', cursive",
                  letterSpacing: '1.5px',
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                }}>
                  ✏️ Fill Form
                </Link>
              )}
            </div>
            {ev.description && <div className="muted">{ev.description}</div>}
            {ev.deadline && (
              <span className={`comic-badge ${isDeadlinePassed(ev.deadline) ? 'expired' : ''}`}>
                ⏰ {new Date(ev.deadline).toLocaleString()}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
