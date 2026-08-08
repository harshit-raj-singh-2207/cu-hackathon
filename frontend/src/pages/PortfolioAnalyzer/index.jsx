import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { githubService } from '../../services/githubService';
import { portfolioAnalyzerService } from '../../services/portfolioAnalyzerService';
import { careerPlanStorage } from '../../services/careerPlanStorage';
import {
  calculatePortfolioScorecard,
  getPortfolioHistory,
  savePortfolioAnalysisToHistory
} from '../../utils/portfolioScoring';

export default function PortfolioAnalyzer() {
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [githubUser, setGithubUser] = useState('kumar-codes');
  const [repoUrl, setRepoUrl] = useState('');
  const [targetGoal, setTargetGoal] = useState('Full Stack Developer');

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [stageText, setStageText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // History & Demo State
  const [history, setHistory] = useState([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    const demo = careerPlanStorage.isDemoActive();
    setIsDemoMode(demo);
    setHistory(getPortfolioHistory(demo));
  }, []);

  // Handle Analysis Run
  const handleAnalyze = async () => {
    if (!githubUser.trim() && !portfolioUrl.trim()) {
      setErrorMsg('Please enter a GitHub username or Portfolio URL to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg('');
    setAnalysisResult(null);

    try {
      // Stage 1: Fetching GitHub Profile
      setStageText('Fetching GitHub Profile metadata...');
      let profile = null;
      let repos = [];

      if (githubUser.trim()) {
        profile = await githubService.getUserProfile(githubUser);
        setStageText('Analyzing Public Repositories & Activity...');
        repos = await githubService.getUserRepos(githubUser);
      }

      // Stage 2: Fetching README
      setStageText('Evaluating README Structure & Documentation...');
      let readmeText = '';
      if (repos.length > 0) {
        readmeText = await githubService.getRepoReadme(profile?.login || githubUser, repos[0].name) || '';
      }

      // Stage 3: Evaluating Quality
      setStageText('Scoring Code Architecture, Testing, & Maintainability...');
      const readmeAnalysis = portfolioAnalyzerService.evaluateReadmeQuality(readmeText);
      const repoQuality = portfolioAnalyzerService.evaluateRepoQuality(repos[0] || {}, readmeAnalysis);

      // Stage 4: Analyzing Portfolio Website
      setStageText('Parsing Portfolio Website Structure Signals...');
      let portfolioAnalysis = null;
      if (portfolioUrl.trim()) {
        portfolioAnalysis = await portfolioAnalyzerService.analyzePortfolioWebsite(portfolioUrl);
      }

      // Stage 5: Final Scorecard Calculation
      setStageText('Comparing Skills against Career Goal & Generating Recommendations...');
      const scorecard = calculatePortfolioScorecard({
        githubProfile: profile,
        repos,
        readmeAnalysis,
        repoQuality,
        portfolioAnalysis,
        targetGoal
      });

      const result = {
        githubUser: profile?.login || githubUser,
        profile,
        repos,
        readmeAnalysis,
        repoQuality,
        portfolioAnalysis,
        scorecard,
        targetGoal,
        analyzedAt: new Date().toISOString()
      };

      setAnalysisResult(result);

      if (!isDemoMode) {
        savePortfolioAnalysisToHistory(result);
        setHistory(getPortfolioHistory(false));
      }
    } catch (err) {
      console.error('Portfolio Analysis Error:', err);
      setErrorMsg(err.message || 'Analysis failed. Please check inputs and try again.');
    } finally {
      setIsAnalyzing(false);
      setStageText('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px', margin: '0 auto', padding: '10px 0' }}>
      
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ color: 'var(--primary-light)', fontSize: '11.5px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              ✦ AI Career Copilot
            </span>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: '4px 0 0 0' }}>
              AI Portfolio & GitHub Repository Analyzer
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: '4px 0 0 0' }}>
              Audit public portfolio structure, README documentation quality, testing coverage, and GitHub project depth against target job requirements.
            </p>
          </div>
        </div>
      </header>

      {/* Input Section Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        <Card title="🔍 Portfolio & GitHub Inputs" subtitle="Enter your public profiles or specific repository URL for automated AI evaluation.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            
            <div>
              <label style={s.label}>Target Career Goal</label>
              <select style={s.select} value={targetGoal} onChange={(e) => setTargetGoal(e.target.value)}>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="AI/ML Engineer">AI/ML Engineer</option>
              </select>
            </div>

            <div>
              <label style={s.label}>GitHub Username</label>
              <input
                style={s.input}
                type="text"
                placeholder="e.g. octocat or kumar-codes"
                value={githubUser}
                onChange={(e) => setGithubUser(e.target.value)}
              />
            </div>

            <div>
              <label style={s.label}>Portfolio Website URL (Optional)</label>
              <input
                style={s.input}
                type="url"
                placeholder="https://myportfolio.dev"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
              />
            </div>

            <div>
              <label style={s.label}>Specific Repository URL (Optional)</label>
              <input
                style={s.input}
                type="url"
                placeholder="https://github.com/username/repository-name"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
              />
            </div>

            {errorMsg && (
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '12px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Analysis Progress Stage Indicator */}
            {isAnalyzing && (
              <div style={{ background: 'var(--bg-surface-3)', border: '1px solid var(--border-brand)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <div className="roadmap-loading-spinner" style={{ margin: '0 auto 8px auto' }} />
                <span style={{ fontSize: '12px', color: 'var(--text-brand)', fontWeight: 600 }}>
                  {stageText || 'Analyzing portfolio metadata...'}
                </span>
              </div>
            )}

            <Button
              variant="glow"
              size="md"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              style={{ marginTop: '8px' }}
            >
              {isAnalyzing ? 'Analyzing Portfolio...' : '⚡ Analyze Portfolio & GitHub'}
            </Button>

          </div>
        </Card>

        {/* History Table */}
        <Card title="📜 Analysis History" subtitle="Previous portfolio scorecards & evaluations.">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {history.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                No previous portfolio evaluations found. Run an analysis above.
              </div>
            ) : (
              history.map((item, i) => (
                <div
                  key={item.id || i}
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block' }}>
                      {item.githubUser} · {item.targetGoal}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {item.date} · {item.reposAnalyzed} Public Repos
                    </span>
                  </div>

                  <span style={{ fontSize: '18px', fontWeight: 900, color: item.overallScore >= 80 ? '#4ade80' : '#fef08a' }}>
                    {item.overallScore}/100
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

      </div>

      {/* ──────────────────────────────────────────────────────────
         ANALYSIS RESULT SCORECARD & BREAKDOWN
         ────────────────────────────────────────────────────────── */}
      {analysisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Scorecard Header */}
          <Card title="📊 AI Portfolio Scorecard" subtitle={`Assessment for @${analysisResult.githubUser} · Target Goal: ${analysisResult.targetGoal}`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={s.scoreBox}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--primary-light)', display: 'block' }}>
                    {analysisResult.scorecard.overallScore}/100
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Overall Portfolio Score</span>
                </div>

                <div style={s.scoreBox}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--success)', display: 'block' }}>
                    {analysisResult.scorecard.categoryScores.githubActivity}/100
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>GitHub Activity</span>
                </div>

                <div style={s.scoreBox}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', display: 'block' }}>
                    {analysisResult.scorecard.categoryScores.readmeQuality}/100
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>README Quality</span>
                </div>

                <div style={s.scoreBox}>
                  <span style={{ fontSize: '28px', fontWeight: 900, color: '#ec4899', display: 'block' }}>
                    {analysisResult.scorecard.categoryScores.testing}/100
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Testing Coverage</span>
                </div>
              </div>

              {/* Career Goal Skill Match Table */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                  🎯 Career Goal Skill Coverage Match ({analysisResult.targetGoal})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {analysisResult.scorecard.skillCoverage.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'var(--bg-surface-2)',
                        border: '1px solid var(--border)',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ fontSize: '12.5px', color: 'var(--text-primary)', fontWeight: 600 }}>{item.skill}</span>
                      <span className={`badge ${item.isDetected ? 'badge-success' : 'badge-muted'}`} style={{ fontSize: '10px' }}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strengths & Recommended Improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', padding: '14px', borderRadius: '10px' }}>
                  <strong style={{ color: '#4ade80', fontSize: '13px', display: 'block', marginBottom: '6px' }}>✓ Identified Strengths:</strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {analysisResult.scorecard.strengths.map((str, i) => <li key={i}>{str}</li>)}
                  </ul>
                </div>

                <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '14px', borderRadius: '10px' }}>
                  <strong style={{ color: '#f87171', fontSize: '13px', display: 'block', marginBottom: '6px' }}>⚠️ Recommended Improvements:</strong>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                    {analysisResult.scorecard.improvements.map((imp, i) => <li key={i}>{imp}</li>)}
                  </ul>
                </div>
              </div>

            </div>
          </Card>

          {/* Top Repositories List */}
          {analysisResult.repos.length > 0 && (
            <Card title="📁 Analyzed Public Repositories" subtitle={`Top repositories found for @${analysisResult.githubUser}`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {analysisResult.repos.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border)',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <a
                        href={r.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary-light)', textDecoration: 'none' }}
                      >
                        {r.name} ↗
                      </a>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {r.description || 'No description provided.'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {r.language && <span className="badge badge-primary">{r.language}</span>}
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>⭐ {r.stargazers_count}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>🍴 {r.forks_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      )}

    </div>
  );
}

const s = {
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '6px'
  },
  select: {
    width: '100%',
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13.5px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  input: {
    width: '100%',
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-strong)',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box'
  },
  scoreBox: {
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '14px',
    textAlign: 'center'
  }
};
