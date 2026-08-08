import React, { useState } from 'react';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';

export default function AttachmentManager({ step, onSaveAttachment, onRemoveAttachment }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('file'); // 'file' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [fileNameInput, setFileNameInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [previewBase64, setPreviewBase64] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const attachment = step?.attachment;

  const handleOpenModal = () => {
    setErrorMsg('');
    if (attachment) {
      setNotesInput(attachment.notes || '');
      if (attachment.type === 'url') {
        setActiveTab('url');
        setUrlInput(attachment.url || '');
        setFileNameInput(attachment.name || '');
      } else {
        setActiveTab('file');
        setFileNameInput(attachment.name || '');
        setPreviewBase64(attachment.url || null);
      }
    } else {
      setUrlInput('');
      setFileNameInput('');
      setNotesInput('');
      setPreviewBase64(null);
      setActiveTab('file');
    }
    setIsModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (max 3MB for Base64 local storage demo)
    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('File size exceeds 3MB limit for browser storage. Please upload a smaller file or use a web link.');
      return;
    }
    setErrorMsg('');
    setFileNameInput(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewBase64(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setErrorMsg('');

    if (activeTab === 'file') {
      if (!previewBase64 && !attachment?.url) {
        setErrorMsg('Please select an image or document file to attach.');
        return;
      }
      const newAtt = {
        id: 'att-' + Date.now(),
        name: fileNameInput || 'Supporting_Evidence.png',
        type: 'image',
        url: previewBase64 || attachment?.url,
        uploadedAt: new Date().toISOString(),
        notes: notesInput
      };
      onSaveAttachment(step.id, newAtt);
    } else {
      if (!urlInput.trim()) {
        setErrorMsg('Please enter a valid URL link (e.g. GitHub repo, Certificate link, Google Doc).');
        return;
      }
      const newAtt = {
        id: 'att-' + Date.now(),
        name: fileNameInput.trim() || urlInput.trim().replace(/^https?:\/\//, '').split('/')[0] + ' Link',
        type: 'url',
        url: urlInput.trim().startsWith('http') ? urlInput.trim() : `https://${urlInput.trim()}`,
        uploadedAt: new Date().toISOString(),
        notes: notesInput
      };
      onSaveAttachment(step.id, newAtt);
    }

    setIsModalOpen(false);
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove this attached evidence?')) {
      onRemoveAttachment(step.id);
      setIsModalOpen(false);
    }
  };

  return (
    <div className="attachment-manager-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📎</span>
          <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
            Evidence & Supporting Attachment
          </strong>
        </div>
        <button
          onClick={handleOpenModal}
          style={{
            background: 'var(--primary-soft)',
            border: '1px solid var(--border-brand)',
            color: 'var(--text-brand)',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
        >
          {attachment ? '✏️ Edit / Replace' : '➕ Attach File / Link'}
        </button>
      </div>

      {attachment ? (
        <div className="attachment-preview-box">
          {attachment.type === 'image' && attachment.url && (
            <div style={{ position: 'relative', width: '100%', height: '110px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', border: '1px solid var(--border)' }}>
              <img
                src={attachment.url}
                alt={attachment.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <span className="badge badge-success" style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '10px' }}>
                Image Evidence
              </span>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
              <span style={{ fontSize: '18px' }}>{attachment.type === 'url' ? '🔗' : '🖼️'}</span>
              <div style={{ overflow: 'hidden' }}>
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: 'var(--primary-light)',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    textDecoration: 'none',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={attachment.name}
                >
                  {attachment.name} ↗
                </a>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px', display: 'block' }}>
                  {attachment.uploadedAt ? `Uploaded ${new Date(attachment.uploadedAt).toLocaleDateString()}` : 'Attached'}
                </span>
              </div>
            </div>

            <button
              onClick={handleRemove}
              title="Detach file"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              Remove
            </button>
          </div>

          {attachment.notes && (
            <p style={{ margin: '8px 0 0 0', fontSize: '11.5px', color: 'var(--text-secondary)', fontStyle: 'italic', background: 'var(--bg-surface-3)', padding: '6px 10px', borderRadius: '6px' }}>
              "{attachment.notes}"
            </p>
          )}
        </div>
      ) : (
        <div
          onClick={handleOpenModal}
          style={{
            border: '1px dashed var(--border-strong)',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center',
            background: 'var(--bg-surface-2)',
            cursor: 'pointer',
            transition: 'all 200ms ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-strong)'}
        >
          <span style={{ fontSize: '22px', display: 'block', marginBottom: '4px' }}>📁</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>
            No evidence attached yet. Click to upload certificate, screenshot, or project URL.
          </span>
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={`Attach Evidence · Step ${step?.stepNum}`}
        maxWidth="520px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <button
              onClick={() => setActiveTab('file')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: activeTab === 'file' ? '1px solid var(--border-brand)' : '1px solid transparent',
                background: activeTab === 'file' ? 'var(--primary-soft)' : 'transparent',
                color: activeTab === 'file' ? 'var(--text-brand)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🖼️ Upload File / Image
            </button>
            <button
              onClick={() => setActiveTab('url')}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: activeTab === 'url' ? '1px solid var(--border-brand)' : '1px solid transparent',
                background: activeTab === 'url' ? 'var(--primary-soft)' : 'transparent',
                color: activeTab === 'url' ? 'var(--text-brand)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              🔗 Link Web URL / GitHub
            </button>
          </div>

          {errorMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px' }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {activeTab === 'file' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Choose Image / Document File (PNG, JPG, PDF max 3MB):
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: '8px',
                  padding: '8px',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />

              {previewBase64 && (
                <div style={{ height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={previewBase64} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Resource / Project Web URL:
                </label>
                <input
                  type="text"
                  placeholder="https://github.com/username/project-repo"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Custom Display Title (optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. GitHub Practice Repository"
                  value={fileNameInput}
                  onChange={(e) => setFileNameInput(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-strong)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Notes / Key Achievements (optional):
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Completed all async JS challenges with 100% test coverage."
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-strong)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: 'var(--text-primary)',
                fontSize: '12.5px',
                resize: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="glow" size="sm" onClick={handleSave}>
              Save Attachment
            </Button>
          </div>

        </div>
      </Modal>
    </div>
  );
}
