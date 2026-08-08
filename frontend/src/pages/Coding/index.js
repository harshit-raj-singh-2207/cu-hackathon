import React, { useState, useCallback, useEffect } from 'react';
import Button from '../../components/Button';
import '../../styles/coding.css';

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'java', label: 'Java', ext: 'java' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
];

const DIFFICULTY_COLORS = {
  Easy: 'var(--success)',
  Medium: 'var(--warning)',
  Hard: 'var(--error)',
};

const SAMPLE_PROBLEMS = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', category: 'Arrays', acceptance: '49.2%', solved: true },
  { id: 2, title: 'Add Two Numbers', difficulty: 'Medium', category: 'Linked List', acceptance: '40.1%', solved: false },
  { id: 3, title: 'Longest Substring Without Repeating', difficulty: 'Medium', category: 'Strings', acceptance: '33.8%', solved: false },
  { id: 4, title: 'Median of Two Sorted Arrays', difficulty: 'Hard', category: 'Binary Search', acceptance: '35.6%', solved: false },
  { id: 5, title: 'Valid Parentheses', difficulty: 'Easy', category: 'Stack', acceptance: '40.7%', solved: true },
  { id: 6, title: 'Merge Two Sorted Lists', difficulty: 'Easy', category: 'Linked List', acceptance: '61.8%', solved: false },
  { id: 7, title: 'Maximum Subarray', difficulty: 'Medium', category: 'Dynamic Programming', acceptance: '50.1%', solved: false },
  { id: 8, title: 'Container With Most Water', difficulty: 'Medium', category: 'Two Pointers', acceptance: '54.3%', solved: true },
];

const DEFAULT_CODE = {
  javascript: `// Two Sum - JavaScript
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
  python: `# Two Sum - Python
def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
  java: `// Two Sum - Java
class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[]{map.get(complement), i};
            }
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`,
  cpp: `// Two Sum - C++
class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> mp;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (mp.count(complement)) {
                return {mp[complement], i};
            }
            mp[nums[i]] = i;
        }
        return {};
    }
};`,
};

