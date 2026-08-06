import React, { useCallback, useEffect, useState } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';
import Modal from '../../components/Modal';
import { applyToJob, getRecommendations } from '../../services/jobService';

const locationToFilter = {
  All: undefined,
  Remote: 'Remote',
  Bangalore: 'Bengaluru',
};

export default function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getRecommendations({
        search: searchTerm.trim() || undefined,
        location: locationToFilter[locationFilter],
        page,
        limit: 15,
      });
      const items = Array.isArray(response?.items) ? response.items : [];
      setJobs(items);
      setTotalJobs(Number(response?.total) || 0);
      setTotalPages(Number(response?.total_pages) || 0);
      setSelectedJob(current =>
        items.find(job => job.id === current?.id) || items[0] || null
      );
    } catch (requestError) {
      setJobs([]);
      setTotalJobs(0);
      setTotalPages(0);
      setSelectedJob(null);
      setError(requestError.message || 'Unable to load job recommendations.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, locationFilter, page]);

  useEffect(() => {
    const timer = setTimeout(loadJobs, 300);
    return () => clearTimeout(timer);
  }, [loadJobs]);

  const handleApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    setError('');
    try {
      await applyToJob(selectedJob.id);
      setJobs(current =>
        current.map(job => job.id === selectedJob.id ? { ...job, has_applied: true } : job)
      );
      setSelectedJob(current => ({ ...current, has_applied: true }));
      setShowApplyModal(true);
    } catch (requestError) {
      setError(requestError.message || 'Unable to submit the application.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="jobs-page">
      <header className="jobs-header">
        <div>
          <span className="jobs-header__eyebrow">✦ AI Matchmaker</span>
          <h1 className="jobs-header__title">AI Job Recommendations</h1>
          <p className="jobs-header__subtitle">
            Live roles matched against your profile, skills, and preferences.
          </p>
        </div>
      </header>

      {error && (
        <div className="jobs-empty" role="alert" style={{ marginBottom: 16 }}>
          <strong>Could not load backend data</strong>
          <span>{error}</span>
          <Button onClick={loadJobs} variant="primary">Try Again</Button>
        </div>
      )}

      <div className="jobs-grid">
        <section className="jobs-filter-panel">
          <strong className="jobs-filter-panel__title">🔍 Filter Jobs</strong>
          <div style={{ marginTop: 8 }}>
            <label className="jobs-filter-label" htmlFor="job-search">Search Role / Company</label>
            <input
              id="job-search"
              type="text"
              placeholder="e.g. React, Amazon..."
              value={searchTerm}
              onChange={event => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              className="jobs-search-input"
            />
          </div>
          <div>
            <label className="jobs-filter-label">Location Criteria</label>
            <div className="jobs-location-group">
              {['All', 'Remote', 'Bangalore'].map(location => (
                <button
                  key={location}
                  onClick={() => {
                    setLocationFilter(location);
                    setPage(1);
                  }}
                  className={`jobs-location-btn ${locationFilter === location ? 'jobs-location-btn--active' : ''}`}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>
          <div className="jobs-ai-insight">
            <strong className="jobs-ai-insight__title">✨ Live recommendation status</strong>
            <p className="jobs-ai-insight__body">
              {loading ? 'Loading recommendations…' : `Showing ${jobs.length} of ${totalJobs} matching jobs.`}
            </p>
          </div>
        </section>

        <section className="jobs-list">
          {loading ? (
            <>
              <div className="jobs-skeleton jobs-skeleton--card" />
              <div className="jobs-skeleton jobs-skeleton--card" />
              <div className="jobs-skeleton jobs-skeleton--card" />
            </>
          ) : jobs.length === 0 ? (
            <div className="jobs-empty">
              <span className="jobs-empty__icon">🔍</span>
              <span>No active jobs matched. Seed the jobs collection or broaden the filters.</span>
            </div>
          ) : (
            <>
              {jobs.map(job => (
                <Card
              key={job.id}
              onClick={() => setSelectedJob(job)}
              interactive
              className={`jobs-card ${selectedJob?.id === job.id ? 'jobs-card--active' : ''}`}
            >
              <div className="jobs-card__top">
                <div className="jobs-card__left">
                  <span className="jobs-card__logo">
                    {job.company_logo_url
                      ? <img src={job.company_logo_url} alt="" width="36" height="36" />
                      : '💼'}
                  </span>
                  <div className="jobs-card__info">
                    <h3 className="jobs-card__title">{job.title}</h3>
                    <span className="jobs-card__meta">{job.company} · {job.location}</span>
                  </div>
                </div>
                <div className="jobs-card__right">
                  <span className={`jobs-card__match ${job.match_score >= 80 ? 'jobs-card__match--high' : ''}`}>
                    {Math.round(job.match_score)}% Match
                  </span>
                  <span className="jobs-card__salary">{job.formatted_salary}</span>
                </div>
              </div>
              <div className="jobs-card__skills">
                {(job.matching_skills || []).slice(0, 3).map(skill => (
                  <span key={skill} className="badge badge-success">{skill}</span>
                ))}
                {(job.missing_skills || []).slice(0, 1).map(skill => (
                  <span key={skill} className="badge badge-muted">{skill} missing</span>
                ))}
              </div>
                </Card>
              ))}
              <nav className="jobs-pagination" aria-label="Job results pages">
                <button
                  type="button"
                  className="jobs-pagination__button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(current => Math.max(1, current - 1))}
                >
                  Previous
                </button>
                <span className="jobs-pagination__status">
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="jobs-pagination__button"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage(current => current + 1)}
                >
                  Next
                </button>
              </nav>
            </>
          )}
        </section>

        <section className="jobs-detail-panel">
          {selectedJob ? (
            <Card title={selectedJob.title} subtitle={`${selectedJob.company} · ${selectedJob.location}`}>
              <div className="jobs-detail-body">
                <div className="jobs-fit-score">
                  <div className="jobs-fit-score__number">{Math.round(selectedJob.match_score)}%</div>
                  <div className="jobs-fit-score__detail" style={{ flex: 1 }}>
                    <div className="jobs-fit-score__label">Match compatibility</div>
                    <div className="jobs-fit-score__bar">
                      <div className="jobs-fit-score__fill" style={{ width: `${selectedJob.match_score}%` }} />
                    </div>
                  </div>
                </div>
                <div className="jobs-detail-row">
                  <strong className="jobs-detail-row__label">Comp Range</strong>
                  <span className="jobs-detail-row__value">{selectedJob.formatted_salary}</span>
                </div>
                <div className="jobs-detail-row">
                  <strong className="jobs-detail-row__label">Summary</strong>
                  <p className="jobs-detail-row__value" style={{ margin: 0 }}>{selectedJob.short_description}</p>
                </div>
                <div className="jobs-skill-alignment">
                  <strong className="jobs-detail-row__label">Your Skill Alignment</strong>
                  <div className="jobs-skill-group__tags">
                    {(selectedJob.matching_skills || []).map(skill => (
                      <span key={skill} className="jobs-skill-pill jobs-skill-pill--match">{skill}</span>
                    ))}
                    {(selectedJob.missing_skills || []).map(skill => (
                      <span key={skill} className="jobs-skill-pill jobs-skill-pill--missing">{skill} missing</span>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleApply}
                  variant="primary"
                  loading={applying}
                  disabled={selectedJob.has_applied}
                  className="jobs-apply-btn"
                >
                  {selectedJob.has_applied ? 'Already Applied' : 'Apply to Job'}
                </Button>
              </div>
            </Card>
          ) : (
            <div className="jobs-empty">Select a job to view its details.</div>
          )}
        </section>
      </div>

      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title="Application saved"
      >
        <div className="jobs-modal-body">
          <span className="jobs-modal-icon">🎉</span>
          <p className="jobs-modal-text">
            Your application for {selectedJob?.title} at {selectedJob?.company} was recorded.
          </p>
          <Button onClick={() => setShowApplyModal(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
