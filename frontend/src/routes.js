/**
 * Centralized route configuration.
 * Currently routes are defined inline in App.jsx.
 * This module provides a route map for use in navigation components.
 */

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

export const PUBLIC_ROUTES = [ROUTES.HOME, ROUTES.LOGIN, ROUTES.REGISTER];

export const SIDEBAR_ITEMS = [
  { path: ROUTES.DASHBOARD,    label: 'Dashboard',     icon: '📊' },
  { path: ROUTES.RESUME,       label: 'Resume',        icon: '📄' },
  { path: ROUTES.ATS,          label: 'ATS Checker',   icon: '🎯' },
  { path: ROUTES.INTERVIEW,    label: 'Interview',     icon: '🎙️' },
  { path: ROUTES.CODING,       label: 'Coding',        icon: '💻' },
  { path: ROUTES.JOBS,         label: 'Jobs',          icon: '💼' },
  { path: ROUTES.ROADMAP,      label: 'Roadmap',       icon: '🗺️' },
  { path: ROUTES.ANALYTICS,    label: 'Analytics',     icon: '📈' },
  { path: ROUTES.DIGITAL_TWIN, label: 'Digital Twin',  icon: '🤖' },
  { path: ROUTES.RECRUITER,    label: 'Recruiter',     icon: '🏟️' },
  { path: ROUTES.TRENDS,       label: 'Trends',        icon: '📡' },
];

export default ROUTES;
