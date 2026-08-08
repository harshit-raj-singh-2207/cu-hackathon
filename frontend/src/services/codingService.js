import { apiRequest } from './api';

export const codingService = {
  /** Fetch all problems with optional filters */
  getProblems: ({ search = '', difficulty = 'ALL', category = 'ALL' } = {}) =>
    fetch(`/api/problems?search=${encodeURIComponent(search)}&difficulty=${difficulty}&category=${category}`)
      .then(r => r.json()),

  /** Fetch single problem by ID */
  getProblem: (id) =>
    fetch(`/api/problems/${id}`).then(r => r.json()),

  /** Run code against sample test case */
  runCode: ({ source_code, language, problem_id, input }) =>
    fetch('/api/judge/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_code, language, problem_id, input }),
    }).then(r => r.json()),

  /** Submit code against all test cases */
  submitCode: ({ source_code, language, problem_id }) =>
    fetch('/api/judge/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_code, language, problem_id }),
    }).then(r => r.json()),

  /** Ask AI Coach */
  askCoach: ({ action, query, problemTitle, problemDescription, userCode, history }) =>
    fetch('/api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, query, problemTitle, problemDescription, userCode, history }),
    }).then(r => r.json()),
};
