import React from 'react';

const activities = [
  {
    title: 'Application moved to recruiter review',
    detail: 'Product Designer role at NovaCloud was updated 18 minutes ago.',
    time: '10:42 AM',
    type: 'Application',
  },
  {
    title: 'Mock interview completed',
    detail: 'Behavioral round score improved to 88 with stronger STAR answers.',
    time: '09:10 AM',
    type: 'Interview',
  },
  {
    title: 'Coding practice streak extended',
    detail: 'Solved 4 dynamic programming problems with 92% accuracy.',
    time: 'Yesterday',
    type: 'Coding',
  },
  {
    title: 'Resume bullet rewritten',
    detail: 'AI optimized your impact metric for the payments dashboard project.',
    time: 'Yesterday',
    type: 'Resume',
  },
  {
    title: 'New role match found',
    detail: 'Senior Frontend Engineer at Atlas AI matches 96% of your profile.',
    time: 'Mon',
    type: 'Jobs',
  },
];

export default function RecentActivity() {
  return (
    <section className="dashboard-glass-card dashboard-activity">
      <div className="dashboard-card-header">
        <div>
          <span className="dashboard-eyebrow">Live Updates</span>
          <h2 className="dashboard-card-title">Recent Activity</h2>
        </div>
        <button className="dashboard-icon-button" type="button" aria-label="Filter activity">FL</button>
      </div>
      <div className="dashboard-timeline">
        {activities.map((activity) => (
          <article className="dashboard-activity-item" key={`${activity.title}-${activity.time}`}>
            <div className="dashboard-activity-item__marker" />
            <div className="dashboard-activity-item__content">
              <div className="dashboard-activity-item__top">
                <span className="dashboard-pill">{activity.type}</span>
                <time>{activity.time}</time>
              </div>
              <h3>{activity.title}</h3>
              <p>{activity.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
