const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Replace Faculty Daily Update import
content = content.replace(
  /import FacultyDailyUpdate from '\.\/pages\/Faculty\/FacultyDailyUpdate';\n/,
  "import FacultyTimetable from './pages/Faculty/FacultyTimetable';\nimport FacultySchedule from './pages/Faculty/FacultySchedule';\n"
);

// Replace Faculty Daily Update route
content = content.replace(
  /<Route path="student-logs" element={<FacultyDailyUpdate \/>} \/>/,
  '<Route path="timetable" element={<FacultyTimetable />} />\n            <Route path="schedule" element={<FacultySchedule />} />'
);

// Add Admin Daily Updates import
content = content.replace(
  /import StaffManagement from '\.\/pages\/admin\/StaffManagement';\n/,
  "import StaffManagement from './pages/admin/StaffManagement';\nimport AdminDailyUpdates from './pages/admin/AdminDailyUpdates';\n"
);

// Add Admin Daily Updates route
content = content.replace(
  /<Route path="academic-schedule" element={<AdminAcademicSchedule \/>} \/>\n\s*<Route path="profile" element={<AdminProfile \/>} \/>/,
  '<Route path="academic-schedule" element={<AdminAcademicSchedule />} />\n            <Route path="daily-updates" element={<AdminDailyUpdates />} />\n            <Route path="profile" element={<AdminProfile />} />'
);

// Add AOE Daily Updates import
content = content.replace(
  /import QualityAudit from '\.\/pages\/AOE\/QualityAudit';\n/,
  "import QualityAudit from './pages/AOE/QualityAudit';\nimport AOEDailyUpdates from './pages/AOE/AOEDailyUpdates';\n"
);

// Add AOE Daily Updates route
content = content.replace(
  /<Route path="quality-audit" element={<QualityAudit \/>} \/>\n\s*<Route path="profile" element={<AdminProfile \/>} \/>/,
  '<Route path="quality-audit" element={<QualityAudit />} />\n            <Route path="daily-updates" element={<AOEDailyUpdates />} />\n            <Route path="profile" element={<AdminProfile />} />'
);

// Add AH Daily Updates import
content = content.replace(
  /import AHParentMeetings from '\.\/pages\/AcademicHead\/AHParentMeetings';\n/,
  "import AHParentMeetings from './pages/AcademicHead/AHParentMeetings';\nimport AHDailyUpdates from './pages/AcademicHead/AHDailyUpdates';\n"
);

// Add AH Daily Updates route
content = content.replace(
  /<Route path="parent-meetings" element={<AHParentMeetings \/>} \/>\n\s*<Route path="profile" element={<AdminProfile \/>} \/>/,
  '<Route path="parent-meetings" element={<AHParentMeetings />} />\n            <Route path="daily-updates" element={<AHDailyUpdates />} />\n            <Route path="profile" element={<AdminProfile />} />'
);

fs.writeFileSync('frontend/src/App.jsx', content);
console.log('App.jsx updated successfully.');
