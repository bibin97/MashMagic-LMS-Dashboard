import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import MentorLayout from './components/Mentor/MentorLayout';

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import Mentors from './pages/admin/Mentors';
import Faculties from './pages/admin/Faculties';
import Tasks from './pages/admin/Tasks';
import Reports from './pages/admin/Reports';
import InteractionLogs from './pages/admin/InteractionLogs';
import Approvals from './pages/Admin/Approvals';
import DailyMentorHeadReport from './pages/Admin/DailyMentorHeadReport';

// Auth Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
// Removed separate Mentor Signup/Login pages as requested

// Mentor Panel Pages
import MentorDashboard from './pages/Mentor/MentorDashboard';
import MyStudents from './pages/Mentor/MyStudents';
import StudentDetails from './pages/Mentor/StudentDetails';
import MyTasks from './pages/Mentor/MyTasks';
import Timetable from './pages/Mentor/Timetable';
import StudentInteractionLog from './pages/Mentor/StudentInteractionLog';
import FacultyInteractionLog from './pages/Mentor/FacultyInteractionLog';

// Placeholders
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';

// Mentor Head Pages
import MentorHeadLayout from './components/MentorHead/MentorHeadLayout';
import MentorHeadDashboard from './pages/MentorHead/MentorHeadDashboard';
import MentorRegistration from './pages/MentorHead/MentorRegistration';
import MentorsList from './pages/MentorHead/MentorsList';
import MentorDetails from './pages/MentorHead/MentorDetails';
import StudentCheckTracker from './pages/MentorHead/StudentCheckTracker';
import StudentShift from './pages/MentorHead/StudentShift';

// Academic Head Pages
import AcademicHeadLayout from './components/AcademicHead/AcademicHeadLayout';
import AcademicHeadDashboard from './pages/AcademicHead/AcademicHeadDashboard';
import Registrations from './pages/AcademicHead/Registrations';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'rounded-2xl font-bold text-sm shadow-xl',
            duration: 3000,
          }}
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Admin Routes (Super Admin) */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="mentors" element={<Mentors />} />
            <Route path="faculties" element={<Faculties />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="reports" element={<Reports />} />
            <Route path="mentor-head-report" element={<DailyMentorHeadReport />} />
            <Route path="logs" element={<InteractionLogs />} />
            <Route path="approvals" element={<Approvals />} />
          </Route>

          {/* Mentor Head System */}
          <Route path="/mentor-head" element={
            <ProtectedRoute allowedRoles={['mentor_head']}>
              <MentorHeadLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/mentor-head/dashboard" replace />} />
            <Route path="dashboard" element={<MentorHeadDashboard />} />
            <Route path="checks" element={<StudentCheckTracker />} />
            <Route path="shift" element={<StudentShift />} />
            <Route path="register-mentor" element={<MentorRegistration />} />
            <Route path="mentors" element={<MentorsList />} />
            <Route path="mentors/:id" element={<MentorDetails />} />
          </Route>

          {/* Academic Head System */}
          <Route path="/academic-head" element={
            <ProtectedRoute allowedRoles={['academic_head']}>
              <AcademicHeadLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/academic-head/dashboard" replace />} />
            <Route path="dashboard" element={<AcademicHeadDashboard />} />
            <Route path="registrations" element={<Registrations />} />
          </Route>

          {/* Mentor System Built for MashMagic */}
          <Route path="/mentor" element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <MentorLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/mentor/dashboard" replace />} />
            <Route path="dashboard" element={<MentorDashboard />} />
            <Route path="students" element={<MyStudents />} />
            <Route path="students/:id" element={<StudentDetails />} />
            <Route path="tasks" element={<MyTasks />} />
            <Route path="timetable" element={<Timetable />} />
            <Route path="student-log" element={<StudentInteractionLog />} />
            <Route path="faculty-log" element={<FacultyInteractionLog />} />
          </Route>

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute allowedRoles={['student', 'user']}>
              {/* Reusing AdminLayout for now as minimal placeholder */}
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/student/dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
          </Route>

          {/* Faculty Routes */}
          <Route path="/faculty" element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/faculty/dashboard" replace />} />
            <Route path="dashboard" element={<FacultyDashboard />} />
          </Route>

          {/* Root Redirection Logic */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 Route */}
          <Route path="*" element={
            <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
              <h1 className="text-9xl font-black text-slate-200">404</h1>
              <p className="text-xl font-bold text-slate-600 -mt-8 mb-8">Access Token Invalid or Page Missing</p>
              <button
                onClick={() => window.location.href = '/'}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-slate-800 transition-all font-black uppercase tracking-widest text-[10px]"
              >
                Return to Safety
              </button>
            </div>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
