import React, { useState, useCallback, useEffect } from 'react';
import Card from '../../components/Card';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ color: 'var(--primary-light)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            ✦ Developer Arena
          </span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0 0' }}>
            Coding Challenges
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>
            Practice data structures and algorithms to crack top tech interviews.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={s.input}>
              {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <Button variant="primary" onClick={handleRun} loading={running}>
              ▶ Run Code
            </Button>
        </div>
      </header>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Sidebar */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <Card title="📚 Problem List">
            <div style={s.filterRow}>
              {['All', 'Easy', 'Medium', 'Hard'].map(f => (
                <button 
                  key={f} 
                  onClick={() => setFilter(f)} 
                  style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div style={s.problemList}>
              {filtered.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => setSelectedProblem(p)} 
                  style={{ ...s.problemItem, ...(selectedProblem?.id === p.id ? s.problemItemActive : {}) }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: p.solved ? 'var(--success)' : 'var(--text-muted)', fontSize: '14px' }}>{p.solved ? '✓' : '○'}</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500 }}>{p.id}. {p.title}</span>
                  </div>
                  <span style={{ color: DIFFICULTY_COLORS[p.difficulty], fontSize: '11px', fontWeight: 600 }}>{p.difficulty}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="📖 Problem Description">
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <span style={{ ...s.tag, color: DIFFICULTY_COLORS[selectedProblem?.difficulty] }}>{selectedProblem?.difficulty}</span>
              <span style={s.tag}>{selectedProblem?.category}</span>
              <span style={s.tag}>Acceptance: {selectedProblem?.acceptance}</span>
            </div>
            <p style={s.desc}>
              Given an array of integers <code style={s.code}>nums</code> and an integer <code style={s.code}>target</code>, return indices of the two numbers such that they add up to <code style={s.code}>target</code>.
            </p>
            <p style={s.desc}>
              You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.
            </p>
            <div style={{ marginTop: '16px' }}>
              <strong style={{ color: 'var(--text-primary)', fontSize: '13px' }}>Example:</strong>
              <pre style={s.examplePre}>{`Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]\nExplanation: nums[0] + nums[1] == 9`}</pre>
            </div>
          </Card>

        </section>

        {/* Right Code Editor */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <Card title={`💻 Code Editor - ${selectedProblem?.title}`}>
             <div style={s.editorBody}>
                <div style={s.lineNumbers}>
                  {code.split('\n').map((_, i) => <div key={i} style={s.lineNum}>{i + 1}</div>)}
                </div>
                <textarea
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  style={s.codeArea}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
             </div>
          </Card>

          <Card title="🖥️ Terminal Output">
            <pre style={s.outputPre}>{output || 'Run your code to see output here...'}</pre>
          </Card>

        </section>

      </div>
    </div>
  );
}

/* ─── Inline Styles ─────────────────────────────────────── */
const s = {
  input: {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    borderRadius: '8px',
    padding: '8px 12px',
    fontSize: '13px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    cursor: 'pointer',
  },
  filterRow: { display: 'flex', gap: '6px', marginBottom: '12px' },
  filterBtn: { 
    background: 'transparent', 
    border: '1px solid var(--border-strong)', 
    borderRadius: '6px', 
    color: 'var(--text-secondary)', 
    padding: '4px 10px', 
    fontSize: '11px', 
    fontWeight: 600, 
    cursor: 'pointer' 
  },
  filterBtnActive: { 
    background: 'var(--primary-transparent)', 
    borderColor: 'var(--border-brand)', 
    color: 'var(--primary-light)' 
  },
  problemList: { display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '250px', overflowY: 'auto', paddingRight: '4px' },
  problemItem: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: '10px 12px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    transition: 'all 150ms ease',
    border: '1px solid transparent'
  },
  problemItemActive: { 
    background: 'var(--bg-surface-hover)', 
    border: '1px solid var(--border-subtle)' 
  },
  tag: { 
    fontSize: '11px', 
    fontWeight: 600, 
    padding: '2px 8px', 
    borderRadius: '4px', 
    background: 'var(--bg-surface-hover)', 
    color: 'var(--text-secondary)' 
  },
  desc: { 
    color: 'var(--text-secondary)', 
    fontSize: '13.5px', 
    lineHeight: 1.7, 
    margin: '0 0 12px 0' 
  },
  code: { 
    background: 'var(--primary-transparent)', 
    color: 'var(--primary-light)', 
    padding: '2px 6px', 
    borderRadius: '4px', 
    fontSize: '12px', 
    fontFamily: 'var(--font-mono)' 
  },
  examplePre: { 
    background: 'var(--bg-surface-3)', 
    color: 'var(--text-primary)', 
    padding: '12px', 
    borderRadius: '8px', 
    fontSize: '12px', 
    fontFamily: 'var(--font-mono)', 
    margin: '8px 0 0 0', 
    lineHeight: 1.6 
  },
  editorBody: { 
    display: 'flex', 
    background: '#1e1e1e', // standard editor dark mode color
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid var(--border-strong)',
    minHeight: '400px'
  },
  lineNumbers: { 
    padding: '16px 0', 
    minWidth: '40px', 
    textAlign: 'right', 
    userSelect: 'none',
    background: '#1e1e1e',
    borderRight: '1px solid #333'
  },
  lineNum: { 
    color: '#858585', 
    fontSize: '13px', 
    lineHeight: '1.6', 
    paddingRight: '12px', 
    fontFamily: 'var(--font-mono)' 
  },
  codeArea: { 
    flex: 1, 
    background: 'transparent', 
    color: '#d4d4d4', 
    border: 'none', 
    outline: 'none', 
    resize: 'none', 
    padding: '16px', 
    fontSize: '13px', 
    lineHeight: '1.6', 
    fontFamily: 'var(--font-mono)', 
    tabSize: 2 
  },
  outputPre: { 
    margin: 0, 
    color: 'var(--success)', 
    fontSize: '13px', 
    fontFamily: 'var(--font-mono)', 
    whiteSpace: 'pre-wrap',
    minHeight: '80px'
  },
};
