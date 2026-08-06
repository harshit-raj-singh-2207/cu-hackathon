import { apiRequest } from './api';

const queryString = (values) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    if (Array.isArray(value)) value.forEach(item => params.append(key, item));
    else params.set(key, value);
  });
  return params.toString();
};

export const getRecommendations = (filters) => apiRequest(`/jobs/recommendations?${queryString(filters)}`);
export const getAutocomplete = (q, limit = 10) => apiRequest(`/jobs/autocomplete?${queryString({ q, limit })}`);
export const getFilterOptions = () => apiRequest('/jobs/filter-options');
export const getJobDetails = (jobId) => apiRequest(`/jobs/${jobId}`);
export const getJobInsights = () => apiRequest('/jobs/insights');
export const saveJob = (jobId) => apiRequest(`/jobs/${jobId}/save`, { method: 'POST' });
export const unsaveJob = (jobId) => apiRequest(`/jobs/${jobId}/save`, { method: 'DELETE' });
export const applyToJob = (jobId) => apiRequest('/jobs/applications', { method: 'POST', body: JSON.stringify({ job_id: jobId, status: 'applied' }) });
