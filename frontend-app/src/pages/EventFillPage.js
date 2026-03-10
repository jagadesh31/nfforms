import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest } from '../api';

export function EventFillPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [answers, setAnswers] = useState([]);
  const [error, setError] = useState('');
  const [alreadyFilled, setAlreadyFilled] = useState(false);
  const [branchAlreadyFilled, setBranchAlreadyFilled] = useState(false);
  const [branchFilledBy, setBranchFilledBy] = useState('');
  const [deadlinePassed, setDeadlinePassed] = useState(false);

  useEffect(() => {
    apiRequest(`/events/${id}`).then((data) => {
      setEvent(data);
      setAnswers(Array(data.questions.length).fill(''));
      if (data.alreadyFilled) setAlreadyFilled(true);
      if (data.branchAlreadyFilled) {
        setBranchAlreadyFilled(true);
        setBranchFilledBy(data.branchFilledBy || 'Another Department Coordinator');
      }
      if (data.deadline && new Date() > new Date(data.deadline)) setDeadlinePassed(true);
    });
  }, [id]);

  const handleChangeAnswer = (index, value) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiRequest(`/events/${id}/responses`, {
        method: 'POST',
        body: JSON.stringify({
          teamName,
          answers: answers.map((text, idx) => ({ questionIndex: idx, text })),
        }),
      });
      navigate('/');
    } catch (err) {
      try {
        const msg = JSON.parse(err.message);
        setError(msg.message || 'Failed to submit');
      } catch {
        setError(err.message || 'Failed to submit');
      }
    }
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

  if (alreadyFilled) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Bangers', cursive",
            fontSize: '2rem',
            color: '#4ecdc4',
            textShadow: '2px 2px 0 #1a1a2e',
            letterSpacing: '3px',
            marginBottom: 12,
          }}>
            ✅ Already Submitted!
          </div>
          <div style={{ fontFamily: "'Bangers', cursive", fontSize: '1.3rem', marginBottom: 8 }}>
            {event.name}
          </div>
          <p className="muted" style={{ marginBottom: 16 }}>You have already submitted your response for this event.</p>
          <button onClick={() => navigate('/')}>🏠 Go Back</button>
        </div>
      </div>
    );
  }

  if (branchAlreadyFilled) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Bangers', cursive",
            fontSize: '2rem',
            color: '#f59e0b',
            textShadow: '2px 2px 0 #1a1a2e',
            letterSpacing: '3px',
            marginBottom: 12,
          }}>
            🏢 Branch Already Submitted!
          </div>
          <div style={{ fontFamily: "'Bangers', cursive", fontSize: '1.3rem', marginBottom: 8 }}>
            {event.name}
          </div>
          <p className="muted" style={{ marginBottom: 16 }}>
            <strong>{branchFilledBy}</strong> from your branch has already submitted a response for this event.
          </p>
          <button onClick={() => navigate('/')}>🏠 Go Back</button>
        </div>
      </div>
    );
  }

  if (deadlinePassed) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: "'Bangers', cursive",
            fontSize: '2rem',
            color: '#dc2626',
            textShadow: '2px 2px 0 #1a1a2e',
            letterSpacing: '3px',
            marginBottom: 12,
          }}>
            ⏰ Deadline Passed!
          </div>
          <div style={{ fontFamily: "'Bangers', cursive", fontSize: '1.3rem', marginBottom: 8 }}>
            {event.name}
          </div>
          <p className="muted" style={{ marginBottom: 16 }}>The deadline for this form has passed.</p>
          <button onClick={() => navigate('/')}>🏠 Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>✏️ {event.name}</h2>
      {event.deadline && (
        <div style={{ marginBottom: 16 }}>
          <span className="comic-badge">⏰ Deadline: {new Date(event.deadline).toLocaleString()}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 600 }}>
        <label>
          🏆 Team Name
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} required placeholder="Enter your team name" />
        </label>
        {event.questions.map((q, idx) => (
          <label key={idx}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: "'Bangers', cursive",
                background: '#222',
                color: '#F2A332',
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                border: '2px solid #000',
                flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              {q.text}
            </div>
            <textarea
              value={answers[idx]}
              onChange={(e) => handleChangeAnswer(idx, e.target.value)}
              required={q.required}
              rows={2}
              placeholder="Your answer..."
            />
          </label>
        ))}
        {error && <div className="error">💥 {error}</div>}
        <button type="submit">🚀 Submit Registration!</button>
      </form>
    </div>
  );
}
