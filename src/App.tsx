import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import MockInterview from './pages/MockInterview';
import CareerRoadmap from './pages/CareerRoadmap';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import PublicLayout from './components/PublicLayout';
import ResumeBuilder from './pages/ResumeBuilder';
import Evaluating from './pages/Evaluating';
import EligibilityCriteria from './pages/EligibilityCriteria';
import Quiz from './pages/Quiz';
import ProgressTracking from './pages/ProgressTracking';

function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public/Landing Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
            </Route>

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/resume" element={<ResumeAnalyzer />} />
                <Route path="/interview" element={<MockInterview />} />
                <Route path="/roadmap" element={<CareerRoadmap />} />
                <Route path="/resume-builder" element={<ResumeBuilder />} />
                <Route path="/evaluating" element={<Evaluating />} />
                <Route path="/eligibility" element={<EligibilityCriteria />} />
                <Route path="/quiz" element={<Quiz />} />
                <Route path="/progress" element={<ProgressTracking />} />
                {/* Additional dashboard routes will be added here */}
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </AppProvider>
  );
}

export default App;
