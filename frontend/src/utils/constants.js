/** Application-wide constants */

export const APP_NAME = 'CareerCopilot';

export const API_BASE = process.env.REACT_APP_API_URL || '/api/v1';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'cc_access_token',
  REFRESH_TOKEN: 'cc_refresh_token',
  USER: 'cc_user',
  THEME: 'cc_theme',
  SETTINGS: 'cc_settings',
  REGISTERED_USERS: 'cc_registered_users',
};

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  RESUME: '/resume',
  ATS: '/ats',
  INTERVIEW: '/interview',
  CODING: '/coding',
  JOBS: '/jobs',
  ROADMAP: '/roadmap',
  ANALYTICS: '/analytics',
  DIGITAL_TWIN: '/twin',
  RECRUITER: '/recruiter',
  TRENDS: '/trends',
  PROFILE: '/profile',
  SETTINGS: '/settings',
};

export const DIFFICULTY = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

export const DIFFICULTY_COLORS = {
  Easy: '#059669',
  Medium: '#d97706',
  Hard: '#dc2626',
};
