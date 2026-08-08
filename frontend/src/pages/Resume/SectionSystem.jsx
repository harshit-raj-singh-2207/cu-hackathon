import React, { useState } from 'react';
import Card from '../../components/Card';
import Button from '../../components/Button';

/**
 * A generic repeating section component that builds a list of items 
 * based on the provided schema definitions.
 */
export function RepeatingSection({ schema, entries, onChange }) {
  const [open, setOpen] = useState(false);

  // Helper to add a new item
  const handleAdd = () => {
    const newItem = { 
      _id: Date.now(), 
      ...schema.defaultEntry 
    };
    onChange([...entries, newItem]);
  };

  // Helper to delete an item
  const handleDelete = (index) => {
    const next = [...entries];
    next.splice(index, 1);
    onChange(next);
  };

  // Helper to update a field inside a specific item
  const handleUpdate = (index, fieldKey, val) => {
    const next = [...entries];
    next[index] = {
      ...next[index],
      [fieldKey]: val
    };
    onChange(next);
  };

  return (
    <div className={`rb-acc ${open ? 'rb-acc--open' : ''}`}>
      <button type="button" className="rb-acc__head" onClick={() => setOpen(!open)}>
        <span className="rb-acc__label">{schema.icon} {schema.label}</span>
        <span className="rb-acc__arrow">{open ? '▲' : '▼'}</span>
      </button>
      
      {open && (
        <div className="rb-acc__body">
          {entries.map((entry, i) => (
            <Card key={entry._id || i} style={{ marginBottom: '16px', background: 'var(--bg-surface-2)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '12px', right: '12px', display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => handleDelete(i)} style={{ background: 'transparent', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '13px' }}>
                  🗑 Delete
                </button>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                  {schema.cardTitle(entry) || `New ${schema.label} Entry`}
                </strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {schema.cardSub(entry)}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)', gap: '14px' }}>
                {schema.fields.map(f => {
                  const isFull = f.span === 'full';
                  const CommonProps = {
                    value: entry[f.key] || '',
                    onChange: e => handleUpdate(i, f.key, e.target.value),
                    placeholder: f.placeholder || `Enter ${f.label.toLowerCase()}...`,
                    className: 'resume-input',
                    style: { width: '100%', boxSizing: 'border-box' }
                  };
                  
                  return (
                    <div key={f.key} style={{ gridColumn: isFull ? '1 / -1' : 'auto' }}>
                      <label className="resume-label">
                        {f.label} {f.optional && <span className="rb-hint">optional</span>}
                      </label>
                      {f.type === 'textarea' ? (
                        <textarea {...CommonProps} rows={3} style={{ ...CommonProps.style, resize: 'vertical' }} />
                      ) : (
                        <input {...CommonProps} type={f.type === 'url' ? 'url' : 'text'} />
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
          
          <Button variant="outline" size="sm" type="button" onClick={handleAdd}>
            + Add {schema.label}
          </Button>
        </div>
      )}
    </div>
  );
}
