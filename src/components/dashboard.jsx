import React, { useState } from 'react';
import Document from './documents';
import Suggestions from './suggestions';

export default function Dashboard({ user, onLogout }) {
  const [tab, setTab] = useState('document');

  return (
    <div>
      <nav style={{ background: '#111', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>TaskFlow</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setTab('document')}
            style={{ background: tab === 'document' ? '#333' : 'none', color: 'white', border: 'none', padding: '6px 16px', cursor: 'pointer', borderRadius: '4px' }}>
            Document
          </button>
          {user.role === 'admin' && (
            <button onClick={() => setTab('suggestions')}
              style={{ background: tab === 'suggestions' ? '#333' : 'none', color: 'white', border: 'none', padding: '6px 16px', cursor: 'pointer', borderRadius: '4px' }}>
              Suggestions
            </button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#aaa', fontSize: '14px' }}>{user.username}</span>
          <span style={{ color: '#e8ff57', fontSize: '12px', border: '1px solid #e8ff57', padding: '2px 8px', borderRadius: '4px' }}>{user.role}</span>
          <button onClick={onLogout} style={{ background: 'none', border: '1px solid #555', color: '#aaa', padding: '6px 12px', cursor: 'pointer', borderRadius: '4px' }}>Logout</button>
        </div>
      </nav>

      {tab === 'document' && <Document user={user} />}
      {tab === 'suggestions' && user.role === 'admin' && <Suggestions user={user} />}
    </div>
  );
}