import React, { useState, useEffect } from 'react';

const API = 'https://taskflow-vex7.onrender.com';

function DocCard({ doc, onSelect }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [suggestedBy, setSuggestedBy] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/v1/suggestions/${doc.id}`)
      .then(r => r.json())
      .then(data => {
        const pending = data.filter(s => s.status === 'pending');
        setPendingCount(pending.length);
        const names = [...new Set(pending.map(s => s.suggested_by))];
        setSuggestedBy(names);
      })
      .catch(err => console.error(err));
  }, [doc.id]);

  return (
    <div onClick={() => onSelect(doc)}
      style={{
        background: 'white',
        border: `1px solid ${pendingCount > 0 ? '#ff9900' : '#ddd'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '12px',
        cursor: 'pointer'
      }}
      onMouseOver={e => e.currentTarget.style.borderColor = '#111'}
      onMouseOut={e => e.currentTarget.style.borderColor = pendingCount > 0 ? '#ff9900' : '#ddd'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>{doc.title}</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {pendingCount > 0 ? (
            <span style={{ fontSize: '12px', background: '#ff9900', color: 'white', padding: '2px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
              {pendingCount} pending
            </span>
          ) : (
            <span style={{ fontSize: '12px', background: '#e6ffed', color: 'green', padding: '2px 10px', borderRadius: '20px' }}>
              No pending
            </span>
          )}
        </div>
      </div>
      {suggestedBy.length > 0 && (
        <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#888' }}>
          Suggested by: <strong>{suggestedBy.join(', ')}</strong>
        </p>
      )}
    </div>
  );
}

export default function Suggestions({ user }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [message, setMessage] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const response = await fetch(`${API}/api/v1/documents?role=admin`);
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  }

  async function fetchSuggestions(docId) {
    try {
      const response = await fetch(`${API}/api/v1/suggestions/${docId}`);
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
      await fetch(`${API}/api/v1/suggestions/${id}/approve`, {
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
      await fetch(`${API}/api/v1/suggestions/${id}/reject`, {
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

  // Group documents by team
  const teams = documents.reduce((acc, doc) => {
    if (!acc[doc.team_name]) acc[doc.team_name] = [];
    acc[doc.team_name].push(doc);
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Suggestions</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {!selectedDoc ? (
        <>
          {Object.keys(teams).map(teamName => (
            <div key={teamName} style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <h3 style={{ margin: 0 }}>{teamName} Team</h3>
                <span style={{ fontSize: '12px', background: '#e8f4ff', color: '#0066cc', padding: '2px 10px', borderRadius: '20px' }}>
                  {teams[teamName].length} {teams[teamName].length === 1 ? 'document' : 'documents'}
                </span>
              </div>
              {teams[teamName].map(doc => (
                <DocCard key={doc.id} doc={doc} onSelect={handleSelectDoc} />
              ))}
            </div>
          ))}
        </>
      ) : (
        <>
          <button onClick={() => { setSelectedDoc(null); setSuggestions([]); setMessage(''); }}
            style={{ marginBottom: '16px', padding: '6px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            ← Back
          </button>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ margin: '0 0 4px' }}>{selectedDoc.title}</h3>
            <span style={{ fontSize: '12px', background: '#e8f4ff', color: '#0066cc', padding: '2px 10px', borderRadius: '20px' }}>
              {selectedDoc.team_name} Team
            </span>
          </div>

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