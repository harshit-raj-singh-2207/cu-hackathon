import React from 'react';

export function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="dashboard-section__header">
      <div>
        {eyebrow && <span className="dashboard-eyebrow">{eyebrow}</span>}
        <h2 className="dashboard-section__title">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function QuickActionCard({ action }) {
  return (
    <a className="dashboard-quick-action" href={action.href}>
      <span className="dashboard-icon dashboard-quick-action__icon">{action.icon}</span>
      <span className="dashboard-quick-action__content">
        <strong>{action.title}</strong>
        <small>{action.description}</small>
      </span>
      <span className="dashboard-quick-action__arrow">AR</span>
    </a>
  );
}

export function AnalyticsCard({ item }) {
  return (
    <article className="dashboard-analytics-card">
      <div className="dashboard-analytics-card__top">
        <span>
          <small>{item.label}</small>
          <strong>{item.value}</strong>
        </span>
        <span className={`dashboard-trend dashboard-trend--${item.trendDirection}`}>{item.trend}</span>
      </div>
      <div className="dashboard-chart" aria-label={`${item.label} chart`}>
        {item.points.map((height, index) => (
          <span
            className={`dashboard-chart__bar dashboard-chart__bar--${height} dashboard-chart__bar-delay-${index}`}
            key={`${item.label}-${index}`}
          />
        ))}
      </div>
    </article>
  );
}

export function UpcomingEvents({ events }) {
  return (
    <section className="dashboard-glass-card">
      <div className="dashboard-card-header">
        <div>
          <span className="dashboard-eyebrow">Next Up</span>
          <h2 className="dashboard-card-title">Upcoming Events</h2>
        </div>
        <a className="dashboard-link" href="/interview">Calendar</a>
      </div>
      <div className="dashboard-event-list">
        {events.map((event) => (
          <article className="dashboard-event" key={event.title}>
            <div className="dashboard-event__date">
              <strong>{event.day}</strong>
              <span>{event.month}</span>
            </div>
            <div>
              <h3>{event.title}</h3>
              <p>{event.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ProfileSummary({ user }) {
  const skills = ['React', 'TypeScript', 'Design Systems', 'AI Tools', 'Node'];

  return (
    <section className="dashboard-glass-card dashboard-profile-card">
      <div className="dashboard-profile-card__hero">
        <div className="dashboard-avatar dashboard-avatar--large">{user.initials}</div>
        <div>
          <h2>{user.name}</h2>
          <p>{user.role}</p>
        </div>
      </div>

      <div className="dashboard-profile-meter">
        <div className="dashboard-profile-meter__top">
          <span>Profile Completion</span>
          <strong>94%</strong>
        </div>
        <div className="dashboard-progress-track">
          <span className="dashboard-profile-meter__bar" />
        </div>
      </div>

      <dl className="dashboard-profile-facts">
        <div>
          <dt>Experience</dt>
          <dd>4+ years</dd>
        </div>
        <div>
          <dt>Education</dt>
          <dd>B.Tech CSE</dd>
        </div>
      </dl>

      <div className="dashboard-skill-list">
        {skills.map((skill) => <span key={skill}>{skill}</span>)}
      </div>

      <a className="dashboard-button dashboard-button--secondary" href="/profile">Edit Profile</a>
    </section>
  );
}

export function AIAssistantCard() {
  const suggestions = ['Tune my resume', 'Find best jobs', 'Practice interview'];

  return (
    <section className="dashboard-ai-card">
      <div className="dashboard-ai-card__orb">AI</div>
      <span className="dashboard-eyebrow">CareerCopilot AI</span>
      <h2>Your next best move is ready.</h2>
      <p>
        Apply to the 6 strongest frontend matches today and refresh your ATS keywords for product-led SaaS roles.
      </p>
      <div className="dashboard-ai-card__suggestions">
        {suggestions.map((item) => <button type="button" key={item}>{item}</button>)}
      </div>
      <a className="dashboard-button dashboard-button--primary" href="/twin">Ask AI</a>
    </section>
  );
}

export function QuickActions({ actions }) {
  return (
    <section className="dashboard-section">
      <SectionTitle eyebrow="Fast Actions" title="What would you like to do next?" />
      <div className="dashboard-quick-grid">
        {actions.map((action) => <QuickActionCard key={action.title} action={action} />)}
      </div>
    </section>
  );
}

export function AnalyticsOverview({ analytics }) {
  return (
    <section className="dashboard-section">
      <SectionTitle
        eyebrow="Analytics"
        title="Career Momentum"
        action={<a className="dashboard-link" href="/analytics">Open reports</a>}
      />
      <div className="dashboard-analytics-grid">
        {analytics.map((item) => <AnalyticsCard key={item.label} item={item} />)}
      </div>
    </section>
  );
}

export function FocusBoard({ items }) {
  return (
    <section className="dashboard-section">
      <SectionTitle eyebrow="Today" title="Priority Focus" />
      <div className="dashboard-focus-grid">
        {items.map((item) => (
          <article className="dashboard-focus-card" key={item.title}>
            <span className={`dashboard-focus-card__status dashboard-focus-card__status--${item.status}`} />
            <div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
            <span className="dashboard-focus-card__time">{item.time}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ApplicationPipeline({ stages }) {
  const total = stages.reduce((sum, stage) => sum + stage.count, 0);

  return (
    <section className="dashboard-glass-card dashboard-pipeline">
      <div className="dashboard-card-header">
        <div>
          <span className="dashboard-eyebrow">Pipeline</span>
          <h2 className="dashboard-card-title">Application Flow</h2>
        </div>
        <strong className="dashboard-pipeline__total">{total} active</strong>
      </div>
      <div className="dashboard-pipeline__list">
        {stages.map((stage) => (
          <article className="dashboard-pipeline__stage" key={stage.label}>
            <div className="dashboard-pipeline__stage-top">
              <span>{stage.label}</span>
              <strong>{stage.count}</strong>
            </div>
            <div className="dashboard-progress-track">
              <span className={`dashboard-pipeline__bar dashboard-pipeline__bar--${stage.width}`} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
