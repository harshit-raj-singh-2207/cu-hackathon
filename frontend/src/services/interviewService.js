import { apiRequest } from './api';

export const interviewService = {
  /**
   * Start a new AI interview session.
   * @param {Object} payload
   * @param {string} payload.company
   * @param {string} payload.job_role
   * @param {string} payload.experience_level
   * @param {string} payload.interview_type   - e.g. 'Behavioral', 'Technical DSA', 'System Design'
   * @param {number} payload.question_count
   * @returns {Promise<{ id: string, questions: string[] }>}
   */
  startSession: (payload) =>
    apiRequest('/interview/session', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /**
   * Fetch an existing session by ID.
   * @param {string} sessionId
   * @returns {Promise<any>}
   */
  getSession: (sessionId) =>
    apiRequest(`/interview/session/${sessionId}`, { method: 'GET' }),

  /**
   * Submit an answer for a question in a session.
   * @param {string} sessionId
   * @param {Object} data
   * @param {number} data.question_index
   * @param {string} data.answer
   * @returns {Promise<{ feedback: string, score: number }>}
   */
  submitAnswer: (sessionId, data) =>
    apiRequest(`/interview/session/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * End a session and retrieve the full evaluation report.
   * @param {string} sessionId
   * @returns {Promise<any>}
   */
  endSession: (sessionId) =>
    apiRequest(`/interview/session/${sessionId}/end`, { method: 'POST' }),

  /**
   * Get past interview session history.
   * @param {number} page
   * @param {number} pageSize
   * @returns {Promise<any>}
   */
  getHistory: (page = 1, pageSize = 10) =>
    apiRequest(`/interview/history?page=${page}&page_size=${pageSize}`, {
      method: 'GET',
    }),
};
