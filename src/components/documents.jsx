import React, { useState, useEffect } from 'react';
import Document from './document';

const API = 'https://taskflow-vex7.onrender.com';

export default function Documents({ user }) {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [teams, setTeams] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [teamId, setTeamId] = useState('');
  const [message, setMessage] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchDocuments();
    if (user.role === 'admin') fetchTeams();
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

  async function fetchTeams() {
    try {
      const response = await fetch(`${API}/api/v1/teams`);
      const data = await response.json();
      setTeams(data);
      if (data.length > 0) setTeamId(data[0].id);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await fetch(`${API}/api/v1/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, team_id: teamId, username: user.username })
      });
      setMessage('Document created!');
      setTitle('');
      setContent('');
      setShowForm(false);
      fetchDocuments();
    } catch (err) {
      setMessage('Error creating document');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ margin: 0 }}>Documents</h2>
        {user.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)}
            style={{ padding: '8px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ New Document'}
          </button>
        )}
      </div>

      {message && <p style={{ color: 'green' }}>{message}</p>}

      {/* Create document form — admin only */}
      {showForm && user.role === 'admin' && (
        <form onSubmit={handleCreate} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px' }}>Create New Document</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '6px', textTransform: 'uppercase' }}>Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Document title"
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px' }}
            />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '6px', textTransform: 'uppercase' }}>Team</label>
            <select
              value={teamId}
              onChange={e => setTeamId(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px' }}>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#555', marginBottom: '6px', textTransform: 'uppercase' }}>Content</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Document content..."
              rows={6}
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box', fontSize: '14px', lineHeight: '1.6' }}
            />
          </div>
          <button type="submit"
            style={{ padding: '10px 24px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}>
            Create Document
          </button>
        </form>
      )}

      <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px' }}>
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