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
        <span style={{ fontWeight: 600, fontSize: '1.2rem', color: 'var(--grey-text)' }}>
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
            fontWeight: 700,
            fontSize: '1.5rem',
            color: 'var(--green)',
            marginBottom: 12,
          }}>
            Already Submitted!
          </div>
          <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: 8, color: 'var(--text-primary)' }}>
            {event.name}
          </div>
          <p className="muted" style={{ marginBottom: 24 }}>You have already submitted your response for this event.</p>
          <button onClick={() => navigate('/')}>Go Back</button>
        </div>
      </div>
    );
  }

  if (branchAlreadyFilled) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            fontWeight: 700,
            fontSize: '1.5rem',
            color: 'var(--gold)',
            marginBottom: 12,
          }}>
            Branch Already Submitted!
          </div>
          <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: 8, color: 'var(--text-primary)' }}>
            {event.name}
          </div>
          <p className="muted" style={{ marginBottom: 24 }}>
            <strong style={{ color: 'var(--text-primary)' }}>{branchFilledBy}</strong> from your branch has already submitted a response for this event.
          </p>
          <button onClick={() => navigate('/')}>Go Back</button>
        </div>
      </div>
    );
  }

  if (deadlinePassed) {
    return (
      <div className="page" style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{
            fontWeight: 700,
            fontSize: '1.5rem',
            color: 'var(--red)',
            marginBottom: 12,
          }}>
            Deadline Passed!
          </div>
          <div style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: 8, color: 'var(--text-primary)' }}>
            {event.name}
          </div>
          <p className="muted" style={{ marginBottom: 24 }}>The deadline for this form has passed.</p>
          <button onClick={() => navigate('/')}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <h2>{event.name}</h2>
      {event.deadline && (
        <div style={{ marginBottom: 24 }}>
          <span className="status-badge">Deadline: {new Date(event.deadline).toLocaleString()}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
        <label>
          Team Name
          <input value={teamName} onChange={(e) => setTeamName(e.target.value)} required placeholder="Enter your team name" />
        </label>
        {event.questions.map((q, idx) => (
          <label key={idx}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <span style={{
                color: 'var(--gold)',
                border: '1px solid var(--gold)',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                flexShrink: 0,
              }}>
                {idx + 1}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{q.text} {q.isRollNumber && <span className="muted" style={{ fontSize: '0.8rem' }}>(Roll No)</span>}</span>
            </div>
            <textarea
              value={answers[idx]}
              onChange={(e) => handleChangeAnswer(idx, e.target.value)}
              required={q.required}
              rows={3}
              placeholder="Your answer..."
            />
          </label>
        ))}
        {error && <div className="error">{error}</div>}
        <button type="submit" style={{ marginTop: 12 }}>Submit Registration</button>
      </form>
    </div>
  );
}
