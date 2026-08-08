const STORAGE_KEYS = {
  HISTORY: 'cc_interview_history'
};

export const evaluateFinalInterviewReport = (sessionData) => {
  const answers = sessionData?.answers || [];
  if (answers.length === 0) {
    return {
      overallPercentage: 0,
      technicalScore: 0,
      communicationScore: 0,
      averageScore: 0,
      totalAnswered: 0,
      readinessBadge: 'Requires Revision',
      badgeColor: 'danger',
      strongAreas: [],
      weakAreas: ['No questions completed'],
      recommendedTopics: ['Initialize a new interview session']
    };
  }

  let totalScoreSum = 0;
  let techSubscoreSum = 0;
  let commSubscoreSum = 0;

  const topicScores = {};

  answers.forEach((ans) => {
    const score = ans.evaluation?.overallScore || 0;
    totalScoreSum += score;

    const sub = ans.evaluation?.subscores || { correctness: score, depth: score, clarity: score };
    techSubscoreSum += (sub.correctness + sub.depth) / 2;
    commSubscoreSum += sub.clarity || score;

    const category = ans.question?.category || 'General';
    if (!topicScores[category]) {
      topicScores[category] = { sum: 0, count: 0 };
    }
    topicScores[category].sum += score;
    topicScores[category].count += 1;
  });

  const count = answers.length;
  const averageScore = Math.round((totalScoreSum / count) * 10) / 10;
  const overallPercentage = Math.round((averageScore / 10) * 100);
  const technicalScore = Math.round(((techSubscoreSum / count) / 10) * 100);
  const communicationScore = Math.round(((commSubscoreSum / count) / 10) * 100);

  let readinessBadge = 'Requires Revision';
  let badgeColor = 'danger';

  if (overallPercentage >= 80) {
    readinessBadge = 'Ready for Interviews';
    badgeColor = 'success';
  } else if (overallPercentage >= 60) {
    readinessBadge = 'Needs Practice';
    badgeColor = 'warning';
  }

  const strongAreas = [];
  const weakAreas = [];

  Object.keys(topicScores).forEach(t => {
    const avg = topicScores[t].sum / topicScores[t].count;
    if (avg >= 7.5) {
      strongAreas.push(t);
    } else {
      weakAreas.push(t);
    }
  });

  return {
    overallPercentage,
    technicalScore,
    communicationScore,
    averageScore,
    totalAnswered: count,
    readinessBadge,
    badgeColor,
    strongAreas,
    weakAreas: weakAreas.length > 0 ? weakAreas : ['None identified'],
    recommendedTopics: weakAreas.length > 0 ? weakAreas.map(w => `Revise ${w} fundamentals`) : ['Practice mock System Design']
  };
};

export const getInterviewHistory = (isDemoMode = false) => {
  if (isDemoMode) {
    return [
      {
        id: 'demo-int-101',
        date: '2026-08-07',
        role: 'Full Stack Developer',
        type: 'Technical',
        difficulty: 'Intermediate',
        overallPercentage: 82,
        readinessBadge: 'Ready for Interviews',
        totalQuestions: 5,
        strongAreas: ['React & Virtual DOM', 'API Architecture'],
        weakAreas: ['JavaScript Closures']
      },
      {
        id: 'demo-int-102',
        date: '2026-08-04',
        role: 'Frontend Developer',
        type: 'Behavioral',
        difficulty: 'Intermediate',
        overallPercentage: 74,
        readinessBadge: 'Needs Practice',
        totalQuestions: 4,
        strongAreas: ['STAR Method'],
        weakAreas: ['Pacing & pauses']
      }
    ];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse interview history', e);
  }
  return [];
};

export const saveInterviewToHistory = (sessionData, report) => {
  try {
    const current = getInterviewHistory(false);
    const newEntry = {
      id: 'int-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      role: sessionData.role,
      type: sessionData.type,
      difficulty: sessionData.difficulty,
      overallPercentage: report.overallPercentage,
      readinessBadge: report.readinessBadge,
      totalQuestions: sessionData.questions.length,
      strongAreas: report.strongAreas,
      weakAreas: report.weakAreas
    };

    const updated = [newEntry, ...current].slice(0, 20); // Keep last 20
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save interview session to history', e);
    return [];
  }
};
