import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest, uploadFile, BASE_URL } from '../api';

export function EventFillPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [answers, setAnswers] = useState([]);
  const [fileUploads, setFileUploads] = useState({}); // { [index]: { file, fileUrl, progress, uploading, error, type } }
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  const handleFileSelect = useCallback(async (index, file, type) => {
    if (!file) return;

    // Validate file type
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');
    if (type === 'audio' && !isAudio) {
      setFileUploads((prev) => ({ ...prev, [index]: { error: 'Please select an audio file', type } }));
      return;
    }
    if (type === 'video' && !isVideo) {
      setFileUploads((prev) => ({ ...prev, [index]: { error: 'Please select a video file', type } }));
      return;
    }

    setFileUploads((prev) => ({
      ...prev,
      [index]: { file, progress: 0, uploading: true, error: null, type, fileUrl: null },
    }));

    try {
      const result = await uploadFile(file, (pct) => {
        setFileUploads((prev) => ({
          ...prev,
          [index]: { ...prev[index], progress: pct },
        }));
      });

      setFileUploads((prev) => ({
        ...prev,
        [index]: { ...prev[index], uploading: false, progress: 100, fileUrl: result.fileUrl },
      }));
    } catch (err) {
      setFileUploads((prev) => ({
        ...prev,
        [index]: { ...prev[index], uploading: false, error: 'Upload failed. Try again.' },
      }));
    }
  }, []);

  const removeFile = (index) => {
    setFileUploads((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Check all file uploads are complete
    for (const idx of Object.keys(fileUploads)) {
      const fu = fileUploads[idx];
      if (fu.uploading) {
        setError('Please wait for all file uploads to complete.');
        return;
      }
      if (fu.error) {
        setError(`File upload error on question ${parseInt(idx) + 1}. Please re-upload.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const answersPayload = answers.map((text, idx) => {
        const fu = fileUploads[idx];
        return {
          questionIndex: idx,
          text: text || '',
          fileUrl: fu?.fileUrl || undefined,
          fileType: fu?.type || undefined,
        };
      });

      await apiRequest(`/events/${id}/responses`, {
        method: 'POST',
        body: JSON.stringify({
          teamName,
          answers: answersPayload,
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
    } finally {
      setSubmitting(false);
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
          <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--green)', marginBottom: 12 }}>
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
          <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--gold)', marginBottom: 12 }}>
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
          <div style={{ fontWeight: 700, fontSize: '1.5rem', color: 'var(--red)', marginBottom: 12 }}>
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
          <div key={idx} className="fill-question">
            <div className="fill-question-header">
              <span className="fill-question-number">{idx + 1}</span>
              <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                {q.text}
                {q.isRollNumber && <span className="muted" style={{ fontSize: '0.8rem', marginLeft: 6 }}>(Roll No)</span>}
                {q.isAudio && <span className="file-type-badge audio-badge">Audio</span>}
                {q.isVideo && <span className="file-type-badge video-badge">Video</span>}
              </span>
            </div>

            {/* Text answer - always shown */}
            <textarea
              value={answers[idx]}
              onChange={(e) => handleChangeAnswer(idx, e.target.value)}
              required={q.required && !q.isAudio && !q.isVideo}
              rows={q.isAudio || q.isVideo ? 2 : 3}
              placeholder={q.isAudio || q.isVideo ? "Optional text note..." : "Your answer..."}
            />

            {/* Audio Upload */}
            {q.isAudio && (
              <div className="file-upload-section">
                <div className="file-upload-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                  Upload Audio File
                </div>
                {!fileUploads[idx]?.fileUrl && !fileUploads[idx]?.uploading && (
                  <label className="file-upload-btn">
                    <input
                      type="file"
                      accept="audio/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(idx, e.target.files?.[0], 'audio')}
                    />
                    Choose Audio File
                  </label>
                )}
                {fileUploads[idx]?.uploading && (
                  <div className="upload-progress">
                    <div className="upload-progress-bar">
                      <div className="upload-progress-fill" style={{ width: `${fileUploads[idx].progress}%` }} />
                    </div>
                    <span className="upload-progress-text">{fileUploads[idx].progress}% Uploading...</span>
                  </div>
                )}
                {fileUploads[idx]?.fileUrl && (
                  <div className="upload-done">
                    <div className="upload-done-info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Audio uploaded</span>
                      <audio controls src={`${BASE_URL}${fileUploads[idx].fileUrl}`} style={{ height: 32, maxWidth: '100%' }} />
                    </div>
                    <button type="button" onClick={() => removeFile(idx)} className="upload-remove-btn">Remove</button>
                  </div>
                )}
                {fileUploads[idx]?.error && (
                  <div className="error" style={{ marginTop: 4 }}>{fileUploads[idx].error}</div>
                )}
              </div>
            )}

            {/* Video Upload */}
            {q.isVideo && (
              <div className="file-upload-section">
                <div className="file-upload-label">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  Upload Video File
                </div>
                {!fileUploads[idx]?.fileUrl && !fileUploads[idx]?.uploading && (
                  <label className="file-upload-btn">
                    <input
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelect(idx, e.target.files?.[0], 'video')}
                    />
                    Choose Video File
                  </label>
                )}
                {fileUploads[idx]?.uploading && (
                  <div className="upload-progress">
                    <div className="upload-progress-bar">
                      <div className="upload-progress-fill video" style={{ width: `${fileUploads[idx].progress}%` }} />
                    </div>
                    <span className="upload-progress-text">{fileUploads[idx].progress}% Uploading...</span>
                  </div>
                )}
                {fileUploads[idx]?.fileUrl && (
                  <div className="upload-done">
                    <div className="upload-done-info">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Video uploaded</span>
                    </div>
                    <video controls src={`${BASE_URL}${fileUploads[idx].fileUrl}`} style={{ maxWidth: '100%', borderRadius: 8, marginTop: 8 }} />
                    <button type="button" onClick={() => removeFile(idx)} className="upload-remove-btn">Remove</button>
                  </div>
                )}
                {fileUploads[idx]?.error && (
                  <div className="error" style={{ marginTop: 4 }}>{fileUploads[idx].error}</div>
                )}
              </div>
            )}
          </div>
        ))}
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={submitting} style={{ marginTop: 12 }}>
          {submitting ? 'Submitting...' : 'Submit Registration'}
        </button>
      </form>
    </div>
  );
}
