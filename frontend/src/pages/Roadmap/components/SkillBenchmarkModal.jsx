import React, { useState, useEffect } from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import SkillReadinessBadge from './SkillReadinessBadge';
import { getQuestionsForStep, evaluateQuizResult, saveBenchmarkResult } from '../../../utils/skillBenchmark';

export default function SkillBenchmarkModal({
  isOpen,
  onClose,
  step,
  onCompleteMilestone,
  isDemoMode = false
}) {
  const [questions, setQuestions] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen && step) {
      const qList = getQuestionsForStep(step);
      setQuestions(qList);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setQuizResult(null);
      setIsSubmitted(false);
    }
  }, [isOpen, step]);

  if (!isOpen || !step) return null;

  const handleSelectOption = (qIdx, optIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [qIdx]: optIdx
    }));
  };

  const handleSubmitQuiz = () => {
    if (!questions) return;
    const result = evaluateQuizResult(selectedAnswers, questions);
    setQuizResult(result);
    setIsSubmitted(true);

    if (!isDemoMode) {
      saveBenchmarkResult(step.id, result);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setQuizResult(null);
    setIsSubmitted(false);
  };

  const handleMarkCompleted = () => {
    onCompleteMilestone(step.id, 'complete');
    onClose();
  };

  const handleDownloadBadge = () => {
    const text = [
      `==================================================`,
      `    AI CAREER COPILOT - LEARNING READINESS BADGE`,
      `==================================================\n`,
      `Milestone: ${step.title}`,
      `Topic: ${step.topic}`,
      `Score: ${quizResult?.score} (${quizResult?.percentage}%)`,
      `Readiness Status: ${quizResult?.readinessText.toUpperCase()}`,
      `Attempted Date: ${new Date().toLocaleDateString()}\n`,
      `This badge verifies completion of the self-paced skill benchmark quiz.`,
      `==================================================`
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Skill-Readiness-Badge-${step.topic.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const currentQ = questions ? questions[currentIndex] : null;
  const isAllAnswered = questions ? Object.keys(selectedAnswers).length === questions.length : false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Skill Benchmark · ${step.title}`}
      maxWidth="680px"
    >
      {!questions ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <span style={{ fontSize: '36px', display: 'block', marginBottom: '12px' }}>📖</span>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 6px 0', fontSize: '16px' }}>
            Skill Benchmark Not Available
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 20px 0' }}>
            A structured benchmark quiz is not available for topic "{step.topic || 'General'}" yet. You can still complete checklist tasks directly.
          </p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : !isSubmitted ? (
        /* QUIZ QUESTION VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Progress Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-2)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-brand)' }}>
              Topic: {step.topic}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Question <strong>{currentIndex + 1}</strong> of <strong>{questions.length}</strong>
            </span>
          </div>

          {/* Question Box */}
          <div>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              {currentQ?.question}
            </h4>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {currentQ?.options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[currentIndex] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelectOption(currentIndex, oIdx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--primary-soft)' : 'var(--bg-surface-2)',
                      color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                      textAlign: 'left',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isSelected ? 'var(--primary)' : 'var(--bg-surface-3)',
                        color: isSelected ? '#fff' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                    <span style={{ flex: 1 }}>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
            >
              ⬅ Previous
            </Button>

            {currentIndex < questions.length - 1 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1))}
              >
                Next ➔
              </Button>
            ) : (
              <Button
                variant="glow"
                size="sm"
                onClick={handleSubmitQuiz}
                disabled={!isAllAnswered}
              >
                Submit Quiz 🎯
              </Button>
            )}
          </div>

        </div>
      ) : (
        /* QUIZ RESULT VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <SkillReadinessBadge result={quizResult} />

          <div style={{ background: 'var(--bg-surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Skill Benchmark Result
            </span>
            <span style={{ fontSize: '32px', fontWeight: 900, color: quizResult?.badgeColor === 'success' ? '#4ade80' : quizResult?.badgeColor === 'warning' ? '#fef08a' : '#f87171' }}>
              {quizResult?.score} ({quizResult?.percentage}%)
            </span>

            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              {quizResult?.status === 'READY' && '🎉 Excellent! You have demonstrated full topic readiness.'}
              {quizResult?.status === 'NEEDS_REVIEW' && '⚠️ Good effort. We recommend reviewing key concepts before completing this milestone.'}
              {quizResult?.status === 'NOT_READY' && '❌ Knowledge gaps detected. Please review milestone materials and retry.'}
            </p>
          </div>

          {/* Answer Review Explanations */}
          <div>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: 'var(--text-primary)' }}>
              Question Review & Explanations:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
              {questions.map((q, idx) => {
                const userAns = selectedAnswers[idx];
                const isCorrect = userAns === q.correctIndex;
                return (
                  <div
                    key={q.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      border: isCorrect ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {idx + 1}. {q.question} {isCorrect ? '✓' : '❌'}
                    </div>
                    <div style={{ color: isCorrect ? '#4ade80' : '#f87171', fontSize: '11.5px' }}>
                      Your Answer: {q.options[userAns] || 'Unanswered'}
                    </div>
                    {!isCorrect && (
                      <div style={{ color: '#4ade80', fontSize: '11.5px', marginTop: '2px' }}>
                        Correct: {q.options[q.correctIndex]}
                      </div>
                    )}
                    {q.explanation && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', fontStyle: 'italic' }}>
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Result Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="ghost" size="sm" onClick={handleRetry}>
                🔄 Retry Quiz
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownloadBadge}>
                📜 Download Badge
              </Button>
            </div>

            <Button
              variant="glow"
              size="sm"
              onClick={handleMarkCompleted}
              disabled={quizResult?.status !== 'READY' && step.status !== 'complete'}
            >
              {quizResult?.status === 'READY' ? '✅ Mark as Completed' : 'Review Recommended'}
            </Button>
          </div>

        </div>
      )}
    </Modal>
  );
}
