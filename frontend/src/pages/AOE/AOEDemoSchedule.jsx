import React, {  useState, useEffect , useDeferredValue } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  CalendarDays, ListTodo, Plus, Target, Presentation, 
  Video, RefreshCcw, Save, XCircle, Search, Clock, DollarSign, User, BookOpen,
  CheckCircle, CheckCircle2, Pencil, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AOEDemoSchedule = () => {
  const [activeTab, setActiveTab] = useState('demo');
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [students, setStudents] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFacultySuggestions, setShowFacultySuggestions] = useState(false);
  const [showSubjectSuggestions, setShowSubjectSuggestions] = useState(false);
  const [demoList, setDemoList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
	const deferredSearchTerm = useDeferredValue(searchTerm);
  const navigate = useNavigate();

  // Current time state for Live button logic
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  // Form State
  const [formData, setFormData] = useState({
    demo_id: '',
    student_name: '',
    student_type: 'new',
    syllabus: '',
    section: '',
    subject: '',
    faculty_id: '',
    faculty_name_input: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    hour_rate: '',
    meeting_link: ''
  });

  const SYLLABUS_OPTIONS = ["CBSE", "STATE", "ICSE", "IGCSE", "IB"];
  const SECTION_OPTIONS = ["KG", "LP", "UP", "HS", "HSS"];

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [evalData, setEvalData] = useState({
    prep_score: 0,
    comm_score: 0,
    concept_score: 0,
    engage_score: 0,
    parent_score: 0,
    remarks: ''
  });

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);

  const evalTotalScore = 
    (Number(evalData.prep_score) || 0) + 
    (Number(evalData.comm_score) || 0) + 
    (Number(evalData.concept_score) || 0) + 
    (Number(evalData.engage_score) || 0) + 
    (Number(evalData.parent_score) || 0);

  const uniqueSubjects = Array.from(new Set(faculties.map(f => f.subject).filter(Boolean)));

  useEffect(() => {
    fetchFaculties();
    fetchStudents();
    fetchDemos();
    
    // Update time every minute
    const interval = setInterval(() => {
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let maxId = 0;
    demoList.forEach(d => {
      if (d.demo_id && d.demo_id.startsWith('DE')) {
        const num = parseInt(d.demo_id.substring(2));
        if (!isNaN(num) && num > maxId) maxId = num;
      } else if (d.demo_id && !isNaN(parseInt(d.demo_id))) {
         const num = parseInt(d.demo_id);
         if (num > maxId) maxId = num;
      }
    });
    
    const nextId = `DE${String(maxId + 1).padStart(2, '0')}`;
    
    setFormData(prev => {
      // Only overwrite if it's empty, or if the current automatically populated ID is stale/duplicate
      if (!prev.demo_id || (prev.demo_id.startsWith('DE') && parseInt(prev.demo_id.substring(2)) <= maxId)) {
        return { ...prev, demo_id: nextId };
      }
      return prev;
    });
  }, [demoList]);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/aoe/students');
      if (response.data.success) {
        setStudents((response.data.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await api.get('/aoe/dropdowns');
      if (response.data.success && response.data.data.faculties) {
        setFaculties(response.data.data.faculties);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const fetchDemos = async () => {
    setLoading(true);
    try {
      const response = await api.get('/aoe/demo-schedules');
      if (response.data.success) {
        setDemoList(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch demo schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    const isPreDemo = activeTab === 'schedule_pre_demo';
    
    if (!isPreDemo && !formData.faculty_id) {
      toast.error('Please select a faculty');
      return;
    }
    
    try {
      if (formData.id) {
        await api.put(`/aoe/demo-schedules/${formData.id}`, { ...formData, type: isPreDemo ? 'pre-demo' : 'demo' });
        toast.success('Demo Schedule Updated Successfully');
        setShowEditModal(false);
      } else {
        await api.post('/aoe/demo-schedules', { ...formData, type: isPreDemo ? 'pre-demo' : 'demo' });
        toast.success('Demo Schedule Created Successfully');
      }
      
      setFormData({
        id: undefined,
        demo_id: '',
        type: 'demo',
        student_name: '',
        student_type: 'new',
        syllabus: '',
        section: '',
        subject: '',
        faculty_id: '',
        faculty_name_input: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '',
        end_time: '',
        hour_rate: '',
        meeting_link: ''
      });
      setActiveTab(isPreDemo ? 'pre-demo' : 'demo');
      fetchDemos();
    } catch (error) {
      toast.error(error.response?.data?.message || (formData.id ? 'Failed to update schedule' : 'Failed to create schedule'));
    }
  };

  const handleEditClick = (demo) => {
    setFormData({
      id: demo.id,
      demo_id: demo.demo_id || '',
      type: demo.type || 'demo',
      student_name: demo.student_name || '',
      student_type: demo.student_type || 'new',
      syllabus: demo.syllabus || '',
      section: demo.section || '',
      subject: demo.subject || '',
      faculty_id: demo.faculty_id || '',
      faculty_name_input: demo.faculty_name || '',
      date: demo.date ? demo.date.substring(0, 10) : new Date().toISOString().split('T')[0],
      start_time: demo.start_time ? demo.start_time.substring(0, 5) : '',
      end_time: demo.end_time ? demo.end_time.substring(0, 5) : '',
      hour_rate: demo.hour_rate || '',
      meeting_link: demo.meeting_link || ''
    });
    setShowEditModal(true);
  };

  const handleToggleSuccess = async (demoId) => {
    try {
      const res = await api.put(`/aoe/demo-schedules/${demoId}/toggle-success`);
      toast.success('Demo success status updated');
      fetchDemos();
    } catch (error) {
      toast.error('Failed to update success status');
    }
  };

  const handleDeleteClick = async (demoId) => {
    if (window.confirm('Are you sure you want to delete this demo schedule?')) {
      try {
        await api.delete(`/aoe/demo-schedules/${demoId}`);
        toast.success('Demo Schedule Deleted Successfully');
        fetchDemos();
      } catch (error) {
        toast.error('Failed to delete demo schedule');
      }
    }
  };

  const openEvaluationModal = (demo) => {
    setSelectedDemo(demo);
    setEvalData({
      prep_score: demo.prep_score || 0,
      comm_score: demo.comm_score || 0,
      concept_score: demo.concept_score || 0,
      engage_score: demo.engage_score || 0,
      parent_score: demo.parent_score || 0,
      remarks: demo.remarks || ''
    });
    setShowModal(true);
  };

  const handleEvaluationSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/aoe/demo-schedules/${selectedDemo.id}/evaluate`, evalData);
      toast.success('Evaluation submitted successfully');
      setShowModal(false);
      fetchDemos();
    } catch (error) {
      toast.error('Failed to submit evaluation');
    }
  };

  const filteredDemos = demoList.filter(d => 
    (activeTab === 'pre-demo' ? d.type === 'pre-demo' : (!d.type || d.type === 'demo')) &&
    (d.student_name?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) || 
     d.faculty_name?.toLowerCase().includes(deferredSearchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 border-b-4 border-b-[#008080]">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Target size={24} />
            </div>
            </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex flex-wrap gap-4 p-2 bg-slate-50/80 backdrop-blur-md rounded-[2rem] border border-slate-200 shadow-inner">
        <button
          onClick={() => setActiveTab('demo')}
          className={`flex-1 min-w-[200px] py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
            activeTab === 'demo'
              ? 'bg-white text-[#008080] shadow-md border-b-2 border-b-[#008080]'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <ListTodo size={16} /> Demo Schedule
        </button>
        <button
          onClick={() => setActiveTab('pre-demo')}
          className={`flex-1 min-w-[200px] py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
            activeTab === 'pre-demo'
              ? 'bg-white text-emerald-600 shadow-md border-b-2 border-b-emerald-600'
              : 'text-slate-500 hover:bg-slate-100'
          }`}
        >
          <Target size={16} /> Pre-Demo
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'schedule_demo' || activeTab === 'schedule_pre_demo' ? (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
              <Target className="text-[#008080]" /> Schedule New {activeTab === 'schedule_pre_demo' ? 'Pre-Demo' : 'Demo'}
            </h2>
            <button 
              onClick={() => setActiveTab(activeTab === 'schedule_pre_demo' ? 'pre-demo' : 'demo')}
              className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <XCircle size={24} />
            </button>
          </div>
          
          <form onSubmit={handleCreateSchedule} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Target size={12}/> Demo ID *
                </label>
                <input
                  type="text" required readOnly
                  value={formData.demo_id}
                  className="w-full p-4 bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl text-xs font-bold outline-none cursor-not-allowed"
                  placeholder="Auto-generated ID"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Target size={12}/> Student Type *
                </label>
                <select
                  required
                  value={formData.student_type}
                  onChange={(e) => setFormData({ ...formData, student_type: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                >
                  <option value="new">New Student</option>
                  <option value="existing">Existing Student</option>
                </select>
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <User size={12}/> Student Name *
                </label>
                <input
                  type="text" required
                  value={formData.student_name}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, student_name: val });
                    setShowSuggestions(true);
                  }}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                  placeholder="Type to search or enter new name"
                />
                
                {/* Custom Autocomplete Dropdown */}
                {showSuggestions && formData.student_name && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto top-full left-0">
                    {students
                      .filter(s => s.name.toLowerCase().includes(formData.student_name.toLowerCase()))
                      .map(s => (
                        <div 
                          key={s.id}
                          className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormData({ 
                              ...formData, 
                              student_name: s.name,
                              student_type: 'existing',
                              syllabus: s.syllabus || '',
                              section: s.section || s.grade || ''
                            });
                            setShowSuggestions(false);
                          }}
                        >
                          <div className="text-xs font-bold text-slate-800">{s.name}</div>
                          {s.email && <div className="text-[9px] text-slate-400">{s.email}</div>}
                        </div>
                      ))}
                    {students.filter(s => s.name.toLowerCase().includes(formData.student_name.toLowerCase())).length === 0 && (
                      <div className="px-4 py-4 text-[10px] text-slate-500 font-bold text-center">
                        No matches found. Will be added as a new student.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <BookOpen size={12}/> Syllabus *
                </label>
                <select
                  required
                  value={formData.syllabus}
                  onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                >
                  <option value="" disabled>Select Syllabus</option>
                  {SYLLABUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Target size={12}/> Section *
                </label>
                <select
                  required
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                >
                  <option value="" disabled>Select Section</option>
                  {SECTION_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <BookOpen size={12}/> Subject *
                </label>
                <input
                  type="text" required
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
                    {uniqueSubjects.filter(subj => subj.toLowerCase().includes(formData.subject.toLowerCase())).length === 0 && (
                      <div className="px-4 py-4 text-[10px] text-slate-500 font-bold text-center">
                        No matches found. You can add this as a new subject.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Presentation size={12}/> Faculty {activeTab !== 'schedule_pre_demo' && '*'}
                </label>
                <input
                  type="text" required={activeTab !== 'schedule_pre_demo'}
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

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <CalendarDays size={12}/> Date {activeTab !== 'schedule_pre_demo' && '*'}
                </label>
                <input
                  type="date" required={activeTab !== 'schedule_pre_demo'}
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Clock size={12}/> Start Time {activeTab !== 'schedule_pre_demo' && '*'}
                </label>
                <input
                  type="time" required={activeTab !== 'schedule_pre_demo'}
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Clock size={12}/> End Time {activeTab !== 'schedule_pre_demo' && '*'}
                </label>
                <input
                  type="time" required={activeTab !== 'schedule_pre_demo'}
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <DollarSign size={12}/> Hourly Rate
                </label>
                <input
                  type="number" step="0.01" min="0"
                  value={formData.hour_rate}
                  onChange={(e) => setFormData({ ...formData, hour_rate: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Video size={12}/> Meeting Link (e.g. Google Meet / Zoom)
                </label>
                <input
                  type="text"
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                  placeholder="https://meet.google.com/..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-slate-50">
              <button
                type="submit"
                className="px-10 py-4 bg-[#008080] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-[#006666] transition-all flex items-center gap-2"
              >
                <Save size={16} /> Save Schedule
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-6 animate-in fade-in duration-500">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-50 pb-6">
            <div className="flex items-center gap-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                <ListTodo className={activeTab === 'pre-demo' ? 'text-emerald-600' : 'text-[#008080]'} /> 
                {activeTab === 'pre-demo' ? 'Pre-Demos' : 'Scheduled Demos'}
              </h2>
              <button
                onClick={() => {
                  setFormData({ id: undefined, demo_id: '', student_name: '', student_type: 'new', syllabus: '', section: '', subject: '', faculty_id: '', faculty_name_input: '', date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', hour_rate: '', meeting_link: '' });
                  setActiveTab(activeTab === 'pre-demo' ? 'schedule_pre_demo' : 'schedule_demo');
                }}
                className={`px-6 py-2.5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-md transition-all flex items-center gap-2 ${activeTab === 'pre-demo' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-[#008080] hover:bg-[#006666]'}`}
              >
                <Plus size={14} /> Add {activeTab === 'pre-demo' ? 'Pre-Demo' : 'Demo'}
              </button>
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search student or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[300px] pl-12 pr-4 py-3 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-slate-100 focus:ring-4 ring-[#008080]/10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div></div>
          ) : filteredDemos.length === 0 ? (
            <div className="text-center p-20 text-slate-400 font-bold uppercase tracking-widest text-[10px]">No demo schedules found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDemos.map(demo => (
                <div key={demo.id} className={`p-6 rounded-[2rem] border shadow-sm transition-all hover:shadow-lg ${demo.status === 'completed' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-white border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-black px-3 py-1 bg-slate-100 text-slate-600 rounded-full uppercase tracking-widest">
                        Demo #{demo.demo_id || demo.id}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mt-2">{demo.student_name}</h3>
                      <p className="text-[10px] font-black text-[#008080] uppercase tracking-widest">{demo.student_type} Student</p>
                    </div>
                    {demo.status === 'completed' ? (
                      <div className="flex gap-4">
                        <div className="text-center mt-2">
                          <span className="block text-[20px] font-black text-emerald-600">{demo.total_score}/50</span>
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Score</span>
                        </div>
                        <div className="flex flex-col gap-2 mt-1 border-l pl-4 border-slate-100">
                          <button 
                            onClick={() => handleToggleSuccess(demo.id)}
                            className={`transition-colors ${demo.is_successful ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-emerald-400'}`}
                            title={demo.is_successful ? "Mark as unsuccessful" : "Mark as successful"}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditClick(demo)}
                            className="text-emerald-400 hover:text-indigo-600 transition-colors"
                            title="Edit Demo"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(demo.id)}
                            className="text-emerald-400 hover:text-rose-600 transition-colors"
                            title="Delete Demo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center mt-2">
                          <span className="text-[9px] font-black px-3 py-1 bg-amber-100 text-amber-600 rounded-full uppercase tracking-widest">Pending</span>
                        </div>
                        <div className="flex flex-col gap-2 mt-1 border-l pl-4 border-slate-100">
                          <button 
                            onClick={() => handleToggleSuccess(demo.id)}
                            className={`transition-colors ${demo.is_successful ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-emerald-400'}`}
                            title={demo.is_successful ? "Mark as unsuccessful" : "Mark as successful"}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditClick(demo)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                            title="Edit Demo"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(demo.id)}
                            className="text-slate-400 hover:text-rose-600 transition-colors"
                            title="Delete Demo"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-6 text-xs font-bold text-slate-600">
                    {demo.date && <p className="flex items-center gap-2"><CalendarDays size={14} className="text-slate-400"/> {new Date(demo.date).toLocaleDateString('en-GB')}</p>}
                    <p className="flex items-center gap-2"><BookOpen size={14} className="text-slate-400"/> {demo.subject}</p>
                    {demo.faculty_name && <p className="flex items-center gap-2"><Presentation size={14} className="text-slate-400"/> {demo.faculty_name}</p>}
                    {demo.start_time && demo.end_time && <p className="flex items-center gap-2"><Clock size={14} className="text-slate-400"/> {demo.start_time} - {demo.end_time}</p>}
                    {demo.meeting_link && (
                      <p className="flex items-center gap-2">
                        <Video size={14} className="text-slate-400"/> 
                        <a href={demo.meeting_link} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate max-w-[200px]">
                          Join Meeting
                        </a>
                      </p>
                    )}
                  </div>

                  {demo.type !== 'pre-demo' && (
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      {(() => {
                        let isLive = false;
                        if (demo.start_time && demo.end_time) {
                          const [startH, startM] = demo.start_time.split(':').map(Number);
                          const [endH, endM] = demo.end_time.split(':').map(Number);
                          const startMins = startH * 60 + startM;
                          const endMins = endH * 60 + endM;
                          isLive = currentTimeMinutes >= startMins && currentTimeMinutes <= endMins;
                        }

                        return (
                          <button className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            isLive 
                              ? 'bg-rose-500 text-white animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                          }`}>
                            <Video size={14} className={isLive ? "text-white" : ""} /> Live
                          </button>
                        );
                      })()}
                      
                      <button 
                        onClick={() => openEvaluationModal(demo)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${demo.status === 'completed' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                      >
                        {demo.status === 'completed' ? 'Update Eval' : 'Evaluate'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Evaluation Modal */}
      {showModal && selectedDemo && (
        <div className="fixed inset-0 bg-[#008080]/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Evaluate Demo</h2>
                <p className="text-[10px] font-black text-[#008080] uppercase tracking-widest mt-1">
                  {selectedDemo.student_name} • {selectedDemo.faculty_name}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm transition-all">
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleEvaluationSubmit} className="flex-1 overflow-y-auto p-10 space-y-8">
              
              <div className="bg-indigo-50/50 p-6 rounded-[2rem] border border-indigo-100 text-center mb-8">
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2">Total Score</p>
                <h3 className="text-4xl font-black text-indigo-900">{evalTotalScore} <span className="text-xl text-indigo-400">/ 50</span></h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { label: 'Preparation', field: 'prep_score' },
                  { label: 'Communication', field: 'comm_score' },
                  { label: 'Concept Delivery', field: 'concept_score' },
                  { label: 'Student Engagement', field: 'engage_score' },
                  { label: 'Parent Response', field: 'parent_score' },
                ].map((item) => (
                  <div key={item.field} className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex justify-between">
                      <span>{item.label}</span>
                      <span className="text-[#008080]">out of 10</span>
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

              <div className="space-y-2 pt-4">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Remarks</label>
                <textarea
                  rows="3"
                  value={evalData.remarks}
                  onChange={(e) => setEvalData({...evalData, remarks: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
                  placeholder="Add your remarks about the demo..."
                ></textarea>
              </div>

              <div className="flex gap-4 pt-8">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-[#008080] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#006666] transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Submit Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Demo Modal */}
      {showEditModal && formData.id && (
        <div className="fixed inset-0 bg-[#008080]/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Edit Demo Schedule</h2>
                <p className="text-[10px] font-black text-[#008080] uppercase tracking-widest mt-1">
                  Update details for {formData.student_name}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setFormData({
                    id: undefined, demo_id: '', type: 'demo', student_name: '', student_type: 'new', syllabus: '', section: '', subject: '', faculty_id: '', faculty_name_input: '', start_time: '', end_time: '', hour_rate: '', meeting_link: ''
                  });
                }} 
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm transition-all"
              >
                <XCircle size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateSchedule} className="flex-1 overflow-y-auto p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Target size={12}/> Demo ID *</label>
                  <input
                    type="text" required readOnly
                    value={formData.demo_id}
                    className="w-full p-4 bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl text-xs font-bold outline-none cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Target size={12}/> Student Type *</label>
                  <select required value={formData.student_type} onChange={(e) => setFormData({ ...formData, student_type: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none">
                    <option value="new">New Student</option>
                    <option value="existing">Existing Student</option>
                  </select>
                </div>

                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><User size={12}/> Student Name *</label>
                  <input type="text" required value={formData.student_name} onChange={(e) => setFormData({ ...formData, student_name: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><BookOpen size={12}/> Syllabus *</label>
                  <select required value={formData.syllabus} onChange={(e) => setFormData({ ...formData, syllabus: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none">
                    <option value="" disabled>Select Syllabus</option>
                    {SYLLABUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Target size={12}/> Section *</label>
                  <select required value={formData.section} onChange={(e) => setFormData({ ...formData, section: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none">
                    <option value="" disabled>Select Section</option>
                    {SECTION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><BookOpen size={12}/> Subject *</label>
                  <input type="text" required value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none" />
                </div>

                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Presentation size={12}/> Faculty {formData.type !== 'pre-demo' && '*'}</label>
                  <input
                    type="text" required={formData.type !== 'pre-demo'}
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
                    <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-2xl shadow-xl max-h-40 overflow-y-auto top-full left-0">
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
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><CalendarDays size={12}/> Date {formData.type !== 'pre-demo' && '*'}</label>
                  <input type="date" required={formData.type !== 'pre-demo'} value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Clock size={12}/> Start Time {formData.type !== 'pre-demo' && '*'}</label>
                  <input type="time" required={formData.type !== 'pre-demo'} value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Clock size={12}/> End Time {formData.type !== 'pre-demo' && '*'}</label>
                  <input type="time" required={formData.type !== 'pre-demo'} value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><DollarSign size={12}/> Hourly Rate</label>
                  <input type="number" step="0.01" min="0" value={formData.hour_rate} onChange={(e) => setFormData({ ...formData, hour_rate: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none" />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-2"><Video size={12}/> Meeting Link (e.g. Google Meet / Zoom)</label>
                  <input type="text" value={formData.meeting_link} onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none" />
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-slate-50">
                <button
                  type="button" 
                  onClick={() => {
                    setShowEditModal(false);
                    setFormData({
                      id: undefined, demo_id: '', student_name: '', student_type: 'new', syllabus: '', section: '', subject: '', faculty_id: '', faculty_name_input: '', date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', hour_rate: '', meeting_link: ''
                    });
                  }}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-4 bg-[#008080] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#006666] transition-all flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Update Demo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AOEDemoSchedule;
