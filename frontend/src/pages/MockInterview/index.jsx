import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import VoiceRecorder from './components/VoiceRecorder';
import { aiInterviewService } from '../../services/aiInterviewService';
import { speechService } from '../../services/speechService';
import { careerPlanStorage } from '../../services/careerPlanStorage';
import {
  evaluateFinalInterviewReport,
  getInterviewHistory,
  saveInterviewToHistory
} from '../../utils/interviewScoring';

export default function MockInterview() {
  const [viewState, setViewState] = useState('SETUP'); // 'SETUP' | 'SESSION' | 'REPORT'
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Setup Form Parameters
  const [role, setRole] = useState('Full Stack Developer');
  const [type, setType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [questionCount, setQuestionCount] = useState(5);
  const [responseMode, setResponseMode] = useState('Voice + Text'); // 'Text' | 'Voice' | 'Voice + Text'
  const [style, setStyle] = useState('Professional'); // 'Professional' | 'Friendly' | 'Challenging'

  // Session State
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswerText, setUserAnswerText] = useState('');
  const [speechMetrics, setSpeechMetrics] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // History State
  const [history, setHistory] = useState([]);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [finalReport, setFinalReport] = useState(null);

  useEffect(() => {
    const demo = careerPlanStorage.isDemoActive();
    setIsDemoMode(demo);
    setHistory(getInterviewHistory(demo));
  }, []);

  // Timer counter during active session
  useEffect(() => {
    let interval = null;
    if (viewState === 'SESSION' && !currentEvaluation) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [viewState, currentEvaluation]);

  // Start Session
  const handleStartSession = async () => {
    setLoading(true);
    try {
      const qList = await aiInterviewService.generateQuestions({
        role,
        type,
        difficulty,
        questionCount,
        isDemoMode
      });
      setQuestions(qList);
      setCurrentIndex(0);
      setAnswers([]);
      setUserAnswerText('');
      setSpeechMetrics(null);
      setCurrentEvaluation(null);
      setTimerSeconds(0);
      setViewState('SESSION');
    } catch (err) {
      console.error('Failed to initialize mock session', err);
      alert('Failed to initialize session. Please check parameters.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Answer
  const handleSubmitAnswer = async () => {
    if (!userAnswerText.trim()) return;

    setLoading(true);
    try {
      const q = questions[currentIndex];
      const evalResult = await aiInterviewService.evaluateAnswer({
        question: q,
        userAnswerText,
        speechMetrics,
        interviewerStyle: style
      });

      setCurrentEvaluation(evalResult);

      const answerObj = {
        questionIndex: currentIndex,
        question: q,
        userAnswer: userAnswerText,
        speechMetrics,
        evaluation: evalResult
      };

      setAnswers(prev => [...prev, answerObj]);
    } catch (e) {
      console.error('Failed to evaluate answer', e);
      alert('Evaluation failed. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Next Question / Complete Session
  const handleNextQuestion = () => {
    setCurrentEvaluation(null);
    setUserAnswerText('');
    setSpeechMetrics(null);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Session Complete -> Generate Final Report
      const sessionData = {
        role,
        type,
        difficulty,
        questions,
        answers: [...answers]
      };
      const report = evaluateFinalInterviewReport(sessionData);
      setFinalReport(report);
      setViewState('REPORT');

      if (!isDemoMode) {
        saveInterviewToHistory(sessionData, report);
        setHistory(getInterviewHistory(false));
      }
    }
  };

  // Format timer MM:SS
  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQ = questions[currentIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', padding: '10px 0' }}>
      
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ color: 'var(--primary-light)', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ✦ AI Career Copilot
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0 0' }}>
              AI Mock Interview Simulator (Voice + Text)
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: '4px 0 0 0' }}>
              Practice technical & behavioral questions with real-time speech evaluation, WPM pacing analytics, and personalized topic feedback.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {viewState !== 'SETUP' && (
              <Button variant="ghost" size="sm" onClick={() => setViewState('SETUP')}>
                ⚙️ Setup New Session
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────
         VIEW 1: SETUP SCREEN
         ────────────────────────────────────────────────────────── */}
      {viewState === 'SETUP' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          <Card title="🎯 Setup Mock Session Parameters" subtitle="Configure domain role, question count, and response format.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              
              <div>
                <label style={s.label}>Target Job Role</label>
                <select style={s.select} value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="AI/ML Engineer">AI/ML Engineer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="DevOps Engineer">DevOps Engineer</option>
                </select>
              </div>

              <div>
                <label style={s.label}>Interview Round Type</label>
                <select style={s.select} value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="Technical">Technical Domain</option>
                  <option value="Behavioral">Behavioral (STAR Method)</option>
                  <option value="System Design">System Design Architecture</option>
                  <option value="HR">HR & Cultural Fit</option>
                </select>
              </div>

              <div>
                <label style={s.label}>Difficulty Level</label>
                <select style={s.select} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  <option value="Beginner">Beginner (Foundational)</option>
                  <option value="Intermediate">Intermediate (Standard)</option>
                  <option value="Advanced">Advanced (Senior / Staff)</option>
                </select>
              </div>

              <div>
                <label style={s.label}>Response Mode</label>
                <select style={s.select} value={responseMode} onChange={(e) => setResponseMode(e.target.value)}>
                  <option value="Voice + Text">🎙️ Voice + Text (Recommended)</option>
                  <option value="Text">💬 Text Only</option>
                  <option value="Voice">🎤 Voice Only</option>
                </select>
              </div>

              <div>
                <label style={s.label}>Interviewer Style</label>
                <select style={s.select} value={style} onChange={(e) => setStyle(e.target.value)}>
                  <option value="Professional">Professional (Standard corporate tone)</option>
                  <option value="Friendly">Friendly & Encouraging</option>
                  <option value="Challenging">Challenging (Pushes edge cases & trade-offs)</option>
                </select>
              </div>

              <div>
                <label style={s.label}>Question Count</label>
                <select style={s.select} value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value))}>
                  <option value={3}>3 Questions (Quick Practice)</option>
                  <option value={5}>5 Questions (Standard)</option>
                  <option value={10}>10 Questions (Full Mock)</option>
                </select>
              </div>

              <Button
                variant="glow"
                size="md"
                onClick={handleStartSession}
                disabled={loading}
                style={{ marginTop: '10px' }}
              >
                {loading ? 'Initializing AI Agent...' : '🚀 Start AI Mock Interview'}
              </Button>

            </div>
          </Card>

          {/* History Dashboard */}
          <Card title="📜 Interview Session History" subtitle="Previous mock practice scores and readiness badges.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No previous mock sessions recorded yet. Complete a session to track historical readiness.
                </div>
              ) : (
                history.map((item, i) => (
                  <div
                    key={item.id || i}
                    style={{
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block' }}>
                        {item.role} · {item.type}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {item.date} · {item.totalQuestions} Questions
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: item.overallPercentage >= 80 ? '#4ade80' : item.overallPercentage >= 60 ? '#fef08a' : '#f87171', display: 'block' }}>
                        {item.overallPercentage}%
                      </span>
                      <span className="badge badge-muted" style={{ fontSize: '9px' }}>
                        {item.readinessBadge}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         VIEW 2: LIVE INTERVIEW SESSION
         ────────────────────────────────────────────────────────── */}
      {viewState === 'SESSION' && currentQ && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Top Progress & Timer Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-2)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="badge badge-primary">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Category: <strong style={{ color: 'var(--text-primary)' }}>{currentQ.category}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                ⏱ Timer: {formatTimer(timerSeconds)}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setViewState('SETUP')}>
                End Interview
              </Button>
            </div>
          </div>

          {/* Question Card */}
          <Card title={`Question ${currentIndex + 1}`} subtitle={`${role} · ${difficulty} Level`}>
            <h3 style={{ margin: '10px 0 0 0', fontSize: '16px', color: 'var(--text-primary)', lineHeight: '1.5', fontWeight: 700 }}>
              "{currentQ.question}"
            </h3>
          </Card>

          {/* Response Controls (Text or Voice) */}
          {!currentEvaluation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Voice Recorder Component if Voice Mode active */}
              {responseMode !== 'Text' && (
                <VoiceRecorder
                  onTranscriptChange={(txt) => setUserAnswerText(txt)}
                  onSpeechMetricsReady={(m) => setSpeechMetrics(m)}
                  disabled={loading}
                />
              )}

              {/* Textarea for Text response */}
              {responseMode !== 'Voice' && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px', fontWeight: 700 }}>
                    💬 Type Your Technical Answer:
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Structure your answer clearly. Include technical terminology, trade-offs, and production considerations."
                    value={userAnswerText}
                    onChange={(e) => setUserAnswerText(e.target.value)}
                    disabled={loading}
                    style={s.textarea}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <Button
                  variant="glow"
                  size="md"
                  onClick={handleSubmitAnswer}
                  disabled={loading || !userAnswerText.trim()}
                >
                  {loading ? 'Evaluating Answer with AI...' : 'Submit Answer for Evaluation 🎯'}
                </Button>
              </div>

            </div>
          ) : (
            /* REAL-TIME AI EVALUATION PANEL */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-surface-2)', border: '1px solid var(--border-brand)', borderRadius: '14px', padding: '20px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🤖</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)' }}>
                      AI Real-Time Evaluation
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Interviewer Style: {style}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '24px', fontWeight: 900, color: currentEvaluation.overallScore >= 7.5 ? '#4ade80' : '#fef08a' }}>
                    {currentEvaluation.overallScore} / 10
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Overall Answer Score</span>
                </div>
              </div>

              {/* Subscores Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <div style={s.subscoreBox}>Relevance: <strong>{currentEvaluation.subscores?.relevance}/10</strong></div>
                <div style={s.subscoreBox}>Correctness: <strong>{currentEvaluation.subscores?.correctness}/10</strong></div>
                <div style={s.subscoreBox}>Depth: <strong>{currentEvaluation.subscores?.depth}/10</strong></div>
                <div style={s.subscoreBox}>Clarity: <strong>{currentEvaluation.subscores?.clarity}/10</strong></div>
              </div>

              {/* Strengths & Improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '12px', borderRadius: '8px' }}>
                  <strong style={{ color: '#4ade80', fontSize: '12px', display: 'block', marginBottom: '4px' }}>✓ Key Strengths:</strong>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {currentEvaluation.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                  </ul>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '12px', borderRadius: '8px' }}>
                  <strong style={{ color: '#f87171', fontSize: '12px', display: 'block', marginBottom: '4px' }}>⚠️ Suggested Improvements:</strong>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {currentEvaluation.improvements.map((imp, idx) => <li key={idx}>{imp}</li>)}
                  </ul>
                </div>
              </div>

              {/* Model Answer Box */}
              <div style={{ background: 'var(--bg-surface-3)', border: '1px solid var(--border)', padding: '12px 14px', borderRadius: '8px' }}>
                <strong style={{ fontSize: '12px', color: 'var(--primary-light)', display: 'block', marginBottom: '4px' }}>
                  💡 Ideal Model Answer:
                </strong>
                <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  "{currentEvaluation.idealAnswer}"
                </p>
              </div>

              {/* Follow-up Question if triggered */}
              {currentEvaluation.followupQuestion && (
                <div style={{ background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '12px 14px', borderRadius: '8px' }}>
                  <strong style={{ fontSize: '12px', color: '#c4b5fd', display: 'block', marginBottom: '4px' }}>
                    ❓ AI Follow-Up Question:
                  </strong>
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                    "{currentEvaluation.followupQuestion}"
                  </p>
                </div>
              )}

              {/* Next Question Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <Button variant="glow" size="md" onClick={handleNextQuestion}>
                  {currentIndex < questions.length - 1 ? 'Next Question ➔' : 'Complete Interview & View Final Report 🏆'}
                </Button>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ──────────────────────────────────────────────────────────
         VIEW 3: FINAL REPORT SCREEN
         ────────────────────────────────────────────────────────── */}
      {viewState === 'REPORT' && finalReport && (
        <Card title="🏆 Final AI Mock Interview Report" subtitle={`Session Performance Summary · ${role}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            
            {/* Header Score Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              <div style={s.reportStatBox}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--primary-light)', display: 'block' }}>
                  {finalReport.overallPercentage}%
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overall Performance</span>
              </div>

              <div style={s.reportStatBox}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: 'var(--success)', display: 'block' }}>
                  {finalReport.technicalScore}%
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Technical Depth</span>
              </div>

              <div style={s.reportStatBox}>
                <span style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b', display: 'block' }}>
                  {finalReport.communicationScore}%
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Communication</span>
              </div>

              <div style={s.reportStatBox}>
                <span className={`badge ${finalReport.overallPercentage >= 80 ? 'badge-success' : 'badge-warning'}`} style={{ margin: '6px auto', display: 'inline-block' }}>
                  {finalReport.readinessBadge}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Readiness Level</span>
              </div>
            </div>

            {/* Strong & Weak Areas */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <strong style={{ color: '#4ade80', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                  ✓ Strong Topic Mastery:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {finalReport.strongAreas.map((area, idx) => <li key={idx}>{area}</li>)}
                </ul>
              </div>

              <div style={{ background: 'var(--bg-surface-2)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border)' }}>
                <strong style={{ color: '#f87171', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                  ⚠️ Identified Weak Areas & Gaps:
                </strong>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  {finalReport.weakAreas.map((area, idx) => <li key={idx}>{area}</li>)}
                </ul>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <Button variant="ghost" size="sm" onClick={() => setViewState('SETUP')}>
                ↩️ Back to Setup
              </Button>
              <Button variant="glow" size="sm" onClick={() => setViewState('SETUP')}>
                Start Another Session 🚀
              </Button>
            </div>

          </div>
        </Card>
      )}

    </div>
  );
}

const s = {
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px'
  },
  select: {
    width: '100%',
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    padding: '12px 14px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  subscoreBox: {
    background: 'var(--bg-surface-3)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '8px',
    textAlign: 'center',
    fontSize: '11.5px',
    color: 'var(--text-muted)'
  },
  reportStatBox: {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '14px',
    textAlign: 'center'
  }
};
