import React, { useState, useEffect } from 'react';

export default function Document({ user }) {
  const [document, setDocument] = useState(null);
  const [editing, setEditing] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [content, setContent] = useState('');
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDocument();
    fetchHistory();
  }, []);

  async function fetchDocument() {
    try {
      const response = await fetch('http://localhost:4000/api/document');
      const data = await response.json();
      setDocument(data);
      setContent(data.content);
    } catch (err) {
      console.error('Error fetching document:', err);
    }
  }

  async function fetchHistory() {
    try {
      const response = await fetch('http://localhost:4000/api/history');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  }

  async function handleSave() {
    try {
      await fetch('http://localhost:4000/api/document', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, username: user.username })
      });
      setMessage('Document saved!');
      setEditing(false);
      fetchDocument();
      fetchHistory();
    } catch (err) {
      setMessage('Error saving document');
    }
  }

  async function handleSuggest() {
    try {
      await fetch('http://localhost:4000/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggested_content: content, username: user.username })
      });
      setMessage('Suggestion submitted!');
      setSuggesting(false);
      fetchDocument();
    } catch (err) {
      setMessage('Error submitting suggestion');
    }
  }

  if (!document) return <p style={{ padding: '24px' }}>Loading...</p>;

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>

      {message && <p style={{ color: 'green', marginBottom: '16px' }}>{message}</p>}

      {/* Document */}
      <div style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ margin: 0 }}>Document</h2>
          <p style={{ margin: 0, fontSize: '12px', color: '#aaa' }}>
            Last updated by {document.updated_by} · {new Date(document.updated_at).toLocaleString()}
          </p>
        </div>

        {/* Viewer — read only */}
        {user.role === 'viewer' && (
          <p style={{ lineHeight: '1.8', color: '#333' }}>{document.content}</p>
        )}

        {/* Editor — suggest edit */}
        {user.role === 'editor' && (
          <>
            {!suggesting ? (
              <>
                <p style={{ lineHeight: '1.8', color: '#333' }}>{document.content}</p>
                <button onClick={() => { setSuggesting(true); setContent(document.content); }}
                  style={{ marginTop: '16px', padding: '8px 20px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Suggest Edit
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={10}
                  style={{ width: '100%', padding: '12px', fontSize: '14px', lineHeight: '1.8', border: '1px solid #0066cc', borderRadius: '4px', boxSizing: 'border-box' }}
                />
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={handleSuggest}
                    style={{ padding: '8px 20px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Submit Suggestion
                  </button>
                  <button onClick={() => setSuggesting(false)}
                    style={{ padding: '8px 20px', background: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* Admin — edit directly */}
        {user.role === 'admin' && (
          <>
            {!editing ? (
              <>
                <p style={{ lineHeight: '1.8', color: '#333' }}>{document.content}</p>
                <button onClick={() => { setEditing(true); setContent(document.content); }}
                  style={{ marginTop: '16px', padding: '8px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  Edit Document
                </button>
              </>
            ) : (
              <>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={10}
                  style={{ width: '100%', padding: '12px', fontSize: '14px', lineHeight: '1.8', border: '1px solid #333', borderRadius: '4px', boxSizing: 'border-box' }}
                />
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button onClick={handleSave}
                    style={{ padding: '8px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Save
                  </button>
                  <button onClick={() => setEditing(false)}
                    style={{ padding: '8px 20px', background: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Version History */}
      <div>
        <h3>Version History</h3>
        {history.length === 0 && <p style={{ color: '#888' }}>No history yet.</p>}
        {history.map((h, index) => (
          <div key={h.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', background: h.action === 'approved' ? '#e6ffed' : '#fff3e0', color: h.action === 'approved' ? 'green' : '#f57c00', padding: '2px 8px', borderRadius: '4px' }}>
                {h.action}
              </span>
              <span style={{ fontSize: '12px', color: '#aaa' }}>
                by {h.changed_by} · {new Date(h.changed_at).toLocaleString()}
              </span>
            </div>
            <p style={{ margin: 0, color: '#555', fontSize: '13px', lineHeight: '1.6' }}>
              {h.content}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}