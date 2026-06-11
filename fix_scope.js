const fs = require('fs');

const files = [
  'e:/my works/MashMagic-LMS-Dashboard/frontend/src/pages/admin/AcademicSchedule.jsx',
  'e:/my works/MashMagic-LMS-Dashboard/frontend/src/pages/AOE/AcademicSchedule.jsx',
  'e:/my works/MashMagic-LMS-Dashboard/frontend/src/pages/Mentor/AcademicSchedule.jsx',
  'e:/my works/MashMagic-LMS-Dashboard/frontend/src/pages/MentorHead/AcademicSchedule.jsx',
  'e:/my works/MashMagic-LMS-Dashboard/frontend/src/pages/SSC/AcademicSchedule.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  const badBlock = `
  const todayCount = schedule.filter(s => {
    const sessionDate = s.date?.split('T')[0];
    return sessionDate === localTodayStr && s.status !== 'Completed';
  }).length;
  const completedCount = schedule.filter(s => s.status === 'Completed').length;
  const totalCount = schedule.length;
  const filteredCount = currentData.length;
  `;

  // Remove the block from inside the IIFE
  content = content.replace(badBlock, '');

  // Add the block BELOW the IIFE
  const iifeEnd = '  })();\n';
  if (content.includes(iifeEnd)) {
    content = content.replace(iifeEnd, iifeEnd + badBlock);
  }

  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ' + file);
});
