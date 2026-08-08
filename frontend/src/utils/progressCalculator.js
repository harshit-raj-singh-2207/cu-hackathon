import { calculateReadinessSummary, getBenchmarkResult } from './skillBenchmark';
import { getInterviewHistory } from './interviewScoring';
import { getPortfolioHistory } from './portfolioScoring';

export const calculateProgressMetrics = (plans = [], isDemoMode = false) => {
  // Edge Case Guard: Empty plan list
  if (!Array.isArray(plans) || plans.length === 0) {
    return {
      percent: 0,
      totalSteps: 0,
      completedSteps: 0,
      totalTasks: 0,
      completedTasks: 0,
      statusCounts: { complete: 0, current: 0, locked: 0 },
      topicStats: {},
      difficultyCounts: { Beginner: 0, Intermediate: 0, Advanced: 0 },
      weakAreas: [],
      readinessSummary: { readyCount: 0, reviewCount: 0, notReadyCount: 0, unattemptedCount: 0 },
      nextAction: {
        stepId: null,
        stepTitle: 'No Career Plans Found',
        taskName: 'Generate a new career path to start',
        topic: 'General',
        duration: 'N/A',
        reason: 'Your roadmap is currently empty. Click "Regenerate with AI" to construct a new personalized trajectory.'
      }
    };
  }

  let totalTasks = 0;
  let completedTasks = 0;

  const topicStats = {};
  const statusCounts = { complete: 0, current: 0, locked: 0 };
  const difficultyCounts = { Beginner: 0, Intermediate: 0, Advanced: 0 };

  plans.forEach(step => {
    // Standardize status validation
    const statusKey = ['complete', 'current', 'locked'].includes(step?.status) ? step.status : 'locked';
    statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;

    // Standardize difficulty
    const diffKey = ['Beginner', 'Intermediate', 'Advanced'].includes(step?.difficulty) ? step.difficulty : 'Intermediate';
    difficultyCounts[diffKey] = (difficultyCounts[diffKey] || 0) + 1;

    // Topic stats tracking with defensive fallbacks
    const topic = (step?.topic || 'General').trim();
    if (!topicStats[topic]) {
      topicStats[topic] = { total: 0, checked: 0, steps: 0, completedSteps: 0 };
    }
    topicStats[topic].steps += 1;
    if (statusKey === 'complete') {
      topicStats[topic].completedSteps += 1;
    }

    // Checklist task counting
    const checklist = Array.isArray(step?.checklist) ? step.checklist : [];
    checklist.forEach(item => {
      totalTasks += 1;
      topicStats[topic].total += 1;
      if (item && item.checked) {
        completedTasks += 1;
        topicStats[topic].checked += 1;
      }
    });
  });

  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const completedSteps = statusCounts.complete || 0;
  const totalSteps = plans.length;

  // Calculate readiness summary metrics
  const readinessSummary = calculateReadinessSummary(plans, isDemoMode);

  // Calculate weak areas (Topics with task completion < 60%)
  const weakAreas = [];
  Object.keys(topicStats).forEach(topic => {
    const stat = topicStats[topic];
    const topicPercent = stat.total > 0 ? Math.round((stat.checked / stat.total) * 100) : 0;
    
    if (topicPercent < 60) {
      const missingTasks = [];
      plans.filter(p => (p?.topic || 'General').trim() === topic).forEach(p => {
        (p?.checklist || []).filter(c => c && !c.checked).forEach(c => missingTasks.push(c.text));
      });

      weakAreas.push({
        topic,
        completionPercent: topicPercent,
        totalTasks: stat.total,
        completedTasks: stat.checked,
        sampleMissing: missingTasks.slice(0, 2),
        recommendation: topicPercent === 0 
          ? `Unstarted topic. Begin foundational ${topic} exercises.`
          : `Needs attention (${topicPercent}% complete). Practice remaining ${topic} checklist items.`
      });
    }
  });

  // Extended AI Next Recommended Action Logic with Quiz, Interview, & Portfolio Context
  let nextAction = null;

  // Check recent Portfolio Analysis performance
  const portfolioHistory = getPortfolioHistory(isDemoMode);
  const latestPortfolio = portfolioHistory[0];

  if (latestPortfolio && latestPortfolio.overallScore < 75) {
    const testingStep = plans.find(p => (p.topic || '').toLowerCase().includes('test') || (p.title || '').toLowerCase().includes('test'));
    if (testingStep) {
      nextAction = {
        stepId: testingStep.id,
        stepTitle: testingStep.title,
        taskName: 'Add unit tests to GitHub projects',
        topic: testingStep.topic || 'General',
        duration: testingStep.duration || 'Flexible',
        reason: `Portfolio Scorecard (${latestPortfolio.overallScore}/100) identified testing & README documentation as key improvement areas.`
      };
    }
  }

  // Check recent Mock Interview performance for weak areas
  if (!nextAction) {
    const interviewHistory = getInterviewHistory(isDemoMode);
    const latestInterview = interviewHistory[0];

    if (latestInterview && latestInterview.weakAreas && latestInterview.weakAreas.length > 0 && latestInterview.overallPercentage < 75) {
      const intWeak = latestInterview.weakAreas[0];
      const matchingStep = plans.find(p => (p.topic || '').toLowerCase().includes(intWeak.toLowerCase()));

      if (matchingStep) {
        nextAction = {
          stepId: matchingStep.id,
          stepTitle: matchingStep.title,
          taskName: `Review ${intWeak} concepts`,
          topic: matchingStep.topic || 'General',
          duration: matchingStep.duration || 'Flexible',
          reason: `Recent Mock Interview (${latestInterview.overallPercentage}%) identified weak performance in ${intWeak}.`
        };
      }
    }
  }

  if (!nextAction) {
    // 1. Check if current step has a benchmark quiz result requiring review
    const currentStep = plans.find(p => p.status === 'current');
    if (currentStep) {
      const bench = getBenchmarkResult(currentStep.id, isDemoMode);
      const pendingTask = (currentStep.checklist || []).find(c => c && !c.checked);

      if (bench && bench.status === 'NOT_READY') {
        nextAction = {
          stepId: currentStep.id,
          stepTitle: currentStep.title,
          taskName: 'Take Skill Quiz & Review Core Concepts',
          topic: currentStep.topic || 'General',
          duration: currentStep.duration || 'Flexible',
          reason: `Skill Benchmark indicates NOT READY (${bench.score}). Review ${currentStep.topic} study materials before retrying.`
        };
      } else if (bench && bench.status === 'NEEDS_REVIEW') {
        nextAction = {
          stepId: currentStep.id,
          stepTitle: currentStep.title,
          taskName: 'Revise Topic & Retry Skill Quiz',
          topic: currentStep.topic || 'General',
          duration: currentStep.duration || 'Flexible',
          reason: `Benchmark score is ${bench.score} (Needs Review). Revise ${currentStep.topic} fundamentals to reach READY status.`
        };
      } else {
        nextAction = {
          stepId: currentStep.id,
          stepTitle: currentStep.title,
          taskName: pendingTask ? pendingTask.text : 'Complete remaining step modules',
          topic: currentStep.topic || 'General',
          duration: currentStep.duration || 'Flexible',
          reason: `Currently in progress (${currentStep.topic}). Completing this will advance your roadmap completion.`
        };
      }
    } else {
      const nextLocked = plans.find(p => p.status === 'locked');
      if (nextLocked) {
        nextAction = {
          stepId: nextLocked.id,
          stepTitle: nextLocked.title,
          taskName: (nextLocked.checklist && nextLocked.checklist[0]) ? nextLocked.checklist[0].text : 'Start milestone',
          topic: nextLocked.topic || 'General',
          duration: nextLocked.duration || 'Flexible',
          reason: 'All previous active steps completed. Unlock this milestone to continue progressing.'
        };
      } else {
        nextAction = {
          stepId: null,
          stepTitle: '🎉 All Core Milestones Complete!',
          taskName: 'Review portfolio evidence attachments & practice mock interviews',
          topic: 'Mastery',
          duration: 'Ongoing',
          reason: 'Congratulations! You have completed 100% of all planned steps in your career roadmap.'
        };
      }
    }
  }

  return {
    percent,
    totalSteps,
    completedSteps,
    totalTasks,
    completedTasks,
    statusCounts,
    topicStats,
    difficultyCounts,
    weakAreas,
    readinessSummary,
    nextAction
  };
};

