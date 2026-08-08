import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import {
  createSocialCardCanvas,
  downloadSocialCardImage,
  copySocialCardToClipboard
} from '../../../utils/socialCardGenerator';

export default function SocialProgressCardModal({
  isOpen,
  onClose,
  plans,
  metrics,
  user,
  isDemoMode
}) {
  const [dataUrl, setDataUrl] = useState(null);
  const [copyState, setCopyState] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      try {
        const canvas = createSocialCardCanvas({ plans, metrics, user, isDemoMode });
        setDataUrl(canvas.toDataURL('image/png'));
        setErrorMsg('');
      } catch (e) {
        console.error('Canvas generation error', e);
        setErrorMsg('Failed to render canvas image preview.');
      }
    }
  }, [isOpen, plans, metrics, user, isDemoMode]);

  const handleDownload = () => {
    downloadSocialCardImage({ plans, metrics, user, isDemoMode });
  };

  const handleCopyImage = async () => {
    try {
      await copySocialCardToClipboard({ plans, metrics, user, isDemoMode });
      setCopyState(true);
      setTimeout(() => setCopyState(false), 2500);
    } catch (err) {
      console.warn('Clipboard image error:', err);
      setErrorMsg(err.message || 'Image copying is restricted by your browser. Please click Download PNG.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🖼️ Social Media Progress Card (1200 x 630 px)"
      maxWidth="840px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Info Banner */}
        <div style={{ background: 'var(--bg-surface-2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
          Standard <strong>1200 x 630 px</strong> aspect ratio formatted for LinkedIn, Twitter/X, Discord, and portfolio embeds.
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Live Scaled Preview Container */}
        <div style={{ background: '#090d16', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-brand)', display: 'flex', justifyContent: 'center' }}>
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Social Media Progress Card 1200x630"
              style={{
                width: '100%',
                height: 'auto',
                aspectRatio: '1200 / 630',
                borderRadius: '8px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="roadmap-loading-spinner" />
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Dimensions: <strong>1200 x 630 PNG</strong>
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Button variant="ghost" size="sm" onClick={handleCopyImage}>
              {copyState ? '✓ Image Copied!' : '📋 Copy Image'}
            </Button>

            <Button variant="glow" size="sm" onClick={handleDownload}>
              📥 Download PNG (1200x630)
            </Button>
          </div>
        </div>

      </div>
    </Modal>
  );
}
