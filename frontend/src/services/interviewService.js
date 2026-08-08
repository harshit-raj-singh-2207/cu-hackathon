import { apiRequest } from './api';

/**
 * Interview service — connects to backend interview and mock-interview APIs.
 */
export const interviewService = {
  /**
   * Create a new interview session.
   */
  createSession: (data) =>
    apiRequest('/interview/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  /**
   * Get all interview sessions for the current user.
   */
  getSessions: () => apiRequest('/interview/sessions', { method: 'GET' }),

  /**
   * Get a specific session by ID.
   */
  getSession: (sessionId) => apiRequest(`/interview/sessions/${sessionId}`, { method: 'GET' }),

  /**
   * Submit an answer to an interview question.
   */
  submitAnswer: (sessionId, questionId, answer) =>
    apiRequest(`/interview/sessions/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ question_id: questionId, answer }),
    }),

  /**
   * Get AI feedback on a response.
   */
  getFeedback: (sessionId) =>
    apiRequest(`/interview/sessions/${sessionId}/feedback`, { method: 'GET' }),

  /**
   * Get interview question bank.
   */
  getQuestions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/interview/questions${query ? `?${query}` : ''}`, { method: 'GET' });
  },

  /**
   * Get available interview types.
   */
  getTypes: () => apiRequest('/interview-types/', { method: 'GET' }),
};
