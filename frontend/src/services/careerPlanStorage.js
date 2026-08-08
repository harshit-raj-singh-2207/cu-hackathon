import { DEFAULT_CAREER_PLANS, JUDGE_DEMO_ACTIVITY } from '../pages/Roadmap/data/initialCareerPlans';
import { calculateProgressMetrics } from '../utils/progressCalculator';
import { getOrCreateShareId, createPublicPayload } from '../utils/progressShare';

const STORAGE_KEYS = {
  USER_PLANS: 'cc_user_career_plans',
  ACTIVITY: 'cc_learner_activity',
  DEMO_MODE_ACTIVE: 'cc_judge_demo_active',
  SHARE_PUBLIC_ENABLED: 'cc_share_public_enabled'
};

export const careerPlanStorage = {
  // Check if Judge Demo Mode is currently active
  isDemoActive() {
    try {
      return localStorage.getItem(STORAGE_KEYS.DEMO_MODE_ACTIVE) === 'true';
    } catch {
      return false;
    }
  },

  // Public Sharing Toggle Status
  isPublicShareEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEYS.SHARE_PUBLIC_ENABLED) === 'true';
    } catch {
      return false;
    }
  },

  // Update Public Sharing Toggle
  setPublicShare(enabled) {
    try {
      if (enabled) {
        localStorage.setItem(STORAGE_KEYS.SHARE_PUBLIC_ENABLED, 'true');
        this.logActivity('Enabled public progress sharing & badge embeds', '🌐');
      } else {
        localStorage.removeItem(STORAGE_KEYS.SHARE_PUBLIC_ENABLED);
        this.logActivity('Disabled public progress sharing', '🔒');
      }
    } catch (e) {
      console.error('Failed to update public share setting', e);
    }
    return this.isPublicShareEnabled();
  },

  // Unique Share ID
  getShareId() {
    return getOrCreateShareId();
  },

  // Get active plans based on current mode (Real User Data vs Isolated Judge Demo Mode)
  getPlans() {
    if (this.isDemoActive()) {
      return this.getJudgeDemoPlans();
    }
    return this.getUserPlans();
  },

  // Load real user plans from LocalStorage or seed defaults
  getUserPlans() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PLANS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse user career plans from localStorage', e);
    }
    return DEFAULT_CAREER_PLANS;
  },

  // Save real user plans to LocalStorage without touching demo data
  saveUserPlans(plans) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PLANS, JSON.stringify(plans));
    } catch (e) {
      console.error('Failed to save user career plans to localStorage', e);
    }
  },

  // Generate isolated Judge Demo Data without overwriting real user storage
  getJudgeDemoPlans() {
    return DEFAULT_CAREER_PLANS.map(step => {
      if (step.id === 1) {
        return {
          ...step,
          status: 'complete',
          checklist: step.checklist.map(c => ({ ...c, checked: true }))
        };
      }
      if (step.id === 2) {
        return {
          ...step,
          status: 'current',
          checklist: step.checklist.map((c, i) => ({ ...c, checked: i === 0 || i === 1 }))
        };
      }
      if (step.id === 3) {
        return {
          ...step,
          status: 'current',
          checklist: step.checklist.map((c, i) => ({ ...c, checked: i === 0 }))
        };
      }
      return step;
    });
  },

  // Get Sanitized Public Payload for Public Progress Route
  getPublicPayload() {
    const isDemo = this.isDemoActive();
    const isPublic = this.isPublicShareEnabled();
    const plans = this.getPlans();
    const metrics = calculateProgressMetrics(plans);
    
    let user = null;
    try {
      const storedUser = localStorage.getItem('cc_user');
      if (storedUser) user = JSON.parse(storedUser);
    } catch (e) {
      console.error(e);
    }

    return createPublicPayload({
      plans,
      metrics,
      user,
      isPublic,
      isDemoMode: isDemo
    });
  },

  // Toggle Judge Demo Mode ON/OFF while protecting real user data
  toggleDemoMode(enable) {
    try {
      if (enable) {
        localStorage.setItem(STORAGE_KEYS.DEMO_MODE_ACTIVE, 'true');
        this.logActivity('Activated Judge Demo Mode (Isolated Data)', '🏆');
      } else {
        localStorage.removeItem(STORAGE_KEYS.DEMO_MODE_ACTIVE);
        this.logActivity('Restored Real Personalized Career Data', '🔄');
      }
    } catch (e) {
      console.error('Failed to toggle demo mode', e);
    }
    return {
      isDemo: this.isDemoActive(),
      plans: this.getPlans()
    };
  },

  // Save attachment for a step
  saveAttachment(stepId, attachment) {
    const plans = this.getUserPlans();
    const updated = plans.map(step => {
      if (step.id === stepId) {
        return { ...step, attachment };
      }
      return step;
    });

    if (!this.isDemoActive()) {
      this.saveUserPlans(updated);
    }

    if (attachment) {
      this.logActivity(`Attached evidence "${attachment.name}" to Step ${stepId}`, '📎');
    } else {
      this.logActivity(`Removed attachment from Step ${stepId}`, '🗑️');
    }

    return this.getPlans();
  },

  // Directly update step status ('complete' | 'current' | 'locked')
  updateStepStatus(stepId, newStatus) {
    const plans = this.getUserPlans();
    const updated = plans.map((step, idx) => {
      if (step.id === stepId) {
        let nextChecklist = step.checklist;
        if (newStatus === 'complete') {
          nextChecklist = step.checklist.map(c => ({ ...c, checked: true }));
        }
        return { ...step, status: newStatus, checklist: nextChecklist };
      }
      return step;
    });

    // Auto-unlock next step if current step completed
    if (newStatus === 'complete') {
      const currentIdx = updated.findIndex(s => s.id === stepId);
      if (currentIdx !== -1 && currentIdx + 1 < updated.length) {
        if (updated[currentIdx + 1].status === 'locked') {
          updated[currentIdx + 1].status = 'current';
        }
      }
    }

    if (!this.isDemoActive()) {
      this.saveUserPlans(updated);
    }

    this.logActivity(`Updated Step ${stepId} status to "${newStatus.toUpperCase()}"`, '🎯');
    return this.getPlans();
  },

  // Toggle checklist item completion
  toggleChecklist(stepId, itemId) {
    let taskName = '';
    let isCompleted = false;

    const plans = this.getUserPlans();
    const updated = plans.map(step => {
      if (step.id === stepId) {
        const nextChecklist = step.checklist.map(item => {
          if (item.id === itemId) {
            isCompleted = !item.checked;
            taskName = item.text;
            return { ...item, checked: !item.checked };
          }
          return item;
        });

        const allChecked = nextChecklist.length > 0 && nextChecklist.every(i => i.checked);
        let nextStatus = step.status;
        if (allChecked) {
          nextStatus = 'complete';
        } else if (step.status === 'complete') {
          nextStatus = 'current';
        }

        return { ...step, checklist: nextChecklist, status: nextStatus };
      }
      return step;
    });

    if (!this.isDemoActive()) {
      this.saveUserPlans(updated);
    }

    if (taskName) {
      this.logActivity(`${isCompleted ? 'Completed' : 'Unchecked'} checklist task: "${taskName.slice(0, 30)}..."`, isCompleted ? '✅' : '🔄');
    }

    return this.getPlans();
  },

  // Load activity history
  getActivityLog() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse activity log from localStorage', e);
    }
    return JUDGE_DEMO_ACTIVITY;
  },

  // Log learner action
  logActivity(text, icon = '⚡') {
    const current = this.getActivityLog();
    const newEntry = {
      id: Date.now(),
      text,
      timestamp: 'Just now',
      icon
    };
    const updated = [newEntry, ...current].slice(0, 15);
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to log activity', e);
    }
    return updated;
  },

  // Reset real user storage to initial default seed state
  resetToSeed() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_PLANS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
      localStorage.removeItem(STORAGE_KEYS.DEMO_MODE_ACTIVE);
      localStorage.removeItem(STORAGE_KEYS.SHARE_PUBLIC_ENABLED);
    } catch (e) {
      console.error('Failed to reset storage', e);
    }
    return {
      plans: DEFAULT_CAREER_PLANS,
      activity: JUDGE_DEMO_ACTIVITY,
      isDemo: false
    };
  }
};
