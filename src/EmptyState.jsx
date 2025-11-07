// D:\mongoapp\frontend\src\EmptyState.jsx

import React from 'react';

function EmptyState({ activeFilter, priorityFilter }) {
  
  let message = "You don't have any tasks in this list yet.";
  
  if (activeFilter === 'completed') {
    message = "You haven't completed any tasks in this list.";
  } else if (priorityFilter !== 'all') {
    message = `You don't have any "${priorityFilter}" priority tasks in this view.`;
  } else if (activeFilter === 'active') {
    message = "You have no active tasks. Good job!";
  }

  return (
    <div className="empty-state">
      <div className="empty-state-icon">📝</div>
      <h3>No Tasks Found</h3>
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;