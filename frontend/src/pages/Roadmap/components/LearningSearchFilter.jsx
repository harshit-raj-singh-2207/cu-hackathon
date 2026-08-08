import React from 'react';
import Button from '../../../components/Button';

export default function LearningSearchFilter({
  searchQuery,
  onSearchChange,
  filters,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount
}) {
  const TOPICS = ['All', 'Frontend', 'Backend', 'DevOps', 'Data Science / AI'];
  const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const DEADLINES = ['All', 'Short-Term', 'Medium-Term', 'Long-Term'];
  const GOALS = ['All', 'Frontend Specialist', 'Fullstack Engineer', 'AI Developer'];

  // Calculate number of active non-default filters
  const activeFilterCount = [
    filters.topic !== 'All',
    filters.difficulty !== 'All',
    filters.deadline !== 'All',
    filters.goal !== 'All',
    Boolean(searchQuery.trim())
  ].filter(Boolean).length;

  return (
    <div className="learning-search-filter-panel">
      {/* Top Search Bar & Counter */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '15px' }}>
            🔍
          </span>
          <input
            type="text"
            placeholder="Search learning topics, skills, or checklist items..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              padding: '11px 14px 11px 40px',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-strong)',
              borderRadius: '10px',
              color: 'var(--text-primary)',
              fontSize: '13.5px',
              outline: 'none',
              transition: 'all 200ms ease',
              boxSizing: 'border-box'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Results Counter & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-surface-3)', padding: '6px 12px', borderRadius: '20px', border: '1px solid var(--border)' }}>
            Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> plans
          </span>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onResetFilters}>
              🔄 Reset Filters ({activeFilterCount})
            </Button>
          )}
        </div>
      </div>

      {/* Multi-Filter Dropdown Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginTop: '16px' }}>
        
        {/* Topic Filter */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            🏷️ Topic
          </label>
          <select
            value={filters.topic}
            onChange={(e) => onFilterChange('topic', e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface-2)',
              border: filters.topic !== 'All' ? '1px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 10px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            {TOPICS.map(t => (
              <option key={t} value={t} style={{ background: '#0f172a' }}>
                {t === 'All' ? 'All Topics' : t}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            🎯 Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => onFilterChange('difficulty', e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface-2)',
              border: filters.difficulty !== 'All' ? '1px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 10px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            {DIFFICULTIES.map(d => (
              <option key={d} value={d} style={{ background: '#0f172a' }}>
                {d === 'All' ? 'All Difficulties' : d}
              </option>
            ))}
          </select>
        </div>

        {/* Deadline Filter */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            ⏱ Deadline / Timeline
          </label>
          <select
            value={filters.deadline}
            onChange={(e) => onFilterChange('deadline', e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface-2)',
              border: filters.deadline !== 'All' ? '1px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 10px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            {DEADLINES.map(dl => (
              <option key={dl} value={dl} style={{ background: '#0f172a' }}>
                {dl === 'All' ? 'All Timelines' : dl}
              </option>
            ))}
          </select>
        </div>

        {/* Goal Filter */}
        <div>
          <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
            🎓 Career Goal
          </label>
          <select
            value={filters.goal}
            onChange={(e) => onFilterChange('goal', e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface-2)',
              border: filters.goal !== 'All' ? '1px solid var(--primary)' : '1px solid var(--border)',
              borderRadius: '8px',
              padding: '8px 10px',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              cursor: 'pointer'
            }}
          >
            {GOALS.map(g => (
              <option key={g} value={g} style={{ background: '#0f172a' }}>
                {g === 'All' ? 'All Target Roles' : g}
              </option>
            ))}
          </select>
        </div>

      </div>
    </div>
  );
}
