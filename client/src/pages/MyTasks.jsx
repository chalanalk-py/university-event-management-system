import { useState, useEffect } from 'react';
import api from '../api';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.get('/tasks/my').then(r => setTasks(r.data));
  }, []);

  const handleMove = async (id, section) => {
    await api.patch(`/tasks/${id}/move`, { section });
    const res = await api.get('/tasks/my');
    setTasks(res.data);
  };

  return (
    <div className="page">
      <h2>My Tasks</h2>
      {tasks.length === 0 ? <p>No tasks assigned</p> : (
        <ul>
          {tasks.map(t => (
            <li key={t.id}>
              <div onClick={() => setExpandedId(expandedId === t.id ? null : t.id)} style={{ cursor: 'pointer' }}>
                <strong>{t.title}</strong> [{t.section.replace('_', ' ')}]
                {t.due_date && <span> | Due: {new Date(t.due_date).toLocaleDateString()}</span>}
              </div>
              {expandedId === t.id && <p>{t.description || 'No description'}</p>}
              <div>
                <button onClick={() => handleMove(t.id, 'todo')}>To Do</button>
                <button onClick={() => handleMove(t.id, 'in_progress')}>In Progress</button>
                <button onClick={() => handleMove(t.id, 'done')}>Done</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
