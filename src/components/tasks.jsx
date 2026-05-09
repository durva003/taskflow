import React, { useState, useEffect } from 'react';

export default function Tasks({ user }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState('');
  const [editId, setEditId] = useState(null);
  const [suggestTask, setSuggestTask] = useState(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const response = await fetch('http://localhost:4000/api/tasks');
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editId) {
        await fetch(`http://localhost:4000/api/tasks/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, username: user.username })
        });
        setMessage('Task updated!');
      } else {
        await fetch('http://localhost:4000/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description, username: user.username })
        });
        setMessage('Task created!');
      }
      setTitle('');
      setDescription('');
      setEditId(null);
      fetchTasks();
    } catch (err) {
      setMessage('Error saving task');
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`http://localhost:4000/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username })
      });
      setMessage('Task deleted!');
      fetchTasks();
    } catch (err) {
      setMessage('Error deleting task');
    }
  }

  async function handleSuggestSubmit(e) {
    e.preventDefault();
    try {
      await fetch('http://localhost:4000/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: suggestTask.id,
          suggested_title: title,
          suggested_description: description,
          username: user.username
        })
      });
      setMessage('Suggestion submitted!');
      setSuggestTask(null);
      setTitle('');
      setDescription('');
    } catch (err) {
      setMessage('Error submitting suggestion');
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2>Tasks</h2>
      {message && <p style={{ color: 'green' }}>{message}</p>}

      {/* ADMIN — create/edit form */}
      {user.role === 'admin' && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '32px', background: '#f9f9f9', padding: '16px', borderRadius: '8px' }}>
          <h3>{editId ? 'Edit Task' : 'Create New Task'}</h3>
          <div>
            <label>Title</label><br />
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title"
              required
              style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginTop: '12px' }}>
            <label>Description</label><br />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Task description"
              rows={4}
              style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button type="submit" style={{ padding: '8px 20px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {editId ? 'Save Changes' : 'Add Task'}
            </button>
            {editId && (
              <button type="button" onClick={() => { setEditId(null); setTitle(''); setDescription(''); }}
                style={{ padding: '8px 20px', background: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {/* EDITOR — suggest edit form */}
      {suggestTask && user.role === 'editor' && (
        <form onSubmit={handleSuggestSubmit} style={{ marginBottom: '32px', background: '#e8f4ff', padding: '16px', borderRadius: '8px', border: '1px solid #0066cc' }}>
          <h3>Suggest Edit for: {suggestTask.title}</h3>
          <div>
            <label>New Title</label><br />
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginTop: '12px' }}>
            <label>New Description</label><br />
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: '8px', marginTop: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <button type="submit" style={{ padding: '8px 20px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Submit Suggestion
            </button>
            <button type="button" onClick={() => { setSuggestTask(null); setTitle(''); setDescription(''); }}
              style={{ padding: '8px 20px', background: '#888', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* TASK LIST — all roles see this */}
      {tasks.length === 0 && <p style={{ color: '#888' }}>No tasks yet.</p>}
      {tasks.map(task => (
        <div key={task.id} style={{ background: 'white', border: '1px solid #ddd', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
          <h3 style={{ margin: '0 0 8px' }}>{task.title}</h3>
          <p style={{ margin: '0 0 8px', color: '#555' }}>{task.description}</p>
          <p style={{ margin: '0', fontSize: '12px', color: '#aaa' }}>Created by {task.created_by}</p>

          {/* Admin buttons */}
          {user.role === 'admin' && (
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button onClick={() => { setEditId(task.id); setTitle(task.title); setDescription(task.description); window.scrollTo(0,0); }}
                style={{ padding: '4px 12px', background: '#111', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Edit
              </button>
              <button onClick={() => handleDelete(task.id)}
                style={{ padding: '4px 12px', background: '#ff4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Delete
              </button>
            </div>
          )}

          {/* Editor button */}
          {user.role === 'editor' && (
            <div style={{ marginTop: '12px' }}>
              <button onClick={() => { setSuggestTask(task); setTitle(task.title); setDescription(task.description); window.scrollTo(0,0); }}
                style={{ padding: '4px 12px', background: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Suggest Edit
              </button>
            </div>
          )}

          {/* Viewer — no buttons, read only */}
        </div>
      ))}
    </div>
  );
}