export default function Coding() {
  const [selectedProblem, setSelectedProblem] = useState(SAMPLE_PROBLEMS[0]);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_CODE.javascript);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [filter, setFilter] = useState('All');
  const [showProblemList, setShowProblemList] = useState(true);

  useEffect(() => {
    setCode(DEFAULT_CODE[language] || '');
  }, [language]);

  const handleRun = useCallback(() => {
    setRunning(true);
    setOutput('');
    setTimeout(() => {
      setOutput(`✅ All test cases passed!\n\nTest Case 1: [2,7,11,15], target=9 → [0,1] ✓\nTest Case 2: [3,2,4], target=6 → [1,2] ✓\nTest Case 3: [3,3], target=6 → [0,1] ✓\n\nRuntime: 4ms | Memory: 42.3 MB`);
      setRunning(false);
    }, 1500);
  }, []);

  const filtered = filter === 'All' ? SAMPLE_PROBLEMS : SAMPLE_PROBLEMS.filter(p => p.difficulty === filter);

  return (
    <div style={S.wrap}>
      {/* Left Panel — Problem List */}
      {showProblemList && (
        <aside style={S.sidebar}>
          <div style={S.sidebarHeader}>
            <strong style={{ color: 'var(--text-primary)', fontSize: '16px' }}>🧠 Problems</strong>
            <button style={S.closeBtn} onClick={() => setShowProblemList(false)}>✕</button>
          </div>
          <div style={S.filterRow}>
            {['All', 'Easy', 'Medium', 'Hard'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ ...S.filterBtn, ...(filter === f ? S.filterBtnActive : {}) }}>
                {f}
              </button>
            ))}
          </div>
          <div style={S.problemList}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelectedProblem(p)} style={{ ...S.problemItem, ...(selectedProblem?.id === p.id ? S.problemItemActive : {}) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: p.solved ? 'var(--success)' : 'var(--text-muted)', fontSize: '14px' }}>{p.solved ? '✓' : '○'}</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>{p.id}. {p.title}</span>
                </div>
                <span style={{ color: DIFFICULTY_COLORS[p.difficulty], fontSize: '11px', fontWeight: 600 }}>{p.difficulty}</span>
              </div>
            ))}
          </div>
        </aside>
      )}

      {/* Center — Code Editor */}
      <main style={S.editor}>
        <div style={S.editorToolbar}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {!showProblemList && (
              <button style={S.iconBtn} onClick={() => setShowProblemList(true)} title="Show problems">☰</button>
            )}
            <span style={{ color: '#a5b4fc', fontSize: '14px', fontWeight: 600 }}>
              {selectedProblem?.id}. {selectedProblem?.title}
            </span>
            <span style={{ ...S.diffBadge, color: DIFFICULTY_COLORS[selectedProblem?.difficulty] }}>
              {selectedProblem?.difficulty}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={S.langSelect}>
              {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <Button variant="primary" size="sm" onClick={handleRun} loading={running}>▶ Run Code</Button>
          </div>
        </div>

        <div style={S.editorBody}>
          <div style={S.lineNumbers}>
            {code.split('\n').map((_, i) => <div key={i} style={S.lineNum}>{i + 1}</div>)}
          </div>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            style={S.codeArea}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        {/* Output Panel */}
        <div style={S.outputPanel}>
          <strong style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Console Output</strong>
          <pre style={S.outputPre}>{output || 'Run your code to see output here...'}</pre>
        </div>
      </main>

      {/* Right Panel — Problem Description */}
      <aside style={S.descPanel}>
        <h2 style={{ color: '#f1f5f9', fontSize: '18px', fontWeight: 700, margin: '0 0 4px 0' }}>
          {selectedProblem?.title}
        </h2>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <span style={{ ...S.tag, color: DIFFICULTY_COLORS[selectedProblem?.difficulty] }}>{selectedProblem?.difficulty}</span>
          <span style={S.tag}>{selectedProblem?.category}</span>
          <span style={S.tag}>Acceptance: {selectedProblem?.acceptance}</span>
        </div>
        <p style={S.desc}>
          Given an array of integers <code style={S.code}>nums</code> and an integer <code style={S.code}>target</code>, return indices of the two numbers such that they add up to <code style={S.code}>target</code>.
        </p>
        <p style={S.desc}>
          You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.
        </p>
        <div style={{ marginTop: '16px' }}>
          <strong style={{ color: '#cbd5e1', fontSize: '13px' }}>Example:</strong>
          <pre style={S.examplePre}>{`Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: nums[0] + nums[1] == 9`}</pre>
        </div>
        <div style={{ marginTop: '16px' }}>
          <strong style={{ color: '#cbd5e1', fontSize: '13px' }}>Constraints:</strong>
          <ul style={{ color: '#94a3b8', fontSize: '13px', paddingLeft: '20px', margin: '8px 0 0 0' }}>
            <li>2 ≤ nums.length ≤ 10⁴</li>
            <li>-10⁹ ≤ nums[i] ≤ 10⁹</li>
            <li>Only one valid answer exists.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */
const S = {
  wrap: { display: 'flex', height: '100%', width: '100%', background: '#0b0f19', color: '#e2e8f0', fontFamily: 'var(--font-sans)', overflow: 'hidden' },
  sidebar: { width: '280px', minWidth: '280px', background: '#0f1525', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sidebarHeader: { padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '16px' },
  filterRow: { display: 'flex', gap: '4px', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  filterBtn: { background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '6px', color: '#94a3b8', padding: '4px 10px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' },
  filterBtnActive: { background: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.4)', color: '#a5b4fc' },
  problemList: { flex: 1, overflowY: 'auto', padding: '8px' },
  problemItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', transition: 'all 150ms ease' },
  problemItemActive: { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' },
  editor: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 },
  editorToolbar: { padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  iconBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px', padding: '4px' },
  diffBadge: { fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)' },
  langSelect: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '5px 10px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', outline: 'none' },
  editorBody: { flex: 1, display: 'flex', overflow: 'auto', background: '#0d1117' },
  lineNumbers: { padding: '16px 0', minWidth: '48px', textAlign: 'right', userSelect: 'none' },
  lineNum: { color: '#475569', fontSize: '13px', lineHeight: '1.6', paddingRight: '12px', fontFamily: 'var(--font-mono)' },
  codeArea: { flex: 1, background: 'transparent', color: '#e2e8f0', border: 'none', outline: 'none', resize: 'none', padding: '16px', fontSize: '13px', lineHeight: '1.6', fontFamily: 'var(--font-mono)', tabSize: 2 },
  outputPanel: { height: '140px', background: '#111827', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  outputPre: { margin: 0, color: '#a3e635', fontSize: '12px', fontFamily: 'var(--font-mono)', whiteSpace: 'pre-wrap', overflow: 'auto', flex: 1 },
  descPanel: { width: '320px', minWidth: '320px', background: '#0f1525', borderLeft: '1px solid rgba(255,255,255,0.06)', padding: '20px', overflowY: 'auto' },
  tag: { fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: '#94a3b8' },
  desc: { color: '#cbd5e1', fontSize: '13.5px', lineHeight: 1.7, margin: '0 0 12px 0' },
  code: { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)' },
  examplePre: { background: '#1e293b', color: '#e2e8f0', padding: '12px', borderRadius: '8px', fontSize: '12px', fontFamily: 'var(--font-mono)', margin: '8px 0 0 0', lineHeight: 1.6 },
};
