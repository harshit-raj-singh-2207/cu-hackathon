import { getQuestionsForTopic } from '../pages/Roadmap/data/skillQuestionBank';

const STORAGE_KEYS = {
  BENCHMARKS: 'cc_skill_benchmarks'
};

// Calculate score, percentage, and readiness status
export const evaluateQuizResult = (selectedAnswers = [], questions = []) => {
  if (!questions || questions.length === 0) {
    return {
      score: '0/0',
      correctCount: 0,
      totalQuestions: 0,
      percentage: 0,
      status: 'NOT_READY',
      readinessText: 'Not Available',
      badgeColor: 'muted'
    };
  }

  let correctCount = 0;
  questions.forEach((q, idx) => {
    if (selectedAnswers[idx] === q.correctIndex) {
      correctCount += 1;
    }
  });

  const totalQuestions = questions.length;
  const percentage = Math.round((correctCount / totalQuestions) * 100);

  let status = 'NOT_READY';
  let readinessText = 'Not Ready';
  let badgeColor = 'danger';

  if (correctCount === 3) {
    status = 'READY';
    readinessText = 'Ready';
    badgeColor = 'success';
  } else if (correctCount === 2) {
    status = 'NEEDS_REVIEW';
    readinessText = 'Needs Review';
    badgeColor = 'warning';
  }

  return {
    score: `${correctCount}/${totalQuestions}`,
    correctCount,
    totalQuestions,
    percentage,
    status,
    readinessText,
    badgeColor,
    attemptedAt: new Date().toISOString()
  };
};

// Retrieve quiz history for a step from LocalStorage (or Demo Mode sample)
export const getBenchmarkResult = (stepId, isDemoMode = false) => {
  if (isDemoMode) {
    // Isolated presentation data for Judge Demo Mode
    if (stepId === 1) {
      return {
        score: '3/3',
        correctCount: 3,
        totalQuestions: 3,
        percentage: 100,
        status: 'READY',
        readinessText: 'Ready',
        badgeColor: 'success',
        attemptedAt: '2026-08-05T10:00:00Z',
        attemptsCount: 1
      };
    }
    if (stepId === 2) {
      return {
        score: '2/3',
        correctCount: 2,
        totalQuestions: 3,
        percentage: 67,
        status: 'NEEDS_REVIEW',
        readinessText: 'Needs Review',
        badgeColor: 'warning',
        attemptedAt: '2026-08-06T14:30:00Z',
        attemptsCount: 2
      };
    }
    if (stepId === 6) {
      return {
        score: '1/3',
        correctCount: 1,
        totalQuestions: 3,
        percentage: 33,
        status: 'NOT_READY',
        readinessText: 'Not Ready',
        badgeColor: 'danger',
        attemptedAt: '2026-08-07T09:15:00Z',
        attemptsCount: 1
      };
    }
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BENCHMARKS);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed[stepId] || null;
    }
  } catch (e) {
    console.error('Failed to parse benchmark results from localStorage', e);
  }
  return null;
};

// Save user quiz result to LocalStorage
export const saveBenchmarkResult = (stepId, result) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BENCHMARKS);
    let map = stored ? JSON.parse(stored) : {};
    
    const existing = map[stepId] || {};
    const attemptsCount = (existing.attemptsCount || 0) + 1;

    map[stepId] = {
      ...result,
      stepId,
      attemptsCount
    };

    localStorage.setItem(STORAGE_KEYS.BENCHMARKS, JSON.stringify(map));
    return map[stepId];
  } catch (e) {
    console.error('Failed to save benchmark result', e);
    return result;
  }
};

// Aggregate readiness analytics summary across all roadmap steps
export const calculateReadinessSummary = (plans = [], isDemoMode = false) => {
  let readyCount = 0;
  let reviewCount = 0;
  let notReadyCount = 0;
  let unattemptedCount = 0;

  plans.forEach(step => {
    const bench = getBenchmarkResult(step.id, isDemoMode);
    if (!bench) {
      unattemptedCount += 1;
    } else if (bench.status === 'READY') {
      readyCount += 1;
    } else if (bench.status === 'NEEDS_REVIEW') {
      reviewCount += 1;
    } else {
      notReadyCount += 1;
    }
  });

  return {
    readyCount,
    reviewCount,
    notReadyCount,
    unattemptedCount,
    totalAttempted: readyCount + reviewCount + notReadyCount
  };
};

export const getQuestionsForStep = (step) => {
  if (!step) return null;
  return getQuestionsForTopic(step.topic || step.title || '');
};
