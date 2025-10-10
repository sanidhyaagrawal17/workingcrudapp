// D:\mongoapp\frontend\src\App.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = "http://localhost:5000/tasks";

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [reminderType, setReminderType] = useState("Days");
  const [reminderValue, setReminderValue] = useState(1);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("default");

  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');

  const toggleTheme = () => { setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light')); };
  
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  const fetchTasks = () => {
    axios.get(API_URL).then(res => setTasks(res.data)).catch(err => console.log(err));
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const addTask = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    axios.post(`${API_URL}/add`, { text, priority, reminderType, reminderValue })
      .then(() => {
        setText("");
        setPriority("Medium");
        setReminderType("Days");
        setReminderValue(1);
        fetchTasks();
      }).catch(err => console.log(err));
  };

  const toggleComplete = (id) => {
    axios.post(`${API_URL}/update/${id}`).then(() => fetchTasks()).catch(err => console.log(err));
  };

  const deleteTask = (id) => {
    axios.delete(`${API_URL}/${id}`).then(() => {
      setTasks(tasks.filter(task => task._id !== id));
    }).catch(err => console.log(err));
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setEditText(task.text);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditText('');
  };

  const handleUpdateTask = (e, taskId) => {
    e.preventDefault();
    if (!editText.trim()) return;
    const updatedTaskData = { text: editText };

    axios.patch(`${API_URL}/edit/${taskId}`, updatedTaskData)
      .then(() => {
        setEditingTask(null);
        setEditText('');
        fetchTasks();
      })
      .catch(err => console.log(err));
  };

  const processedTasks = useMemo(() => {
    let filtered = tasks;
    if (activeFilter === 'active') { filtered = tasks.filter(t => !t.isCompleted); } 
    else if (activeFilter === 'completed') { filtered = tasks.filter(t => t.isCompleted); }
    
    let sorted = [...filtered];
    if (sortBy === 'priority') {
      const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
      sorted.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    } else if (sortBy === 'time') {
      const getTimeValue = (r) => {
        let multiplier = 1;
        switch(r.reminderType) {
          case 'Minutes': multiplier = 60 * 1000; break;
          case 'Hours': multiplier = 60 * 60 * 1000; break;
          case 'Days': multiplier = 24 * 60 * 60 * 1000; break;
          case 'Weeks': multiplier = 7 * 24 * 60 * 60 * 1000; break;
          case 'Months': multiplier = 30 * 24 * 60 * 60 * 1000; break;
          default: break;
        }
        const createdAt = new Date(r.createdAt).getTime();
        return createdAt + (r.reminderValue * multiplier);
      };
      sorted.sort((a, b) => getTimeValue(a) - getTimeValue(b));
    } else {
        sorted.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    
    return sorted;
  }, [tasks, activeFilter, sortBy]);

  return (
    <div className="App">
      <header>
        <button className="theme-toggle" onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
        <h1>My Tasks 📝</h1>
        <p>Stay organized, one task at a time.</p>
      </header>
      
      <form onSubmit={addTask} className="task-form">
        <div className="form-group"><label htmlFor="taskInput">Task</label><input id="taskInput" type="text" placeholder="What do you need to do?" value={text} onChange={(e) => setText(e.target.value)} className="form-input"/></div>
        <div className="form-row">
          <div className="form-group"><label htmlFor="timeValue">Timeframe</label><input id="timeValue" type="number" value={reminderValue} min="1" onChange={(e) => setReminderValue(e.target.value)} className="form-input"/></div>
          <div className="form-group"><label htmlFor="timeUnit">Unit</label><select id="timeUnit" value={reminderType} onChange={(e) => setReminderType(e.target.value)} className="form-input"><option value="Minutes">Minutes</option><option value="Hours">Hours</option><option value="Days">Days</option><option value="Weeks">Weeks</option><option value="Months">Months</option></select></div>
          <div className="form-group"><label htmlFor="prioritySelect">Priority</label><select id="prioritySelect" value={priority} onChange={(e) => setPriority(e.target.value)} className="form-input"><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option></select></div>
        </div>
        <button type="submit">Add Task</button>
      </form>
      
      <div className="view-controls">
        <div className="filters"><button onClick={() => setActiveFilter('all')} className={activeFilter === 'all' ? 'active' : ''}>All</button><button onClick={() => setActiveFilter('active')} className={activeFilter === 'active' ? 'active' : ''}>Active</button><button onClick={() => setActiveFilter('completed')} className={activeFilter === 'completed' ? 'active' : ''}>Completed</button></div>
        <div className="sort-by"><label htmlFor="sortSelect">Sort by:</label><select id="sortSelect" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-input"><option value="default">Default</option><option value="priority">Priority</option><option value="time">Time Remaining</option></select></div>
      </div>
      
      <ul className="task-list">
        {processedTasks.map(task => (
          <li key={task._id} className={task.isCompleted ? 'completed' : ''}>
            {editingTask && editingTask._id === task._id ? (
              <form className="edit-form" onSubmit={(e) => handleUpdateTask(e, task._id)}>
                <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} className="form-input" autoFocus/>
                <div className="edit-form-actions">
                  <button type="submit" className="save-btn">Save</button>
                  <button type="button" onClick={handleCancelEdit} className="cancel-btn">Cancel</button>
                </div>
              </form>
            ) : (
              <>
                <div className="task-content"><span className="task-text" onClick={() => toggleComplete(task._id)}>{task.text}</span><span className="task-date">Due in: {task.reminderValue} {task.reminderType}</span></div>
                <div className="task-actions"><span className={`priority-pill priority-${task.priority.toLowerCase()}`}>{task.priority}</span><button onClick={() => handleEdit(task)} className="edit-btn">Edit</button><button onClick={() => deleteTask(task._id)} className="delete-btn">Delete</button></div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;