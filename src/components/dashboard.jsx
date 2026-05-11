import React, { useState, useEffect } from 'react';
import Documents from './documents';
import Suggestions from './suggestions';

export default function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('documents');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (user.role === 'admin') {
      fetchPendingCount();
      // Check every 30 seconds
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user.role]);

  async function fetchPendingCount() {
    try {
      // Fetch all documents first
      const docsRes = await fetch(
        `http://localhost:4000/api/v1/documents?role=admin`
      );
      const docs = await docsRes.json();

      // Fetch suggestions for each document
      let count = 0;
      for (const doc of docs) {
        const sugRes = await fetch(`http://localhost:4000/api/v1/suggestions/${doc.id}`);
        const sugs = await sugRes.json();
        count += sugs.filter(s => s.status === 'pending').length;
      }
      setPendingCount(count);
    } catch (err) {
      console.error('Error fetching pending count:', err);
    }
  }

  return (
    <div>
      <nav style={{ background: '#111', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>TaskFlow</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setTab('documents')}
            style={{ background: tab === 'documents' ? '#333' : 'none', color: 'white', border: 'none', padding: '6px 16px', cursor: 'pointer', borderRadius: '4px' }}>
            Documents
          </button>
          {user.role === 'admin' && (
            <button onClick={() => { setTab('suggestions'); setPendingCount(0); }}
              style={{ background: tab === 'suggestions' ? '#333' : 'none', color: 'white', border: 'none', padding: '6px 16px', cursor: 'pointer', borderRadius: '4px', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Suggestions
              {pendingCount > 0 && (
                <span style={{ background: '#ff4444', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 7px', borderRadius: '20px', minWidth: '20px', textAlign: 'center' }}>
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#aaa', fontSize: '14px' }}>{user.username}</span>
          <span style={{ color: '#e8ff57', fontSize: '12px', border: '1px solid #e8ff57', padding: '2px 8px', borderRadius: '4px' }}>{user.role}</span>
          <button onClick={onLogout} style={{ background: 'none', border: '1px solid #555', color: '#aaa', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}>Logout</button>
        </div>
      </nav>

      {tab === 'documents' && <Documents user={user} />}
      {tab === 'suggestions' && user.role === 'admin' && <Suggestions user={user} />}
    </div>
  );
}