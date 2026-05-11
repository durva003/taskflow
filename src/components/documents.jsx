import React, { useState, useEffect } from 'react';
import Document from './document';

const API = 'https://taskflow-vex7.onrender.com';

export default function Documents({ user }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDocuments();
  }, []);

  async function fetchDocuments() {
    try {
      const response = await fetch(
        `${API}/api/v1/documents?team_id=${user.team_id}&role=${user.role}`
      );
      const data = await response.json();
      setDocuments(data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  }

  if (selectedDoc) {
    return (
      <div>
        <button
          onClick={() => setSelectedDoc(null)}
          style={{ margin: '24px', padding: '8px 16px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          ← Back to Documents
        </button>
        <Document user={user} docId={selectedDoc.id} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Documents</h2>
      <p style={{ color: '#888', fontSize: '13px' }}>
        {user.role === 'admin' ? 'All documents' : 'Your team documents'}
      </p>

      {documents.length === 0 && <p style={{ color: '#888' }}>No documents yet.</p>}

      {documents.map(doc => (
        <div
          key={doc.id}
          onClick={() => setSelectedDoc(doc)}
          style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '20px', marginBottom: '12px', cursor: 'pointer' }}
          onMouseOver={e => e.currentTarget.style.borderColor = '#111'}
          onMouseOut={e => e.currentTarget.style.borderColor = '#ddd'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>{doc.title}</h3>
            <span style={{ fontSize: '12px', background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px', color: '#666' }}>
              {doc.team_name}
            </span>
          </div>
          <p style={{ margin: '8px 0 0', color: '#888', fontSize: '13px' }}>
            {doc.content.substring(0, 100)}...
          </p>
          <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#aaa' }}>
            Last updated by {doc.updated_by} · {new Date(doc.updated_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}