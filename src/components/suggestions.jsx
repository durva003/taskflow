import React, { useState, useEffect } from 'react';

export default function Suggestions({ user }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const response = await fetch(
        `http://localhost:4000/api/v1/documents?team_id=${user.team_id}&role=${user.role}`
      );
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  }

  async function fetchSuggestions(docId) {
    try {
      const response = await fetch(`http://localhost:4000/api/v1/suggestions/${docId}`);
      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  }

  function handleSelectDoc(doc) {
    setSelectedDoc(doc);
    fetchSuggestions(doc.id);
  }

  async function handleApprove(id) {
    try {
      await fetch(`http://localhost:4000/api/v1/suggestions/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      setMessage('Suggestion approved!');
      fetchSuggestions(selectedDoc.id);
    } catch (err) {
      setMessage('Error approving suggestion');
    }
  }

  async function handleReject(id) {
    try {
      await fetch(`http://localhost:4000/api/v1/suggestions/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      setMessage('Suggestion rejected!');
      fetchSuggestions(selectedDoc.id);
    } catch (err) {
      setMessage('Error rejecting suggestion');
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Suggestions</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {/* Document selector */}
      {!selectedDoc ? (
        <>
          <p style={{ color: '#888', fontSize: '13px' }}>Select a document to review suggestions</p>
          {documents.map(doc => (
            <div key={doc.id} onClick={() => handleSelectDoc(doc)}
              style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '12px', cursor: 'pointer' }}
              onMouseOver={e => e.currentTarget.style.borderColor = '#111'}
              onMouseOut={e => e.currentTarget.style.borderColor = '#ddd'}>
              <h3 style={{ margin: '0 0 4px' }}>{doc.title}</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>{doc.team_name}</p>
            </div>
          ))}
        </>
      ) : (
        <>
          <button onClick={() => { setSelectedDoc(null); setSuggestions([]); }}
            style={{ marginBottom: '16px', padding: '6px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            ← Back
          </button>
          <h3>{selectedDoc.title} — Suggestions</h3>

          {suggestions.length === 0 && <p style={{ color: '#888' }}>No suggestions for this document.</p>}

          {suggestions.map(s => (
            <div key={s.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#aaa' }}>
                Suggested by <strong>{s.suggested_by}</strong> · {new Date(s.created_at).toLocaleString()} · Status: <strong style={{ color: s.status === 'pending' ? '#f90' : s.status === 'approved' ? 'green' : 'red' }}>{s.status}</strong>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: '#fff0f0', padding: '12px', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Original</p>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.7', color: '#333' }}>{s.original_content}</p>
                </div>
                <div style={{ background: '#f0fff0', padding: '12px', borderRadius: '6px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Suggested</p>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.7', color: '#333' }}>{s.suggested_content}</p>
                </div>
              </div>

              {s.status === 'pending' && (
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
        </>
      )}
    </div>
  );
}