export const exportSummaryReport = (plans = [], metrics = {}, activityLog = [], isDemoMode = false) => {
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const textLines = [
    `==================================================`,
    `       CAREER COPILOT - PERSONALIZED PROGRESS SUMMARY`,
    `       ${isDemoMode ? '[DEMO MODE ACTIVE - SAMPLE LEARNER DATA]' : '[REAL USER PERSONALIZED DATA]'}`,
    `       Generated on: ${dateStr}`,
    `==================================================\n`,
    `OVERALL METRICS:`,
    `- Overall Completion: ${metrics.percent || 0}%`,
    `- Steps Completed: ${metrics.completedSteps || 0} / ${metrics.totalSteps || 0}`,
    `- Tasks Completed: ${metrics.completedTasks || 0} / ${metrics.totalTasks || 0}\n`,
    `SKILL BENCHMARK READINESS:`,
    `- Ready (3/3): ${metrics.readinessSummary?.readyCount || 0}`,
    `- Needs Review (2/3): ${metrics.readinessSummary?.reviewCount || 0}`,
    `- Not Ready (0-1/3): ${metrics.readinessSummary?.notReadyCount || 0}\n`,
    `STATUS BREAKDOWN:`,
    `- Complete: ${metrics.statusCounts?.complete || 0}`,
    `- In Progress: ${metrics.statusCounts?.current || 0}`,
    `- Locked: ${metrics.statusCounts?.locked || 0}\n`,
    `NEXT RECOMMENDED ACTION:`,
    `-> Step: ${metrics.nextAction?.stepTitle || 'N/A'}`,
    `-> Task: ${metrics.nextAction?.taskName || 'N/A'}`,
    `-> Rationale: ${metrics.nextAction?.reason || 'N/A'}\n`,
    `WEAK AREAS IDENTIFIED (${(metrics.weakAreas || []).length}):`,
    ...(metrics.weakAreas || []).map(w => `  [!] ${w.topic}: ${w.completionPercent}% complete. Recommendation: ${w.recommendation}`),
    `\nDETAILED CAREER PLAN STEPS:`,
    ...plans.map(p => {
      const attInfo = p.attachment ? ` (Evidence attached: ${p.attachment.name})` : '';
      return `  Step ${p.stepNum || p.id}: ${p.title} [${(p.status || 'locked').toUpperCase()}] - Topic: ${p.topic || 'General'}${attInfo}`;
    }),
    `\nRECENT LEARNER ACTIVITY:`,
    ...(activityLog || []).slice(0, 5).map(a => `  - ${a.icon || '⚡'} ${a.text} (${a.timestamp})`),
    `==================================================`
  ];

  return textLines.join('\n');
};
