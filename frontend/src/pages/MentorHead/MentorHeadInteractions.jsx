import React, { useState, useEffect } from 'react';
import {
 Activity,
 Search,
 Filter,
 Phone,
 MessageSquare,
 ClipboardList,
 Clock,
 User,
 Calendar,
 ChevronRight,
 Loader2,
 X,
 Trash2,
 Image as ImageIcon
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MentorHeadInteractions = () => {
 const [activeTab, setActiveTab] = useState('mentors');
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [mentorName, setMentorName] = useState('');
 const [filterDate, setFilterDate] = useState('');
 const [mentorLogs, setMentorLogs] = useState({ studentLogs: [], facultyLogs: [] });
 const [facultyLogs, setFacultyLogs] = useState([]);
 const [viewingLog, setViewingLog] = useState(null);

 useEffect(() => {
  fetchLogs();
 }, [mentorName, filterDate]);

 const fetchLogs = async () => {
 setLoading(true);
 try {
  const params = {};
  if (mentorName) params.mentor_name = mentorName;
  if (filterDate) params.date = filterDate;

  const [mentorRes, facultyRes] = await Promise.all([
  api.get('/mentor-head/mentor-logs', { params }),
  api.get('/mentor-head/faculty-intelligence', { params })
  ]);

 if (mentorRes.data.success) {
 setMentorLogs(mentorRes.data.data);
 }
 if (facultyRes.data.success) {
 setFacultyLogs(facultyRes.data.data);
 }
 } catch (error) {
 console.error("Error fetching logs:", error);
 toast.error("Failed to load interaction logs");
 } finally {
 setLoading(false);
 }
 };

 const handleDeleteLog = async (log) => {
  const confirmMessage = "Are you sure you want to permanently delete this interaction log? This action will remove it from the database forever.";
  if (!window.confirm(confirmMessage)) return;

  try {
   const source = log.category || (activeTab === 'faculties' ? 'Intelligence' : 'student_interaction_logs');
   const response = await api.delete(`/mentor-head/logs/${log.id}?source=${source}`);

   if (response.data.success) {
    toast.success("Log deleted successfully");
    fetchLogs();
   }
  } catch (error) {
   console.error("Error deleting log:", error);
   toast.error(error.response?.data?.message || "Failed to delete interaction log");
  }
 };

 const combinedMentorLogs = [
 ...mentorLogs.studentLogs.map(log => ({ ...log, category: 'Student Call' })),
 ...mentorLogs.facultyLogs.map(log => ({ ...log, category: 'Faculty Call' }))
  ].sort((a, b) => new Date(b.sort_date || b.date) - new Date(a.sort_date || a.date));

 const filteredMentorLogs = combinedMentorLogs.filter(log =>
  log.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  log.category?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const filteredFacultyLogs = facultyLogs.filter(log =>
 log.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 log.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
 log.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
 );

 const formatDateTime = (dateStr) => {
  if (!dateStr) return '---';
  return new Date(dateStr).toLocaleString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  }).toUpperCase();
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center h-[60vh]">
 <div className="flex flex-col items-center gap-4">
 <Loader2 className="w-10 h-10 text-[#008080] animate-spin" />
 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Compiling interaction matrix...</p>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-8 pb-20">
 {/* Header Section */}
 <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
 <div>
 <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase ">Interaction Log Archive</h2>
 <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
 <Activity size={14} className="text-[#008080]" />
 Complete repository of mentor-student calls and mentor-faculty interaction reports
 </p>
 </div>

 <div className="flex bg-slate-100 p-1.5 rounded-[2rem] shadow-inner">
 <button
 onClick={() => setActiveTab('mentors')}
 className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'mentors'
 ? 'bg-slate-900 text-white shadow-xl'
 : 'text-slate-500 hover:text-slate-900'
 }`}
 >
 Mentor - Student Interactions
 </button>
 <button
 onClick={() => setActiveTab('faculties')}
 className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'faculties'
 ? 'bg-slate-900 text-white shadow-xl'
 : 'text-slate-500 hover:text-slate-900'
 }`}
 >
 Mentor - Faculty Interactions
 </button>
 </div>
 </div>

  {/* Search and Filters */}
  <div className="flex flex-col lg:flex-row gap-6">
  <div className="relative group flex-1">
  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors">
  <Search size={20} />
  </div>
  <input
  type="text"
  placeholder={`Search by student or type...`}
  className="w-full p-6 pl-16 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10 transition-all font-bold text-slate-800 placeholder:text-slate-300"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  />
  </div>

  <div className="flex flex-col sm:flex-row gap-4">
  <div className="relative group">
  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors">
  <User size={18} />
  </div>
  <input
  type="text"
  placeholder="Mentor Name..."
  className="w-full sm:w-64 p-6 pl-16 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10 transition-all font-bold text-slate-800"
  value={mentorName}
  onChange={(e) => setMentorName(e.target.value)}
  />
  </div>
  
  <div className="relative group">
  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors">
  <Calendar size={18} />
  </div>
  <input
  type="date"
  className="w-full sm:w-56 p-6 pl-16 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10 transition-all font-bold text-slate-800"
  value={filterDate}
  onChange={(e) => setFilterDate(e.target.value)}
  />
  </div>

  {(mentorName || filterDate) && (
  <button 
  onClick={() => { setMentorName(''); setFilterDate(''); }}
  className="p-6 bg-rose-50 text-rose-500 rounded-[2.5rem] border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
  >
  <X size={18} /> Reset
  </button>
  )}
  </div>
  </div>

 {/* Content Area */}
 {activeTab === 'mentors' ? (
 <div className="grid grid-cols-1 gap-6">
 {filteredMentorLogs.length === 0 ? (
 <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 font-bold text-slate-600">
 No mentor - student interaction logs found.
 </div>
 ) : (
 filteredMentorLogs.map((log, idx) => (
 <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
 <div className="absolute right-0 top-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 group-hover:bg-[#008080]/10 transition-colors"></div>

 <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
 <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg shrink-0 ${log.category === 'Student Call' ? 'bg-[#008080]' : 'bg-emerald-500'
 } text-white`}>
 {log.category === 'Student Call' ? <Phone size={24} /> : <MessageSquare size={24} />}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-2">
 <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${log.category === 'Student Call'
 ? 'bg-[#008080]/10 text-[#008080] border border-[#008080]'
 : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
 }`}>
 {log.category}
 </span>
 <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-sm">
 <Calendar size={13} className="text-[#008080]" />
 {formatDateTime(log.created_at || log.date)}
 </span>
 </div>
 <h3 className="text-xl font-black text-slate-900 mb-1">
 {log.mentor_name} <span className="text-slate-600 font-medium mx-2 font-serif">→</span> {log.student_name}
 </h3>
 <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
 "{log.mentor_notes || log.notes || 'No detailed notes provided for this interaction.'}"
 </p>
 </div>

 <div className="flex flex-col items-end gap-2 shrink-0">
 {log.connected_today ? (
 <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
 Connected Successfully
 </span>
 ) : log.connected_today === false ? (
 <span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 shadow-sm">
 Call Missed/Rejected
 </span>
 ) : null}
 <div className="flex gap-2">
  <button 
    onClick={() => handleDeleteLog(log)} 
    className="p-4 bg-rose-50 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
    title="Delete Log"
  >
    <Trash2 size={18} />
  </button>
  <button 
    onClick={() => setViewingLog(log)} 
    className="p-4 bg-slate-50 rounded-2xl text-slate-600 group-hover:bg-[#008080] group-hover:text-white transition-all shadow-sm"
    title="View Details"
  >
    <ChevronRight size={18} />
  </button>
 </div>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-6">
 {filteredFacultyLogs.length === 0 ? (
 <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 font-bold text-slate-600">
 No mentor - faculty interaction logs found.
 </div>
 ) : (
 filteredFacultyLogs.map((log, idx) => (
 <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
 <div className="absolute right-0 bottom-0 w-32 h-32 bg-rose-50 rounded-full -mr-10 -mb-10 group-hover:bg-[#008080]/10 transition-colors"></div>

 <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
 <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg shrink-0 ${log.type === 'Academic' ? 'bg-[#008080]' : 'bg-rose-500'
 } text-white`}>
 <ClipboardList size={24} />
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-3 mb-2">
 <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${log.type === 'Academic'
 ? 'bg-[#008080]/10 text-[#008080] border border-[#008080]'
 : 'bg-rose-50 text-rose-600 border border-rose-100'
 }`}>
 {log.type} Issue
 </span>
 <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-sm">
 <Calendar size={13} className="text-rose-500" />
 {formatDateTime(log.created_at || log.date)}
 </span>
 </div>
 <h3 className="text-xl font-black text-slate-900 mb-1">
 {log.faculty_name} <span className="text-slate-600 font-medium mx-2 font-serif">→</span> {log.student_name}
 </h3>
 <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
 "{log.remarks}"
 </p>
 </div>

 <div className="flex flex-col items-end gap-3 shrink-0">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">
 {log.faculty_name?.charAt(0)}
 </div>
 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Submitted By Faculty</span>
 </div>
 <div className="flex items-center gap-2">
 <span className={`px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm border ${log.status === 'Open'
 ? 'bg-amber-50 text-amber-600 border-amber-100'
 : 'bg-emerald-50 text-emerald-600 border-emerald-100'
 }`}>
 {log.status} Phase
 </span>
 <button 
    onClick={() => handleDeleteLog(log)} 
    className="p-2 bg-rose-50 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
    title="Delete Log"
  >
    <Trash2 size={16} />
  </button>
 <button onClick={() => setViewingLog({ ...log, category: 'Intelligence' })} className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-[#008080] hover:text-white transition-all shadow-sm">
 <ChevronRight size={16} />
 </button>
 </div>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 )}

  {viewingLog ? (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500 pb-20">
      {/* Detail View Header */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setViewingLog(null)} 
            className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-[#008080] transition-all shadow-xl active:scale-90"
          >
            <X size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Interaction Dossier</h2>
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <Activity size={14} className="text-[#008080]" />
              {viewingLog.student_name} • {viewingLog.category} {viewingLog.sub_type && `(${viewingLog.sub_type})`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
            <Calendar size={14} className="text-[#008080]" />
            {formatDateTime(viewingLog.date || viewingLog.created_at)}
          </span>
          <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border ${
            viewingLog.connected_today === false ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
          }`}>
            {viewingLog.connected_today === false ? 'Missed Call' : 'Connection Established'}
          </span>
        </div>
      </div>

      {/* Detail Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Core Info */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-4">Participants</h4>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#008080]/10 rounded-2xl flex items-center justify-center text-[#008080] font-black text-lg">
                {viewingLog.student_name?.charAt(0)}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">Student Node</p>
                <p className="text-sm font-black text-slate-900">{viewingLog.student_name}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-lg">
                {viewingLog.mentor_name?.charAt(0) || viewingLog.faculty_name?.charAt(0)}
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase">{viewingLog.category === 'Intelligence' ? 'Faculty Source' : 'Mentor Lead'}</p>
                <p className="text-sm font-black text-slate-900">{viewingLog.mentor_name || viewingLog.faculty_name}</p>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Communication Channel</p>
                <p className="text-xs font-bold text-slate-700">{viewingLog.connection_method || 'Standard Audio Call'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Urgency Priority</p>
                <p className={`text-xs font-black uppercase ${
                  viewingLog.parent_update_priority === 'High' ? 'text-rose-500' : 'text-emerald-500'
                }`}>{viewingLog.parent_update_priority || 'Standard'}</p>
              </div>
            </div>
          </div>

          {viewingLog.screenshot_url && (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Verification Evidence</h4>
              <a 
                href={viewingLog.screenshot_url} 
                target="_blank" 
                rel="noreferrer"
                className="block group relative rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-lg hover:border-[#008080]/20 transition-all"
              >
                <img src={viewingLog.screenshot_url} alt="Interaction Proof" className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ImageIcon className="text-white" size={32} />
                </div>
              </a>
            </div>
          )}
        </div>

        {/* Right Column - Detailed Metrics */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm min-h-[400px]">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-6 flex items-center gap-2">
              <ClipboardList size={16} className="text-[#008080]" />
              Detailed Analytical Report
            </h4>

            <div className="mt-8 space-y-10">
              {/* Primary Interaction Notes */}
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Primary Observations</p>
                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 relative">
                  <div className="absolute top-0 left-10 -translate-y-1/2 bg-white px-4 py-1 rounded-full border border-slate-100 text-[8px] font-black uppercase text-[#008080]">Mentor Narrative</div>
                  <p className="text-slate-700 font-medium leading-relaxed italic text-lg">
                    "{viewingLog.mentor_notes || viewingLog.remarks || viewingLog.notes || 'No detailed qualitative data recorded.'}"
                  </p>
                </div>
              </div>

              {/* Data Grid based on Log Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Academic Metrics */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Matrix</p>
                  <div className="bg-white border border-slate-100 rounded-[2rem] p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Self Clarity</span>
                      <span className="text-sm font-black text-[#008080]">{viewingLog.self_clarity || viewingLog.understanding_level || '0'}%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Focus Level</span>
                      <span className="text-sm font-black text-slate-800">{viewingLog.focus_level || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Homework Status</span>
                      <span className="text-sm font-black text-slate-800">{viewingLog.homework_status || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Confusing Topic</span>
                      <span className="text-sm font-black text-rose-500">{viewingLog.confusing_topic || 'None'}</span>
                    </div>
                  </div>
                </div>

                {/* Behavioral Metrics */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Psychological Profile</p>
                  <div className="bg-white border border-slate-100 rounded-[2rem] p-6 space-y-4 shadow-sm">
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Confidence</span>
                      <span className="text-sm font-black text-indigo-500">{viewingLog.confidence || '0'}/5</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Motivation</span>
                      <span className="text-sm font-black text-slate-800">{viewingLog.motivation_level || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-50">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Exam Anxiety</span>
                      <span className="text-sm font-black text-slate-800">{viewingLog.exam_anxiety || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Solve Independent</span>
                      <span className="text-sm font-black text-slate-800">{viewingLog.can_solve_independently || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action items & Extras */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Mentor Directives</p>
                  <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                    <p className="text-sm font-bold text-amber-900 leading-relaxed">
                      {viewingLog.mentor_action_needed || viewingLog.action_detail || 'No specific action directives recorded for this interaction.'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Student Feedback/Requests</p>
                  <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                    <p className="text-sm font-bold text-emerald-900 leading-relaxed">
                      {viewingLog.student_requests || 'No student requests or special feedback noted.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Session Specific Details if any */}
              {(viewingLog.main_issue || viewingLog.secondary_issue) && (
                <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl">
                  <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Core Session Diagnostics</h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Primary Issue Identified</p>
                      <p className="text-lg font-black text-rose-400">{viewingLog.main_issue}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Action Type Assigned</p>
                      <p className="text-lg font-black text-[#008080]">{viewingLog.action_type}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Secondary Findings</p>
                      <p className="text-sm font-medium">{viewingLog.secondary_issue || 'None'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Target Subject</p>
                      <p className="text-sm font-medium">{viewingLog.weak_subject || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="space-y-8 pb-20">
      {/* Header Section */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase ">Interaction Log Archive</h2>
          <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
            <Activity size={14} className="text-[#008080]" />
            Complete repository of mentor-student calls and mentor-faculty interaction reports
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] shadow-inner">
          <button
            onClick={() => setActiveTab('mentors')}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'mentors'
            ? 'bg-slate-900 text-white shadow-xl'
            : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Mentor - Student Interactions
          </button>
          <button
            onClick={() => setActiveTab('faculties')}
            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'faculties'
            ? 'bg-slate-900 text-white shadow-xl'
            : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Mentor - Faculty Interactions
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="relative group flex-1">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder={`Search by student or type...`}
            className="w-full p-6 pl-16 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10 transition-all font-bold text-slate-800 placeholder:text-slate-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors">
              <User size={18} />
            </div>
            <input
              type="text"
              placeholder="Mentor Name..."
              className="w-full sm:w-64 p-6 pl-16 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10 transition-all font-bold text-slate-800"
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
            />
          </div>
          
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors">
              <Calendar size={18} />
            </div>
            <input
              type="date"
              className="w-full sm:w-56 p-6 pl-16 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/10 transition-all font-bold text-slate-800"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          {(mentorName || filterDate) && (
            <button 
              onClick={() => { setMentorName(''); setFilterDate(''); }}
              className="p-6 bg-rose-50 text-rose-500 rounded-[2.5rem] border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest"
            >
              <X size={18} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {activeTab === 'mentors' ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredMentorLogs.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 font-bold text-slate-600">
              No mentor - student interaction logs found.
            </div>
          ) : (
            filteredMentorLogs.map((log, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 group-hover:bg-[#008080]/10 transition-colors"></div>

                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                  <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg shrink-0 ${log.category === 'Student Call' ? 'bg-[#008080]' : 'bg-emerald-500'
                  } text-white`}>
                    {log.category === 'Student Call' ? <Phone size={24} /> : <MessageSquare size={24} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${log.category === 'Student Call'
                      ? 'bg-[#008080]/10 text-[#008080] border border-[#008080]'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {log.category}
                      </span>
                      <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-sm">
                        <Calendar size={13} className="text-[#008080]" />
                        {formatDateTime(log.created_at || log.date)}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">
                      {log.mentor_name} <span className="text-slate-600 font-medium mx-2 font-serif">→</span> {log.student_name}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
                      "{log.mentor_notes || log.notes || 'No detailed notes provided for this interaction.'}"
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {log.connected_today ? (
                      <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                        Connected Successfully
                      </span>
                    ) : log.connected_today === false ? (
                      <span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 shadow-sm">
                        Call Missed/Rejected
                      </span>
                    ) : null}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDeleteLog(log)} 
                        className="p-4 bg-rose-50 rounded-2xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        title="Delete Log"
                      >
                        <Trash2 size={18} />
                      </button>
                      <button 
                        onClick={() => setViewingLog(log)} 
                        className="p-4 bg-slate-50 rounded-2xl text-slate-600 group-hover:bg-[#008080] group-hover:text-white transition-all shadow-sm"
                        title="View Details"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredFacultyLogs.length === 0 ? (
            <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 font-bold text-slate-600">
              No mentor - faculty interaction logs found.
            </div>
          ) : (
            filteredFacultyLogs.map((log, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-rose-50 rounded-full -mr-10 -mb-10 group-hover:bg-[#008080]/10 transition-colors"></div>

                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                  <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg shrink-0 ${log.type === 'Academic' ? 'bg-[#008080]' : 'bg-rose-500'
                  } text-white`}>
                    <ClipboardList size={24} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${log.type === 'Academic'
                      ? 'bg-[#008080]/10 text-[#008080] border border-[#008080]'
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {log.type} Issue
                      </span>
                      <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-sm">
                        <Calendar size={13} className="text-rose-500" />
                        {formatDateTime(log.created_at || log.date)}
                      </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-1">
                      {log.faculty_name} <span className="text-slate-600 font-medium mx-2 font-serif">→</span> {log.student_name}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">
                      "{log.remarks}"
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">
                        {log.faculty_name?.charAt(0)}
                      </div>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Submitted By Faculty</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm border ${log.status === 'Open'
                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {log.status} Phase
                      </span>
                      <button 
                        onClick={() => handleDeleteLog(log)} 
                        className="p-2 bg-rose-50 rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        title="Delete Log"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button onClick={() => setViewingLog({ ...log, category: 'Intelligence' })} className="p-2 bg-slate-50 rounded-xl text-slate-600 hover:bg-[#008080] hover:text-white transition-all shadow-sm">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )}

 </div>
 );
};

export default MentorHeadInteractions;
