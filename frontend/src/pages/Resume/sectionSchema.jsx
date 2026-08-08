

import React, { useRef, useState } from 'react';


function EntryCard({
  entry, schema, index,
  onChange, onDelete, onDuplicate,
  onDragStart, onDragOver, onDrop, onDragEnd,
  isDragging, isDragOver,
  startOpen,
}) {
  const [editing, setEditing] = useState(!!startOpen);

  const setField = (key, val) => onChange({ ...entry, [key]: val });

  const title = schema.cardTitle(entry);
  const sub   = schema.cardSub(entry);
  const isEmpty = !title || title === schema.cardTitle(schema.defaultEntry);

  return (
    <div
      className={[
        'rs-card',
        isDragging  ? 'rs-card--dragging'  : '',
        isDragOver  ? 'rs-card--dragover'  : '',
        editing     ? 'rs-card--editing'   : '',
      ].join(' ')}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
   
      <div className="rs-card__header">
        <span
          className="rs-card__handle"
          title="Drag to reorder"
          onMouseDown={e => e.stopPropagation()}
        >
          ⠿
        </span>

 
        <div
          className="rs-card__meta"
          onClick={() => setEditing(v => !v)}
          style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
        >
          <span className={`rs-card__title${isEmpty ? ' rs-card__title--empty' : ''}`}>
            {title}
          </span>
          {sub && !editing && (
            <span className="rs-card__sub">{sub}</span>
          )}
        </div>

      
        <div className="rs-card__actions">
          <button
            type="button"
            className="rs-card__act"
            onClick={() => setEditing(v => !v)}
            title={editing ? 'Collapse' : 'Edit'}
            aria-label={editing ? 'Collapse card' : 'Edit card'}
          >
            {editing ? '▲' : '✎'}
          </button>
          <button
            type="button"
            className="rs-card__act rs-card__act--dup"
            onClick={onDuplicate}
            title="Duplicate"
            aria-label="Duplicate card"
          >
            ⧉
          </button>
          <button
            type="button"
            className="rs-card__act rs-card__act--del"
            onClick={onDelete}
            title="Delete"
            aria-label="Delete card"
          >
            ✕
          </button>
        </div>
      </div>

 
      {editing && (
        <div className="rs-card__form">
          {schema.fields.map(f => (
            <div
              key={f.key}
              className={f.span === 'full' ? 'rs-card__form-full' : 'rs-card__form-half'}
            >
              <label className="resume-label">
                {f.label}
                {f.optional && <span className="rs-hint"> optional</span>}
              </label>

              {f.type === 'textarea' ? (
                <textarea
                  className="resume-input resume-textarea resume-textarea--short"
                  placeholder={f.placeholder || ''}
                  value={entry[f.key] || ''}
                  onChange={e => setField(f.key, e.target.value)}
                  rows={3}
                />
              ) : (
                <input
                  className="resume-input"
                  type={f.type === 'url' ? 'url' : 'text'}
                  placeholder={f.placeholder || ''}
                  value={entry[f.key] || ''}
                  onChange={e => setField(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


export function RepeatingSection({ schema, entries, onChange }) {
  const [open, setOpen]           = useState(true);
  const [newIdx, setNewIdx]       = useState(null);  
  const dragIdx                   = useRef(null);
  const [draggingIdx, setDragging] = useState(null);
  const [dragOverIdx, setDragOver] = useState(null);


  const addEntry = () => {
    const entry = { ...schema.defaultEntry, _id: Date.now() };
    const next  = [...entries, entry];
    onChange(next);
    setNewIdx(next.length - 1);   
    setOpen(true);
  };

  const updateEntry = (idx, updated) => {
    const next = [...entries];
    next[idx]  = updated;
    onChange(next);
  };

  const deleteEntry = (idx) => {
    onChange(entries.filter((_, i) => i !== idx));
    if (newIdx === idx) setNewIdx(null);
  };

  const duplicateEntry = (idx) => {
    const next = [...entries];
    const copy = { ...next[idx], _id: Date.now() };
    next.splice(idx + 1, 0, copy);
    onChange(next);
  };

 
  const handleDragStart = (idx) => {
    dragIdx.current = idx;
    setDragging(idx);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (dragIdx.current !== idx) setDragOver(idx);
  };

  const handleDrop = (idx) => {
    const from = dragIdx.current;
    if (from === null || from === idx) return;
    const next = [...entries];
    const [moved] = next.splice(from, 1);
    next.splice(idx, 0, moved);
    onChange(next);
    setDragging(null);
    setDragOver(null);
    dragIdx.current = null;
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOver(null);
    dragIdx.current = null;
  };

  return (
    <div className="rs-section">
      
      <button
        type="button"
        className={`rs-section__head ${open ? 'rs-section__head--open' : ''}`}
        onClick={() => setOpen(v => !v)}
      >
        <span className="rs-section__icon" aria-hidden="true">{schema.icon}</span>
        <span className="rs-section__label">{schema.label}</span>
        {entries.length > 0 && (
          <span className="rs-section__badge">{entries.length}</span>
        )}
        <span className="rs-section__arrow" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>

     
      {open && (
        <div className="rs-section__body">
          {entries.length === 0 ? (
            <p className="rs-section__empty">
              No entries yet — click below to add your first {schema.label.toLowerCase()} entry.
            </p>
          ) : (
            <div className="rs-section__cards">
              {entries.map((entry, idx) => (
                <EntryCard
                  key={entry._id ?? idx}
                  entry={entry}
                  schema={schema}
                  index={idx}
                  startOpen={idx === newIdx}
                  onChange={updated => updateEntry(idx, updated)}
                  onDelete={() => deleteEntry(idx)}
                  onDuplicate={() => duplicateEntry(idx)}
                  onDragStart={() => handleDragStart(idx)}
                  onDragOver={e => handleDragOver(e, idx)}
                  onDrop={() => handleDrop(idx)}
                  onDragEnd={handleDragEnd}
                  isDragging={draggingIdx === idx}
                  isDragOver={dragOverIdx === idx && draggingIdx !== idx}
                />
              ))}
            </div>
          )}

          <button type="button" className="rs-section__add" onClick={addEntry}>
            ＋ Add {schema.label}
          </button>
        </div>
      )}
    </div>
  );
}
