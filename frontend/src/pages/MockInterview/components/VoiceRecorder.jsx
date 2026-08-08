import React, { useState, useEffect } from 'react';
import Button from '../../../components/Button';
import { speechService } from '../../../services/speechService';

export default function VoiceRecorder({
  onTranscriptChange,
  onSpeechMetricsReady,
  disabled = false
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const isSupported = speechService.isSupported();

  useEffect(() => {
    return () => {
      if (isListening) {
        speechService.stopListening();
      }
    };
  }, [isListening]);

  const handleStartRecording = () => {
    setErrorMsg('');
    setTranscript('');
    setMetrics(null);

    try {
      speechService.startListening(
        (newText) => {
          setTranscript(newText);
          if (onTranscriptChange) onTranscriptChange(newText);
        },
        (listeningState) => {
          setIsListening(listeningState);
        }
      );
    } catch (err) {
      setErrorMsg(err.message || 'Microphone access failed. Please use Text mode.');
    }
  };

  const handleStopRecording = () => {
    const finalMetrics = speechService.stopListening();
    setIsListening(false);
    setMetrics(finalMetrics);
    if (onSpeechMetricsReady) {
      onSpeechMetricsReady(finalMetrics);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--bg-surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🎤</span>
          <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>
            Voice Response Input
          </strong>
        </div>

        {isListening && (
          <span className="badge badge-warning" style={{ fontSize: '11px', gap: '6px', animation: 'pulse 1s infinite' }}>
            🔴 Recording Live Speech...
          </span>
        )}
      </div>

      {!isSupported && (
        <div style={{ padding: '8px 12px', background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: '8px', color: '#fef08a', fontSize: '12px' }}>
          ⚠️ Speech Recognition API is not supported in this browser. Please type your answer below.
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', fontSize: '12px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Live Transcript Box */}
      <div>
        <textarea
          rows={3}
          placeholder={isListening ? 'Listening... Speak clearly into your microphone.' : 'Recorded voice transcript will appear here. Or type manually.'}
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            if (onTranscriptChange) onTranscriptChange(e.target.value);
          }}
          disabled={disabled}
          style={{
            width: '100%',
            background: 'var(--bg-surface-3)',
            border: isListening ? '1px solid var(--primary)' : '1px solid var(--border-strong)',
            borderRadius: '8px',
            padding: '10px 12px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            resize: 'none',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Record Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {!isListening ? (
            <Button
              variant="glow"
              size="sm"
              onClick={handleStartRecording}
              disabled={disabled || !isSupported}
            >
              🎙️ Start Recording
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStopRecording}
              style={{ background: '#ef4444', borderColor: '#dc2626' }}
            >
              ⏹ Stop Recording
            </Button>
          )}
        </div>

        {/* Speech Delivery Analytics Badge */}
        {metrics && (
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span className="badge badge-muted">Pace: {metrics.wpm} WPM</span>
            <span className="badge badge-muted">Fillers: {metrics.fillerCount}</span>
            <span className="badge badge-muted">Duration: {metrics.durationSeconds}s</span>
          </div>
        )}
      </div>

    </div>
  );
}
