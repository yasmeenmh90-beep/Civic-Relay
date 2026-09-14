import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Sparkles } from 'lucide-react';

// Route-level code splitting
const HomePage = React.lazy(() => import('./pages/Home').then((m) => ({ default: m.HomePage })));
const LoginPage = React.lazy(() => import('./pages/Login').then((m) => ({ default: m.LoginPage })));
const SignupPage = React.lazy(() => import('./pages/Signup').then((m) => ({ default: m.SignupPage })));
const ReportIssuePage = React.lazy(() => import('./pages/ReportIssue').then((m) => ({ default: m.ReportIssuePage })));
const ProcessingPage = React.lazy(() => import('./pages/Processing').then((m) => ({ default: m.ProcessingPage })));
const MyIssuesPage = React.lazy(() => import('./pages/MyIssues').then((m) => ({ default: m.MyIssuesPage })));
const IssueDetailsPage = React.lazy(() => import('./pages/IssueDetails').then((m) => ({ default: m.IssueDetailsPage })));
const CommunityMapPage = React.lazy(() => import('./pages/CommunityMap').then((m) => ({ default: m.CommunityMapPage })));
const StaffDashboardPage = React.lazy(() => import('./pages/StaffDashboard').then((m) => ({ default: m.StaffDashboardPage })));
const PrivacyPage = React.lazy(() => import('./pages/Privacy').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = React.lazy(() => import('./pages/Terms').then((m) => ({ default: m.TermsPage })));
const NotFoundPage = React.lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFoundPage })));

const RouteLoadingFallback: React.FC = () => (
  <div className="flex-1 min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
    <div className="relative flex items-center justify-center mb-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-glow-cyan border border-border">
        <Sparkles className="w-6 h-6 text-neon-cyan animate-pulse" />
      </div>
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-neon-mint animate-ping" />
    </div>
    <span className="text-xs font-mono font-semibold uppercase tracking-widest text-foreground-muted">
      Synchronizing Autonomous Node...
    </span>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppShell>
              <Suspense fallback={<RouteLoadingFallback />}>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/community-map" element={<CommunityMapPage />} />
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />

                  {/* Authenticated Citizen Routes */}
                  <Route
                    path="/report"
                    element={
                      <ProtectedRoute>
                        <ReportIssuePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/processing/:issueId"
                    element={
                      <ProtectedRoute>
                        <ProcessingPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-issues"
                    element={
                      <ProtectedRoute>
                        <MyIssuesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/issues/:issueId"
                    element={
                      <ProtectedRoute>
                        <IssueDetailsPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Staff Only Routes */}
                  <Route
                    path="/staff"
                    element={
                      <ProtectedRoute requireStaff>
                        <StaffDashboardPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* 404 Route */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
            </AppShell>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
