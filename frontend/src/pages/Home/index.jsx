import React, { useEffect, useState, useRef } from 'react';
import Hero     from './Hero';
import Features from './Features';
import About    from './About';
import Contact  from './Contact';

/* ══════════════════════════════════════════════════════════
   SCROLL PROGRESS BAR
══════════════════════════════════════════════════════════ */
function ScrollBar() {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el  = document.documentElement;
      setPct((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div style={{ position:'fixed', top:0, left:0, zIndex:999, height:3,
      width:`${pct}%`, background:'linear-gradient(90deg,#7c3aed,#06b6d4)',
      transition:'width 0.1s linear', pointerEvents:'none' }} />
  );
}

/* ══════════════════════════════════════════════════════════
   HOW IT WORKS
══════════════════════════════════════════════════════════ */
const STEPS = [
  { n:'01', icon:'📤', title:'Upload Your Resume',    desc:'Drop your PDF or paste your LinkedIn URL. Our AI parses every detail in seconds.' },
  { n:'02', icon:'🤖', title:'AI Analyses & Scores',  desc:'Get a 12-dimension score, keyword gaps, and role-matched insights instantly.' },
  { n:'03', icon:'🚀', title:'Land Your Dream Role',  desc:'Apply smarter, practise interviews, and track your progress to the offer letter.' },
];

function HowItWorks() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section id="how-it-works" ref={ref} style={s.section}>
      <div style={s.container}>
        <div style={s.hdr}>
          <span style={s.pill}>How It Works</span>
          <h2 style={s.h2}>Three steps to your <span style={s.grad}>next offer</span></h2>
          <p style={s.lead}>No setup, no learning curve. Start in under 60 seconds.</p>
        </div>
        <div style={{ display:'flex', gap:24, flexWrap:'wrap', justifyContent:'center' }}>
          {STEPS.map((st, i) => (
            <div key={st.n} style={{ ...s.stepCard,
              opacity: vis ? 1 : 0,
              transform: vis ? 'translateY(0)' : 'translateY(28px)',
              transition: `all 0.6s ease ${i * 0.15}s` }}>
              <div style={s.stepNum}>{st.n}</div>
              <div style={s.stepIcon}>{st.icon}</div>
              <h3 style={s.stepTitle}>{st.title}</h3>
              <p style={s.stepDesc}>{st.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   TESTIMONIALS
══════════════════════════════════════════════════════════ */
const TESTIMONIALS = [
  { name:'Priya R.',    role:'SDE-2 @ Google',      avatar:'PR', bg:'linear-gradient(135deg,#7c3aed,#8b5cf6)',
    text:'Went from 3 rejections to 2 FAANG offers in 6 weeks. The ATS checker alone is worth it — I had no idea how many keywords I was missing.' },
  { name:'Arjun M.',   role:'Product @ Razorpay',   avatar:'AM', bg:'linear-gradient(135deg,#06b6d4,#22d3ee)',
    text:'The mock interview AI is scary good. It asked me follow-ups I wasn\'t expecting, and the feedback was more useful than any human mock I\'d done.' },
  { name:'Sneha K.',   role:'Data Analyst @ Swiggy', avatar:'SK', bg:'linear-gradient(135deg,#ec4899,#f472b6)',
    text:'Negotiated a 40% salary hike using the salary analytics section. I knew exactly what to ask for with real data to back it up.' },
  { name:'Rohan V.',   role:'Backend Dev @ CRED',    avatar:'RV', bg:'linear-gradient(135deg,#22c55e,#4ade80)',
    text:'Career roadmap feature mapped out exactly which skills I needed and in what order. Saved me months of random Googling.' },
  { name:'Ananya T.',  role:'Frontend @ Flipkart',   avatar:'AT', bg:'linear-gradient(135deg,#f59e0b,#fbbf24)',
    text:'The AI resume analyser caught formatting issues that were silently killing my applications. Fixed them in an hour, got callbacks the same week.' },
  { name:'Karan S.',   role:'ML Engineer @ Microsoft', avatar:'KS', bg:'linear-gradient(135deg,#ef4444,#f87171)',
    text:'CareerCopilot is what a career platform should be. Everything is AI-first, not just slapped on as a gimmick.' },
];

function Testimonials() {
  return (
    <section id="testimonials" style={{ ...s.section, background:'#f0f6ff' }}>
      <div style={s.container}>
        <div style={s.hdr}>
          <span style={s.pill}>Testimonials</span>
          <h2 style={s.h2}>Loved by <span style={s.grad}>2.4M+ professionals</span></h2>
          <p style={s.lead}>Real results from real people — not cherry-picked marketing copy.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} style={{ ...s.tCard, animationDelay:`${i*0.07}s` }}>
              <p style={s.tText}>"{t.text}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginTop:16 }}>
                <div style={{ ...s.tAvatar, background:t.bg }}>{t.avatar}</div>
                <div>
                  <div style={s.tName}>{t.name}</div>
                  <div style={s.tRole}>{t.role}</div>
                </div>
              </div>
              <div style={s.tStars}>★★★★★</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   PRICING
══════════════════════════════════════════════════════════ */
const PLANS = [
  { name:'Free',    price:'₹0',   period:'forever',  color:'#64748b', cta:'Get Started',
    features:['Resume Analyzer (3/mo)','ATS Checker (5/mo)','Job Recommendations','Community Access'], },
  { name:'Pro',     price:'₹499', period:'/month',   color:'#7c3aed', cta:'Start Free Trial', popular:true,
    features:['Everything in Free','Unlimited Resume Scans','Mock Interviews (AI)','Coding Practice (500+)','Career Roadmap','Placement Analytics'], },
  { name:'Teams',   price:'₹999', period:'/user/mo', color:'#06b6d4', cta:'Contact Sales',
    features:['Everything in Pro','Recruiter Arena','AI Career Twin','Team Analytics','Priority Support','Dedicated CSM'], },
];

function Pricing() {
  const [hov, setHov] = useState(null);
  return (
    <section id="pricing" style={{ ...s.section, background:'var(--bg-base)' }}>
      <div style={s.container}>
        <div style={s.hdr}>
          <span style={s.pill}>Pricing</span>
          <h2 style={s.h2}>Simple, <span style={s.grad}>transparent</span> pricing</h2>
          <p style={s.lead}>No hidden fees. Cancel anytime. 14-day free trial on Pro.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:24, maxWidth:1000, margin:'0 auto' }}>
          {PLANS.map((plan, i) => (
            <div key={plan.name}
              onMouseEnter={() => setHov(i)} onMouseLeave={() => setHov(null)}
              style={{ ...s.priceCard,
                border:`1px solid ${hov===i||plan.popular ? plan.color : 'var(--border)'}`,
                background: plan.popular ? `radial-gradient(ellipse at top,${plan.color}15,var(--bg-surface) 70%)` : 'var(--bg-surface)',
                transform: hov===i ? 'translateY(-6px)' : 'none' }}>
              {plan.popular && <div style={{ ...s.popularBadge, background:plan.color }}>Most Popular</div>}
              <div style={{ fontSize:13, fontWeight:700, color:plan.color, marginBottom:8 }}>{plan.name}</div>
              <div style={s.priceNum}>{plan.price}<span style={s.pricePer}> {plan.period}</span></div>
              <ul style={s.featureList}>
                {plan.features.map(f => (
                  <li key={f} style={s.featureItem}>
                    <span style={{ color:plan.color }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href={plan.name==='Teams'?'/contact':'/register'}
                style={{ ...s.priceBtn, background: plan.popular?`linear-gradient(135deg,${plan.color},#06b6d4)`:'var(--bg-surface-2)',
                  color: plan.popular?'#fff':'var(--text-secondary)',
                  border: plan.popular?'none':`1px solid var(--border)` }}>
                {plan.cta} →
              </a>
            </div>
          ))}
        </div>
        <p style={{ textAlign:'center', color:'#475569', fontSize:13, marginTop:32 }}>
          🔒 Secure checkout via Razorpay · GST Invoice included · 14-day money-back guarantee
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   STATS COUNTER
══════════════════════════════════════════════════════════ */
const STATS = [
  { value: 2400000, suffix: '+', label: 'Professionals Onboarded',    icon: '👥', color: '#7c3aed' },
  { value: 96,      suffix: '%', label: 'Placement Rate (2024)',       icon: '🎯', color: '#06b6d4' },
  { value: 500,     suffix: '+', label: 'DSA Problems Curated',        icon: '💻', color: '#22c55e' },
  { value: 8,       suffix: 's', label: 'Avg. Resume Score Time',      icon: '⚡', color: '#f59e0b' },
  { value: 12000,   suffix: '+', label: 'Verified 5-Star Reviews',     icon: '★',  color: '#ec4899' },
  { value: 40,      suffix: '%', label: 'Avg. Salary Hike Negotiated', icon: '📈', color: '#8b5cf6' },
];

function useCountUp(target, duration = 2000, active = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [active, target, duration]);
  return count;
}

function StatItem({ stat, active }) {
  const count = useCountUp(stat.value, 2000, active);
  const display = stat.value >= 1000000
    ? (count / 1000000).toFixed(1) + 'M'
    : stat.value >= 1000
    ? (count / 1000).toFixed(0) + 'K'
    : count;
  return (
    <div style={s2.statCard}>
      <span style={{ ...s2.statIcon, background: `${stat.color}20`, border: `1px solid ${stat.color}40` }}>
        {stat.icon}
      </span>
      <div style={{ ...s2.statNum, color: stat.color }}>
        {display}{stat.suffix}
      </div>
      <div style={s2.statLabel}>{stat.label}</div>
    </div>
  );
}

function StatsSection() {
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setActive(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref} style={s2.statsSection}>
      <div style={s.container}>
        <div style={s.hdr}>
          <span style={s.pill}>By The Numbers</span>
          <h2 style={s.h2}>Impact that <span style={s.grad}>speaks for itself</span></h2>
          <p style={s.lead}>Real outcomes from real users — tracked, verified, and growing every day.</p>
        </div>
        <div style={s2.statsGrid} className="stats-grid-responsive">
          {STATS.map(stat => <StatItem key={stat.label} stat={stat} active={active} />)}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   MARQUEE TICKER
══════════════════════════════════════════════════════════ */
const COMPANIES = [
  { name: 'Google',     emoji: '🔵' },
  { name: 'Microsoft',  emoji: '🪟' },
  { name: 'Amazon',     emoji: '📦' },
  { name: 'Meta',       emoji: '🔷' },
  { name: 'Apple',      emoji: '🍎' },
  { name: 'Flipkart',   emoji: '🛒' },
  { name: 'Razorpay',   emoji: '💳' },
  { name: 'Swiggy',     emoji: '🧡' },
  { name: 'CRED',       emoji: '💎' },
  { name: 'Zomato',     emoji: '🍕' },
  { name: 'PhonePe',    emoji: '📱' },
  { name: 'Meesho',     emoji: '🛍️' },
  { name: 'Infosys',    emoji: '🏢' },
  { name: 'Wipro',      emoji: '🌐' },
  { name: 'TCS',        emoji: '💼' },
  { name: 'Accenture',  emoji: '⟩' },
];

function Marquee() {
  const doubled = [...COMPANIES, ...COMPANIES];
  return (
    <section style={s2.marqueeSection}>
      <p style={s2.marqueeLabel}>🏆 Our users work at the world's best companies</p>
      <div style={s2.marqueeTrack}>
        <div style={s2.marqueeInner}>
          {doubled.map((c, i) => (
            <span key={i} style={s2.marqueeChip}>
              <span>{c.emoji}</span>
              <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: 13 }}>{c.name}</span>
            </span>
          ))}
        </div>
      </div>
      {/* inject marquee keyframe once */}
      <style>{`
        @keyframes marqueeScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPARISON TABLE
══════════════════════════════════════════════════════════ */
const COMPARE_ROWS = [
  { feature: 'AI Resume Analyzer',          us: true,  linkedin: '⚠️', naukri: '⚠️', indeed: false },
  { feature: 'ATS Keyword Checker',         us: true,  linkedin: false, naukri: false, indeed: false },
  { feature: 'AI Mock Interviews',          us: true,  linkedin: false, naukri: false, indeed: false },
  { feature: 'DSA Coding Practice (500+)',  us: true,  linkedin: false, naukri: false, indeed: false },
  { feature: 'Career Roadmap (AI)',         us: true,  linkedin: false, naukri: false, indeed: false },
  { feature: 'Salary Analytics (live)',     us: true,  linkedin: '⚠️', naukri: '⚠️', indeed: '⚠️' },
  { feature: 'AI Career Digital Twin',      us: true,  linkedin: false, naukri: false, indeed: false },
  { feature: 'Recruiter Portal',            us: true,  linkedin: true,  naukri: true,  indeed: true  },
  { feature: 'Free Tier Available',         us: true,  linkedin: true,  naukri: true,  indeed: true  },
  { feature: 'India-first (INR pricing)',   us: true,  linkedin: false, naukri: true,  indeed: false },
];

function CompareCell({ val }) {
  if (val === true)  return <span style={s2.cellYes}>✓</span>;
  if (val === false) return <span style={s2.cellNo}>✗</span>;
  return <span style={s2.cellWarn}>{val}</span>;
}

function ComparisonTable() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.15 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref} style={{ ...s.section, background: '#f0f6ff',
      opacity: vis ? 1 : 0, transform: vis ? 'translateY(0)' : 'translateY(32px)',
      transition: 'all 0.7s ease' }}>
      <div style={s.container}>
        <div style={s.hdr}>
          <span style={s.pill}>Why Us</span>
          <h2 style={s.h2}>CareerCopilot vs <span style={s.grad}>the rest</span></h2>
          <p style={s.lead}>We built everything job seekers actually need — not just a job board with an AI badge.</p>
        </div>
        <div style={{ overflowX: 'auto', borderRadius: 18, border: '1px solid var(--border)' }}>
          <table style={s2.table}>
            <thead>
              <tr>
                <th style={s2.thFeature}>Feature</th>
                <th style={{ ...s2.th, color: '#a78bfa' }}>CareerCopilot ✦</th>
                <th style={s2.th}>LinkedIn</th>
                <th style={s2.th}>Naukri</th>
                <th style={s2.th}>Indeed</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={row.feature} style={{ background: i % 2 === 0 ? 'rgba(37,99,235,0.03)' : 'transparent' }}>
                  <td style={s2.tdFeature}>{row.feature}</td>
                  <td style={{ ...s2.td, background: 'rgba(37,99,235,0.03)' }}><CompareCell val={row.us} /></td>
                  <td style={s2.td}><CompareCell val={row.linkedin} /></td>
                  <td style={s2.td}><CompareCell val={row.naukri} /></td>
                  <td style={s2.td}><CompareCell val={row.indeed} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ textAlign: 'center', color: '#475569', fontSize: 12, marginTop: 16 }}>
          ⚠️ = partial / limited feature &nbsp;·&nbsp; Data based on publicly available information, {new Date().getFullYear()}
        </p>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   FINAL CTA BANNER
══════════════════════════════════════════════════════════ */
function CTABanner() {
  return (
    <section style={{ padding:'80px 24px', background:'var(--bg-base)', fontFamily:'Inter,sans-serif' }}>
      <div style={{ maxWidth:860, margin:'0 auto', textAlign:'center',
        background:'linear-gradient(135deg,rgba(37,99,235,0.08),rgba(14,165,233,0.06))',
        border:'1px solid var(--border-brand)', borderRadius:28, padding:'60px 40px',
        position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-30%', left:'50%', transform:'translateX(-50%)',
          width:500, height:300, background:'radial-gradient(ellipse,rgba(37,99,235,0.1),transparent 70%)',
          pointerEvents:'none' }} />
        <span style={s.pill}>Limited Time</span>
        <h2 style={{ fontSize:'clamp(28px,4vw,48px)', fontWeight:900, color:'var(--text-primary)',
          letterSpacing:'-0.035em', margin:'20px 0 16px', lineHeight:1.15 }}>
          Start your career transformation<br />
          <span style={s.grad}>completely free</span>
        </h2>
        <p style={{ color:'var(--text-secondary)', fontSize:17, lineHeight:1.7, maxWidth:520, margin:'0 auto 36px' }}>
          Join 2.4M+ professionals. No credit card required. Cancel anytime.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
          <a href="/register" style={{ padding:'15px 36px', borderRadius:12,
            background:'linear-gradient(135deg,#2563eb,#0ea5e9)',
            color:'#fff', fontSize:16, fontWeight:700, textDecoration:'none',
            boxShadow:'0 0 36px rgba(37,99,235,0.25)' }}>
            Get Started Free →
          </a>
          <a href="#features" style={{ padding:'15px 36px', borderRadius:12,
            border:'1px solid var(--border)', background:'var(--bg-surface-2)',
            color:'var(--text-secondary)', fontSize:16, fontWeight:600, textDecoration:'none' }}>
            See All Features
          </a>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════ */
const FOOTER_LINKS = {
  Product:  ['Resume Analyzer','ATS Checker','Mock Interview','Coding Practice','Job Recommendations','Career Roadmap'],
  Company:  ['About Us','Blog','Careers','Press Kit','Partners','Contact'],
  Resources:['Documentation','Help Center','Community','API','Status','Changelog'],
  Legal:    ['Privacy Policy','Terms of Service','Cookie Policy','GDPR','Security'],
};

function Footer() {
  return (
    <footer style={{ background:'var(--bg-base)', borderTop:'1px solid var(--border)', fontFamily:'Inter,sans-serif' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'64px 24px 32px' }}>
        {/* Top row */}
        <div style={{ display:'grid', gridTemplateColumns:'260px repeat(4,1fr)', gap:40, marginBottom:56, flexWrap:'wrap' }}>
          {/* Brand */}
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div style={{ width:36, height:36, borderRadius:10,
                background:'linear-gradient(135deg,#2563eb,#0ea5e9)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#fff', fontWeight:900, fontSize:14 }}>CC</div>
              <span style={{ color:'var(--text-primary)', fontWeight:800, fontSize:17 }}>CareerCopilot</span>
            </div>
            <p style={{ color:'var(--text-secondary)', fontSize:13, lineHeight:1.75, marginBottom:20 }}>
              AI-powered career platform helping professionals land better roles, faster.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              {['in','𝕏','▶','◈'].map((icon, i) => (
                <a key={i} href="/" style={{ width:32, height:32, borderRadius:'50%',
                  background:'rgba(37,99,235,0.06)', border:'1px solid var(--border)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'var(--text-secondary)', fontSize:12, fontWeight:700, textDecoration:'none' }}>{icon}</a>
              ))}
            </div>
          </div>
          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([cat, links]) => (
            <div key={cat}>
              <p style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase',
                letterSpacing:'0.08em', marginBottom:16 }}>{cat}</p>
              {links.map(l => (
                <a key={l} href="/" style={{ display:'block', color:'var(--text-secondary)', fontSize:13,
                  textDecoration:'none', marginBottom:10, transition:'color 0.2s ease' }}
                  onMouseEnter={e => e.target.style.color='var(--primary)'}
                  onMouseLeave={e => e.target.style.color='var(--text-secondary)'}>{l}</a>
              ))}
            </div>
          ))}
        </div>
        {/* Bottom bar */}
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:24,
          display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <p style={{ color:'var(--text-muted)', fontSize:13, margin:0 }}>
            © {new Date().getFullYear()} CareerCopilot AI Pvt. Ltd. · Made with ❤️ in Bangalore
          </p>
          <div style={{ display:'flex', gap:20 }}>
            {['Privacy','Terms','Cookies'].map(l => (
              <a key={l} href="/" style={{ color:'var(--text-muted)', fontSize:13, textDecoration:'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FAQSection() {
  const [openIdx, setOpenIdx] = useState(null);

  const faqs = [
    { q: "How does the AI Resume Analyzer score my profile?", a: "Our analyzer evaluates your resume against 12 critical ATS dimensions, checking keyword densities, formatting errors, and action verbs in under 8 seconds." },
    { q: "Can I customize my mock interview parameters?", a: "Yes! You can choose your target engineering domain (Frontend, Backend, System Architect) and focus rounds (Behavioral STAR format, Technical DSA, or System Design)." },
    { q: "How does the personalized learning roadmap update?", a: "The roadmap syncs with your weekly coding challenge completions and profile skill gaps, updating progression meters automatically." },
    { q: "Is there a free tier available for job seekers?", a: "Yes, our free tier gives you 3 resume scans per month, basic job recommendations, and access to select coding challenges completely free." }
  ];

  const toggle = (idx) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section id="faq" style={{ padding: '100px 0', background: 'var(--bg-base)', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ display: 'inline-block', padding: '6px 18px', borderRadius: 999, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.25)', color: 'var(--primary)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20 }}>FAQ</span>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.035em', lineHeight: 1.2, marginBottom: 16 }}>Frequently Asked <span style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Questions</span></h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>Everything you need to know about CareerCopilot AI tools.</p>
        </div>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {faqs.map((faq, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', transition: 'all 250ms ease' }}>
                <button type="button" onClick={() => toggle(i)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', outline: 'none' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: '700' }}>{faq.q}</span>
                  <span style={{ color: 'var(--primary)', fontSize: '16px', transition: 'transform 200ms ease', transform: isOpen ? 'rotate(90deg)' : 'none' }}>❯</span>
                </button>
                <div style={{ maxHeight: isOpen ? '160px' : '0', opacity: isOpen ? 1 : 0, overflow: 'hidden', transition: 'max-height 250ms cubic-bezier(0.4, 0, 0.2, 1), opacity 250ms ease' }}>
                  <p style={{ padding: '0 24px 20px 24px', margin: 0, color: 'var(--text-secondary)', fontSize: '13.5px', lineHeight: '1.6' }}>
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════
   HOME PAGE
══════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <>
      <ScrollBar />
      <Hero />
      <StatsSection />
      <HowItWorks />
      <Features />
      <Marquee />
      <Testimonials />
      <ComparisonTable />
      <Pricing />
      <FAQSection />
      <About />
      <CTABanner />
      <Contact />
      <Footer />
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   SHARED STYLES
══════════════════════════════════════════════════════════ */
const s = {
  section:   { padding:'100px 0', background:'var(--bg-base)', fontFamily:'Inter,sans-serif' },
  container: { maxWidth:1200, margin:'0 auto', padding:'0 24px' },
  hdr:       { textAlign:'center', marginBottom:56 },
  pill: {
    display:'inline-block', padding:'6px 18px', borderRadius:999,
    background:'rgba(37,99,235,0.08)', border:'1px solid rgba(37,99,235,0.25)',
    color:'var(--primary)', fontSize:12, fontWeight:700, letterSpacing:'0.06em',
    textTransform:'uppercase', marginBottom:20,
  },
  h2: {
    fontSize:'clamp(28px,4vw,44px)', fontWeight:900, color:'var(--text-primary)',
    letterSpacing:'-0.035em', lineHeight:1.2, marginBottom:16,
  },
  grad: {
    background:'var(--gradient-text)',
    WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
  },
  lead: { color:'var(--text-secondary)', fontSize:17, maxWidth:560, margin:'0 auto', lineHeight:1.7 },

  /* How It Works */
  stepCard: {
    flex:'1 1 280px', maxWidth:340,
    background:'var(--bg-surface)', border:'1px solid var(--border)',
    borderRadius:20, padding:32, position:'relative',
  },
  stepNum:   { fontSize:12, fontWeight:800, color:'rgba(37,99,235,0.5)', letterSpacing:'0.1em', marginBottom:16 },
  stepIcon:  { fontSize:36, marginBottom:16 },
  stepTitle: { fontSize:18, fontWeight:800, color:'var(--text-primary)', marginBottom:10 },
  stepDesc:  { fontSize:14, color:'var(--text-secondary)', lineHeight:1.7, margin:0 },

  /* Testimonials */
  tCard: {
    background:'var(--bg-surface)', border:'1px solid var(--border)',
    borderRadius:18, padding:28, display:'flex', flexDirection:'column',
    animation:'fadeInUp 0.5s ease both',
  },
  tText:   { fontSize:14, color:'var(--text-secondary)', lineHeight:1.75, margin:0, flex:1 },
  tAvatar: { width:42, height:42, borderRadius:'50%', display:'flex', alignItems:'center',
    justifyContent:'center', fontSize:13, fontWeight:800, color:'#fff', flexShrink:0 },
  tName:   { fontSize:14, fontWeight:700, color:'var(--text-primary)' },
  tRole:   { fontSize:12, color:'var(--text-muted)', marginTop:2 },
  tStars:  { color:'#f59e0b', fontSize:13, marginTop:16 },

  /* Pricing */
  priceCard: {
    background:'var(--bg-surface)', borderRadius:20, padding:32,
    display:'flex', flexDirection:'column', gap:12,
    position:'relative', transition:'all 0.25s ease', cursor:'default',
  },
  popularBadge: {
    position:'absolute', top:20, right:20,
    padding:'4px 12px', borderRadius:999,
    fontSize:11, fontWeight:700, color:'#fff',
  },
  priceNum:    { fontSize:36, fontWeight:900, color:'var(--text-primary)', lineHeight:1 },
  pricePer:    { fontSize:14, fontWeight:500, color:'var(--text-muted)' },
  featureList: { listStyle:'none', padding:0, margin:'8px 0', display:'flex', flexDirection:'column', gap:8, flex:1 },
  featureItem: { fontSize:13, color:'var(--text-secondary)', display:'flex', gap:8, alignItems:'center' },
  priceBtn: {
    display:'block', textAlign:'center', padding:'13px 24px',
    borderRadius:10, fontSize:14, fontWeight:700,
    textDecoration:'none', marginTop:8, transition:'opacity 0.2s ease',
  },
};

/* ── Extra styles for new sections ── */
const s2 = {
  /* Stats */
  statsSection: { padding:'90px 0', background:'var(--bg-base)', fontFamily:'Inter,sans-serif' },
  statsGrid: {
    display:'grid',
    gridTemplateColumns:'repeat(6,1fr)',
    gap:16, marginTop:8,
  },
  statCard: {
    background:'var(--bg-surface)', border:'1px solid var(--border)',
    borderRadius:18, padding:'28px 24px', textAlign:'center',
    display:'flex', flexDirection:'column', alignItems:'center', gap:12,
    transition:'transform 0.25s ease, border-color 0.25s ease',
  },
  statIcon: {
    width:48, height:48, borderRadius:14, fontSize:22,
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  statNum: { fontSize:'clamp(28px,3vw,40px)', fontWeight:900, color:'var(--text-primary)', letterSpacing:'-0.04em', lineHeight:1 },
  statLabel: { fontSize:13, color:'var(--text-muted)', fontWeight:600, lineHeight:1.4, textAlign:'center' },

  /* Marquee */
  marqueeSection: {
    padding:'40px 0',
    background:'var(--bg-base)',
    borderTop:'1px solid var(--border)',
    borderBottom:'1px solid var(--border)',
    overflow:'hidden',
    fontFamily:'Inter,sans-serif',
  },
  marqueeLabel: {
    textAlign:'center', fontSize:12, color:'var(--text-muted)', fontWeight:700,
    textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:20,
  },
  marqueeTrack: { overflow:'hidden', position:'relative' },
  marqueeInner: {
    display:'flex', gap:12,
    width:'max-content',
    animation:'marqueeScroll 30s linear infinite',
  },
  marqueeChip: {
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'8px 20px',
    background:'var(--bg-surface)',
    border:'1px solid var(--border)',
    borderRadius:999,
    whiteSpace:'nowrap',
    fontSize:13,
  },

  /* Comparison Table */
  table: { width:'100%', borderCollapse:'collapse', fontFamily:'Inter,sans-serif' },
  th: {
    padding:'14px 20px', textAlign:'center',
    fontSize:13, fontWeight:800, color:'var(--text-secondary)',
    background:'rgba(37,99,235,0.08)',
    borderBottom:'1px solid var(--border)',
    whiteSpace:'nowrap',
  },
  thFeature: {
    padding:'14px 24px', textAlign:'left',
    fontSize:13, fontWeight:800, color:'var(--text-secondary)',
    background:'rgba(37,99,235,0.08)',
    borderBottom:'1px solid var(--border)',
  },
  td: {
    padding:'13px 20px', textAlign:'center',
    borderBottom:'1px solid var(--border)',
    fontSize:15,
    color:'var(--text-primary)',
  },
  tdFeature: {
    padding:'13px 24px', textAlign:'left',
    borderBottom:'1px solid var(--border)',
    fontSize:13, color:'var(--text-secondary)', fontWeight:500,
  },
  cellYes:  { color:'#22c55e', fontWeight:800, fontSize:18 },
  cellNo:   { color:'#ef444460', fontWeight:800, fontSize:18 },
  cellWarn: { color:'#f59e0b', fontSize:13, fontWeight:700 },
};
