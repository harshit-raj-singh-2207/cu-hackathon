import { apiRequest } from './api';

export const resumeService = {
  /**
   * Upload a resume file to the server.
   * @param {File} file - The PDF or DOCX file to upload.
   * @returns {Promise<Object>} Response with upload status and parsed document info.
   */
  async upload(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/resume/upload', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Run the analyzer logic on the currently uploaded resume.
   * @param {string} [jobDescription] - Optional JD to score against.
   * @returns {Promise<Object>} The analysis report with formatting checks and metrics.
   */
  async analyze(jobDescription) {
    return apiRequest('/analyzer/analyze', {
      method: 'POST',
      body: JSON.stringify({ job_description: jobDescription }),
    });
  },

  /**
   * Fetch the last run analysis report.
   * @returns {Promise<Object>} The report data.
   */
  async getReport() {
    return apiRequest('/analyzer/report', {
      method: 'GET',
    });
  },

  /**
   * Download the uploaded physical resume file.
   * Returns a URL that can be used directly for a download link.
   * @returns {Promise<Blob>} File Blob.
   */
  async download() {
    const token = localStorage.getItem('cc_access_token');
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${process.env.REACT_APP_API_URL || '/api/v1'}/resume/download`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) throw new Error('Download failed');
    return res.blob();
  },

  /**
   * Delete the resume file and database record.
   * @returns {Promise<Object>} Reset confirmation.
   */
  async delete() {
    return apiRequest('/resume/', {
      method: 'DELETE',
    });
  },
};
