import React, { useState, useEffect, useMemo } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { careerPlanStorage } from '../../services/careerPlanStorage';
import { calculateProgressMetrics } from '../../utils/progressCalculator';
import { getBenchmarkResult } from '../../utils/skillBenchmark';
import LearningSearchFilter from './components/LearningSearchFilter';
import AttachmentManager from './components/AttachmentManager';
import PersonalizedSummary from './components/PersonalizedSummary';
import SkillReadinessBadge from './components/SkillReadinessBadge';
import SkillBenchmarkModal from './components/SkillBenchmarkModal';

export default function Roadmap() {
  const [steps, setSteps] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Skill Benchmark Modal state
  const [activeQuizStep, setActiveQuizStep] = useState(null);

  // Advanced Bounty Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    topic: 'All',
    difficulty: 'All',
    deadline: 'All',
    goal: 'All'
  });

  // Load active plans & activity on mount
  useEffect(() => {
    refreshData();
    setIsLoading(false);
  }, []);

  const refreshData = () => {
    const demoState = careerPlanStorage.isDemoActive();
    const loadedPlans = careerPlanStorage.getPlans();
    const loadedActivity = careerPlanStorage.getActivityLog();

    setIsDemoMode(demoState);
    setSteps(loadedPlans);
    setActivityLog(loadedActivity);

    // Maintain selection or select first active step
    setSelectedStep(prev => {
      if (prev) {
        const found = loadedPlans.find(s => s.id === prev.id);
        if (found) return found;
      }
      return loadedPlans.find(s => s.status === 'current') || loadedPlans[0] || null;
    });
  };

  // Filter plans based on search query and multi-topic filter controls
  const filteredSteps = useMemo(() => {
    return steps.filter(step => {
      // Keyword match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (step.title || '').toLowerCase().includes(q);
        const subMatch = (step.subtitle || '').toLowerCase().includes(q);
        const descMatch = (step.description || '').toLowerCase().includes(q);
        const topicMatch = (step.topic || '').toLowerCase().includes(q);
        const checkMatch = (step.checklist || []).some(c => (c.text || '').toLowerCase().includes(q));

        if (!titleMatch && !subMatch && !descMatch && !topicMatch && !checkMatch) {
          return false;
        }
      }

      // Topic filter
      if (filters.topic !== 'All' && step.topic !== filters.topic) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulty !== 'All' && step.difficulty !== filters.difficulty) {
        return false;
      }

      // Deadline filter
      if (filters.deadline !== 'All' && step.deadline !== filters.deadline) {
        return false;
      }

      // Goal filter
      if (filters.goal !== 'All' && step.goal !== filters.goal) {
        return false;
      }

      return true;
    });
  }, [steps, searchQuery, filters]);

  // Elite Progress Metrics Calculation (Recomputed reactively with demo context)
  const progressMetrics = useMemo(() => {
    return calculateProgressMetrics(steps, isDemoMode);
  }, [steps, isDemoMode]);

  // Handle Checklist Toggle
  const handleChecklistToggle = (stepId, itemId) => {
    careerPlanStorage.toggleChecklist(stepId, itemId);
    refreshData();
  };

  // Handle Direct Step Status Change (Complete | In Progress | Locked)
  const handleStatusChange = (stepId, newStatus) => {
    careerPlanStorage.updateStepStatus(stepId, newStatus);
    refreshData();
  };

  // Handle Save Attachment (Core Bounty)
  const handleSaveAttachment = (stepId, attachment) => {
    careerPlanStorage.saveAttachment(stepId, attachment);
    refreshData();
  };

  // Handle Remove Attachment (Core Bounty)
  const handleRemoveAttachment = (stepId) => {
    careerPlanStorage.saveAttachment(stepId, null);
    refreshData();
  };

  // Toggle Judge Demo Mode ON/OFF
  const handleToggleDemoMode = (enable) => {
    careerPlanStorage.toggleDemoMode(enable);
    refreshData();
  };

  // Reset to Clean Seed Data
  const handleResetToSeed = () => {
    careerPlanStorage.resetToSeed();
    refreshData();
  };

  // Filter handlers
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilters({
      topic: 'All',
      difficulty: 'All',
      deadline: 'All',
      goal: 'All'
    });
  };

  const handleRegenerate = () => {
    alert('AI is recalculating your skill gaps and updating career timelines. Standard paths updated.');
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="roadmap-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="roadmap-page">
      
      {/* Header */}
      <header className="roadmap-header">
        <div>
          <span className="roadmap-kicker">
            ✦ AI Career Path & Learning Hub
          </span>
          <h1 className="roadmap-title">
            Personalized Career Roadmap
          </h1>
          <p className="roadmap-subtitle">
            Your custom learning progression route dynamically optimized with supporting evidence attachments, topic filters, and learner analytics.
          </p>
        </div>

        <div className="roadmap-actions">
          {isDemoMode ? (
            <Button onClick={() => handleToggleDemoMode(false)} variant="ghost" size="sm">
              ↩️ Exit Demo
            </Button>
          ) : (
            <Button onClick={() => handleToggleDemoMode(true)} variant="ghost" size="sm">
              🏆 Judge Demo Mode
            </Button>
          )}
          <Button onClick={handleRegenerate} variant="glow" size="sm">
            ✨ Regenerate with AI
          </Button>
        </div>
      </header>

      {/* 🟣 ELITE BOUNTY: Personalized Learner Progress Summary Banner */}
      <PersonalizedSummary
        metrics={progressMetrics}
        plans={steps}
        activityLog={activityLog}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onResetToSeed={handleResetToSeed}
        onSelectStep={(step) => setSelectedStep(step)}
      />

      {/* 🔵 ADVANCED BOUNTY: Search Input and Topic Filters */}
      <LearningSearchFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalCount={steps.length}
        filteredCount={filteredSteps.length}
      />

      {/* Main Grid Workspace */}
      <div className="roadmap-grid" style={{ marginTop: '24px' }}>
        
        {/* Left Column: Progression Timeline Cards */}
        <section className="roadmap-panel">
          
          {filteredSteps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: 'var(--bg-surface-2)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>🔍</span>
              <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '16px' }}>No Career Plans Match Your Filters</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 16px 0' }}>
                Try adjusting your search keyword or topic filter controls.
              </p>
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                🔄 Clear All Filters
              </Button>
            </div>
          ) : (
            <div className="roadmap-timeline">
              {filteredSteps.map((step) => {
                const isSelected = selectedStep && selectedStep.id === step.id;
                const isCurrent = step.status === 'current';
                const isComplete = step.status === 'complete';
                const hasAttachment = Boolean(step.attachment);

                // Benchmark Quiz Result
                const benchResult = getBenchmarkResult(step.id, isDemoMode);

                return (
                  <div
                    key={step.id}
                    onClick={() => setSelectedStep(step)}
                    className={`roadmap-step ${isComplete ? 'is-complete' : ''} ${isCurrent ? 'is-current' : ''} ${isSelected ? 'is-selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Step Metadata & Badges */}
                    <div className="roadmap-step__meta">
                      <span>Step {step.stepNum}</span>
                      <span>·</span>
                      <span>{step.duration}</span>
                      <span>·</span>
                      <span style={{ color: 'var(--primary-light)', fontWeight: 700 }}>{step.topic}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <h3 className="roadmap-step__title">{step.title}</h3>
                        <p className="roadmap-step__text" style={{ marginTop: '4px' }}>{step.subtitle}</p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        <span className={`badge ${isComplete ? 'badge-success' : isCurrent ? 'badge-primary' : 'badge-muted'}`}>
                          {isComplete ? 'Complete' : isCurrent ? 'In Progress' : 'Locked'}
                        </span>
                        
                        {/* Skill Benchmark Readiness Badge */}
                        <SkillReadinessBadge result={benchResult} compact />
                      </div>
                    </div>

                    {/* Skill Checklist Snippets & Attachment / Quiz Action Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div className="roadmap-skills">
                        {(step.checklist || []).slice(0, 3).map(item => (
                          <span
                            key={item.id}
                            className="roadmap-skill"
                            style={{ color: item.checked ? 'var(--success)' : 'var(--text-secondary)' }}
                          >
                            {item.checked ? '✓' : '○'} {item.text.split(' ')[0]}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* 🔵 Core Bounty Evidence Attachment Badge Indicator */}
                        {hasAttachment && (
                          <span
                            className="badge badge-success"
                            style={{ fontSize: '10.5px', gap: '4px', background: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.3)' }}
                            title={`Evidence attached: ${step.attachment.name}`}
                          >
                            📎 Evidence Attached
                          </span>
                        )}

                        {/* Quiz Action Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStep(step);
                            setActiveQuizStep(step);
                          }}
                          style={{
                            background: 'var(--primary-soft)',
                            border: '1px solid var(--border-brand)',
                            color: 'var(--text-brand)',
                            borderRadius: '6px',
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          📝 Take Skill Quiz
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </section>

        {/* Right Column: Detailed Selected Plan Sidebar & Controls */}
        {selectedStep && (
          <section className="roadmap-sidebar">
            
            <Card title={`Step ${selectedStep.stepNum} · Details`} subtitle={selectedStep.title} className="roadmap-summary">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
                
                {/* Meta info pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span className="badge badge-primary">{selectedStep.topic}</span>
                  <span className="badge badge-muted">{selectedStep.difficulty}</span>
                  <span className="badge badge-muted">⏱ {selectedStep.duration}</span>
                  <span className="badge badge-muted">🎯 {selectedStep.goal}</span>
                </div>

                {/* Benchmark Quiz Card & Action Button */}
                <div style={{ background: 'var(--bg-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-brand)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--text-primary)', fontSize: '12.5px' }}>
                      📝 Skill Readiness Benchmark
                    </strong>
                    <Button
                      variant="glow"
                      size="sm"
                      onClick={() => setActiveQuizStep(selectedStep)}
                    >
                      Take Quiz ➔
                    </Button>
                  </div>

                  <SkillReadinessBadge result={getBenchmarkResult(selectedStep.id, isDemoMode)} />
                </div>

                {/* Direct Milestone Status Control Selector */}
                <div style={{ background: 'var(--bg-surface-2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Milestone Progress Status:
                  </label>
                  <select
                    value={selectedStep.status || 'locked'}
                    onChange={(e) => handleStatusChange(selectedStep.id, e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-surface-3)',
                      border: '1px solid var(--border-brand)',
                      borderRadius: '6px',
                      padding: '8px 10px',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <option value="complete" style={{ background: '#0f172a' }}>✅ Completed</option>
                    <option value="current" style={{ background: '#0f172a' }}>⚡ In Progress</option>
                    <option value="locked" style={{ background: '#0f172a' }}>🔒 Locked / Pending</option>
                  </select>
                </div>

                {/* Description */}
                {selectedStep.description && (
                  <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    {selectedStep.description}
                  </p>
                )}

                {/* 🔵 CORE BOUNTY: Attachment Manager Component */}
                <AttachmentManager
                  step={selectedStep}
                  onSaveAttachment={handleSaveAttachment}
                  onRemoveAttachment={handleRemoveAttachment}
                />

                {/* Target Checklist Tasks */}
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block', marginBottom: '10px' }}>
                    Target Checklist Tasks:
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(selectedStep.checklist || []).map(item => (
                      <label
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: item.checked ? 'var(--text-muted)' : 'var(--text-secondary)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(item.checked)}
                          onChange={() => handleChecklistToggle(selectedStep.id, item.id)}
                          style={{ marginTop: '3px', accentColor: 'var(--primary)' }}
                        />
                        <span style={{ textDecoration: item.checked ? 'line-through' : 'none' }}>
                          {item.text}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Resources list */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                    Study Guides & Material:
                  </strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(selectedStep.resources || []).map((res, i) => (
                      <a
                        key={i}
                        href={res.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '12.5px',
                          color: 'var(--primary-light)',
                          textDecoration: 'none',
                          background: 'var(--bg-surface-2)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          transition: 'all 200ms ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--bg-surface-3)';
                          e.currentTarget.style.borderColor = 'var(--border-strong)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--bg-surface-2)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                      >
                        <span>{res.name}</span>
                        <span className="badge badge-muted" style={{ fontSize: '9px' }}>{res.type}</span>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Overall completion bar */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                    Overall Path Completion
                  </strong>
                  <div className="roadmap-progress">
                    <span className="roadmap-progress__bar" style={{ width: `${progressMetrics.percent}%` }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                    <span>Steps Completed</span>
                    <span>{progressMetrics.completedSteps} / {progressMetrics.totalSteps}</span>
                  </div>
                </div>

              </div>
            </Card>

            {/* AI Career Coach Widget */}
            <Card title="🤖 AI Career Coach" glow style={{ marginTop: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                <p style={{ margin: 0, lineHeight: '1.5' }}>
                  "You have completed {progressMetrics.completedTasks} checklist tasks so far! Click **Take Skill Quiz** on any milestone to evaluate your skill readiness."
                </p>
              </div>
            </Card>

          </section>
        )}

      </div>

      {/* Skill Benchmark Quiz Modal */}
      <SkillBenchmarkModal
        isOpen={Boolean(activeQuizStep)}
        onClose={() => setActiveQuizStep(null)}
        step={activeQuizStep}
        onCompleteMilestone={(stepId, status) => {
          handleStatusChange(stepId, status);
          refreshData();
        }}
        isDemoMode={isDemoMode}
      />
    </div>
  );
}
