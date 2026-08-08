import React, { useEffect, Suspense, lazy, Component } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Loader from './components/Loader';
import CursorGlow from './components/CursorGlow';
import FloatingAssistant from './components/FloatingAssistant';
import CommandPalette from './components/CommandPalette';
import BackgroundAurora from './components/BackgroundAurora';
import './styles/global.css';

/* ─── Simple Auth ────────────────────────────────────────── */
const getUser = () => {
  try {
    const user = JSON.parse(localStorage.getItem('cc_user'));
    if (user) return user;
    return { name: 'Developer', email: 'developer@example.com' };
  }
  catch {
    return { name: 'Developer', email: 'developer@example.com' };
  }
};

/* ─── Error Boundary for unbuilt pages ─────────────────── */
class PageBoundary extends Component {
  state = { err: false };
  static getDerivedStateFromError() { return { err: true }; }
  componentDidCatch(error, info) {
    console.error("Boundary Caught Error: ", error, info);
  }
  render() {
    if (this.state.err) return (
      <div style={S.coming}>
        <span style={{ fontSize: 52 }}>🚧</span>
        <h3 style={S.comingTitle}>Something went wrong</h3>
        <p style={S.comingText}>There was an error loading this module.</p>
      </div>
    );
    return this.props.children;
  }
}

/* ─── Lazy Pages ────────────────────────────────────────── */
const Home = lazy(() => import('./pages/Home/index'));
const PublicProgress = lazy(() => import('./pages/PublicProgress/index'));
const Login = lazy(() => import('./pages/Login/index'));
const Register = lazy(() => import('./pages/Register/index'));
const Dashboard = lazy(() => import('./pages/Dashboard/index'));
const Resume = lazy(() => import('./pages/Resume/index'));
const ATS = lazy(() => import('./pages/ATS/index'));
const Interview = lazy(() => import('./pages/Interview/index'));
const MockInterview = lazy(() => import('./pages/MockInterview/index'));
const PortfolioAnalyzer = lazy(() => import('./pages/PortfolioAnalyzer/index'));
const Coding = lazy(() => import('./pages/Coding/index'));
const Jobs = lazy(() => import('./pages/Jobs/index'));
const Roadmap = lazy(() => import('./pages/Roadmap/index'));
const Analytics = lazy(() => import('./pages/Analytics/index'));
const DigitalTwin = lazy(() => import('./pages/DigitalTwin/index'));
const RecruiterArena = lazy(() => import('./pages/RecruiterArena/index'));
const TrendRadar = lazy(() => import('./pages/TrendRadar/index'));
const Profile = lazy(() => import('./pages/Profile/index'));
const Settings = lazy(() => import('./pages/Settings/index'));

/* ─── Protected Route ───────────────────────────────────── */
const ProtectedRoute = ({ children }) =>
  getUser() ? children : <Navigate to="/login" replace />;

/* ─── Layouts ───────────────────────────────────────────── */
const PublicLayout = () => (
  <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <Navbar />
    <main style={{ flex: 1 }}>
      <Outlet />
    </main>
  </div>
);

const AuthLayout = () => (
  <div style={S.authWrap}>
    <Outlet />
  </div>
);

const DashboardLayout = () => {
  const location = useLocation();
  const isCoding = location.pathname.startsWith('/coding');

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', background: 'var(--bg-base, #f0f6ff)' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {!isCoding && <Navbar />}
        <main style={isCoding ? S.codingMain : S.dashMain}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

/* ─── Wrap page with error boundary ────────────────────── */
const P = ({ C }) => <PageBoundary><C /></PageBoundary>;

/* ─── App ───────────────────────────────────────────────── */
export default function App() {
  useEffect(() => { window.__hideSplash?.(); }, []);

  return (
    <>
      <BackgroundAurora />
      <CursorGlow />
      <FloatingAssistant />
      <CommandPalette />
      <Suspense fallback={<Loader type="page" />}>
        <Routes>

          {/* Public — Landing */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<P C={Home} />} />
            <Route path="/share/progress/:shareId" element={<P C={PublicProgress} />} />
          </Route>

          {/* Auth — no nav */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<P C={Login} />} />
            <Route path="/register" element={<P C={Register} />} />
          </Route>

          {/* Dashboard — protected + sidebar */}
          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<P C={Dashboard} />} />
            <Route path="/resume" element={<P C={Resume} />} />
            <Route path="/ats" element={<P C={ATS} />} />
            <Route path="/interview" element={<P C={Interview} />} />
            <Route path="/mock-interview" element={<P C={MockInterview} />} />
            <Route path="/interview/session/:sessionId" element={<P C={MockInterview} />} />
            <Route path="/portfolio-analyzer" element={<P C={PortfolioAnalyzer} />} />
            <Route path="/coding" element={<P C={Coding} />} />
            <Route path="/jobs" element={<P C={Jobs} />} />
            <Route path="/roadmap" element={<P C={Roadmap} />} />
            <Route path="/analytics" element={<P C={Analytics} />} />
            <Route path="/twin" element={<P C={DigitalTwin} />} />
            <Route path="/recruiter" element={<P C={RecruiterArena} />} />
            <Route path="/trends" element={<P C={TrendRadar} />} />
            <Route path="/profile" element={<P C={Profile} />} />
            <Route path="/settings" element={<P C={Settings} />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>
    </>
  );
}

/* ─── Inline Styles ─────────────────────────────────────── */
const S = {
  dashMain: {
    flex: 1,
    padding: '32px',
    background: 'var(--bg-base, #f0f6ff)',
    overflowY: 'auto',
    fontFamily: 'var(--font-sans)',
  },
  codingMain: {
    flex: 1,
    padding: 0,
    margin: 0,
    background: '#0b0f19',
    overflow: 'hidden',
    height: '100%',
    width: '100%',
  },
  authWrap: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-base, #f0f6ff)',
    padding: '24px',
  },
  coming: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: '16px',
    textAlign: 'center',
  },
  comingTitle: { color: 'var(--text-primary, #0f172a)', fontFamily: 'var(--font-sans)', fontSize: '22px', fontWeight: 700 },
  comingText: { color: 'var(--text-muted, #64748b)', fontFamily: 'var(--font-sans)', fontSize: '14px' },
};
