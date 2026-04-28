import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Loading Spinner for Suspense
const PageLoader = () => (
 <div className="min-h-screen w-full flex items-center justify-center bg-white">
 <div className="flex flex-col items-center gap-4">
 <div className="w-12 h-12 border-4 border-[#008080]/20 border-t-[#008080] rounded-full animate-spin"></div>
 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Initializing Portal...</p>
 </div>
 </div>
);

// Layouts - Lazy Loaded
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const MentorLayout = lazy(() => import('./components/Mentor/MentorLayout'));
const FacultyLayout = lazy(() => import('./components/Faculty/FacultyLayout'));
const MentorHeadLayout = lazy(() => import('./components/MentorHead/MentorHeadLayout'));
const AcademicHeadLayout = lazy(() => import('./components/AcademicHead/AcademicHeadLayout'));

// Auth Pages - Lazy Loaded
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));

// Common Pages
const AdminProfile = lazy(() => import('./pages/common/Profile'));

// Admin Pages - Lazy Loaded
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Students = lazy(() => import('./pages/admin/Students'));
const Mentors = lazy(() => import('./pages/admin/Mentors'));
const Faculties = lazy(() => import('./pages/admin/Faculties'));
const Tasks = lazy(() => import('./pages/admin/Tasks'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const InteractionLogs = lazy(() => import('./pages/admin/InteractionLogs'));
const Approvals = lazy(() => import('./pages/admin/Approvals'));
const DailyMentorHeadReport = lazy(() => import('./pages/admin/DailyMentorHeadReport'));
const AdminManagement = lazy(() => import('./pages/admin/AdminManagement'));
const StaffManagement = lazy(() => import('./pages/admin/StaffManagement'));
const AdminLiveMonitoring = lazy(() => import('./pages/admin/LiveMonitoring'));

// Mentor Panel Pages - Lazy Loaded
const MentorDashboard = lazy(() => import('./pages/Mentor/MentorDashboard'));
const MyStudents = lazy(() => import('./pages/Mentor/MyStudents'));
const StudentDetails = lazy(() => import('./pages/Mentor/StudentDetails'));
const MyTasks = lazy(() => import('./pages/Mentor/MyTasks'));
const Timetable = lazy(() => import('./pages/Mentor/Timetable'));
const StudentInteractionLog = lazy(() => import('./pages/Mentor/StudentInteractionLog'));
const FacultyInteractionLog = lazy(() => import('./pages/Mentor/FacultyInteractionLog'));
const Exams = lazy(() => import('./pages/Mentor/Exams'));
const AcademicSchedule = lazy(() => import('./pages/Mentor/AcademicSchedule'));
const StudentsData = lazy(() => import('./pages/Mentor/StudentsData'));

// Faculty Panel Pages - Lazy Loaded
const FacultyDashboard = lazy(() => import('./pages/Faculty/FacultyDashboard'));
const FacultyStudents = lazy(() => import('./pages/Faculty/MyStudents'));
const FacultySessions = lazy(() => import('./pages/Faculty/FacultySessions'));
const FacultyReports = lazy(() => import('./pages/Faculty/FacultyReports'));
const FacultyExams = lazy(() => import('./pages/Faculty/FacultyExams'));
const StudentLogs = lazy(() => import('./pages/Faculty/StudentLogs'));
const FacultyTasks = lazy(() => import('./pages/Faculty/FacultyTasks'));
const FacultyDocuments = lazy(() => import('./pages/Faculty/FacultyDocuments'));
const FacultyNotifications = lazy(() => import('./pages/Faculty/FacultyNotifications'));
const FacultyStudentDetails = lazy(() => import('./pages/Mentor/StudentDetails'));

// Mentor Head Pages - Lazy Loaded
const MentorHeadDashboard = lazy(() => import('./pages/MentorHead/MentorHeadDashboard'));
const MentorRegistration = lazy(() => import('./pages/MentorHead/MentorRegistration'));
const MentorsList = lazy(() => import('./pages/MentorHead/MentorsList'));
const CourseCompletedTracker = lazy(() => import('./pages/MentorHead/CourseCompletedTracker'));
const MentorDetails = lazy(() => import('./pages/MentorHead/MentorDetails'));
const StudentCheckTracker = lazy(() => import('./pages/MentorHead/StudentCheckTracker'));
const StudentShift = lazy(() => import('./pages/MentorHead/StudentShift'));
const MentorHeadInteractions = lazy(() => import('./pages/MentorHead/MentorHeadInteractions'));
const MentorHeadTasks = lazy(() => import('./pages/MentorHead/MentorHeadTasks'));
const FacultyDirectoryMentorHead = lazy(() => import('./pages/MentorHead/FacultyDirectory'));

// Academic Head Pages - Lazy Loaded
const AcademicHeadDashboard = lazy(() => import('./pages/AcademicHead/AcademicHeadDashboard'));
const Registrations = lazy(() => import('./pages/AcademicHead/Registrations'));
const AcademicHeadTasks = lazy(() => import('./pages/AcademicHead/AcademicHeadTasks'));
const AcademicHeadFacultyActivity = lazy(() => import('./pages/AcademicHead/AcademicHeadFacultyActivity'));
const AcademicActions = lazy(() => import('./pages/AcademicHead/AcademicActions'));
const FacultyDirectory = lazy(() => import('./pages/AcademicHead/FacultyDirectory'));
const StudentsListAcademic = lazy(() => import('./pages/AcademicHead/StudentsList'));
const MentorsListAcademic = lazy(() => import('./pages/AcademicHead/MentorsList'));
const Documents = lazy(() => import('./pages/AcademicHead/Documents'));
const FacultyAudit = lazy(() => import('./pages/AcademicHead/FacultyAudit'));
const StudentLogsAcademic = lazy(() => import('./pages/AcademicHead/StudentLogs'));
const FacultyLogsAcademic = lazy(() => import('./pages/AcademicHead/FacultyLogs'));
const CheckingSection = lazy(() => import('./pages/AcademicHead/CheckingSection'));
const AcademicLiveMonitoring = lazy(() => import('./pages/AcademicHead/LiveMonitoring'));
const EditStudent = lazy(() => import('./pages/AcademicHead/EditStudent'));

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
 <Suspense fallback={<PageLoader />}>
 <Routes>
 {/* Public Routes */}
 <Route path="/login" element={<Login />} />
 <Route path="/signup" element={<Signup />} />

 {/* Admin Routes (Super Admin) */}
  <Route path="/admin" element={
  <ProtectedRoute allowedRoles={['super_admin']}>
  <AdminLayout />
  </ProtectedRoute>
  }>
 <Route index element={<Navigate to="/admin/dashboard" replace />} />
 <Route path="dashboard" element={<Dashboard />} />
 <Route path="students" element={<Students />} />
 <Route path="mentors" element={<Mentors />} />
 <Route path="faculties" element={<Faculties />} />
 <Route path="staff" element={<StaffManagement />} />
 <Route path="tasks" element={<Tasks />} />
 <Route path="reports" element={<Reports />} />
 <Route path="mentor-head-report" element={<DailyMentorHeadReport />} />
 <Route path="logs" element={<InteractionLogs />} />
 <Route path="approvals" element={<Approvals />} />
 <Route path="admin-management" element={<AdminManagement />} />
 <Route path="live-monitoring" element={<AdminLiveMonitoring />} />
 <Route path="profile" element={<AdminProfile />} />
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
 <Route path="students" element={<StudentsListAcademic role="mentor_head" />} /> {/* Route for student management */}
 <Route path="faculties" element={<FacultyDirectoryMentorHead />} />
 <Route path="course-completed" element={<CourseCompletedTracker />} />
 <Route path="tasks" element={<MentorHeadTasks />} />
 <Route path="interactions" element={<MentorHeadInteractions />} />
 <Route path="profile" element={<AdminProfile />} />
 </Route>

 {/* Academic Head System */}
 <Route path="/academic-head" element={
 <ProtectedRoute allowedRoles={['academic_head']}>
 <AcademicHeadLayout />
 </ProtectedRoute>
 }>
 <Route index element={<Navigate to="/academic-head/dashboard" replace />} />
 <Route path="dashboard" element={<AcademicHeadDashboard />} />
 <Route path="actions" element={<AcademicActions />} />
 <Route path="faculties" element={<FacultyDirectory />} />
 <Route path="students" element={<StudentsListAcademic role="academic_head" />} />
 <Route path="edit-student/:id" element={<EditStudent />} />
 <Route path="mentors" element={<MentorsListAcademic />} />
 <Route path="documents" element={<Documents />} />
 <Route path="faculty-audit" element={<FacultyAudit />} />
 <Route path="registrations" element={<Registrations />} />
 <Route path="tasks" element={<AcademicHeadTasks />} />
 <Route path="faculty-activity" element={<AcademicHeadFacultyActivity />} />
 <Route path="student-logs" element={<StudentLogsAcademic />} />
 <Route path="faculty-logs" element={<FacultyLogsAcademic />} />
 <Route path="checking" element={<CheckingSection />} />
 <Route path="live-monitoring" element={<AcademicLiveMonitoring />} />
 <Route path="profile" element={<AdminProfile />} />
 </Route>

 {/* Faculty System */}
 <Route path="/faculty" element={
 <ProtectedRoute allowedRoles={['faculty']}>
 <FacultyLayout />
 </ProtectedRoute>
 }>
 <Route index element={<Navigate to="/faculty/dashboard" replace />} />
 <Route path="dashboard" element={<FacultyDashboard />} />
 <Route path="students" element={<FacultyStudents />} />
 <Route path="students/:id" element={<FacultyStudentDetails />} />
 <Route path="sessions" element={<FacultySessions />} />
 <Route path="reports" element={<FacultyReports />} />
 <Route path="exam-scores" element={<FacultyExams />} />
 <Route path="student-logs" element={<StudentLogs />} />
 <Route path="tasks" element={<FacultyTasks />} />
 <Route path="notifications" element={<FacultyNotifications />} />
 <Route path="profile" element={<AdminProfile />} />
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
 <Route path="faculty-log/new" element={<FacultyInteractionLog />} />
 <Route path="exams" element={<Exams />} />
 <Route path="students-data" element={<StudentsData />} />
 <Route path="academic-schedule" element={<AcademicSchedule />} />
 <Route path="profile" element={<AdminProfile />} />
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
 </Suspense>
 </Router>
 </AuthProvider>
 );
}

export default App;
