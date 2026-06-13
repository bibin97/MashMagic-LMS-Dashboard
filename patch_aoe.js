const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/AOE/AOEDemoSchedule.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add handlePreDemoSubmit right before handleCreateSchedule
const handlePreDemoSubmitCode = `
  const handlePreDemoSubmit = async (e) => {
    e.preventDefault();
    if (!formData.faculty_id) {
      toast.error('Please select a faculty');
      return;
    }
    
    try {
      const scheduleRes = await api.post('/aoe/demo-schedules', { ...formData, type: 'pre-demo', status: 'completed' });
      const newId = scheduleRes.data.demo?.id || scheduleRes.data.id;
      
      if (newId) {
        await api.put(\`/aoe/demo-schedules/\${newId}/evaluate\`, evalData);
      }
      
      toast.success('Pre-Demo Evaluated Successfully');
      setActiveTab('pre-demo');
      setFormData({
        id: undefined, demo_id: '', type: 'demo', student_name: '', student_type: 'new', syllabus: '', section: '', subject: '', faculty_id: '', faculty_name_input: '', date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', hour_rate: '', meeting_link: ''
      });
      setEvalData({ prep_score: 0, comm_score: 0, concept_score: 0, engage_score: 0, parent_score: 0, remarks: '' });
      fetchDemos();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create pre-demo evaluation');
    }
  };

  const handleCreateSchedule`;

content = content.replace('  const handleCreateSchedule', handlePreDemoSubmitCode);

// 2. Change the form rendering
const formStartTarget = `<form onSubmit={handleCreateSchedule} className="space-y-8">`;
const formEndTarget = `          </form>
        </div>
      ) : (`;

const customFormContent = `
          {activeTab === 'schedule_pre_demo' ? (
            <form onSubmit={handlePreDemoSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Demo ID */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Target size={12}/> Demo ID
                  </label>
                  <input
                    type="text"
                    value={formData.demo_id}
                    onChange={(e) => setFormData({ ...formData, demo_id: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                    placeholder="Enter Demo ID"
                  />
                </div>
                {/* Faculty */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Presentation size={12}/> Faculty *
                  </label>
                  <input
                    type="text" required
                    value={formData.faculty_name_input}
                    onFocus={() => setShowFacultySuggestions(true)}
                    onBlur={() => setTimeout(() => setShowFacultySuggestions(false), 200)}
                    onChange={(e) => {
                      setFormData({ ...formData, faculty_name_input: e.target.value, faculty_id: '' });
                      setShowFacultySuggestions(true);
                    }}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                    placeholder="Search faculty..."
                  />
                  
                  {showFacultySuggestions && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto top-full left-0">
                      {faculties
                        .filter(f => f.name.toLowerCase().includes(formData.faculty_name_input.toLowerCase()) || (f.subject && f.subject.toLowerCase().includes(formData.faculty_name_input.toLowerCase())))
                        .map(f => (
                          <div 
                            key={f.id}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, faculty_name_input: f.name, faculty_id: f.id });
                              setShowFacultySuggestions(false);
                            }}
                          >
                            <div className="text-xs font-bold text-slate-800">{f.name}</div>
                            {f.subject && <div className="text-[9px] text-slate-400">{f.subject}</div>}
                          </div>
                        ))}
                      {faculties.filter(f => f.name.toLowerCase().includes(formData.faculty_name_input.toLowerCase())).length === 0 && (
                        <div className="px-4 py-4 text-[10px] text-slate-500 font-bold text-center">
                          No faculty found matching this name.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Subject */}
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <BookOpen size={12}/> Subject
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onFocus={() => setShowSubjectSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSubjectSuggestions(false), 200)}
                    onChange={(e) => {
                      setFormData({ ...formData, subject: e.target.value });
                      setShowSubjectSuggestions(true);
                    }}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                    placeholder="E.g., Mathematics"
                  />
                  {/* Subject Autocomplete Dropdown */}
                  {showSubjectSuggestions && formData.subject && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto top-full left-0">
                      {uniqueSubjects
                        .filter(subj => subj.toLowerCase().includes(formData.subject.toLowerCase()))
                        .map((subj, idx) => (
                          <div 
                            key={idx}
                            className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setFormData({ ...formData, subject: subj });
                              setShowSubjectSuggestions(false);
                            }}
                          >
                            <div className="text-xs font-bold text-slate-800">{subj}</div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
                {/* Date */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <CalendarDays size={12}/> Date *
                  </label>
                  <input
                    type="date" required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Evaluation criteria part */}
              <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 text-center mb-8">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-2">Evaluation Score</h3>
                <div className="text-4xl font-black text-indigo-900">{evalTotalScore} <span className="text-xl text-indigo-400">/ 50</span></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { id: 'prep', label: 'Basic Setup', field: 'prep_score' },
                  { id: 'comm', label: 'Communication', field: 'comm_score' },
                  { id: 'concept', label: 'Concept Delivery', field: 'concept_score' },
                  { id: 'engage', label: 'Engagement', field: 'engage_score' },
                  { id: 'parent', label: 'Parent Response', field: 'parent_score' }
                ].map((item) => (
                  <div key={item.id} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Star size={12} className={evalData[item.field] > 0 ? "text-amber-400" : "text-slate-300"}/> 
                      {item.label} (1-10)
                    </label>
                    <input
                      type="number" min="0" max="10" required
                      value={evalData[item.field]}
                      onChange={(e) => setEvalData({...evalData, [item.field]: e.target.value})}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-lg font-black focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <MessageSquare size={12}/> Remarks
                </label>
                <textarea
                  rows="3" required
                  value={evalData.remarks}
                  onChange={(e) => setEvalData({...evalData, remarks: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                  placeholder="Add your remarks about the demo..."
                />
              </div>

              <div className="flex justify-end pt-8 border-t border-slate-50">
                <button
                  type="submit"
                  className="px-10 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-2"
                >
                  <Save size={16} /> Submit Pre-Demo
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCreateSchedule} className="space-y-8">`;

const oldFormEnd = `            <div className="flex justify-end pt-8 border-t border-slate-50">
              <button
                type="submit"
                className="px-10 py-4 bg-[#008080] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#006666] transition-all flex items-center gap-2"
              >
                <Save size={16} /> Save Schedule
              </button>
            </div>
          </form>
        </div>
      ) : (`

const newFormEnd = `            <div className="flex justify-end pt-8 border-t border-slate-50">
              <button
                type="submit"
                className="px-10 py-4 bg-[#008080] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#006666] transition-all flex items-center gap-2"
              >
                <Save size={16} /> Save Schedule
              </button>
            </div>
          </form>
          )}
        </div>
      ) : (`

content = content.replace('<form onSubmit={handleCreateSchedule} className="space-y-8">', customFormContent);
content = content.replace(oldFormEnd, newFormEnd);

fs.writeFileSync(filePath, content);
console.log("Successfully patched AOEDemoSchedule.jsx");
