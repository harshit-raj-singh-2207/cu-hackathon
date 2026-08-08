const STORAGE_KEYS = {
  HISTORY: 'cc_portfolio_history'
};

export const calculatePortfolioScorecard = ({
  githubProfile = null,
  repos = [],
  readmeAnalysis = {},
  repoQuality = {},
  portfolioAnalysis = null,
  targetGoal = 'Full Stack Developer'
}) => {
  const publicRepoCount = githubProfile?.public_repos || repos.length || 5;
  const activityScore = Math.min(100, Math.max(50, publicRepoCount * 8 + 40));

  const repositoryQualityScore = repoQuality.overallScore || 76;
  const readmeScore = readmeAnalysis.score || 70;
  const projectDepthScore = Math.min(100, Math.max(60, repos.length * 5 + 65));
  const documentationScore = Math.round((readmeScore + (repoQuality.categoryScores?.documentation || 70)) / 2);
  const testingScore = repoQuality.categoryScores?.testing || 55;

  const overallScore = Math.round(
    (activityScore * 0.15) +
    (repositoryQualityScore * 0.25) +
    (readmeScore * 0.20) +
    (projectDepthScore * 0.15) +
    (documentationScore * 0.15) +
    (testingScore * 0.10)
  );

  // Extract detected technologies across repositories
  const detectedTech = new Set(['JavaScript', 'React', 'HTML/CSS']);
  repos.forEach(r => {
    if (r.language) detectedTech.add(r.language);
  });

  // Compare detected technologies against target Career Goal
  const targetSkillMap = {
    'Full Stack Developer': ['JavaScript', 'React', 'Node.js', 'Express', 'HTML/CSS', 'PostgreSQL'],
    'Frontend Developer': ['JavaScript', 'React', 'TypeScript', 'HTML/CSS', 'Redux'],
    'Backend Developer': ['Node.js', 'Python', 'Java', 'PostgreSQL', 'Docker', 'REST APIs'],
    'AI/ML Engineer': ['Python', 'PyTorch', 'TensorFlow', 'NumPy', 'Pandas', 'RAG']
  };

  const requiredSkills = targetSkillMap[targetGoal] || targetSkillMap['Full Stack Developer'];
  const skillCoverage = requiredSkills.map(skill => {
    const isDetected = Array.from(detectedTech).some(t => t.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(t.toLowerCase()));
    return {
      skill,
      status: isDetected ? 'Strong' : 'Limited',
      isDetected
    };
  });

  const strengths = [];
  const improvements = [];

  if (activityScore >= 75) strengths.push('Active GitHub profile with consistent public projects.');
  if (readmeScore >= 70) strengths.push('Clear project documentation and README structure.');
  if (testingScore < 60) improvements.push('Add unit and integration test suites (Jest/Cypress) to repositories.');
  if (readmeScore < 70) improvements.push('Include live demo links and environment variable setup guides in README files.');

  return {
    overallScore,
    categoryScores: {
      githubActivity: activityScore,
      repositoryQuality: repositoryQualityScore,
      readmeQuality: readmeScore,
      projectDepth: projectDepthScore,
      documentation: documentationScore,
      testing: testingScore
    },
    detectedTech: Array.from(detectedTech),
    skillCoverage,
    strengths,
    improvements
  };
};

export const getPortfolioHistory = (isDemoMode = false) => {
  if (isDemoMode) {
    return [
      {
        id: 'demo-port-101',
        date: '2026-08-08',
        githubUser: 'demo-developer',
        overallScore: 82,
        targetGoal: 'Full Stack Developer',
        reposAnalyzed: 6,
        topRepoName: 'AI-Career-Copilot'
      },
      {
        id: 'demo-port-102',
        date: '2026-08-02',
        githubUser: 'demo-developer',
        overallScore: 74,
        targetGoal: 'Frontend Developer',
        reposAnalyzed: 4,
        topRepoName: 'React-Dashboard-UI'
      }
    ];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to parse portfolio history', e);
  }
  return [];
};

export const savePortfolioAnalysisToHistory = (analysisData) => {
  try {
    const current = getPortfolioHistory(false);
    const newEntry = {
      id: 'port-' + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      githubUser: analysisData.githubUser || 'Anonymous',
      overallScore: analysisData.scorecard?.overallScore || 75,
      targetGoal: analysisData.targetGoal || 'Full Stack Developer',
      reposAnalyzed: analysisData.repos?.length || 0,
      topRepoName: analysisData.repos?.[0]?.name || 'N/A'
    };

    const updated = [newEntry, ...current].slice(0, 15);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save portfolio analysis to history', e);
    return [];
  }
};
