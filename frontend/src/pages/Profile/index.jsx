import React, { useState, useEffect } from 'react';
import Button from '../../components/Button';
import Card from '../../components/Card';


export default function Profile() {
  const [user, setUser] = useState({
    name: 'Kumar',
    title: 'Senior Frontend Engineer',
    email: 'kumar@careercopilot.ai',
    phone: '+91 98765 43210',
    location: 'Bengaluru, India',
    github: 'github.com/kumar-codes',
    linkedin: 'linkedin.com/in/kumar-dev',
  });

  const [projects, setProjects] = useState([
    { title: 'Interactive payment dashboard', desc: 'React, TypeScript ledger compiling merchant pipelines.', url: 'github.com/kumar/ledger' },
    { title: 'AI code visual compiler', desc: 'Next.js rendering of tree syntax parses.', url: 'github.com/kumar/syntax' }
  ]);

  const [newProject, setNewProject] = useState({ title: '', desc: '', url: '' });

  const [certificates, setCertificates] = useState([
    { name: 'React Advanced patterns & algorithms', issuer: 'Meta (Coursera)', date: 'June 2025', id: 'CRT-984-REACT' },
    { name: 'Cloud architecture systems expert', issuer: 'AWS Training', date: 'Sept 2024', id: 'AWS-AWS-384' }
  ]);

  const [newCert, setNewCert] = useState({ name: '', issuer: '', date: '', id: '' });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('cc_user');
      if (stored) {
        const u = JSON.parse(stored);
        setUser(prev => ({
          ...prev,
          name: u.name || 'Kumar',
          email: u.email || 'kumar@careercopilot.ai'
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProject.title.trim()) return;
    setProjects([...projects, newProject]);
    setNewProject({ title: '', desc: '', url: '' });
  };

  const handleAddCertificate = (e) => {
    e.preventDefault();
    if (!newCert.name.trim()) return;
    setCertificates([...certificates, newCert]);
    setNewCert({ name: '', issuer: '', date: '', id: '' });
  };

  return (
    <div className="profile-page">
      
      {/* Header */}
      <header className="profile-header">
        <span className="profile-header__eyebrow">✦ Developer Profile</span>
        <h1 className="profile-header__title">Profile & Portfolio Workspace</h1>
        <p className="profile-header__subtitle">Manage your verified credentials, credentials tracking, and portfolio project URLs.</p>
      </header>

      {/* Main Grid */}
      <div className="profile-grid">
        
        {/* Left Side: General Profile & Projects */}
        <section className="profile-col">
          
          {/* General info */}
          <Card title="👤 Professional Metadata">
            <div className="profile-meta-grid">
              <div className="profile-meta-item">
                <span className="profile-meta-item__label">FULL NAME</span>
                <strong className="profile-meta-item__value">{user.name}</strong>
              </div>
              <div className="profile-meta-item">
                <span className="profile-meta-item__label">ROLE TITLE</span>
                <strong className="profile-meta-item__value">{user.title}</strong>
              </div>
              <div className="profile-meta-item">
                <span className="profile-meta-item__label">EMAIL ADDRESS</span>
                <span className="profile-meta-item__value profile-meta-item__value--normal">{user.email}</span>
              </div>
              <div className="profile-meta-item">
                <span className="profile-meta-item__label">LOCATION</span>
                <span className="profile-meta-item__value profile-meta-item__value--normal">{user.location}</span>
              </div>
            </div>
          </Card>

          {/* Portfolio Builder */}
          <Card title="💻 Portfolio Projects Builder" subtitle="Showcase your strongest codebases.">
            <div className="profile-card-body">
              
              {/* Projects List */}
              <div className="profile-card-list">
                {projects.map((proj, i) => (
                  <div key={i} className="profile-card-item">
                    <div className="profile-card-item__header">
                      <strong className="profile-card-item__title">{proj.title}</strong>
                      <a className="profile-card-item__link" href={`https://${proj.url}`}>🌐 Link</a>
                    </div>
                    <p className="profile-card-item__desc">{proj.desc}</p>
                  </div>
                ))}
              </div>

              {/* Add form */}
              <form onSubmit={handleAddProject} className="profile-form">
                <strong className="profile-form__title">Add Custom Project</strong>
                <div className="profile-form__row">
                  <input className="profile-input" type="text" placeholder="Project Title" value={newProject.title} onChange={e => setNewProject({ ...newProject, title: e.target.value })} required />
                  <input className="profile-input" type="text" placeholder="URL (e.g. github.com/user/repo)" value={newProject.url} onChange={e => setNewProject({ ...newProject, url: e.target.value })} />
                </div>
                <input className="profile-input" type="text" placeholder="Quick description (technologies & metrics)" value={newProject.desc} onChange={e => setNewProject({ ...newProject, desc: e.target.value })} />
                <div className="profile-form__actions">
                  <Button type="submit" variant="glow">Add Project</Button>
                </div>
              </form>

            </div>
          </Card>

        </section>

        {/* Right Side: Certificate Tracker & Streaks */}
        <section className="profile-col">
          
          {/* Certificate Tracker */}
          <Card title="📜 Certificate Tracker" subtitle="Manage and verify course credentials.">
            <div className="profile-card-body">
              
              {/* List */}
              <div className="profile-card-list">
                {certificates.map((cert, i) => (
                  <div key={i} className="profile-card-item">
                    <div className="profile-card-item__header">
                      <strong className="profile-card-item__title">{cert.name}</strong>
                      <span className="badge badge-success profile-card-item__badge">Verified</span>
                    </div>
                    <div className="profile-card-item__footer">
                      <span>Issuer: {cert.issuer} ({cert.date})</span>
                      <span>ID: {cert.id}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add form */}
              <form onSubmit={handleAddCertificate} className="profile-form">
                <strong className="profile-form__title">Record Certification</strong>
                <div className="profile-form__row profile-form__row--wide">
                  <input className="profile-input" type="text" placeholder="Certification Name" value={newCert.name} onChange={e => setNewCert({ ...newCert, name: e.target.value })} required />
                  <input className="profile-input" type="text" placeholder="Issuer (e.g. Coursera)" value={newCert.issuer} onChange={e => setNewCert({ ...newCert, issuer: e.target.value })} required />
                </div>
                <div className="profile-form__row">
                  <input className="profile-input" type="text" placeholder="Credential Verification ID" value={newCert.id} onChange={e => setNewCert({ ...newCert, id: e.target.value })} />
                  <input className="profile-input" type="text" placeholder="Issue Date (e.g. June 2026)" value={newCert.date} onChange={e => setNewCert({ ...newCert, date: e.target.value })} />
                </div>
                <div className="profile-form__actions">
                  <Button type="submit" variant="glow">Record Certificate</Button>
                </div>
              </form>

            </div>
          </Card>

        </section>

      </div>
    </div>
  );
}

