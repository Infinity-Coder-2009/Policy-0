/**
 * App Component with Routing
 * ============================================================
 * Main application router with Clerk-protected routes.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import { Layout } from './components/layout';
import { LoginPage, SignupPage } from './pages/auth';
import { DashboardPage } from './pages/Dashboard';
import { GeneratePage } from './pages/Generate';
import { PoliciesPage } from './pages/Policies';
import { FlywheelPage } from './pages/Flywheel';
import { SettingsPage } from './pages/Settings';
import { HealthPage } from './pages/Health';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        <Layout>{children}</Layout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/generate" element={<ProtectedRoute><GeneratePage /></ProtectedRoute>} />
        <Route path="/policies" element={<ProtectedRoute><PoliciesPage /></ProtectedRoute>} />
        <Route path="/flywheel" element={<ProtectedRoute><FlywheelPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/health" element={<ProtectedRoute><HealthPage /></ProtectedRoute>} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}