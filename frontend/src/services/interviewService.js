import { apiRequest } from './api';

export const interviewService = {
  startSession: (data) => apiRequest('/interviews/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  submitAnswer: (sessionId, data) => apiRequest(`/interviews/sessions/${sessionId}/answers`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getSession: (sessionId) => apiRequest(`/interviews/sessions/${sessionId}`),
  getReport: (sessionId) => apiRequest(`/interviews/sessions/${sessionId}/report`),
  startWebcamSession: (interviewSessionId) => apiRequest('/webcam/start', {
    method: 'POST',
    body: JSON.stringify({ interview_session_id: interviewSessionId }),
  }),
  stopWebcamSession: (webcamSessionId) => apiRequest(`/webcam/stop?session_id=${webcamSessionId}`, {
    method: 'POST',
  }),
  getWebcamReport: (webcamSessionId) => apiRequest(`/webcam/report/${webcamSessionId}`),
  getWebcamHistory: () => apiRequest('/webcam/history'),
};
