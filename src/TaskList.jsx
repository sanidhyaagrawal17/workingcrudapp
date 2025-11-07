// D:\mongoapp\frontend\src\TaskList.jsx

import React from 'react';
import EmptyState from './EmptyState.jsx';

// Helper function to format the countdown
const formatTimeRemaining = (dueDate) => {
  if (!dueDate) return "No Deadline"; // Handle null dates
  const now = new Date();
  const due = new Date(dueDate);
  let diff = due - now;
  if (diff <= 0) return "Overdue";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  diff -= days * (1000 * 60 * 60 * 24);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * (1000 * 60 * 60);
  const minutes = Math.floor(diff / (1000 * 60));
  let result = '';
  if (days > 0) result += `${days}d `;
  if (hours > 0) result += `${hours}h `;
  if (minutes > 0 && days === 0) result += `${minutes}m`;
  if (result.trim() === '') result = 'Less than a minute';
  return result.trim();
};

const formatDuration = (totalSeconds) => {
  if (!totalSeconds || totalSeconds === 0) return null;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};

function TaskList({
  processedTasks, activeFilter, setActiveFilter, 
  priorityFilter, setPriorityFilter,
  sortBy, setSortBy, editingTask, 
  handleUpdateTask, handleEditFormChange, setEditingTask,
  toggleComplete, handleEdit, deleteTask,
  lists, selectedList, setSelectedList,
  handleDeleteList,
  
  // --- Receive new props ---
  priorities,
  editFormData,
  
  adminApplySort, adminSortOrder,
  adminApplySkip, adminSkip,
  adminApplyLimit, adminLimit
}) {
  return (
    <>
      <div className="list-management-area">
        <div className="list-selector-wrapper">
          <label htmlFor="listSelect">Current List:</label>
          <select id="listSelect" className="form-input" value={selectedList} onChange={(e) => setSelectedList(e.target.value)}>
            {lists.length === 0 ? (
              <option value="" disabled>No lists found</option>
            ) : (
              lists.map(list => (
                <option key={list} value={list}>{list}</option>
              ))
            )}
          </select>
          <button 
            onClick={handleDeleteList} 
            className="delete-btn" 
            title={`Delete "${selectedList}" list`}
            disabled={!selectedList || selectedList.toLowerCase() === 'tasks'}
          >
            Delete List
          </button>
        </div>
      </div>

      {(adminApplySort || adminApplySkip || adminApplyLimit) && (
        <div className="admin-query-display">
          <strong>Admin Query Active:</strong>
          {adminApplySort && <span>Sort( {adminSortOrder.replace('_', ' ')} )</span>}
          {adminApplySkip && <span>Skip( {adminSkip} )</span>}
          {adminApplyLimit && <span>Limit( {adminLimit} )</span>}
        </div>
      )}


      <div className="view-controls">
        <div className="filter-group">
          <label>Status:</label>
          <button onClick={() => setActiveFilter('all')} className={activeFilter === 'all' ? 'active' : ''}>All</button>
          <button onClick={() => setActiveFilter('active')} className={activeFilter === 'active' ? 'active' : ''}>Active</button>
          <button onClick={() => setActiveFilter('completed')} className={activeFilter === 'completed' ? 'active' : ''}>Completed</button>
        </div>
        <div className="filter-group">
          <label>Priority:</label>
          {/* --- THIS DROPDOWN IS NOW DYNAMIC --- */}
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="form-input">
            <option value="all">All</option>
            {/* This check prevents the crash. If priorities is undefined, it won't map. */}
            {priorities && priorities.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="sort-by">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="form-input">
            <option value="default">Default</option>
            <option value="priority">Priority</option>
            <option value="time">Time Remaining</option>
          </select>
        </div>
      </div>
      
      {processedTasks.length === 0 ? (
        <EmptyState activeFilter={activeFilter} priorityFilter={priorityFilter} />
      ) : (
        <ul className="task-list">
          {processedTasks.map(task => {
            const durationText = formatDuration(task.estimatedDuration);
            const deadlineText = formatTimeRemaining(task.dueDate);
            
            return (
              <li key={task._id} className={task.isCompleted ? 'completed' : ''}>
                {editingTask && editingTask._id === task._id ? (
                  <form className="edit-form" onSubmit={(e) => handleUpdateTask(e, task._id)}>
                    <div className="form-group"><label>Task</label><input name="text" type="text" value={editFormData.text} onChange={handleEditFormChange} className="form-input" autoFocus/></div>
                    <div className="form-group"><label>New Due Date</label><input name="dueDate" type="datetime-local" value={editFormData.dueDate} onChange={handleEditFormChange} className="form-input"/></div>
                    <div className="form-group">
                      <label>Est. Duration (in seconds)</label>
                      <input name="estimatedDuration" type="number" value={editFormData.estimatedDuration} onChange={handleEditFormChange} className="form-input" min="0" />
                    </div>
                    <div className="edit-form-actions"><button type="submit" className="save-btn">Save</button><button type="button" onClick={() => setEditingTask(null)} className="cancel-btn">Cancel</button></div>
                  </form>
                ) : (
                  <>
                    <div className="task-content">
                      <span className="task-text" onClick={() => toggleComplete(task._id)}>{task.text}</span>
                      <div className="task-details">
                        <span className="task-date">Due: {deadlineText}</span>
                        {durationText && (
                          <span className="task-duration">Est: {durationText}</span>
                        )}
                      </div>
                    </div>
                    <div className="task-actions">
                      <span className={`priority-pill priority-${(task.priority || 'medium').toLowerCase()}`}>{task.priority}</span>
                      <button onClick={() => handleEdit(task)} className="edit-btn">Edit</button>
                      <button onClick={() => deleteTask(task._id)} className="delete-btn">Delete</button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </>
  );
}

export default TaskList;