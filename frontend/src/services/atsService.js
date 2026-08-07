import { apiRequest } from './api';

export const atsService = {
  /**
   * Run an ATS compatibility check against a job description.
   * Assumes the user already has a resume uploaded on the server.
   * @param {Object} data 
   * @param {string} data.job_description
   * @param {string} [data.job_title]
   * @returns {Promise<any>}
   */
  check: (data) => apiRequest('/ats/check', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Get paginated ATS check history.
   * @param {number} page 
   * @param {number} pageSize 
   * @returns {Promise<any>}
   */
  getHistory: (page = 1, pageSize = 10) => apiRequest(`/ats/history?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
  }),

  /**
   * Get a specific ATS check result by ID.
   * @param {string} resultId 
   * @returns {Promise<any>}
   */
  getResult: (resultId) => apiRequest(`/ats/history/${resultId}`, {
    method: 'GET',
  }),

  /**
   * Delete an ATS check result by ID.
   * @param {string} resultId 
   * @returns {Promise<any>}
   */
  deleteResult: (resultId) => apiRequest(`/ats/history/${resultId}`, {
    method: 'DELETE',
  }),
};
