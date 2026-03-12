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

  // For new logic: allow up to maxDcSubmissions per DC, no edits
  const canFillEvent = (event) => {
    return !isDeadlinePassed(event.deadline) && (event.dcSubmissionCount || 0) < (event.maxDcSubmissions || 1);
  };

  const fillableCount = events.filter(canFillEvent).length;

  return (
    <div className="page">
      <h2>Department Coordinator — Events</h2>
      {events.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1.05rem' }}>
            You can fill {fillableCount} form{fillableCount !== 1 ? 's' : ''} right now.
          </p>
        </div>
      )}
      {events.length === 0 && (
        <div className="card" style={{ textAlign: 'center', maxWidth: '100%' }}>
          <p style={{ fontWeight: 600, fontSize: '1.2rem' }}>
            No events available right now.
          </p>
          <p className="muted">Check back later for new events.</p>
        </div>
      )}
      {events.length > 0 && (
        <ul className="list">
          {events.map((ev) => (
            <li key={ev._id} className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '1.1rem' }}>{ev.name}</strong>
                {isDeadlinePassed(ev.deadline) ? (
                  <span className="status-badge expired">Closed</span>
                ) : (ev.dcSubmissionCount || 0) >= (ev.maxDcSubmissions || 1) ? (
                  <span className="status-badge" style={{ background: 'var(--green)', color: '#fff' }}>Submission Limit Reached</span>
                ) : (
                  <Link to={`/events/${ev._id}/fill`} style={{
                    background: 'var(--gold)',
                    color: '#000',
                    padding: '8px 16px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}>
                    Fill Form ({(ev.maxDcSubmissions || 1) - (ev.dcSubmissionCount || 0)} left)
                  </Link>
                )}
              </div>
              {ev.description && <div className="muted">{ev.description}</div>}
              {ev.deadline && (
                <span className={`status-badge ${isDeadlinePassed(ev.deadline) ? 'expired' : ''}`}>
                  Deadline: {new Date(ev.deadline).toLocaleString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
