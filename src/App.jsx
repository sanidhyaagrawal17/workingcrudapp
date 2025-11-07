// D:\mongoapp\frontend\src\App.jsx

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import './App.css';
import TaskForm from './TaskForm.jsx';
import TaskList from './TaskList.jsx';
import AdminPanel from './AdminPanel.jsx';
import toast, { Toaster } from 'react-hot-toast';
import { Rnd } from 'react-rnd';

const API_URL = "http://localhost:5000/tasks";
const ADMIN_API_URL = "http://localhost:5000/admin";

function App() {
  const [activeTab, setActiveTab] = useState('list');
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState('');
  const [newListName, setNewListName] = useState('');
  const [currentDbName, setCurrentDbName] = useState('Loading...');

  const [text, setText] = useState('');
  const [priority, setPriority] = useState('Medium'); 
  const [timeframeType, setTimeframeType] = useState('deadline');
  const [deadlineInput, setDeadlineInput] = useState('');
  const [durationInputs, setDurationInputs] = useState({ hours: '', minutes: '', seconds: '' });

  const [activeFilter, setActiveFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({ text: '', dueDate: '', estimatedDuration: 0 });

  const [operationLog, setOperationLog] = useState([]);
  const [logFontSize, setLogFontSize] = useState(0.9);
  const [adminQueryPreview, setAdminQueryPreview] = useState('');

  const [priorities, setPriorities] = useState(['High', 'Medium', 'Low']);
  const [newPriority, setNewPriority] = useState('');

  // --- Log Window State ---
  const [isLogFullscreen, setIsLogFullscreen] = useState(false);
  const [logDockSide, setLogDockSide] = useState('right');
  const [logSize, setLogSize] = useState({ width: 450, height: 300 });
  const [logPosition, setLogPosition] = useState({ x: window.innerWidth - 490, y: 40 });
  const [floatPosition, setFloatPosition] = useState({ x: window.innerWidth - 490, y: 40 });
  const [floatSize, setFloatSize] = useState({ width: 450, height: 300 });
  const [logViewMode, setLogViewMode] = useState('main');
  const [logContentView, setLogContentView] = useState('log');

  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const [formPreviewMode, setFormPreviewMode] = useState('task'); // 'task', 'list', 'priority'

  // --- Admin Panel state ---
  const [adminFilterPriority, setAdminFilterPriority] = useState('High');
  const [adminSortOrder, setAdminSortOrder] = useState('dueDate_1');
  const [adminLimit, setAdminLimit] = useState(10);
  const [adminSkip, setAdminSkip] = useState(5);
  const [adminApplyFilter, setAdminApplyFilter] = useState(false);
  const [adminApplySort, setAdminApplySort] = useState(false);
  const [adminApplyLimit, setAdminApplyLimit] = useState(false);
  const [adminApplySkip, setAdminApplySkip] = useState(false);
  const [adminFilterType, setAdminFilterType] = useState('priority');
  const [adminFilterField, setAdminFilterField] = useState('text');
  const [adminFilterValue, setAdminFilterValue] = useState('');

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (activeTab === 'list') {
      setLogContentView('log');
    } else if (activeTab === 'form') {
      setLogContentView('preview');
      setFormPreviewMode('task'); 
    } else if (activeTab === 'admin') {
      setLogContentView('preview');
    }
  }, [activeTab]);

  useEffect(() => {
    axios.get(`${ADMIN_API_URL}/get-db-name`)
      .then(res => setCurrentDbName(res.data.dbName))
      .catch(() => setCurrentDbName('myTaskDB'));
  }, []);

  useEffect(() => {
    if (currentDbName !== 'Loading...') fetchLists();
  }, [currentDbName]);

  useEffect(() => {
    if (selectedList) fetchTasks();
    else setTasks([]);
  }, [selectedList]);

  useEffect(() => {
    setLogSize(prev => ({ ...prev, width: floatSize.width, height: floatSize.height }));
  }, [floatSize.width, floatSize.height]);

  // --- Data fetchers ---
  const fetchLists = () => {
    axios.get(`${ADMIN_API_URL}/get-collections?dbName=${currentDbName}`)
      .then(res => {
        const collectionNames = res.data.collections;
        setLists(collectionNames);
        if (!selectedList || !collectionNames.includes(selectedList))
          setSelectedList(collectionNames[0] || '');
      })
      .catch(() => {
        toast.error('Failed to fetch lists.');
        setLists([]);
        setSelectedList('');
      });
  };

  const fetchTasks = () => {
    axios.get(`${API_URL}?listName=${selectedList}&dbName=${currentDbName}`)
      .then(res => setTasks(res.data))
      .catch(() => setTasks([]));
  };

  // --- Utility Functions ---
  const logOperation = (command, mainOutput, inverseCommand, inverseOutput) => {
    const newLog = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      command,
      mainOutput: JSON.stringify(mainOutput, null, 2),
      inverseCommand: inverseCommand || 'N/A',
      inverseOutput: inverseOutput ? JSON.stringify(inverseOutput, null, 2) : JSON.stringify({ note: 'N/A' }, null, 2)
    };
    setOperationLog(prev => [newLog, ...prev].slice(0, 100));
    setLogViewMode('main');
    setLogContentView('log');
  };

  const clearLog = () => { setOperationLog([]); toast.success('Log cleared!'); };
  const toggleTheme = () => setTheme(p => (p === 'light' ? 'dark' : 'light'));
  const handleDurationInputChange = e => {
    const { name, value } = e.target;
    setDurationInputs(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
  };
  const handleDbSwitch = dbName => {
    logOperation(`use ${dbName}`, { switchedToDb: dbName, ok: 1 }, null, null);
    setCurrentDbName(dbName);
    setTasks([]); setLists([]); setSelectedList('');
  };

  const handleAddPriority = (e) => {
    e.preventDefault();
    const newPriorityName = newPriority.trim();
    if (newPriorityName && !priorities.find(p => p.toLowerCase() === newPriorityName.toLowerCase())) {
      const updatedPriorities = [...priorities, newPriorityName];
      setPriorities(updatedPriorities);
      setPriority(newPriorityName);
      setNewPriority('');
      toast.success(`Priority "${newPriorityName}" added!`);
    } else if (!newPriorityName) {
      toast.error('Priority name cannot be empty.');
    } else {
      toast.error(`Priority "${newPriorityName}" already exists.`);
    }
  };


  // --- List Management Functions (Real API Calls) ---

  const handleCreateList = (listName) => {
    const newListName = listName.trim();
    if (!newListName || lists.includes(newListName)) {
      toast.error('Invalid or duplicate list name.');
      return;
    }
    axios.post(`${ADMIN_API_URL}/collection/fly`, { dbName: currentDbName, collectionName: newListName })
      .then(res => {
        logOperation(`db.${newListName}.insertOne({ demo: "created" })`, res.data, null, null);
        setLists([...lists, newListName]);
        setSelectedList(newListName);
        setNewListName('');
        setActiveTab('list');
        toast.success(`List "${newListName}" created!`);
      })
      .catch(err => {
        toast.error('Failed to create list.');
        console.error(err);
      });
  };

  const handleCreateCollectionManual = (collectionName) => {
    const newCollectionName = collectionName.trim();
    if (!newCollectionName || lists.includes(newCollectionName)) {
      toast.error('Invalid or duplicate collection name.');
      return;
    }
    axios.post(`${ADMIN_API_URL}/collection/manual`, { dbName: currentDbName, collectionName: newCollectionName })
      .then(res => {
        logOperation(`db.createCollection("${newCollectionName}")`, res.data, null, null);
        setLists([...lists, newCollectionName]);
        setSelectedList(newCollectionName);
        setActiveTab('list');
        toast.success(`Collection "${newCollectionName}" created!`);
      })
      .catch(err => {
        toast.error('Failed to create collection.');
        console.error(err);
      });
  };

  const handleDeleteList = () => {
    if (!selectedList || selectedList.toLowerCase() === 'tasks') {
      toast.error('Cannot delete this list.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete the list "${selectedList}"? This cannot be undone.`)) {
      axios.delete(`${ADMIN_API_URL}/collection/${selectedList}?dbName=${currentDbName}`)
        .then(res => {
          logOperation(`db.${selectedList}.drop()`, res.data, null, null);
          const newLists = lists.filter(l => l !== selectedList);
          setLists(newLists);
          const nextList = newLists.length > 0 ? newLists[0] : '';
          setSelectedList(nextList);
          toast.success(`List "${selectedList}" deleted.`);
        })
        .catch(err => {
          toast.error('Failed to delete list.');
          console.error(err); 
        });
    }
  };


  // --- CRUD Operations ---
  const addTask = e => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!selectedList) {
      toast.error('Please select a list first.');
      return;
    }
    setIsLoading(true);

    let taskDueDate = null, taskDuration = 0;
    if (timeframeType === 'deadline' && deadlineInput)
      taskDueDate = new Date(deadlineInput).toISOString();
    else if (timeframeType === 'duration')
      taskDuration = (durationInputs.hours || 0) * 3600 + (durationInputs.minutes || 0) * 60 + (durationInputs.seconds || 0);

    const taskData = { text, priority, dueDate: taskDueDate, estimatedDuration: taskDuration, dbName: currentDbName, listName: selectedList };
    const logData = { ...taskData };
    delete logData.dbName; delete logData.listName;
    if (timeframeType !== 'deadline') delete logData.dueDate;
    if (timeframeType !== 'duration') delete logData.estimatedDuration;

    axios.post(`${API_URL}/add`, taskData)
      .then(res => {
        setText('');
        setPriority('Medium');
        setDeadlineInput('');
        setDurationInputs({ hours: '', minutes: '', seconds: '' });
        fetchTasks();
        setActiveTab('list');
        toast.success(`Task added to "${selectedList}"!`);
        logOperation(`db.${selectedList}.insertOne(${JSON.stringify(logData, null, 2)})`, res.data, null, null);
      })
      .catch(() => toast.error('Failed to add task.'))
      .finally(() => setIsLoading(false));
  };

  const toggleComplete = id => {
    axios.post(`${API_URL}/update/${id}`, { dbName: currentDbName, listName: selectedList })
      .then(res => {
        fetchTasks();
        toast.success('Task status updated!');
        logOperation(`db.${selectedList}.updateOne({ _id: "${id}" }, { $set: { isCompleted: ${res.data.isCompleted} } })`, res.data, null, null);
      })
      .catch(() => toast.error('Failed to update task.'));
  };

  const deleteTask = id => {
    axios.delete(`${API_URL}/${id}`, { data: { dbName: currentDbName, listName: selectedList } })
      .then(res => {
        setTasks(tasks.filter(t => t._id !== id));
        toast.success('Task deleted!');
        logOperation(`db.${selectedList}.deleteOne({ _id: "${id}" })`, res.data, null, null);
      })
      .catch(() => toast.error('Failed to delete task.'));
  };

  const handleEdit = task => {
    setEditingTask(task);
    const localDue = task.dueDate
      ? new Date(new Date(task.dueDate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      : '';
    setEditFormData({ text: task.text, dueDate: localDue, estimatedDuration: task.estimatedDuration || 0 });
  };

  const handleEditFormChange = e => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateTask = (e, id) => {
    e.preventDefault();
    if (!editFormData.text.trim()) return;
    const data = { ...editFormData, dbName: currentDbName, listName: selectedList };
    axios.patch(`${API_URL}/edit/${id}`, data)
      .then(res => {
        setEditingTask(null);
        fetchTasks();
        toast.success('Task updated!');
        const logData = { ...data };
        delete logData.dbName; delete logData.listName;
        logOperation(`db.${selectedList}.updateOne({ _id: "${id}" }, { $set: ${JSON.stringify(logData, null, 2)} })`, res.data, null, null);
      })
      .catch(() => toast.error('Failed to update task.'));
  };

  // --- Log Dock Handlers ---
  const handleLogDock = side => {
    setIsLogFullscreen(false);
    if (side === logDockSide) setLogDockSide('float');
    else setLogDockSide(side);
  };

  const toggleLogFullscreen = () => setIsLogFullscreen(p => !p);

  const handleDragStop = (e, d) => {
    if (logDockSide === 'float') {
      setLogPosition({ x: d.x, y: d.y });
      setFloatPosition({ x: d.x, y: d.y });
    }
  };

  const handleResizeStop = (e, direction, ref, delta, position) => {
    const newSize = { width: ref.offsetWidth, height: ref.offsetHeight };
    setFloatSize(newSize);
    setLogSize(newSize);
    if (logDockSide === 'float') {
      setLogPosition(position);
      setFloatPosition(position);
    }
  };

  // --- Docked resizer (mouse handlers) ---
  const minWidth = 260;
  const minHeight = 150;
  const maxWidth = Math.max(400, window.innerWidth - 120);
  const maxHeight = Math.max(300, window.innerHeight - 120);

  const startDockResize = (e) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({ x: e.clientX, y: e.clientY, width: floatSize.width, height: floatSize.height });
  };

  useEffect(() => {
    if (!isResizing) return;
    function onMouseMove(e) {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      if (logDockSide === 'right') {
        let newW = Math.round(resizeStart.width - dx);
        newW = Math.max(minWidth, Math.min(maxWidth, newW));
        setFloatSize(prev => ({ ...prev, width: newW }));
        setLogSize(prev => ({ ...prev, width: newW }));
      } else if (logDockSide === 'left') {
        let newW = Math.round(resizeStart.width + dx);
        newW = Math.max(minWidth, Math.min(maxWidth, newW));
        setFloatSize(prev => ({ ...prev, width: newW }));
        setLogSize(prev => ({ ...prev, width: newW }));
      } else if (logDockSide === 'top') {
        let newH = Math.round(resizeStart.height + dy);
        newH = Math.max(minHeight, Math.min(maxHeight, newH));
        setFloatSize(prev => ({ ...prev, height: newH }));
        setLogSize(prev => ({ ...prev, height: newH }));
      } else if (logDockSide === 'bottom') {
        let newH = Math.round(resizeStart.height - dy);
        newH = Math.max(minHeight, Math.min(maxHeight, newH));
        setFloatSize(prev => ({ ...prev, height: newH }));
        setLogSize(prev => ({ ...prev, height: newH }));
      }
    }
    function onMouseUp() { setIsResizing(false); }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isResizing, resizeStart, logDockSide]);

  // --- Dynamic style vars ---
  const appClassName = `App ${isLogFullscreen ? 'fullscreen-log' : 'dock-mode-' + logDockSide}`;
  const logClassName = `resizable-sidebar ${isLogFullscreen ? 'fullscreen' : ''} ${logDockSide !== 'float' ? `docked docked-${logDockSide}` : ''}`;

  // --- Processed tasks ---
  const processedTasks = useMemo(() => {
    let filtered = tasks;
    if (activeFilter === 'active') filtered = tasks.filter(t => !t.isCompleted);
    else if (activeFilter === 'completed') filtered = tasks.filter(t => t.isCompleted);
    if (priorityFilter !== 'all') filtered = filtered.filter(t => t.priority === priorityFilter);
    const sorted = [...filtered];
    if (sortBy === 'priority') {
      const order = priorities.reduce((acc, p, i) => ({ ...acc, [p]: i + 1 }), {});
      sorted.sort((a, b) => (order[a.priority] || Infinity) - (order[b.priority] || Infinity));
    } else if (sortBy === 'time') {
      sorted.sort((a, b) => (a.dueDate ? new Date(a.dueDate) : Infinity) - (b.dueDate ? new Date(b.dueDate) : Infinity));
    } else sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return sorted;
  }, [tasks, activeFilter, sortBy, priorityFilter, priorities]);


  // --- 
  // --- THIS IS THE FIX: The simulation logic is rewritten ---
  // --- 
  const commandPreview = useMemo(() => {
    if (activeTab !== 'form') return null;

    // Mode 1: User is focused on the "Create New List" form
    if (formPreviewMode === 'list') {
      return `db.${newListName || '...'}.insertOne({ demo: "created" })`;
    }

    // Mode 2: User is focused on the "Create Custom Priority" form
    if (formPreviewMode === 'priority') {
      return `// This is a local app-only change.\n// (Adds "${newPriority || '...'}" to dropdowns)`;
    }

    // Mode 3 (Default): User is focused on the main "Add Task" form
    
    // --- THIS IS THE KEY ---
    // If no list is selected, show a helpful message instead of a broken query
    if (!selectedList) {
      return `// Please select a list from the dropdown above\n// or create a new list below to add a task.`
    }
    
    // If a list *is* selected, build the normal task preview
    let due = null, dur = 0;
    if (timeframeType === 'deadline')
      due = deadlineInput ? new Date(deadlineInput).toISOString() : '[Select a date]';
    else if (timeframeType === 'duration')
      dur = (durationInputs.hours || 0) * 3600 + (durationInputs.minutes || 0) * 60 + (durationInputs.seconds || 0);
    
    const task = { text: text || 'Example task', priority };
    if (timeframeType === 'deadline') task.dueDate = due;
    if (timeframeType === 'duration') task.estimatedDuration = dur;
    
    // selectedList is guaranteed to be present here
    return `db.${selectedList}.insertOne(${JSON.stringify(task, null, 2)})`;

  }, [
    activeTab, 
    formPreviewMode, 
    text, priority, 
    deadlineInput, durationInputs, 
    selectedList, timeframeType, 
    newListName, newPriority
  ]);

  // --- Return JSX ---
  
  const dockStyle = {};
  if (isLogFullscreen) {
    dockStyle.width = '100vw';
    dockStyle.height = '100vh';
    dockStyle.top = 0;
    dockStyle.left = 0;
    dockStyle.right = 0;
    dockStyle.bottom = 0;
    dockStyle.zIndex = 9999;
  } else if (logDockSide === 'left' || logDockSide === 'right') {
    dockStyle.width = `${logSize.width}px`;
    dockStyle.height = '100%';
  } else if (logDockSide === 'top' || logDockSide === 'bottom') {
    dockStyle.height = `${logSize.height}px`;
    dockStyle.width = '100%';
  }

  return (
    <div className={appClassName}>
      <Toaster position="bottom-right" />

      <div className="app-content-wrapper" style={{ padding: '2.5rem' }}>
        <header>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <h1>My Tasks 📝</h1>
          <p style={{ margin: 0, marginTop: '0.5rem', color: 'var(--text-light)' }}>
            DB: <strong>{currentDbName}</strong>
          </p>
        </header>

        <div className="main-content-area">
          <div className="left-column-content">
            <div className="tabs">
              <button onClick={() => setActiveTab('list')} className={`tab-btn ${activeTab === 'list' ? 'active' : ''}`}>Task List</button>
              <button onClick={() => setActiveTab('form')} className={`tab-btn ${activeTab === 'form' ? 'active' : ''}`}>Add New Task</button>
              <button onClick={() => setActiveTab('admin')} className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}>Admin</button>
            </div>

            <div className="tab-content">
              {activeTab === 'form' && (
                <TaskForm
                  text={text} setText={setText}
                  priority={priority} setPriority={setPriority}
                  timeframeType={timeframeType} setTimeframeType={setTimeframeType}
                  deadlineInput={deadlineInput} setDeadlineInput={setDeadlineInput}
                  durationInputs={durationInputs} handleDurationInputChange={handleDurationInputChange}
                  addTask={addTask} isLoading={isLoading}
                  lists={lists} newListName={newListName}
                  setNewListName={setNewListName}
                  handleCreateList={handleCreateList} 
                  
                  priorities={priorities}
                  newPriority={newPriority}
                  setNewPriority={setNewPriority}
                  handleAddPriority={handleAddPriority}

                  // --- THIS IS THE FIX ---
                  selectedList={selectedList}
                  setSelectedList={setSelectedList}
                  setFormPreviewMode={setFormPreviewMode}
                  // ------------------------
                />
              )}
              {activeTab === 'list' && (
                <TaskList
                  tasks={tasks}
                  processedTasks={processedTasks}
                  activeFilter={activeFilter} setActiveFilter={setActiveFilter}
                  priorityFilter={priorityFilter} setPriorityFilter={setPriorityFilter}
                  sortBy={sortBy} setSortBy={setSortBy}
                  editingTask={editingTask} setEditingTask={setEditingTask}
                  editFormData={editFormData} handleEditFormChange={handleEditFormChange}
                  handleUpdateTask={handleUpdateTask}
                  toggleComplete={toggleComplete}
                  handleEdit={handleEdit}
                  deleteTask={deleteTask}
                  lists={lists} selectedList={selectedList}
                  setSelectedList={setSelectedList}
                  handleDeleteList={handleDeleteList}
                  
                  priorities={priorities}
                />
              )}
              {activeTab === 'admin' && (
                <AdminPanel
                  onAdminAction={logOperation}
                  setAdminQueryPreview={setAdminQueryPreview}
                  handleDbSwitch={handleDbSwitch}
                  currentDbName={currentDbName}
                  selectedList={selectedList} 
                  
                  handleCreateCollectionManual={handleCreateCollectionManual}
                  
                  adminFilterPriority={adminFilterPriority}
                  setAdminFilterPriority={setAdminFilterPriority}
                  adminSortOrder={adminSortOrder}
                  setAdminSortOrder={setAdminSortOrder}
                  adminLimit={adminLimit}
                  setAdminLimit={setAdminLimit}
                  adminSkip={adminSkip}
                  setAdminSkip={setAdminSkip}
                  adminApplyFilter={adminApplyFilter}
                  setAdminApplyFilter={setAdminApplyFilter}
                  adminApplySort={adminApplySort}
                  setAdminApplySort={setAdminApplySort}
                  adminApplyLimit={adminApplyLimit}
                  setAdminApplyLimit={setAdminApplyLimit}
                  adminApplySkip={adminApplySkip}
                  setAdminApplySkip={setAdminApplySkip}
                  adminFilterType={adminFilterType}
                  setAdminFilterType={setAdminFilterType}
                  adminFilterField={adminFilterField}
                  setAdminFilterField={setAdminFilterField}
                  adminFilterValue={adminFilterValue}
                  setAdminFilterValue={setAdminFilterValue}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Log Window --- */}
      {logDockSide === 'float' ? (
        <Rnd
          className={logClassName}
          size={isLogFullscreen ? { width: '100vw', height: '100vh' } : { width: floatSize.width, height: floatSize.height }}
          position={isLogFullscreen ? { x: 0, y: 0 } : logPosition}
          onResizeStop={handleResizeStop}
          onDragStop={handleDragStop}
          enableResizing={!isLogFullscreen}
          disableDragging={isLogFullscreen}
          minWidth={260}
          minHeight={150}
          bounds="window"
          style={{ position: 'fixed', zIndex: 9999 }}
        >
          <LogContent
            {...{
              activeTab,
              isLogFullscreen,
              toggleLogFullscreen,
              handleLogDock,
              logViewMode, setLogViewMode,
              logContentView, setLogContentView,
              logFontSize, setLogFontSize,
              clearLog,
              commandPreview,
              adminQueryPreview,
              operationLog
            }}
          />
        </Rnd>
      ) : (
        <div className={logClassName} style={{ ...dockStyle, position: isLogFullscreen ? 'fixed' : 'relative' }}>
          {!isLogFullscreen && (logDockSide === 'right' || logDockSide === 'left') && (
            <div
              className="sidebar-resizer vertical"
              onMouseDown={startDockResize}
              style={{
                position: 'absolute', top: 0, bottom: 0, width: 10, cursor: 'ew-resize',
                zIndex: 50, left: logDockSide === 'right' ? -6 : undefined,
                right: logDockSide === 'left' ? -6 : undefined, background: 'transparent'
              }}
            />
          )}
          {!isLogFullscreen && (logDockSide === 'top' || logDockSide === 'bottom') && (
            <div
              className="sidebar-resizer horizontal"
              onMouseDown={startDockResize}
              style={{
                position: 'absolute', left: 0, right: 0, height: 10, cursor: 'ns-resize',
                zIndex: 50, bottom: logDockSide === 'top' ? -6 : undefined,
                top: logDockSide === 'bottom' ? -6 : undefined, background: 'transparent'
              }}
            />
          )}
          <LogContent
            {...{
              activeTab,
              isLogFullscreen,
              toggleLogFullscreen,
              handleLogDock,
              logViewMode, setLogViewMode,
              logContentView, setLogContentView,
              logFontSize, setLogFontSize,
              clearLog,
              commandPreview,
              adminQueryPreview,
              operationLog
            }}
          />
        </div>
      )}
    </div>
  );
}

