import { apiRequest } from './api';

/**
 * Coding practice service — connects to the backend coding API.
 */
export const codingService = {
  /**
   * Get list of coding problems with optional filters.
   */
  getProblems: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/coding/problems${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  /**
   * Get a specific problem by ID.
   */
  getProblem: (problemId) => apiRequest(`/coding/problems/${problemId}`, { method: 'GET' }),

  /**
   * Submit a code solution.
   */
  submitSolution: (problemId, code, language) =>
    apiRequest(`/coding/problems/${problemId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    }),

  /**
   * Run code against test cases without submitting.
   */
  runCode: (problemId, code, language) =>
    apiRequest(`/coding/problems/${problemId}/run`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    }),

  /**
   * Get submission history for a problem.
   */
  getSubmissions: (problemId) =>
    apiRequest(`/coding/problems/${problemId}/submissions`, { method: 'GET' }),

  /**
   * Get user's coding stats.
   */
  getStats: () => apiRequest('/coding/stats', { method: 'GET' }),
};
