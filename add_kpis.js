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

  // We need to inject the KPI calculation logic right after `const localTodayStr = ...`
  // and inject the UI right before `{/* Tabs and Search Bar */}`

  const logicMatch = content.match(/const localTodayStr = [\s\S]*?\(\);\s+/);
  if (!logicMatch) {
    console.log(`Could not find localTodayStr in ${file}`);
    return;
  }

  const kpiLogic = `
  const todayCount = schedule.filter(s => {
    const sessionDate = s.date?.split('T')[0];
    return sessionDate === localTodayStr && s.status !== 'Completed';
  }).length;
  const completedCount = schedule.filter(s => s.status === 'Completed').length;
  const totalCount = schedule.length;
  const filteredCount = currentData.length;
  `;

  if (!content.includes('const todayCount =')) {
    content = content.replace(logicMatch[0], logicMatch[0] + kpiLogic + '\n');
  }

  // Next, replace the existing stats in the header (if any) and inject the KPI row
  // Most files have: {/* Tabs and Search Bar */}
  // We'll inject before that.

  const uiString = `
      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total</p>
            <p className="text-lg font-black text-slate-900 leading-none">{totalCount}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
            <Timer size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Today</p>
            <p className="text-lg font-black text-slate-900 leading-none">{todayCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
            <CheckSquare size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Completed</p>
            <p className="text-lg font-black text-slate-900 leading-none">{completedCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
            <Filter size={18} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Filtered</p>
            <p className="text-lg font-black text-slate-900 leading-none">{filteredCount}</p>
          </div>
        </div>
      </div>
  `;

  if (!content.includes('KPI Stats Row')) {
    content = content.replace('{/* Tabs and Search Bar */}', uiString + '\n      {/* Tabs and Search Bar */}');
  }

  // Remove the old "Active Track" stat from the header to avoid redundancy.
  // It usually looks like:
  /*
        <div className="flex items-center gap-4">
          <div className="bg-slate-50 px-4 md:px-6 py-2.5 md:py-3 rounded-[1rem] md:rounded-2xl border border-slate-100 flex items-center gap-3">
            <Activity className="text-emerald-500 shrink-0" size={14} />
            <div>
              <p className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest">Active Track</p>
              <p className="text-xs md:text-sm font-black text-slate-900 leading-none">{schedule.filter(s => s.status === 'Scheduled').length} Sessions</p>
            </div>
          </div>
        </div>
  */
  const oldStatRegex = /<div className="flex items-center gap-4">[\s\S]*?<Activity className="text-emerald-500[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/g;
  content = content.replace(oldStatRegex, '');

  fs.writeFileSync(file, content, 'utf8');
  console.log('Updated ' + file);
});