// --- LogContent (No changes) ---
function LogContent({
  activeTab,
  isLogFullscreen,
  toggleLogFullscreen,
  handleLogDock,
  logViewMode, setLogViewMode,
  logContentView, setLogContentView,
  logFontSize, setLogFontSize,
  clearLog,
  commandPreview,
  adminQueryPreview,
  operationLog
}) {
  
  const isPreviewAvailable = activeTab === 'form' || activeTab === 'admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="log-header" role="banner" aria-label="Operation log header">
        <h3 aria-live="polite">
          {logContentView === 'preview' && activeTab === 'form' ? 'Insert Command Preview'
            : logContentView === 'preview' && activeTab === 'admin' ? 'Admin Query Preview'
            : 'Operation Log'}
        </h3>

        <div
          className="log-controls-wrapper"
          role="toolbar"
          aria-label="Log controls"
          tabIndex={-1}
        >
          <div className="log-view-tabs" role="tablist" aria-label="Log Content View">
            <button
              role="tab"
              aria-selected={logContentView === 'preview'}
              onClick={() => setLogContentView('preview')}
              className={logContentView === 'preview' ? 'active' : ''}
              title="Show Command Preview"
              disabled={!isPreviewAvailable}
            >
              Preview
            </button>
            <button
              role="tab"
              aria-selected={logContentView === 'log'}
              onClick={() => setLogContentView('log')}
              className={logContentView === 'log' ? 'active' : ''}
              title="Show Operation Log"
            >
              Log
            </button>
          </div>

          {logContentView === 'log' && (
            <div className="log-view-tabs" role="tablist" aria-label="Log view tabs">
              <button
                role="tab"
                aria-selected={logViewMode === 'main'}
                onClick={() => setLogViewMode('main')}
                className={logViewMode === 'main' ? 'active' : ''}
                title="Show query results"
              >
                Results
              </button>
              <button
                role="tab"
                aria-selected={logViewMode === 'inverse'}
                onClick={() => setLogViewMode('inverse')}
                className={logViewMode === 'inverse' ? 'active' : ''}
                title="Show left out data"
              >
                Left Out
              </button>
            </div>
          )}

          <div className="log-dock-controls" aria-hidden={false} title="Dock controls">
            <button
              onClick={toggleLogFullscreen}
              title={isLogFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              aria-pressed={isLogFullscreen}
            >
              {isLogFullscreen ? '[-]' : '[ ]'}
            </button>
            <button onClick={() => handleLogDock('top')} title="Dock Top">▲</button>
            <button onClick={() => handleLogDock('bottom')} title="Dock Bottom">▼</button>
            <button onClick={() => handleLogDock('left')} title="Dock Left">◀</button>
            <button onClick={() => handleLogDock('float')} title="Float">○</button>
            <button onClick={() => handleLogDock('right')} title="Dock Right">▶</button>
          </div>

          <div className="log-font-controls" aria-label="Font size">
            <button onClick={() => setLogFontSize(s => Math.max(0.5, (s || 0.9) - 0.1))} title="Decrease font">A-</button>
            <button onClick={() => setLogFontSize(s => Math.min(1.5, (s || 0.9) + 0.1))} title="Increase font">A+</button>
          </div>

          <button className="log-clear-btn" onClick={clearLog} title="Clear log">Clear</button>
        </div>
      </div>

      <div
        className={`real-time-log ${logContentView === 'preview' ? 'preview-active' : ''}`}
        style={{ fontSize: `${logFontSize}rem`, flexGrow: 1, overflowY: 'auto' }}
      >
        {logContentView === 'preview' && activeTab === 'form' ? (
          <div className="log-entry preview-log" style={{ padding: '1rem' }}>
            <pre className="log-command" style={{ margin: 0 }}>{commandPreview}</pre>
          </div>
        ) : logContentView === 'preview' && activeTab === 'admin' ? (
          <div className="log-entry preview-log" style={{ padding: '1rem' }}>
            <pre className="log-command" style={{ margin: 0 }}>{adminQueryPreview || 'db.tasks.find({})'}</pre>
          </div>
        ) : (
          <>
            {operationLog.length === 0 ? (
              <p className="log-empty" style={{ padding: '1.25rem', margin: 0 }}>No operations logged yet.</p>
            ) : (
              operationLog.map(log => (
                <div key={log.id} className="log-entry" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #222' }}>
                  <span className="log-timestamp" style={{ color: '#555', display: 'block', marginBottom: '0.25rem' }}>{log.timestamp}</span>
                  <pre className="log-command" style={{ margin: 0 }}>
                    {logViewMode === 'main'
                      ? (typeof log.command === 'string' ? log.command : JSON.stringify(log.command, null, 2))
                      : (log.inverseCommand || 'N/A')}
                  </pre>
                  <pre className="log-output" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                    {logViewMode === 'main' ? log.mainOutput : log.inverseOutput}
                  </pre>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;