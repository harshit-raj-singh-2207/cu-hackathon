// Utility module for generating share URLs, dynamic Shields.io badges, Markdown/HTML embeds, and public progress payloads.

export const getOrCreateShareId = () => {
  try {
    let shareId = localStorage.getItem('cc_share_id');
    if (!shareId) {
      shareId = 'share_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('cc_share_id', shareId);
    }
    return shareId;
  } catch (e) {
    console.error('Error managing shareId', e);
    return 'share_demo_123';
  }
};

export const getShareUrl = (shareId) => {
  const origin = window.location.origin || 'http://localhost:3000';
  const id = shareId || getOrCreateShareId();
  return `${origin}/share/progress/${id}`;
};

export const getBadgeUrl = (percent = 0) => {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  // Shields.io dynamic badge URL with violet theme color matching Career Copilot branding
  return `https://img.shields.io/badge/Career%20Roadmap-${p}%25%20Completed-7c3aed?style=for-the-badge&logo=rocket`;
};

export const getMarkdownBadge = (percent = 0, shareUrl) => {
  const url = shareUrl || getShareUrl();
  const badgeUrl = getBadgeUrl(percent);
  return `[![Career Progress](${badgeUrl})](${url})`;
};

export const getHtmlBadge = (percent = 0, shareUrl) => {
  const url = shareUrl || getShareUrl();
  const badgeUrl = getBadgeUrl(percent);
  return `<a href="${url}" target="_blank" rel="noopener noreferrer">\n  <img src="${badgeUrl}" alt="Career Progress ${percent}% Completed" />\n</a>`;
};

export const createPublicPayload = ({
  plans = [],
  metrics = {},
  user = null,
  isPublic = false,
  isDemoMode = false
}) => {
  // Return sanitized public progress payload with ZERO private attributes (no passwords, emails, tokens, resume data)
  if (!isPublic && !isDemoMode) {
    return {
      isPublic: false,
      message: 'This learner\'s progress report is set to private.'
    };
  }

  const learnerName = user?.name ? user.name.split(' ')[0] : 'Learner';
  const primaryGoal = plans[0]?.goal || 'Fullstack Engineer';

  return {
    isPublic: true,
    isDemoMode,
    learnerName,
    primaryGoal,
    updatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    metrics: {
      percent: metrics.percent || 0,
      completedSteps: metrics.completedSteps || 0,
      totalSteps: metrics.totalSteps || 0,
      completedTasks: metrics.completedTasks || 0,
      totalTasks: metrics.totalTasks || 0,
      statusCounts: metrics.statusCounts || { complete: 0, current: 0, locked: 0 },
      topicStats: metrics.topicStats || {}
    },
    weakAreas: (metrics.weakAreas || []).map(w => ({
      topic: w.topic,
      completionPercent: w.completionPercent,
      recommendation: w.recommendation
    }))
  };
};
