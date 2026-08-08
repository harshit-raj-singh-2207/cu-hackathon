import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { codingService } from '../../services/codingService';

/* ─── Constants ───────────────────────────────────────────── */
const DIFFICULTIES = ['ALL', 'EASY', 'MEDIUM', 'HARD'];
const LANGUAGES = ['javascript', 'python', 'cpp', 'java'];
const LANG_LABELS = { javascript: 'JS', python: 'PY', cpp: 'C++', java: 'Java' };
const DIFF_COLOR = { EASY: '#22c55e', MEDIUM: '#f59e0b', HARD: '#ef4444', Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' };

const STARTER = {
  javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Write your solution here\n  \n}`,
  python: `class Solution:\n    def twoSum(self, nums, target):\n        # Write your solution here\n        pass`,
  cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your solution here\n        \n    }\n};`,
  java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{};\n    }\n}`,
};

/* ─── Main Component ─────────────────────────────────────── */
export default function Coding() {
  // Problem list state
  const [problems, setProblems] = useState([]);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('ALL');

  // Selected problem state
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [activeTab, setActiveTab] = useState('description'); // description | examples | editorial

  // Editor state
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(STARTER.javascript);
  const [editorReady, setEditorReady] = useState(false);

  // Run / Submit state
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [resultTab, setResultTab] = useState('output'); // output | testcases

  // AI Coach state
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachMessages, setCoachMessages] = useState([
    { sender: 'ai', text: '👋 Hi! I\'m your AI Coach. Ask me for hints, explanations, or optimizations!' }
  ]);
  const [coachInput, setCoachInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const coachBottomRef = useRef(null);

  // Panel sizes
  const [leftWidth, setLeftWidth] = useState(30); // %

  /* ─── Load Problems ──────────────────────────────────────── */
  const fetchProblems = useCallback(async () => {
    setLoadingProblems(true);
    try {
      const data = await codingService.getProblems({ search, difficulty });
      const list = data.problems || data.data || [];
      setProblems(list);
      if (!selectedProblem && list.length > 0) {
        selectProblem(list[0]);
      }
    } catch (e) {
      console.error('Failed to load problems:', e);
    } finally {
      setLoadingProblems(false);
    }
  }, [search, difficulty]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  useEffect(() => {
    coachBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachMessages]);

  /* ─── Select Problem ────────────────────────────────────── */
  const selectProblem = (p) => {
    setSelectedProblem(p);
    setResult(null);
    setActiveTab('description');
    const starter = p.starterCode?.[language] || STARTER[language];
    setCode(starter);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    const starter = selectedProblem?.starterCode?.[lang] || STARTER[lang];
    setCode(starter);
  };

  /* ─── Run Code ──────────────────────────────────────────── */
  const handleRun = async () => {
    if (!code.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await codingService.runCode({
        source_code: code,
        language,
        problem_id: selectedProblem?._id || selectedProblem?.id,
        input: selectedProblem?.examples?.[0]?.input || '',
      });
      setResult({ ...res, type: 'run' });
      setResultTab('output');
    } catch (e) {
      setResult({ success: false, error: e.message, type: 'run' });
    } finally {
      setRunning(false);
    }
  };

  /* ─── Submit Code ───────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await codingService.submitCode({
        source_code: code,
        language,
        problem_id: selectedProblem?._id || selectedProblem?.id,
      });
      setResult({ ...res, type: 'submit' });
      setResultTab('output');
    } catch (e) {
      setResult({ success: false, error: e.message, type: 'submit' });
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── AI Coach ──────────────────────────────────────────── */
  const sendCoachMessage = async (action = null, text = null) => {
    const userText = text || coachInput.trim();
    if (!userText && !action) return;
    const userMsg = { sender: 'user', text: action ? `/${action}` : userText };
    setCoachMessages(prev => [...prev, userMsg]);
    setCoachInput('');
    setCoachLoading(true);
    try {
      const res = await codingService.askCoach({
        action,
        query: userText,
        problemTitle: selectedProblem?.title,
        problemDescription: selectedProblem?.description,
        userCode: code,
        history: coachMessages,
      });
      setCoachMessages(prev => [...prev, { sender: 'ai', text: res.reply || res.advice || '⚠️ No response.' }]);
    } catch (e) {
      setCoachMessages(prev => [...prev, { sender: 'ai', text: `❌ Error: ${e.message}` }]);
    } finally {
      setCoachLoading(false);
    }
  };

  /* ─── Render ─────────────────────────────────────────────── */
  return (
    <div style={S.root}>

      {/* ── Left: Problem List ── */}
      <div style={{ ...S.panel, width: `${leftWidth}%`, minWidth: 220, maxWidth: 380, borderRight: '1px solid #1e2538' }}>
        <div style={S.panelHeader}>
          <span style={S.panelTitle}>🧩 Problems</span>
          <span style={{ color: '#64748b', fontSize: 11 }}>{problems.length} problems</span>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #1e2538' }}>
          <input
            style={S.searchInput}
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                style={{
                  ...S.filterBtn,
                  background: difficulty === d ? '#6366f1' : '#1e2538',
                  color: difficulty === d ? '#fff' : '#94a3b8',
                }}
              >{d}</button>
            ))}
          </div>
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loadingProblems ? (
            <div style={S.centerMsg}>
              <div style={S.spinner} />
              <span>Loading problems...</span>
            </div>
          ) : problems.length === 0 ? (
            <div style={S.centerMsg}>No problems found</div>
          ) : (
            problems.map((p, i) => (
              <div
                key={p._id || p.id || i}
                onClick={() => selectProblem(p)}
                style={{
                  ...S.problemRow,
                  background: selectedProblem?._id === p._id ? '#1e2a45' : 'transparent',
                  borderLeft: selectedProblem?._id === p._id ? '3px solid #6366f1' : '3px solid transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#475569', fontSize: 11, minWidth: 24 }}>#{i + 1}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500, lineHeight: 1.3 }}>
                    {p.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, paddingLeft: 32 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: DIFF_COLOR[p.difficulty] || '#94a3b8',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>{p.difficulty}</span>
                  {p.category && (
                    <span style={{ fontSize: 10, color: '#475569', background: '#1e2538', padding: '1px 6px', borderRadius: 4 }}>
                      {p.category}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Center: Problem Detail + Editor ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Problem Header */}
        {selectedProblem && (
          <div style={S.problemHeader}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h2 style={S.problemTitle}>{selectedProblem.title}</h2>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: DIFF_COLOR[selectedProblem.difficulty] || '#94a3b8',
                  background: `${DIFF_COLOR[selectedProblem.difficulty] || '#94a3b8'}18`,
                  padding: '2px 8px', borderRadius: 20,
                }}>{selectedProblem.difficulty}</span>
              </div>
              {/* Tabs */}
              <div style={{ display: 'flex', gap: 0, marginTop: 6 }}>
                {['description', 'examples'].map(t => (
                  <button key={t} onClick={() => setActiveTab(t)} style={{
                    ...S.tab, borderBottom: activeTab === t ? '2px solid #6366f1' : '2px solid transparent',
                    color: activeTab === t ? '#6366f1' : '#64748b',
                  }}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>
                ))}
              </div>
            </div>
            {/* Language Selector */}
            <div style={{ display: 'flex', gap: 4 }}>
              {LANGUAGES.map(l => (
                <button key={l} onClick={() => handleLanguageChange(l)} style={{
                  ...S.langBtn,
                  background: language === l ? '#6366f1' : '#1e2538',
                  color: language === l ? '#fff' : '#94a3b8',
                }}>{LANG_LABELS[l]}</button>
              ))}
            </div>
          </div>
        )}

        {/* Split: Description / Editor */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>

          {/* Problem Description */}
          <div style={{ width: '42%', borderRight: '1px solid #1e2538', overflowY: 'auto', padding: '16px 20px' }}>
            {!selectedProblem ? (
              <div style={S.centerMsg}>← Select a problem to start</div>
            ) : activeTab === 'description' ? (
              <>
                <p style={S.descText}>{selectedProblem.description}</p>
                {selectedProblem.constraints?.length > 0 && (
                  <>
                    <h4 style={S.sectionLabel}>Constraints</h4>
                    <ul style={S.constraintList}>
                      {selectedProblem.constraints.map((c, i) => (
                        <li key={i} style={{ color: '#94a3b8', fontSize: 13, marginBottom: 4, fontFamily: 'monospace' }}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}
                {selectedProblem.examples?.length > 0 && (
                  <>
                    <h4 style={S.sectionLabel}>Examples</h4>
                    {selectedProblem.examples.map((ex, i) => (
                      <div key={i} style={S.exampleBox}>
                        <div style={S.exampleRow}><span style={S.exLabel}>Input:</span><code style={S.exCode}>{ex.input}</code></div>
                        <div style={S.exampleRow}><span style={S.exLabel}>Output:</span><code style={S.exCode}>{ex.output}</code></div>
                        {ex.explanation && <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{ex.explanation}</div>}
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : (
              /* Examples Tab */
              <div>
                {selectedProblem.examples?.map((ex, i) => (
                  <div key={i} style={{ ...S.exampleBox, marginBottom: 12 }}>
                    <div style={{ color: '#6366f1', fontWeight: 700, fontSize: 12, marginBottom: 6 }}>Example {i + 1}</div>
                    <div style={S.exampleRow}><span style={S.exLabel}>Input:</span><code style={S.exCode}>{ex.input}</code></div>
                    <div style={S.exampleRow}><span style={S.exLabel}>Output:</span><code style={S.exCode}>{ex.output}</code></div>
                    {ex.explanation && <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>{ex.explanation}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Code Editor + Result */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

            {/* Editor */}
            <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
              <Editor
                height="100%"
                language={language === 'cpp' ? 'cpp' : language}
                value={code}
                onChange={v => setCode(v || '')}
                theme="vs-dark"
                onMount={() => setEditorReady(true)}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  lineNumbers: 'on',
                  wordWrap: 'on',
                  padding: { top: 12 },
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  fontLigatures: true,
                }}
              />
            </div>

            {/* Action Bar */}
            <div style={S.actionBar}>
              <button
                onClick={() => setCoachOpen(o => !o)}
                style={{ ...S.coachBtn, background: coachOpen ? '#4f46e5' : '#1e2538' }}
              >
                🤖 AI Coach
              </button>
              <div style={{ flex: 1 }} />
              <button onClick={handleRun} disabled={running || submitting} style={S.runBtn}>
                {running ? '⏳ Running...' : '▶ Run Code'}
              </button>
              <button onClick={handleSubmit} disabled={running || submitting} style={S.submitBtn}>
                {submitting ? '⏳ Submitting...' : '🚀 Submit'}
              </button>
            </div>

            {/* Result Panel */}
            {result && (
              <div style={S.resultPanel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{
                    fontWeight: 700, fontSize: 13,
                    color: result.status === 'ACCEPTED' ? '#22c55e' : result.status === 'COMPILE_ERROR' ? '#f59e0b' : '#ef4444',
                    background: result.status === 'ACCEPTED' ? '#22c55e18' : result.status === 'COMPILE_ERROR' ? '#f59e0b18' : '#ef444418',
                    padding: '3px 10px', borderRadius: 20,
                  }}>
                    {result.status === 'ACCEPTED' ? '✅' : '❌'} {result.status || 'DONE'}
                  </span>
                  {result.type === 'submit' && (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>
                      {result.passedTestCases}/{result.totalTestCases} test cases passed
                    </span>
                  )}
                  {result.executionTime && <span style={{ color: '#475569', fontSize: 11 }}>⏱ {result.executionTime}</span>}
                  {result.memoryUsed && <span style={{ color: '#475569', fontSize: 11 }}>💾 {result.memoryUsed}</span>}
                </div>

                {result.stderr ? (
                  <pre style={S.resultCode}><span style={{ color: '#ef4444' }}>{result.stderr}</span></pre>
                ) : result.stdout ? (
                  <pre style={S.resultCode}>{result.stdout}</pre>
                ) : result.message ? (
                  <pre style={S.resultCode}>{result.message}</pre>
                ) : null}

                {result.results?.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {result.results.slice(0, 3).map((tc, i) => (
                      <div key={i} style={{ ...S.tcRow, borderColor: tc.passed ? '#22c55e30' : '#ef444430' }}>
                        <span style={{ color: tc.passed ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 700 }}>
                          {tc.passed ? '✓' : '✗'} Case {i + 1}
                        </span>
                        <span style={{ color: '#64748b', fontSize: 11, marginLeft: 8 }}>
                          Expected: <code style={{ color: '#94a3b8' }}>{tc.expected}</code>
                          &nbsp;·&nbsp;Got: <code style={{ color: tc.passed ? '#22c55e' : '#ef4444' }}>{tc.actual}</code>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: AI Coach Panel ── */}
      {coachOpen && (
        <div style={S.coachPanel}>
          <div style={S.panelHeader}>
            <span style={S.panelTitle}>🤖 AI Coach</span>
            <button onClick={() => setCoachOpen(false)} style={S.closeBtn}>✕</button>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '8px 12px', borderBottom: '1px solid #1e2538' }}>
            {['hint', 'explain', 'optimize', 'complexity'].map(a => (
              <button key={a} onClick={() => sendCoachMessage(a)} style={S.quickBtn}>
                {a === 'hint' ? '💡' : a === 'explain' ? '🧠' : a === 'optimize' ? '⚡' : '📊'} {a}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {coachMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  ...S.bubble,
                  background: msg.sender === 'user' ? '#4f46e5' : '#1e2538',
                  color: msg.sender === 'user' ? '#fff' : '#cbd5e1',
                  maxWidth: '88%',
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: 12.5 }}>
                    {msg.text}
                  </pre>
                </div>
              </div>
            ))}
            {coachLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 12 }}>
                <div style={S.spinner} /> Thinking...
              </div>
            )}
            <div ref={coachBottomRef} />
          </div>

          {/* Input */}
          <div style={S.coachInputRow}>
            <input
              style={S.coachTextInput}
              placeholder="Ask anything..."
              value={coachInput}
              onChange={e => setCoachInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendCoachMessage()}
            />
            <button onClick={() => sendCoachMessage()} style={S.sendBtn}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const S = {
  root: {
    display: 'flex', height: '100%', width: '100%',
    background: '#0b0f19', color: '#e2e8f0',
    fontFamily: "'Inter', system-ui, sans-serif",
    overflow: 'hidden',
  },
  panel: {
    display: 'flex', flexDirection: 'column',
    background: '#0d1117', overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px', borderBottom: '1px solid #1e2538',
    background: '#0d1117',
  },
  panelTitle: { fontSize: 13, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.02em' },
  searchInput: {
    width: '100%', background: '#1e2538', border: '1px solid #2a3448',
    borderRadius: 8, padding: '7px 12px', color: '#e2e8f0', fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  },
  filterBtn: {
    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
    border: 'none', cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase',
  },
  problemRow: {
    padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #1a2035',
    transition: 'background 0.15s',
  },
  problemHeader: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '10px 16px', borderBottom: '1px solid #1e2538',
    background: '#0d1117', gap: 12, flexWrap: 'wrap',
  },
  problemTitle: { margin: 0, fontSize: 15, fontWeight: 700, color: '#f1f5f9' },
  tab: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '4px 12px 6px', fontSize: 12, fontWeight: 600,
    transition: 'color 0.15s', letterSpacing: '0.03em',
  },
  langBtn: {
    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
    border: 'none', cursor: 'pointer', transition: 'all 0.15s',
  },
  descText: { color: '#94a3b8', fontSize: 13.5, lineHeight: 1.7, margin: '0 0 16px 0' },
  sectionLabel: { color: '#6366f1', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '16px 0 8px' },
  constraintList: { paddingLeft: 18, margin: 0 },
  exampleBox: {
    background: '#1a2035', border: '1px solid #1e2a45',
    borderRadius: 8, padding: '10px 14px', marginBottom: 10,
  },
  exampleRow: { display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  exLabel: { color: '#6366f1', fontSize: 12, fontWeight: 700, minWidth: 54 },
  exCode: { color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' },
  actionBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', background: '#0d1117', borderTop: '1px solid #1e2538',
  },
  coachBtn: {
    fontSize: 12, fontWeight: 600, padding: '6px 14px',
    borderRadius: 8, border: 'none', cursor: 'pointer', color: '#e2e8f0',
    transition: 'background 0.2s',
  },
  runBtn: {
    fontSize: 13, fontWeight: 700, padding: '7px 18px',
    borderRadius: 8, border: 'none', cursor: 'pointer',
    background: '#1e2538', color: '#e2e8f0', transition: 'all 0.15s',
  },
  submitBtn: {
    fontSize: 13, fontWeight: 700, padding: '7px 18px',
    borderRadius: 8, border: 'none', cursor: 'pointer',
    background: '#6366f1', color: '#fff', transition: 'all 0.15s',
  },
  resultPanel: {
    background: '#0d1117', borderTop: '1px solid #1e2538',
    padding: '12px 16px', maxHeight: 200, overflowY: 'auto',
  },
  resultCode: {
    background: '#1a2035', borderRadius: 8, padding: '10px 14px',
    fontSize: 12.5, color: '#e2e8f0', margin: 0,
    fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
  },
  tcRow: {
    padding: '5px 10px', borderRadius: 6, border: '1px solid',
    background: '#1a2035', display: 'flex', alignItems: 'center',
  },
  coachPanel: {
    width: 320, display: 'flex', flexDirection: 'column',
    background: '#0d1117', borderLeft: '1px solid #1e2538',
    height: '100%',
  },
  closeBtn: {
    background: 'none', border: 'none', color: '#64748b',
    cursor: 'pointer', fontSize: 14, padding: '2px 6px',
  },
  quickBtn: {
    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 6,
    background: '#1e2538', border: 'none', color: '#94a3b8', cursor: 'pointer',
    textTransform: 'capitalize',
  },
  bubble: {
    padding: '8px 12px', borderRadius: 10,
    maxWidth: '88%',
  },
  coachInputRow: {
    display: 'flex', gap: 6, padding: '10px 12px',
    borderTop: '1px solid #1e2538', background: '#0d1117',
  },
  coachTextInput: {
    flex: 1, background: '#1e2538', border: '1px solid #2a3448',
    borderRadius: 8, padding: '8px 12px', color: '#e2e8f0',
    fontSize: 13, outline: 'none',
  },
  sendBtn: {
    background: '#6366f1', border: 'none', borderRadius: 8,
    color: '#fff', padding: '8px 14px', cursor: 'pointer',
    fontSize: 14, fontWeight: 700,
  },
  centerMsg: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexDirection: 'column', gap: 12, height: '100%', minHeight: 120,
    color: '#475569', fontSize: 13,
  },
  spinner: {
    width: 18, height: 18, border: '2px solid #1e2538',
    borderTop: '2px solid #6366f1', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};

/* ─── Keyframes ─────────────────────────────────────────── */
const style = document.createElement('style');
style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);
