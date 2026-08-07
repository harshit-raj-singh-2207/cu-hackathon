import React, { useState, useMemo, useEffect } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import { apiRequest } from '../../services/api';

const FALLBACK_STEPS = [
  {
    id: 1,
    stepNum: 1,
    title: 'HTML & CSS Architecture',
    subtitle: 'Layout foundations & syntax specs',
    status: 'current', // 'complete' | 'current' | 'locked'
    duration: 'Week 1',
    resources: [
      { type: 'Doc', name: 'CSS Grid Layout specifications', href: '#' },
      { type: 'Video', name: 'Fluid Typography & layouts', href: '#' }
    ],
    checklist: [
      { id: 101, text: 'CSS Grid & Flexbox alignment parameters', checked: false },
      { id: 102, text: 'Fluid typography using rem & vh units', checked: false },
      { id: 103, text: 'Semantic HTML markup structures for SEO', checked: false }
    ]
  }
];

export default function Roadmap() {
  const [userGoal, setUserGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRoadmapReady, setIsRoadmapReady] = useState(false);

  const [steps, setSteps] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  
  useEffect(() => {
    fetchActiveRoadmap();
  }, []);

  const fetchActiveRoadmap = async () => {
    try {
      const roadmapsRes = await apiRequest('/roadmaps');
      if (roadmapsRes && roadmapsRes.items && roadmapsRes.items.length > 0) {
        // Find the most recent active roadmap
        const activeRoadmap = roadmapsRes.items[0];
        setUserGoal(activeRoadmap.goal_text || activeRoadmap.roadmap_name);
        
        // Fetch phases
        const phases = await apiRequest(`/roadmaps/${activeRoadmap.id}/phases`);
        
        const builtSteps = [];
        for (const phase of phases) {
          // Fetch tasks for each phase
          const tasks = await apiRequest(`/roadmaps/phases/${phase.id}/tasks`);
          
          builtSteps.push({
            id: phase.id,
            roadmapId: activeRoadmap.id,
            stepNum: phase.phase_number,
            title: phase.title,
            subtitle: phase.description,
            status: phase.status,
            duration: `Week ${phase.phase_number}`,
            resources: [], // Expandable metadata
            checklist: tasks.sort((a,b) => a.order - b.order).map(t => ({
              id: t.id,
              text: t.title,
              checked: t.status === 'completed'
            }))
          });
        }
        
        // Ensure steps ordered by week
        builtSteps.sort((a, b) => a.stepNum - b.stepNum);
        
        setSteps(builtSteps);
        setSelectedStep(builtSteps[0]);
        setIsRoadmapReady(true);
      }
    } catch (error) {
      console.error("Failed to load existing roadmap", error);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!userGoal.trim()) return;

    setIsGenerating(true);
    try {
      const requestBody = { goal: userGoal };
      await apiRequest('/roadmaps/generate-from-goal', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      await fetchActiveRoadmap();
    } catch (error) {
      console.error('Failed to generate roadmap', error);
      // Fallback
      setSteps(FALLBACK_STEPS);
      setSelectedStep(FALLBACK_STEPS[0]);
      setIsRoadmapReady(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setIsRoadmapReady(false);
    setUserGoal('');
    setSteps([]);
    setSelectedStep(null);
  };

  const handleStepSelect = (step) => {
    setSelectedStep(step);
  };

  const handleChecklistToggle = async (stepId, itemId) => {
    const stepToUpdate = steps.find(s => s.id === stepId);
    if (!stepToUpdate || stepToUpdate.status === 'locked') return;

    const itemToUpdate = stepToUpdate.checklist.find(i => i.id === itemId);
    if (!itemToUpdate) return;
    
    const nextCheckedState = !itemToUpdate.checked;
    const newStatus = nextCheckedState ? 'completed' : 'pending';

    // Optimistic Update
    const updatedSteps = steps.map(step => {
      if (step.id === stepId) {
        const nextChecklist = step.checklist.map(item => {
          if (item.id === itemId) return { ...item, checked: nextCheckedState };
          return item;
        });

        const allChecked = nextChecklist.every(item => item.checked);
        let nextStatus = step.status;
        if (allChecked) {
          nextStatus = 'completed';
        } else if (step.status === 'completed' || step.status === 'complete') {
          nextStatus = 'current';
        }

        const nextStep = { ...step, checklist: nextChecklist, status: nextStatus };
        
        if (selectedStep && selectedStep.id === stepId) {
          setSelectedStep(nextStep);
        }

        return nextStep;
      }
      return step;
    });

    // Auto-unlock next step logic
    for (let i = 0; i < updatedSteps.length; i++) {
        if ((updatedSteps[i].status === 'completed' || updatedSteps[i].status === 'complete') && updatedSteps[i+1] && updatedSteps[i+1].status === 'locked') {
            updatedSteps[i+1].status = 'current';
        }
    }

    setSteps(updatedSteps);

    // Backend sync
    try {
       await apiRequest(`/roadmaps/tasks/${itemId}`, {
           method: 'PATCH',
           body: JSON.stringify({ status: newStatus })
       });
    } catch(err) {
       console.error("Failed to update task across backend", err);
       // We can revert pessimistic state here
    }
  };

  const progressMetrics = useMemo(() => {
    let totalItems = 0;
    let checkedItems = 0;
    steps.forEach(step => {
      step.checklist.forEach(item => {
        totalItems++;
        if (item.checked) checkedItems++;
      });
    });

    const percent = Math.round((checkedItems / (totalItems || 1)) * 100);
    return {
      percent,
      completedSteps: steps.filter(s => s.status === 'completed' || s.status === 'complete').length,
      totalSteps: steps.length
    };
  }, [steps]);


  // ==========================================
  // VIEW 1: GENERATOR INPUT
  // ==========================================
  if (!isRoadmapReady) {
    return (
      <div className="roadmap-page roadmap-page--generator">
        <div className="roadmap-generator-container">
          <div className="roadmap-generator-header">
            <span className="roadmap-kicker">✦ AI Career Architect</span>
            <h1 className="roadmap-title">What is your career goal?</h1>
            <p className="roadmap-subtitle">
              Tell us what you want to achieve. Our AI will instantly craft a step-by-step weekly progression roadmap with curated assignments and resources.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="roadmap-generator-form">
            <textarea 
              className="roadmap-generator-textarea"
              placeholder="e.g., I want to transition from a manual QA tester to a Senior Automation Engineer in 6 months..."
              value={userGoal}
              onChange={(e) => setUserGoal(e.target.value)}
              disabled={isGenerating}
              rows={4}
              autoFocus
            />
            <div className="roadmap-generator-actions">
              <Button type="submit" variant="primary" disabled={isGenerating || !userGoal.trim()}>
                {isGenerating ? 'AI is generating...' : 'Generate Persistent Roadmap →'}
              </Button>
            </div>
          </form>

          {isGenerating && (
            <div className="roadmap-generator-loading">
              <div className="roadmap-loading-spinner" />
              <div className="roadmap-loading-text">
                <p>Analyzing career requirements...</p>
                <p className="roadmap-loading-sub">Storing weekly assignments securely in your account.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ROADMAP DISPLAY
  // ==========================================
  return (
    <div className="roadmap-page">
      <header className="roadmap-header">
        <div>
          <span className="roadmap-kicker">
            ✦ AI Career Path
          </span>
          <h1 className="roadmap-title">
            Personalized Career Roadmap
          </h1>
          <p className="roadmap-subtitle">
            Goal: <strong style={{color:'var(--text-primary)'}}>{userGoal}</strong>
          </p>
        </div>

        <div className="roadmap-actions">
          <Button onClick={handleReset} variant="outline" size="sm">
            ↺ Start Over
          </Button>
        </div>
      </header>

      <div className="roadmap-grid">
        <section className="roadmap-panel">
          <div className="roadmap-timeline">
            {steps.map((step) => {
              const isSelected = selectedStep && selectedStep.id === step.id;
              const isCurrent = step.status === 'current';
              const isComplete = step.status === 'complete' || step.status === 'completed';
              const isLocked = step.status === 'locked';

              return (
                <div
                  key={step.id}
                  onClick={() => handleStepSelect(step)}
                  className={`roadmap-step ${isComplete ? 'is-complete' : ''} ${isCurrent ? 'is-current' : ''} ${isSelected ? 'is-selected' : ''} ${isLocked ? 'is-locked' : ''}`}
                >
                  <div className="roadmap-step__meta">
                    <span>{step.duration}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <h3 className="roadmap-step__title">{step.title}</h3>
                    <span className={`badge ${isComplete ? 'badge-success' : isCurrent ? 'badge-primary' : 'badge-muted'}`}>
                      {isComplete ? 'Complete' : isCurrent ? 'In Progress' : 'Locked'}
                    </span>
                  </div>
                  <p className="roadmap-step__text">{step.subtitle}</p>

                  <div className="roadmap-skills">
                    {step.checklist.slice(0, 3).map(item => (
                      <span
                        key={item.id}
                        className="roadmap-skill"
                        style={{ color: item.checked ? 'var(--success)' : 'var(--text-secondary)' }}
                      >
                        {item.checked ? '✓' : '○'} {item.text.split(' ').slice(0, 2).join(' ')}...
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="roadmap-sidebar">
          {selectedStep ? (
             <Card title={`${selectedStep.duration} Details`} subtitle={selectedStep.title} className="roadmap-summary">
             <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
               
               <div>
                 <strong style={{ color: 'var(--text-primary)', fontSize: '14px', display: 'block', marginBottom: '12px' }}>
                   📝 Weekly Assignments:
                 </strong>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                   {selectedStep.checklist.map(item => (
                     <label
                       key={item.id}
                       style={{
                         display: 'flex',
                         alignItems: 'flex-start',
                         gap: '10px',
                         cursor: selectedStep.status === 'locked' ? 'not-allowed' : 'pointer',
                         fontSize: '13px',
                         color: item.checked ? 'var(--text-muted)' : 'var(--text-secondary)',
                         opacity: selectedStep.status === 'locked' ? 0.6 : 1
                       }}
                     >
                       <input
                         type="checkbox"
                         checked={item.checked}
                         disabled={selectedStep.status === 'locked'}
                         onChange={() => handleChecklistToggle(selectedStep.id, item.id)}
                         style={{ marginTop: '3px', accentColor: 'var(--primary)' }}
                       />
                       <span style={{ textDecoration: item.checked ? 'line-through' : 'none', lineHeight: '1.4' }}>
                         {item.text}
                       </span>
                     </label>
                   ))}
                 </div>
               </div>
 
               <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                 <strong style={{ color: 'var(--text-primary)', fontSize: '13px', display: 'block', marginBottom: '8px' }}>
                   📚 How to do it (Resources):
                 </strong>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                   {selectedStep.resources && selectedStep.resources.length > 0 ? selectedStep.resources.map((res, i) => (
                     <a
                       key={i}
                       href={res.href}
                       style={{
                         display: 'flex',
                         justifyContent: 'space-between',
                         alignItems: 'center',
                         fontSize: '12.5px',
                         color: 'var(--primary-light)',
                         textDecoration: 'none',
                         background: 'var(--bg-surface-2)',
                         padding: '10px 12px',
                         borderRadius: '8px',
                         border: '1px solid var(--border)',
                         transition: 'all 200ms ease',
                         opacity: selectedStep.status === 'locked' ? 0.6 : 1,
                         pointerEvents: selectedStep.status === 'locked' ? 'none' : 'auto'
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
                   )) : (
                     <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>AI generated plan stored securely in your dashboard. Expand assignments to track progress.</span>
                   )}
                 </div>
               </div>
 
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
          ) : null}
        </section>
      </div>
    </div>
  );
}
