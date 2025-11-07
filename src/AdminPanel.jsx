// D:\mongoapp\frontend\src\AdminPanel.jsx

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

function AdminPanel({
  onAdminAction,
  setAdminQueryPreview,
  handleDbSwitch,
  currentDbName,
  selectedList,
  handleCreateCollectionManual, // Real function from App.jsx
  
  adminFilterPriority, setAdminFilterPriority,
  adminSortOrder, setAdminSortOrder,
  adminLimit, setAdminLimit,
  adminSkip, setAdminSkip,
  adminApplyFilter, setAdminApplyFilter,
  adminApplySort, setAdminApplySort,
  adminApplyLimit, setAdminApplyLimit,
  adminApplySkip, setAdminApplySkip,
  adminFilterType, setAdminFilterType,
  adminFilterField, setAdminFilterField,
  adminFilterValue, setAdminFilterValue
}) {

  const [dbNameInput, setDbNameInput] = useState(currentDbName);
  const [collectionNameInput, setCollectionNameInput] = useState('');
  
  // --- NEW SIMULATION LOGIC ---
  
  const [previewMode, setPreviewMode] = useState('query'); // 'db' | 'collectionManual' | 'query'
  const [findQueryPreview, setFindQueryPreview] = useState('db.tasks.find({})');

  // This hook *only* builds the advanced 'find()' query string
  useEffect(() => {
    let findArgs = {};
    let modifiers = "";
    const collectionName = selectedList || 'tasks'; 

    if (adminApplyFilter) {
      if (adminFilterType === 'priority') {
        findArgs = { priority: adminFilterPriority };
      } else {
        findArgs = { [adminFilterField]: adminFilterValue || '...' };
      }
    }
    if (adminApplySort) {
      const [field, order] = adminSortOrder.split('_');
      modifiers += `.sort({ ${field}: ${order} })`;
    }
    if (adminApplySkip) {
      modifiers += `.skip(${adminSkip || 0})`;
    }
    if (adminApplyLimit) {
      modifiers += `.limit(${adminLimit || 10})`;
    }

    const preview = `db.${collectionName}.find(${JSON.stringify(findArgs)})` + modifiers;
    setFindQueryPreview(preview);

  }, [
    selectedList,
    adminApplyFilter, adminApplySort, adminApplySkip, adminApplyLimit,
    adminFilterPriority, adminSortOrder, adminLimit, adminSkip,
    adminFilterType, adminFilterField, adminFilterValue
  ]);

  // This 'Router' hook decides WHAT to show in the preview window
  useEffect(() => {
    if (previewMode === 'db') {
      setAdminQueryPreview(`use ${dbNameInput || '...'}`);
    } 
    else if (previewMode === 'collectionManual') {
      setAdminQueryPreview(`db.createCollection("${collectionNameInput || '...'}")`);
    }
    else { // 'query'
      setAdminQueryPreview(findQueryPreview);
    }
  }, [
    previewMode, 
    dbNameInput, 
    collectionNameInput, 
    findQueryPreview, 
    setAdminQueryPreview
  ]);

  // --- End of New Simulation Logic ---


  const onDbSwitch = (e) => {
    e.preventDefault();
    if (dbNameInput.trim()) {
      handleDbSwitch(dbNameInput.trim());
    } else {
      toast.error('Please enter a DB name.');
    }
  };

  const onDropDatabase = () => {
    if (window.confirm(`Are you sure you want to drop database "${currentDbName}"? This cannot be undone.`)) {
      // This is still a simulation, as it's a very destructive action
      // To make it real, you would follow the same pattern as handleDeleteList
      onAdminAction(`db.dropDatabase()`, { "dropped": currentDbName, "ok": 1 }, null, null);
      toast.success(`Sent command: db.dropDatabase()`);
      handleDbSwitch('myTaskDB');
      setDbNameInput('myTaskDB');
    }
  };

  // This now calls the REAL function from App.jsx
  const onCreateCollectionManual = (e) => {
    e.preventDefault();
    if (!collectionNameInput.trim()) {
      toast.error('Please enter a collection name.');
      return;
    }
    handleCreateCollectionManual(collectionNameInput);
    setCollectionNameInput('');
  };


  const onRunQuery = () => {
    // This logs the 'find()' query for simulation purposes
    onAdminAction(findQueryPreview, { "status": "Query executed (demo)" }, null, null);
    toast.success('Query logged!');
  };


  return (
    <div className="admin-panel">

      {/* --- DATABASE MANAGEMENT --- */}
      <h3>Database Management</h3>
      <form onSubmit={onDbSwitch} className="admin-form-row">
        <div className="form-group">
          <label htmlFor="dbName">Switch/Create DB:</label>
          <input
            id="dbName"
            type="text"
            className="form-input"
            value={dbNameInput}
            onChange={(e) => setDbNameInput(e.target.value)}
            placeholder="e.g., myTaskDB"
            onFocus={() => setPreviewMode('db')}
          />
        </div>
        <button 
          type="submit" 
          className="admin-btn"
          onFocus={() => setPreviewMode('db')}
        >
          use {dbNameInput || '...'}
        </button>
        <button 
          type="button" 
          className="admin-btn danger" 
          onClick={onDropDatabase}
          onFocus={() => setPreviewMode('db')}
        >
          Drop DB
        </button>
      </form>
      <p>Current DB: <strong>{currentDbName}</strong></p>

      {/* --- COLLECTION MANAGEMENT --- */}
      <h3>Collection Management</h3>
      <form onSubmit={onCreateCollectionManual} className="admin-form-row">
        <div className="form-group">
          <label htmlFor="collectionName">Collection Name:</label>
          <input
            id="collectionName"
            type="text"
            className="form-input"
            value={collectionNameInput}
            onChange={(e) => setCollectionNameInput(e.target.value)}
            placeholder="e.g., project_tasks"
            onFocus={() => setPreviewMode('collectionManual')}
          />
        </div>
        <button 
          type="submit" 
          className="admin-btn"
          onFocus={() => setPreviewMode('collectionManual')}
        >
          Create Collection (Manual)
        </button>
      </form>

      {/* --- ADVANCED QUERY BUILDER --- */}
      <h3 onFocus={() => setPreviewMode('query')}>Advanced Query</h3>
      <div 
        className="admin-query-builder" 
        tabIndex={-1} // Make the div focusable
        onFocus={() => setPreviewMode('query')}
      >

        {/* --- FILTER (find) --- */}
        <div className="admin-query-section">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={adminApplyFilter}
              onChange={(e) => setAdminApplyFilter(e.target.checked)}
            />
            Apply Filter (find)
          </label>
          <div className="admin-controls" disabled={!adminApplyFilter}>
            <select
              className="form-input"
              value={adminFilterType}
              onChange={(e) => setAdminFilterType(e.target.value)}
            >
              <option value="priority">By Priority</option>
              <option value="custom">By Custom Field</option>
            </select>
            {adminFilterType === 'priority' ? (
              <select
                className="form-input"
                value={adminFilterPriority}
                onChange={(e) => setAdminFilterPriority(e.target.value)}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            ) : (
              <>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Field (e.g., text)"
                  value={adminFilterField}
                  onChange={(e) => setAdminFilterField(e.target.value)}
                />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Value (e.g., 'Buy milk')"
                  value={adminFilterValue}
                  onChange={(e) => setAdminFilterValue(e.target.value)}
                />
              </>
            )}
          </div>
        </div>

        {/* --- SORT --- */}
        <div className="admin-query-section">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={adminApplySort}
              onChange={(e) => setAdminApplySort(e.target.checked)}
            />
            Apply Sort
          </label>
          <div className="admin-controls" disabled={!adminApplySort}>
            <select
              className="form-input"
              value={adminSortOrder}
              onChange={(e) => setAdminSortOrder(e.target.value)}
            >
              <option value="dueDate_1">Due Date (Asc)</option>
              <option value="dueDate_-1">Due Date (Desc)</option>
              <option value="priority_1">Priority (Asc)</option>
              <option value="priority_-1">Priority (Desc)</option>
            </select>
          </div>
        </div>

        {/* --- SKIP --- */}
        <div className="admin-query-section">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={adminApplySkip}
              onChange={(e) => setAdminApplySkip(e.target.checked)}
            />
            Apply Skip
          </label>
          <div className="admin-controls" disabled={!adminApplySkip}>
            <input
              type="number"
              className="form-input"
              value={adminSkip}
              onChange={(e) => setAdminSkip(Number(e.target.value))}
              min="0"
            />
          </div>
        </div>

        {/* --- LIMIT --- */}
        <div className="admin-query-section">
          <label className="admin-checkbox-label">
            <input
              type="checkbox"
              checked={adminApplyLimit}
              onChange={(e) => setAdminApplyLimit(e.target.checked)}
            />
            Apply Limit
          </label>
          <div className="admin-controls" disabled={!adminApplyLimit}>
            <input
              type="number"
              className="form-input"
              value={adminLimit}
              onChange={(e) => setAdminLimit(Number(e.target.value))}
              min="1"
            />
          </div>
        </div>

      </div>
      <button 
        className="admin-btn primary" 
        onClick={onRunQuery}
        onFocus={() => setPreviewMode('query')}
      >
        Log Query Command
      </button>
    </div>
  );
}

export default AdminPanel;