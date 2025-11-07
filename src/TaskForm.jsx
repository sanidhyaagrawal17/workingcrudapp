// D:\mongoapp\frontend\src\TaskForm.jsx

import React from 'react';

// Helper arrays for dropdowns
const hourOptions = Array.from({ length: 24 }, (_, i) => i);
const minuteOptions = Array.from({ length: 60 }, (_, i) => i);

function TaskForm({
  text, setText, priority, setPriority, 
  timeframeType, setTimeframeType,
  deadlineInput, setDeadlineInput,
  durationInputs, handleDurationInputChange,
  addTask, isLoading, 
  lists, 
  newListName, setNewListName, handleCreateList,
  
  priorities, newPriority, setNewPriority, handleAddPriority,
  
  // --- THIS IS THE FIX ---
  selectedList,
  setSelectedList,
  setFormPreviewMode
}) {
  
  const onCreateList = (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    handleCreateList(newListName);
  };

  const onFormSubmit = (e) => {
    addTask(e);
  };

  return (
    <>
      {/* --- Main Task Form --- */}
      <form 
        onSubmit={onFormSubmit} 
        className="task-form"
        onFocus={() => setFormPreviewMode('task')}
      >
        
        {/* --- THIS IS THE NEW DROPDOWN --- */}
        <div className="form-group">
          <label htmlFor="list-select-form">Add to List:</label>
          <select 
            id="list-select-form" 
            className="form-input" 
            value={selectedList} 
            onChange={(e) => setSelectedList(e.target.value)}
          >
            {lists.length === 0 ? (
              <option value="" disabled>Please create a list first</option>
            ) : (
              lists.map(list => (
                <option key={list} value={list}>{list}</option>
              ))
            )}
          </select>
        </div>
        {/* ------------------------------- */}

        <div className="form-group">
          <label htmlFor="taskInput">Task</label>
          <input id="taskInput" type="text" placeholder="What do you need to do?" value={text} onChange={(e) => setText(e.target.value)} className="form-input"/>
        </div>
        
        <div className="form-group">
          <label>Timeframe Type</label>
          <select className="form-input" value={timeframeType} onChange={(e) => setTimeframeType(e.target.value)}>
            <option value="deadline">Deadline (When is it due?)</option>
            <option value="duration">Completion Time (How long will it take?)</option>
          </select>
        </div>

        {timeframeType === 'deadline' && (
          <div className="form-group">
            <label>Deadline</label>
            <input 
              type="datetime-local" 
              className="form-input"
              value={deadlineInput} 
              onChange={(e) => setDeadlineInput(e.target.value)}
              min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
            />
          </div>
        )}
        
        {timeframeType === 'duration' && (
          <div className="form-row">
            <div className="form-group">
              <label>Hours</label>
              <select name="hours" value={durationInputs.hours || ''} onChange={handleDurationInputChange} className="form-input">
                <option value="" disabled>--</option>
                {hourOptions.map(hour => (<option key={hour} value={hour}>{hour}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label>Minutes</label>
              <select name="minutes" value={durationInputs.minutes || ''} onChange={handleDurationInputChange} className="form-input">
                <option value="" disabled>--</option>
                {minuteOptions.map(min => (<option key={min} value={min}>{min}</option>))}
              </select>
            </div>
            <div className="form-group">
              <label>Seconds</label>
              <select name="seconds" value={durationInputs.seconds || ''} onChange={handleDurationInputChange} className="form-input">
                <option value="" disabled>--</option>
                {minuteOptions.map(sec => (<option key={sec} value={sec}>{sec}</option>))}
              </select>
            </div>
          </div>
        )}
        
        <div className="form-row">
          <div className="form-group">
            <label>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} className="form-input">
              {priorities.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Adding...' : 'Add Task'}
        </button>
      </form>
      
      {/* --- Create List Form (On-the-fly) --- */}
      <div 
        className="list-management-area create-list-inline"
        onFocus={() => setFormPreviewMode('list')}
      >
        <label>Create New List (On-the-fly)</label>
        <form className="create-list-form" onSubmit={onCreateList}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g., shopping_list" 
            value={newListName} 
            onChange={(e) => setNewListName(e.target.value)}
          />
          <button type="submit" className="save-btn">+</button>
        </form>
      </div>
      
      {/* --- Create Priority Form --- */}
      <div 
        className="list-management-area create-list-inline"
        onFocus={() => setFormPreviewMode('priority')}
      >
        <label>Create Custom Priority</label>
        <form className="create-list-form" onSubmit={handleAddPriority}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g., Blocker" 
            value={newPriority} 
            onChange={(e) => setNewPriority(e.target.value)}
          />
          <button type="submit" className="save-btn">+</button>
        </form>
      </div>
    </>
  );
}

export default TaskForm;