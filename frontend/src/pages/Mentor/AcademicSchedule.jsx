import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
 CalendarClock, Clock, BookOpen, Users,
 Search, Filter, ChevronRight, Activity,
 Calendar, AlertCircle, Bell, CheckSquare, MessageSquareText, Lock, 
 ShieldCheck, Timer
} from 'lucide-react';
import toast from 'react-hot-toast';

const AcademicSchedule = () => {
 const [schedule, setSchedule] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [statusFilter, setStatusFilter] = useState('All');
 const [selectedSession, setSelectedSession] = useState(null);
 const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
 const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
 const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
 const [reminderData, setReminderData] = useState({ num: 1, remark: '' });
 const [minutesTaken, setMinutesTaken] = useState('');

 useEffect(() => {
 fetchSchedule();
 }, []);

 const fetchSchedule = async () => {
 try {
 const res = await api.get('/mentor/academic-schedule');
 setSchedule(res.data.data);
 } catch (error) {
 toast.error("Failed to load academic schedule");
 } finally {
 setLoading(false);
 }
 };

 const filteredSchedule = schedule.filter(session => {
 const matchesSearch =
 (session.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (session.faculty_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (session.student_name || '').toLowerCase().includes(searchTerm.toLowerCase());
 const matchesStatus = statusFilter === 'All' || session.status === statusFilter;
 return matchesSearch && matchesStatus;
 });

 const handleReminder = async () => {
 if (!reminderData.remark.trim()) return toast.error("Remark is required");
 try {
 await api.put(`/mentor/academic-schedule/${selectedSession.id}/reminder`, {
 reminder_num: reminderData.num,
 remark: reminderData.remark
 });
 toast.success(`Reminder ${reminderData.num} recorded`);
 setIsReminderModalOpen(false);
 fetchSchedule();
 } catch (error) {
 toast.error("Failed to update reminder");
 }
 };

 const handleComplete = async () => {
 if (!minutesTaken || isNaN(minutesTaken)) return toast.error("Enter valid minutes");
 try {
 await api.put(`/mentor/academic-schedule/${selectedSession.id}/complete`, {
 minutes_taken: parseInt(minutesTaken)
 });
 toast.success("Session marked as completed");
 setIsCompleteModalOpen(false);
 fetchSchedule();
 } catch (error) {
 toast.error(error.response?.data?.message || "Failed to complete session");
 }
 };

 if (loading) return (
 <div className="flex flex-col items-center justify-center p-20 space-y-4">
 <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
 <p className="text-xs font-black text-slate-600 uppercase tracking-widest animate-pulse">Syncing Academic Timetable...</p>
 </div>
 );

 return (
 <div className="space-y-8 pb-20">
 {/* Header Area */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 border-b-4 border-b-[#008080]">
 <div className="flex items-center gap-5">
 <div className="w-14 h-14 bg-[#008080] rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
 <CalendarClock size={28} />
 </div>
 <div>
 <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase ">Academic Schedule</h1>
 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1">Full monitoring of faculty-led sessions for your students</p>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
 <Activity className="text-emerald-500" size={18} />
 <div>
 <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Total Active</p>
 <p className="text-sm font-black text-slate-900 leading-none">{schedule.filter(s => s.status === 'Scheduled').length} Sessions</p>
 </div>
 </div>
 </div>
 </div>

 {/* Filter & Search Bar */}
 <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-6">
 <div className="flex-1 w-full relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
 <input
 type="text"
 placeholder="Search by topic or faculty name..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
 />
 </div>

 <div className="flex items-center gap-4 w-full md:w-auto">
 <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-600">
 <Filter size={16} />
 <span className="text-[10px] font-black uppercase tracking-widest">Status</span>
 </div>
 <select
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="bg-slate-50 border-none rounded-xl px-4 py-4 text-xs font-bold text-slate-700 focus:bg-white outline-none min-w-[150px]"
 >
 <option value="All">All Sessions</option>
 <option value="Scheduled">Scheduled</option>
 <option value="Completed">Completed</option>
 </select>
 </div>
 </div>

 {/* Timetable Grid */}
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
 {filteredSchedule.map((session, idx) => (
 <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
 <div className={`absolute top-0 right-0 w-24 h-24 ${session.status === 'Completed' ? 'bg-emerald-50' : 'bg-amber-50'} rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150`}></div>

 <div className="relative z-10">
 <div className="flex items-center justify-between mb-8">
 <div className="flex items-center gap-2">
 <Calendar className="text-[#008080]" size={14} />
 <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
 {new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
 </span>
 </div>
 <div className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm border ${session.status === 'Completed'
 ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
 : 'bg-amber-50 text-amber-600 border-amber-100'
 }`}>
 {session.status} Phase
 </div>
 </div>

 <div className="space-y-6">
 <div className="flex items-start gap-4">
 <div className="w-10 h-10 rounded-xl bg-[#008080]/10 flex items-center justify-center text-[#008080] shrink-0 shadow-sm border border-[#008080]">
 <BookOpen size={20} />
 </div>
 <div>
 <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Subject / Technical Topic</p>
 <h4 className="text-lg font-black text-slate-900 leading-tight pr-4">{session.topic || 'General Academic Session'}</h4>
 </div>
 </div>

 <div className="flex items-start gap-4">
 <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 shrink-0 shadow-sm border border-rose-100">
 <Users size={20} />
 </div>
 <div>
 <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Assigned Faculty</p>
 <h4 className="text-lg font-black text-slate-900 leading-tight">{session.faculty_name}</h4>
 </div>
 </div>

 <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-6">
 <button
 onClick={() => { setSelectedSession(session); setIsDetailsModalOpen(true); }}
 className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl hover:bg-[#008080]/10 transition-colors group/btn"
 >
 <Clock className="text-[#008080] font-bold group-hover/btn:scale-110 transition-transform" size={14} />
 <span className="text-xs font-black text-slate-700 ">
 {session.start_time ? new Date(`2000-01-01T${session.start_time}`).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD'}
 </span>
 </button>
 <button 
 onClick={() => { setSelectedSession(session); setIsDetailsModalOpen(true); }}
 className="p-3 bg-slate-50 rounded-xl text-slate-400 group-hover:text-[#008080] group-hover:bg-[#008080]/10 transition-all"
 >
 <ChevronRight size={20} />
 </button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

 {filteredSchedule.length === 0 && (
 <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-sm">
 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
 <AlertCircle size={40} />
 </div>
 <h3 className="text-xl font-black text-slate-900 uppercase ">No sessions found</h3>
 <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-2">Try adjusting your filters or search keywords</p>
 </div>
 )}

 {/* Details Modal */}
 {isDetailsModalOpen && selectedSession && (
 <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
 <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
 <div className="sticky top-0 bg-white/80 backdrop-blur-xl px-10 py-6 border-b border-slate-100 flex justify-between items-center z-10">
 <div>
 <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">Session Insights</h2>
 <p className="text-[10px] font-black text-[#008080] uppercase tracking-[0.2em] mt-1">{selectedSession.student_name}'s Timeline</p>
 </div>
 <button onClick={() => setIsDetailsModalOpen(false)} className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all"><XCircle size={24} /></button>
 </div>

 <div className="p-10 space-y-10">
 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-1">
 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Faculty Name</p>
 <p className="text-sm font-black text-slate-800">{selectedSession.faculty_name}</p>
 </div>
 <div className="space-y-1 text-right">
 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Session Date</p>
 <p className="text-sm font-black text-slate-800">{new Date(selectedSession.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
 </div>
 <div className="col-span-2 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
 <p className="text-[8px] font-black text-[#008080] uppercase tracking-widest mb-2">Subject Expertise</p>
 <p className="text-base font-black text-slate-900">{selectedSession.topic}</p>
 </div>
 </div>

 {/* Reminder Section */}
 <div className="space-y-4">
 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
 <Bell size={14} className="text-[#008080]" /> Communication Triggers
 </h4>
 <div className="grid grid-cols-3 gap-4">
 {[1, 2, 3].map(n => (
 <button
 key={n}
 onClick={() => { setReminderData({ num: n, remark: selectedSession[`reminder_${n}_remark`] || '' }); setIsReminderModalOpen(true); }}
 className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${selectedSession[`reminder_${n}`] ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-white border-slate-100 text-slate-400 hover:border-[#008080] hover:text-[#008080]'}`}
 >
 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedSession[`reminder_${n}`] ? 'bg-emerald-600 text-white' : 'bg-slate-50'}`}>
 {selectedSession[`reminder_${n}`] ? <CheckSquare size={14} /> : <span className="text-[10px] font-black">{n}</span>}
 </div>
 <span className="text-[9px] font-black uppercase">Reminder {n}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Status / Completion Section */}
 <div className="space-y-4">
 <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
 <Activity size={14} className="text-[#008080]" /> Phase Execution
 </h4>
 {selectedSession.status === 'Completed' ? (
 <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex items-center gap-6">
 <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
 <ShieldCheck size={32} />
 </div>
 <div>
 <p className="text-xl font-black text-emerald-900">Session Verified</p>
 <div className="flex items-center gap-4 mt-1">
 <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-lg">
 <Timer size={12} /> {selectedSession.minutes_taken} Minutes Recorded
 </span>
 <span className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-lg">
 <Lock size={12} /> Duration Locked
 </span>
 </div>
 </div>
 </div>
 ) : (
 <button
 onClick={() => { setMinutesTaken(''); setIsCompleteModalOpen(true); }}
 className="w-full p-8 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-between hover:bg-[#008080] transition-all group"
 >
 <div className="flex items-center gap-6">
 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
 <CheckSquare size={32} />
 </div>
 <div className="text-left">
 <p className="text-xl font-black uppercase tracking-tighter">Mark as Commenced</p>
 <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">Verify session hours and close phase</p>
 </div>
 </div>
 <ChevronRight size={28} />
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Reminder Action Modal */}
 {isReminderModalOpen && (
 <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
 <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 space-y-8">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-[#008080] text-white rounded-2xl flex items-center justify-center shadow-lg"><Bell size={24} /></div>
 <div>
 <h3 className="text-lg font-black text-slate-900 uppercase">Deploy Reminder {reminderData.num}</h3>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Add execution remarks</p>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Execution Remarks *</label>
 <textarea
 value={reminderData.remark}
 onChange={(e) => setReminderData({ ...reminderData, remark: e.target.value })}
 placeholder="Type reminder notes here..."
 className="w-full p-5 bg-slate-50 border-none rounded-[1.5rem] text-xs font-bold focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none min-h-[120px]"
 />
 </div>
 <div className="flex gap-4">
 <button onClick={handleReminder} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#008080] transition-all">Record Note</button>
 <button onClick={() => setIsReminderModalOpen(false)} className="px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">Close</button>
 </div>
 </div>
 </div>
 )}

 {/* Completion Modal */}
 {isCompleteModalOpen && (
 <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
 <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 space-y-8">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><CheckSquare size={24} /></div>
 <div>
 <h3 className="text-lg font-black text-slate-900 uppercase">Verify Completion</h3>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Final session hour audit</p>
 </div>
 </div>
 <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
 <AlertCircle className="text-rose-600 shrink-0" size={18} />
 <p className="text-[9px] font-bold text-rose-700 uppercase leading-relaxed tracking-widest">Caution: Once minutes are recorded, they become read-only and locked for further editing.</p>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Total Minutes Taken *</label>
 <div className="relative">
 <input
 type="number"
 value={minutesTaken}
 onChange={(e) => setMinutesTaken(e.target.value)}
 placeholder="e.g. 60"
 className="w-full p-5 pl-14 bg-slate-50 border-none rounded-[1.5rem] text-sm font-black focus:bg-white focus:ring-4 ring-[#008080]/10 transition-all outline-none"
 />
 <Timer className="absolute left-5 top-1/2 -translate-y-1/2 text-[#008080]" size={20} />
 </div>
 </div>
 <div className="flex gap-4">
 <button onClick={handleComplete} className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all">Close Phase</button>
 <button onClick={() => setIsCompleteModalOpen(false)} className="px-8 py-4 bg-slate-50 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">Back</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default AcademicSchedule;
