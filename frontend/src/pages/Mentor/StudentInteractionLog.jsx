import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
 MessageSquare, CheckCircle, ArrowLeft, Target, AlertCircle, BarChart3,
 CloudLightning, FileText, Camera, Phone, UserCheck, HeartPulse, Brain,
 Clock, Activity, BookOpen, Smile, Plus, Frown, Meh, MoreHorizontal, Upload, ImageIcon, Loader2, Zap, TrendingUp, ShieldAlert, CheckCircle2, ChevronRight, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

const StudentInteractionLog = () => {
 const location = useLocation();
 const navigate = useNavigate();

 const [loading, setLoading] = useState(false);
 const [assignedLoading, setAssignedLoading] = useState(true);
 const [submitted, setSubmitted] = useState(false);
 const [allStudents, setAllStudents] = useState([]);
 const [assignedStudents, setAssignedStudents] = useState([]);
 const [selectedStudent, setSelectedStudent] = useState(null);
 const [activeTab, setActiveTab] = useState('both'); // 'both', 'mentorship', 'tuition'
 const [statusFilter, setStatusFilter] = useState('pending'); // 'pending', 'completed'
 
 // Form States
 const [sessionType, setSessionType] = useState(null); // 'DEEP', 'MEDIUM', 'QUICK'
 const [formData, setFormData] = useState({});

 useEffect(() => {
   fetchAssignedStudents();
   fetchAllStudents();
 }, []);

 const fetchAssignedStudents = async () => {
   setAssignedLoading(true);
   try {
     const res = await api.get('/mentor-interactions/daily-assignments');
     setAssignedStudents(res.data.data);
   } catch (error) {
     toast.error("Failed to load daily assignments");
   } finally {
     setAssignedLoading(false);
   }
 };

 const fetchAllStudents = async () => {
   try {
     const res = await api.get('/mentor/students');
     setAllStudents(res.data.data);
   } catch (error) {
     console.error("Failed to load all students");
   }
 };

 const handleStudentSelect = (student, type) => {
   setSelectedStudent(student);
   setSessionType(type || 'TUITION');
   setSubmitted(false);
   
   // Initialize form data based on type
   if (type === 'DEEP') {
     setFormData({
       student_status_before: 'Yes',
       main_problem: 'No major issue',
       root_cause: '',
       mentor_guidance: '',
       action_plan: '',
       student_response: 'Positive / motivated',
       followup_required: 'No',
       followup_when: 'Tomorrow',
       attention_level: 'Stable',
       next_session_type: 'MEDIUM'
     });
   } else if (type === 'MEDIUM') {
     setFormData({
       progress: 'Good',
       class_attendance: 'Regular',
       issue_found: 'No',
       issue_category: 'Academic',
       quick_guidance: '',
       next_task: '',
       upgrade_to_deep: 'No',
       next_session_type: 'QUICK'
     });
   } else if (type === 'QUICK') {
     setFormData({
       availability: 'Attended call',
       study_status: 'Studied properly',
       attendance: 'Attended',
       immediate_concern: 'No',
       immediate_concern_category: 'Academic',
       next_session_type: 'QUICK',
       quick_notes: ''
     });
   } else {
     // Simple Tuition Tracking
     setFormData({
       date: new Date().toISOString().split('T')[0],
       attendance: 'Present',
       notes: ''
     });
   }
 };

 const handleChange = (e) => {
   const { name, value } = e.target;
   setFormData(prev => ({ ...prev, [name]: value }));
 };

 const handleSubmit = async (e) => {
   e.preventDefault();
   setLoading(true);

    try {
      // Validation Rules from Product Document
      if (sessionType === 'DEEP') {
        if (!formData.action_plan || !formData.main_problem || !formData.root_cause || !formData.mentor_guidance) {
          toast.error("Please fill all mandatory fields (Problem, Root Cause, Guidance, and Action Plan)");
          setLoading(false);
          return;
        }
      } else if (sessionType === 'MEDIUM') {
        if (!formData.next_task) {
          toast.error("Next Task is mandatory for Medium sessions");
          setLoading(false);
          return;
        }
      } else if (sessionType === 'QUICK') {
        if (!formData.study_status) {
          toast.error("Today's Study Status is mandatory");
          setLoading(false);
          return;
        }
      }
     if (sessionType === 'TUITION') {
       // Old legacy logging or simple tracking for tuition
       await api.post('/mentor/student-log', {
         ...formData,
         student_id: selectedStudent.id,
         student_name: selectedStudent.name,
         connection_method: 'Other',
         mentor_notes: formData.notes
       });
     } else {
       // New Structured Interaction System
       await api.post('/mentor-interactions/submit-report', {
         student_id: selectedStudent.id,
         session_type: sessionType,
         next_session_type: formData.next_session_type,
         report_data: formData
       });
     }

     toast.success("Interaction submitted successfully!");
     setSubmitted(true);
     fetchAssignedStudents(); // Refresh daily list
     fetchAllStudents(); // Refresh all students list
   } catch (error) {
     toast.error(error.response?.data?.message || "Submission failed");
   } finally {
     setLoading(false);
   }
 };

 const isDiamondCategory = (s) => {
    if (!s) return false;
    const badge = s.badge?.toLowerCase();
    const type = s.enrollment_type?.toLowerCase();
    return badge === 'diamond' || 
           type === 'both' || 
           type === 'mentorship and tuition' || 
           type === 'mentorship & tuition' || 
           type === 'mentorship + tuition' ||
           (type && type.includes('mentorship') && type.includes('tuition'));
  };

 const isGoldCategory = (s) => {
    if (!s) return false;
    if (isDiamondCategory(s)) return false;
    const badge = s.badge?.toLowerCase();
    const type = s.enrollment_type?.toLowerCase();
    return badge === 'gold' || 
           type === 'mentorship' || 
           type === 'mentorship only';
  };

 const isSilverCategory = (s) => s.onboarding_status !== 'pending' && !isDiamondCategory(s) && !isGoldCategory(s);

 const getSessionIcon = (type) => {
   switch(type) {
     case 'DEEP': return <Activity className="text-rose-500" size={20} />;
     case 'MEDIUM': return <TrendingUp className="text-amber-500" size={20} />;
     case 'QUICK': return <Zap className="text-blue-500" size={20} />;
     default: return <UserCheck className="text-slate-400" size={20} />;
   }
 };

 const getSessionColor = (type) => {
   switch(type) {
     case 'DEEP': return 'bg-rose-50 border-rose-100 text-rose-600';
     case 'MEDIUM': return 'bg-amber-50 border-amber-100 text-amber-600';
     case 'QUICK': return 'bg-blue-50 border-blue-100 text-blue-600';
     default: return 'bg-slate-50 border-slate-100 text-slate-600';
   }
 };

 // Main List Screen
 if (!selectedStudent) {
   return (
     <div className="max-w-6xl mx-auto p-4 md:p-10 pb-20 space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
       <header className="bg-white/70 backdrop-blur-xl p-8 md:p-14 rounded-[40px] md:rounded-[48px] border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex flex-col md:flex-row justify-between items-center gap-10">
         <div className="text-center md:text-left">
           <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">Mentor Execution Hub</h1>
           <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-3 justify-center md:justify-start">
             <div className="w-2 h-2 rounded-full bg-[#008080] animate-ping"></div>
             Decision-Driven Mentorship Platform
           </p>
         </div>
          <div className="flex gap-4">
             <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 text-center">
                 <p className="text-[10px] font-black text-rose-600 uppercase mb-1">Deep</p>
                 <p className="text-2xl font-black text-rose-900">{assignedStudents.filter(s => s.sessionType === 'DEEP').length || 0}</p>
             </div>
             <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 text-center">
                 <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Med</p>
                 <p className="text-2xl font-black text-amber-900">{assignedStudents.filter(s => s.sessionType === 'MEDIUM').length || 0}</p>
             </div>
             <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                 <p className="text-[10px] font-black text-blue-600 uppercase mb-1">Quick</p>
                 <p className="text-2xl font-black text-blue-900">{assignedStudents.filter(s => s.sessionType === 'QUICK').length || 0}</p>
             </div>
          </div>
       </header>

       <div className="space-y-4">
        {/* Main Category Tabs */}
        <div className="flex flex-wrap gap-4 p-2 bg-white/50 backdrop-blur-md rounded-[28px] border border-slate-200/50 sticky top-4 z-50 shadow-sm">
          {[
            { id: 'both', label: 'Mentorship + Tuition', color: 'bg-purple-600' },
            { id: 'mentorship', label: 'Mentorship Only', color: 'bg-amber-500' },
            { id: 'tuition', label: 'Tuition Only', color: 'bg-slate-900' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 px-6 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? `${tab.color} text-white shadow-lg` : 'text-slate-600 hover:bg-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-Tabs: Status Filter */}
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${statusFilter === 'pending' ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' : 'bg-white text-slate-400 border border-slate-100 hover:border-rose-200'}`}
          >
            <div className={`w-2 h-2 rounded-full ${statusFilter === 'pending' ? 'bg-white animate-pulse' : 'bg-rose-500'}`}></div>
            Awaiting Interaction ({activeTab === 'tuition' ? 
              allStudents.filter(s => isSilverCategory(s) && !s.connected_today).length :
              assignedStudents.filter(s => s.status !== 'COMPLETED' && (activeTab === 'both' ? isDiamondCategory(s) : isGoldCategory(s))).length
            })
          </button>
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-8 py-3 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 ${statusFilter === 'completed' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200' : 'bg-white text-slate-400 border border-slate-100 hover:border-emerald-200'}`}
          >
            <div className={`w-2 h-2 rounded-full ${statusFilter === 'completed' ? 'bg-white animate-pulse' : 'bg-emerald-500'}`}></div>
            Completed Today ({activeTab === 'tuition' ? 
              allStudents.filter(s => isSilverCategory(s) && s.connected_today).length :
              assignedStudents.filter(s => s.status === 'COMPLETED' && (activeTab === 'both' ? isDiamondCategory(s) : isGoldCategory(s))).length
            })
          </button>
        </div>
      </div>

       {/* Main Content Area */}
       <div className="min-h-[400px]">
         {assignedLoading ? (
           <div className="flex flex-col items-center justify-center py-40 gap-4">
             <Loader2 size={40} className="animate-spin text-[#008080]" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Data...</p>
           </div>
         ) : (
           <div className="space-y-10 animate-in fade-in duration-500">
             {activeTab !== 'tuition' ? (
                <div className="space-y-8">
                  <div className="flex items-center justify-between px-4">
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                         <ShieldAlert size={18} className="text-[#008080]" /> 
                         {statusFilter === 'pending' ? 'Pending Execution Fleet' : 'Concluded Interactions'}
                     </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(assignedStudents.length > 0 ? assignedStudents : [])
                       .filter(s => {
                         const matchesStatus = statusFilter === 'completed' ? s.status === 'COMPLETED' : s.status !== 'COMPLETED';
                         const matchesTab = activeTab === 'both' ? isDiamondCategory(s) : isGoldCategory(s);
                         return matchesStatus && matchesTab;
                       })
                       .map(student => {
                         const sessionType = student.sessionType || 'QUICK';
                         const isCompleted = student.status === 'COMPLETED';
                         return (
                           <button
                             key={student.id}
                             onClick={() => handleStudentSelect(student, sessionType)}
                             className={`group relative overflow-hidden p-8 rounded-[3rem] border transition-all text-left flex flex-col justify-between h-64 ${isCompleted ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100 hover:shadow-2xl hover:scale-[1.02] hover:border-slate-200 active:scale-95'}`}
                           >
                             <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 opacity-10 transition-transform group-hover:scale-150 duration-700 ${getSessionColor(sessionType).split(' ')[0]}`}></div>
                             
                             <div>
                               <div className="flex justify-between items-start mb-4">
                                 <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getSessionColor(sessionType)}`}>
                                   {sessionType} SESSION
                                 </div>
                                 {isCompleted && <CheckCircle2 className="text-emerald-500" size={24} />}
                               </div>
                               <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none uppercase mb-2 truncate">{student.name}</h3>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">MM-{student.id.toString().padStart(4, '0')} • {student.priority_category || 'Stable'} Priority</p>
                             </div>

                             <div className="flex items-center justify-between mt-6">
                               <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${getSessionColor(sessionType)}`}>
                                   {getSessionIcon(sessionType)}
                                 </div>
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                   {isCompleted ? 'Report Logged' : 'Awaiting Interaction'}
                                 </span>
                               </div>
                               <ChevronRight size={20} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                             </div>
                           </button>
                         );
                       })}
                    {assignedStudents.filter(s => {
                        const matchesStatus = statusFilter === 'completed' ? s.status === 'COMPLETED' : s.status !== 'COMPLETED';
                        const matchesTab = activeTab === 'both' ? isDiamondCategory(s) : isGoldCategory(s);
                        return matchesStatus && matchesTab;
                    }).length === 0 && (
                      <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200 animate-in fade-in zoom-in duration-500">
                         <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">All students in your today's fleet are {statusFilter === 'pending' ? 'accounted for' : 'awaiting action'}.</p>
                      </div>
                    )}
                  </div>
                </div>
             ) : (
                <div className="space-y-8">
                  <div className="flex items-center gap-3 px-4">
                    <div className="w-4 h-8 bg-slate-900 rounded-full"></div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                      {statusFilter === 'pending' ? 'Pending Tuition Attendance' : 'Concluded Tuition Records'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allStudents
                      .filter(s => isSilverCategory(s) && (statusFilter === 'completed' ? s.connected_today : !s.connected_today))
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(student => (
                      <button
                        key={student.id}
                        onClick={() => handleStudentSelect(student, 'TUITION')}
                        className={`bg-white p-8 rounded-[3rem] border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all text-left group h-48 flex flex-col justify-between ${student.connected_today ? 'bg-emerald-50/50 border-emerald-100' : ''}`}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">{student.name}</h3>
                            {student.connected_today && <CheckCircle2 className="text-emerald-500" size={20} />}
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{student.course} • Grade {student.grade}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#008080] text-[9px] font-black uppercase tracking-[0.2em]">
                            {student.connected_today ? 'View Record' : 'Track Attendance'}
                          </div>
                          <ArrowLeft size={16} className="text-slate-300 rotate-180" />
                        </div>
                      </button>
                    ))}
                    {allStudents.filter(s => isSilverCategory(s) && (statusFilter === 'completed' ? s.connected_today : !s.connected_today)).length === 0 && (
                      <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                         <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">No students in this {statusFilter} category.</p>
                      </div>
                    )}
                  </div>
                </div>
             )}
           </div>
         )}
       </div>
     </div>
   );
 }

 // Interaction Form Screen
 return (
   <div className="max-w-4xl mx-auto space-y-10 p-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
     <button
       onClick={() => { setSelectedStudent(null); setSubmitted(false); }}
       className="flex items-center gap-2 text-slate-600 hover:text-[#008080] font-black text-[10px] uppercase tracking-widest transition-colors mb-4"
     >
       <ArrowLeft size={16} /> Return to Dashboard
     </button>

     <header className={`border p-10 rounded-[3rem] shadow-2xl relative overflow-hidden transition-all ${sessionType === 'DEEP' ? 'bg-rose-950 border-rose-900' : sessionType === 'MEDIUM' ? 'bg-amber-950 border-amber-900' : sessionType === 'QUICK' ? 'bg-blue-950 border-blue-900' : 'bg-slate-900 border-slate-800'}`}>
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full -mr-40 -mt-40 opacity-10 ${sessionType === 'DEEP' ? 'bg-rose-500' : sessionType === 'MEDIUM' ? 'bg-amber-500' : sessionType === 'QUICK' ? 'bg-blue-500' : 'bg-[#008080]'}`}></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl ${sessionType === 'DEEP' ? 'bg-rose-500' : sessionType === 'MEDIUM' ? 'bg-amber-500' : sessionType === 'QUICK' ? 'bg-blue-500' : 'bg-[#008080]'}`}>
              {getSessionIcon(sessionType)}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase mb-2">{selectedStudent.name}</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {sessionType} SESSION • {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <p className="text-[10px] font-bold text-white uppercase tracking-widest">
              Completed {assignedStudents.filter(s => s.status === 'COMPLETED').length} / {assignedStudents.length} Sessions Today
            </p>
          </div>
</header>

     {!submitted ? (
       <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-50 space-y-12">
         
         {sessionType === 'DEEP' && (
            <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 items-end">
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block">Planned Task Completed?</label>
                   <div className="grid grid-cols-3 gap-2">
                     {['Yes', 'Partially', 'No'].map(opt => (
                       <button key={opt} type="button" onClick={() => setFormData({...formData, student_status_before: opt})} className={`py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${formData.student_status_before === opt ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-100'}`}>{opt}</button>
                     ))}
                   </div>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block">Main Problem</label>
                   <select name="main_problem" value={formData.main_problem} onChange={handleChange} className="w-full py-3 px-4 bg-white border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-rose-500/20">
                     {['Academic difficulty', 'Lack of consistency', 'Low confidence', 'Distraction / mobile usage', 'Emotional issue', 'No major issue'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block">Student Response</label>
                   <div className="grid grid-cols-3 gap-2">
                     {['Positive', 'Neutral', 'Resistant'].map(opt => (
                       <button key={opt} type="button" onClick={() => setFormData({...formData, student_response: opt})} className={`py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${formData.student_response === opt ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-100'}`}>{opt}</button>
                     ))}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Root Cause</label>
                   <textarea name="root_cause" rows="2" required value={formData.root_cause} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold outline-none focus:bg-rose-50/30 transition-all focus:border-rose-200" placeholder="Why is this happening?"></textarea>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Mentor Guidance</label>
                   <textarea name="mentor_guidance" rows="2" required value={formData.mentor_guidance} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold outline-none focus:bg-rose-50/30 transition-all focus:border-rose-200" placeholder="What exact guidance was given?"></textarea>
                </div>
              </div>

              <div className="space-y-2 relative group">
                 <label className="text-[10px] font-black text-rose-600 uppercase tracking-widest ml-1 absolute -top-3 left-6 bg-white px-2">Action Plan</label>
                 <textarea name="action_plan" rows="3" required value={formData.action_plan} onChange={handleChange} className="w-full p-8 bg-rose-50/50 border-2 border-rose-100 focus:border-rose-300 rounded-[2.5rem] text-lg font-black text-slate-900 outline-none transition-all placeholder:text-rose-200 shadow-[0_10px_40px_rgba(244,63,94,0.05)]" placeholder="What should student do before next session?"></textarea>
              </div>

              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Follow-up Required?</label>
                   <div className="flex gap-2">
                     {['Yes', 'No'].map(opt => (
                       <button key={opt} type="button" onClick={() => setFormData({...formData, followup_required: opt})} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${formData.followup_required === opt ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100'}`}>{opt}</button>
                     ))}
                   </div>
                </div>
                {formData.followup_required === 'Yes' && (
                  <div className="flex items-center gap-4 animate-in slide-in-from-right-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase">When?</span>
                    <select name="followup_when" value={formData.followup_when} onChange={handleChange} className="p-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none">
                      {['Tomorrow', 'Within 2 days', 'This week'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

         {sessionType === 'MEDIUM' && (
           <div className="space-y-10">
             <div className="flex flex-col md:flex-row gap-6 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 items-end">
                <div className="flex-1 space-y-3">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block">Progress Since Last Session</label>
                   <div className="grid grid-cols-3 gap-2">
                     {['Good', 'Average', 'Poor'].map(opt => (
                       <button key={opt} type="button" onClick={() => setFormData({...formData, progress: opt})} className={`py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${formData.progress === opt ? 'bg-amber-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-100'}`}>{opt}</button>
                     ))}
                   </div>
                </div>
                <div className="flex-1 space-y-3">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block">Class Attendance</label>
                   <select name="class_attendance" value={formData.class_attendance} onChange={handleChange} className="w-full py-3 px-4 bg-white border border-slate-100 rounded-2xl text-xs font-black uppercase outline-none focus:ring-2 focus:ring-amber-500/20">
                     {['Regular', 'Missed 1 class', 'Missed multiple'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
                </div>
                <div className="flex-1 space-y-3">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block">Any Issue Found?</label>
                   <div className="flex gap-2">
                     {['Yes', 'No'].map(opt => (
                       <button key={opt} type="button" onClick={() => setFormData({...formData, issue_found: opt})} className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${formData.issue_found === opt ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-100'}`}>{opt}</button>
                     ))}
                   </div>
                </div>
             </div>

             <div className="space-y-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Guidance Given</label>
                   <textarea name="quick_guidance" rows="2" value={formData.quick_guidance} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold outline-none focus:bg-amber-50/30 transition-all focus:border-amber-200" placeholder="Briefly summarize the correction..."></textarea>
                </div>
                <div className="space-y-2 relative group">
                   <label className="text-[10px] font-black text-amber-600 uppercase tracking-widest ml-1 absolute -top-3 left-6 bg-white px-2">Next Task Assigned (Compulsory)</label>
                   <textarea name="next_task" rows="3" required value={formData.next_task} onChange={handleChange} className="w-full p-8 bg-amber-50/50 border-2 border-amber-100 focus:border-amber-300 rounded-[2.5rem] text-lg font-black text-slate-900 outline-none transition-all placeholder:text-amber-200 shadow-[0_10px_40px_rgba(245,158,11,0.05)]" placeholder="What is the very next action for the student?"></textarea>
                </div>
             </div>

             <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Need Deep Session?</label>
                   <div className="flex gap-2">
                     {['Yes', 'No'].map(opt => (
                       <button key={opt} type="button" onClick={() => setFormData({...formData, upgrade_to_deep: opt})} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${formData.upgrade_to_deep === opt ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100'}`}>{opt}</button>
                     ))}
                   </div>
                </div>
             </div>
           </div>
         )}

         {sessionType === 'QUICK' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Student Available?</label>
                    <div className="flex gap-1">
                      {['Attended call', 'Did not attend'].map(opt => (
                        <button key={opt} type="button" onClick={() => setFormData({...formData, availability: opt})} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.availability === opt ? 'bg-blue-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{opt === 'Attended call' ? 'Attended' : 'Missed'}</button>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Study Status</label>
                    <div className="flex gap-1">
                      {['Studied properly', 'Studied partially', 'Not studied'].map(opt => (
                        <button key={opt} type="button" onClick={() => setFormData({...formData, study_status: opt})} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.study_status === opt ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{opt.split(' ')[1] || 'Properly'}</button>
                      ))}
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Class Attendance</label>
                    <div className="flex gap-1">
                      {['Attended', 'Missed'].map(opt => (
                        <button key={opt} type="button" onClick={() => setFormData({...formData, attendance: opt})} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${formData.attendance === opt ? 'bg-blue-500 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}>{opt}</button>
                      ))}
                    </div>
                 </div>
              </div>

              <div className={`p-6 rounded-[2.5rem] border transition-all ${formData.immediate_concern === 'Yes' ? 'bg-rose-50 border-rose-200 shadow-xl shadow-rose-100/50' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                 <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-1 flex items-center gap-2">
                      {formData.immediate_concern === 'Yes' && <AlertCircle size={16} className="text-rose-500" />}
                      Immediate Concern?
                    </label>
                    <div className="flex gap-2">
                       {['Yes', 'No'].map(opt => (
                          <button key={opt} type="button" onClick={() => setFormData({...formData, immediate_concern: opt})} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.immediate_concern === opt ? (opt === 'Yes' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-900 text-white shadow-md') : 'bg-slate-100 text-slate-400'}`}>{opt}</button>
                       ))}
                    </div>
                 </div>
                 {formData.immediate_concern === 'Yes' && (
                    <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
                      {['Academic', 'Discipline', 'Device Addiction', 'Emotional', 'Attendance'].map(opt => (
                        <button key={opt} type="button" onClick={() => setFormData({...formData, immediate_concern_category: opt})} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${formData.immediate_concern_category === opt ? 'bg-rose-600 text-white shadow-lg' : 'bg-white text-rose-400 border border-rose-200 hover:bg-rose-100'}`}>{opt}</button>
                      ))}
                    </div>
                 )}
              </div>
            </div>
         )}

         {sessionType === 'TUITION' && (
           <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Attendance Status</label>
                   <select name="attendance" value={formData.attendance} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase">
                     {['Present', 'Absent', 'Late'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Date</label>
                   <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase" />
                </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Observations / Quick Notes</label>
                 <textarea name="notes" rows="4" value={formData.notes} onChange={handleChange} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold outline-none focus:ring-4 focus:ring-slate-900/10" placeholder="Any specific notes for today's tuition..."></textarea>
              </div>
           </div>
         )}

          {/* Next Attention Level & Notes */}
          {(sessionType === 'DEEP' || sessionType === 'MEDIUM' || sessionType === 'QUICK') && (
            <div className={`p-8 rounded-[3rem] border space-y-6 transition-all ${formData.next_session_type === 'DEEP' ? 'bg-rose-950 border-rose-900 shadow-[0_0_40px_rgba(244,63,94,0.1)]' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h4 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                    {formData.next_session_type === 'DEEP' && <AlertCircle className="text-rose-500" size={20} />}
                    Next Attention Level
                  </h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select the intensity for the next interaction</p>
                </div>
                <div className="flex gap-2 p-1.5 bg-white/10 rounded-2xl">
                  {[
                    { id: 'DEEP', label: 'Deep', color: 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' },
                    { id: 'MEDIUM', label: 'Medium', color: 'bg-amber-500 text-white shadow-lg' },
                    { id: 'QUICK', label: 'Quick', color: 'bg-blue-500 text-white shadow-lg' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFormData({...formData, next_session_type: opt.id})}
                      className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.next_session_type === opt.id ? opt.color : 'text-slate-400 hover:text-white'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Notes (Optional)</label>
                 <textarea 
                    name="quick_notes" 
                    rows="2" 
                    value={formData.quick_notes} 
                    onChange={handleChange} 
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-[1.5rem] text-sm font-bold text-white outline-none focus:bg-white/10 transition-all placeholder:text-slate-600" 
                    placeholder="Anything important noticed?"
                 ></textarea>
              </div>
            </div>
          )}

          {/* AI Recommendation Box */}
          {(sessionType === 'DEEP' || sessionType === 'MEDIUM' || sessionType === 'QUICK') && (
             <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#008080]/10 flex items-center justify-center">
                   <Brain size={18} className="text-[#008080]" />
                </div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Next Recommended Action</p>
                   <p className="text-sm font-black text-slate-900 uppercase">
                     {formData.immediate_concern === 'Yes' || formData.progress === 'Poor' ? 'Schedule Deep Session & Inform Parent' :
                      formData.next_session_type === 'DEEP' ? 'Prepare root cause analysis for next Deep Session' :
                      'Monitor student behavior tomorrow'}
                   </p>
                </div>
             </div>
          )}

         <div className="pt-8">
           <button
             type="submit"
             disabled={loading}
             className={`w-full p-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-4 active:scale-[0.98] ${sessionType === 'DEEP' ? 'bg-rose-600 text-white shadow-rose-200 hover:-translate-y-1' : sessionType === 'MEDIUM' ? 'bg-amber-500 text-white shadow-amber-200 hover:-translate-y-1' : sessionType === 'QUICK' ? 'bg-blue-600 text-white shadow-blue-200 hover:-translate-y-1' : 'bg-slate-900 text-white hover:-translate-y-1'}`}
           >
             {loading ? 'Saving Interaction...' : 'Save Interaction'}
             {!loading && <CheckCircle2 size={24} />}
           </button>
         </div>

       </form>
     ) : (
       <div className="space-y-8 animate-in fade-in zoom-in duration-300">
         <div className="bg-emerald-50 border border-emerald-100 p-12 rounded-[4rem] text-center shadow-xl">
           <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-200">
             <CheckCircle2 size={40} strokeWidth={3} />
           </div>
           <h2 className="text-3xl font-black text-emerald-900 mb-2 uppercase tracking-tight">Interaction Saved!</h2>
           <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest mb-10">The student's interaction log has been updated successfully.</p>
           <button
             onClick={() => { setSelectedStudent(null); setSubmitted(false); }}
             className="px-12 py-5 bg-emerald-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-700 hover:shadow-xl transition-all active:scale-95"
           >
             Continue Today's Plan
           </button>
         </div>
       </div>
     )}
   </div>
 );
};

export default StudentInteractionLog;
