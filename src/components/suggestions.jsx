import React, { useState, useEffect } from 'react';

export default function Suggestions({ user }) {
  const [suggestions, setSuggestions] = useState([]);
  const [document, setDocument] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSuggestions();
    fetchDocument();
  }, []);

  async function fetchDocument() {
    try {
      const response = await fetch('http://localhost:4000/api/document');
      const data = await response.json();
      setDocument(data);
    } catch (err) {
      console.error('Error fetching document:', err);
    }
  }

  async function fetchSuggestions() {
    try {
      const response = await fetch('http://localhost:4000/api/suggestions');
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  }

  async function handleApprove(id) {
    try {
      await fetch(`http://localhost:4000/api/suggestions/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      setMessage('Suggestion approved!');
      fetchSuggestions();
      fetchDocument();
    } catch (err) {
      setMessage('Error approving suggestion');
    }
  }

  async function handleReject(id) {
    try {
      await fetch(`http://localhost:4000/api/suggestions/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      setMessage('Suggestion rejected!');
      fetchSuggestions();
    } catch (err) {
      setMessage('Error rejecting suggestion');
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Suggestions</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {suggestions.length === 0 && <p style={{ color: '#888' }}>No suggestions yet.</p>}

      {suggestions.map(s => (
        <div key={s.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>

          <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#aaa' }}>
            Suggested by <strong>{s.suggested_by}</strong> · {new Date(s.created_at).toLocaleString()} · Status: <strong style={{ color: s.status === 'pending' ? '#f90' : s.status === 'approved' ? 'green' : 'red' }}>{s.status}</strong>
          </p>

          {/* Side by side comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ background: '#fff0f0', padding: '12px', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Current Version</p>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.7', color: '#333' }}>
                {document ? document.content : 'Loading...'}
              </p>
            </div>
            <div style={{ background: '#f0fff0', padding: '12px', borderRadius: '6px' }}>
              <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Suggested Version</p>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.7', color: '#333' }}>
                {s.suggested_content}
              </p>
            </div>
          </div>

          {/* Approve / Reject */}
          {user.role === 'admin' && s.status === 'pending' && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button onClick={() => handleApprove(s.id)}
                style={{ padding: '6px 16px', background: 'green', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                ✓ Approve
              </button>
              <button onClick={() => handleReject(s.id)}
                style={{ padding: '6px 16px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                ✗ Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}