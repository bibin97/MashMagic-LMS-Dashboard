import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CalendarClock, Clock, BookOpen, Users,
  Search, Filter, ChevronRight, Activity, Radio, Video,
  Calendar, AlertCircle, Bell, CheckSquare, MessageSquareText, Lock, 
  ShieldCheck, Timer, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const checkIsLive = (session) => {
  if (!session.start_time || !session.end_time || !session.date) return false;
  if (session.status === 'Completed') return false;
  
  const now = new Date();
  const sessionDate = new Date(session.date);
  
  if (
    now.getFullYear() !== sessionDate.getFullYear() ||
    now.getMonth() !== sessionDate.getMonth() ||
    now.getDate() !== sessionDate.getDate()
  ) {
    return false;
  }
  
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = session.start_time.split(':').map(Number);
  const [endH, endM] = session.end_time.split(':').map(Number);
  
  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  
  return currentMins >= (startMins - 5) && currentMins <= endMins;
};

const AcademicSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('today');
  const [joinedSessions, setJoinedSessions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('joinedSessions')) || {}; } catch { return {}; }
  });
  
  const handleJoinSession = (session) => {
    const newJoined = { ...joinedSessions, [session.id]: true };
    setJoinedSessions(newJoined);
    localStorage.setItem('joinedSessions', JSON.stringify(newJoined));
    window.open(session.meeting_link, '_blank');
  };
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [minutesTaken, setMinutesTaken] = useState('');

  // Keep tracking input values for reminder remarks in a local state so they are editable
  const [reminderRemarks, setReminderRemarks] = useState({ 1: '', 2: '', 3: '' });

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

  const getFilteredData = () => {
    const localToday = new Date();
    const year = localToday.getFullYear();
    const month = String(localToday.getMonth() + 1).padStart(2, '0');
    const day = String(localToday.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;

    let filtered = schedule.filter(session => {
      const matchesSearch =
        (session.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.faculty_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.student_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    if (activeTab === 'today') {
      return filtered.filter(s => {
        const sessionDate = s.date.split('T')[0];
        return sessionDate <= todayStr && s.status !== 'Completed' && s.status !== 'Postponed';
      });
    } else if (activeTab === 'upcoming') {
      return filtered.filter(s => {
        const sessionDate = s.date.split('T')[0];
        return s.status === 'Postponed' || (sessionDate > todayStr && s.status !== 'Completed');
      });
    } else {
      return filtered.filter(s => s.status === 'Completed');
    }
  };

  const currentData = getFilteredData();

  const localTodayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const handleReminderSave = async (num, remark) => {
    if (!remark.trim()) return toast("Please type a note to save", { icon: "✍️" });
    try {
      await api.put(`/mentor/academic-schedule/${selectedSession.id}/reminder`, {
        reminder_num: num,
        remark: remark
      });
      toast.success(`Reminder ${num} recorded successfully`);
      
      // Update selectedSession locally
      const updatedSession = { 
        ...selectedSession, 
        [`reminder_${num}`]: 1, 
        [`reminder_${num}_remark`]: remark 
      };
      setSelectedSession(updatedSession);
      
      // Update main schedule state
      setSchedule(prev => prev.map(s => s.id === selectedSession.id ? updatedSession : s));
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update reminder");
    }
  };

  const saveQuickReminder1 = async (session) => {
    const remark = window.prompt("Enter remark for Reminder 1 (e.g., 'Sent via WhatsApp'):");
    if (remark === null) return; 
    if (!remark.trim()) return toast("Please type a note to save", { icon: "✍️" });
    
    try {
      await api.put(`/mentor/academic-schedule/${session.id}/reminder`, {
        reminder_num: 1,
        remark: remark
      });
      toast.success(`Reminder 1 recorded successfully`);
      
      const updatedSession = { 
        ...session, 
        reminder_1: 1, 
        reminder_1_remark: remark 
      };
      setSchedule(prev => prev.map(s => s.id === session.id ? updatedSession : s));
      if (selectedSession?.id === session.id) {
        setSelectedSession(updatedSession);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update reminder");
    }
  };

  const handleComplete = async () => {
    if (!minutesTaken || isNaN(minutesTaken) || parseInt(minutesTaken) <= 0) {
      return toast.error("Enter valid positive minutes");
    }
    try {
      await api.put(`/mentor/academic-schedule/${selectedSession.id}/complete`, {
        minutes_taken: parseInt(minutesTaken)
      });
      toast.success("Session marked as completed");
      setIsCompleteModalOpen(false);
      setIsDetailsModalOpen(false);
      fetchSchedule();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to complete session");
    }
  };

  const openDetailsModal = (session) => {
    setSelectedSession(session);
    setReminderRemarks({
      1: session.reminder_1_remark || '',
      2: session.reminder_2_remark || '',
      3: session.reminder_3_remark || ''
    });
    setIsDetailsModalOpen(true);
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 bg-white p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 border-b-4 border-b-[#008080]">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-[#008080] rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 shrink-0">
            <CalendarClock size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight ">Academic Schedule Coordination</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1">Success monitoring of faculty-led sessions</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 px-4 md:px-6 py-2.5 md:py-3 rounded-[1rem] md:rounded-2xl border border-slate-100 flex items-center gap-3">
            <Activity className="text-emerald-500 shrink-0" size={14} />
            <div>
              <p className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest">Total Active</p>
              <p className="text-xs md:text-sm font-black text-slate-900 leading-none">{schedule.filter(s => s.status === 'Scheduled').length} Sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4 md:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div className="flex p-1.5 bg-slate-100 rounded-[1rem] md:rounded-2xl gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'today', label: 'Today\'s Sessions', icon: <Clock size={14} />, color: 'bg-emerald-500' },
              { id: 'upcoming', label: 'Upcoming', icon: <CalendarClock size={14} />, color: 'bg-indigo-500' },
              { id: 'completed', label: 'Completed', icon: <CheckSquare size={14} />, color: 'bg-slate-500' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-md'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${activeTab === tab.id ? tab.color : 'bg-slate-300'}`}></div>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 max-w-md relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filter by student or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-3.5 bg-slate-50 border-none rounded-[1rem] md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 ring-[#008080]/5 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Timetable List View */}
      <div className="space-y-4">
        {currentData.map((session, idx) => (
          <div key={idx} className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group overflow-hidden flex flex-col md:flex-row items-stretch">
            <div className={`w-2 md:w-3 shrink-0 ${session.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500'} opacity-40 group-hover:opacity-100 transition-opacity animate-pulse`}></div>
            
            <div className="flex-grow p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
              
              <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto md:min-w-[200px]">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 rounded-xl md:rounded-[1.5rem] flex items-center justify-center text-slate-600 group-hover:bg-[#008080] group-hover:text-white transition-all duration-700 -rotate-3 group-hover:rotate-0 shrink-0">
                  <Users size={20} />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-xs md:text-sm font-black text-slate-900 tracking-tight uppercase truncate">{session.student_name}</h3>
                  <p className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mt-1 truncate">
                    Faculty: {session.faculty_name}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:gap-6 flex-grow">
                <div className="flex items-center gap-2 md:gap-3 bg-slate-50/50 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-slate-100 transition-colors group-hover:bg-[#008080]/10">
                  <Calendar size={14} className="text-[#008080]" />
                  <span className="text-[10px] md:text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">
                    {session.date ? new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'TBD'}
                  </span>
                </div>

                <div className="flex items-center gap-2 md:gap-3 bg-slate-50/50 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border border-slate-100 transition-colors group-hover:bg-[#008080]/10">
                  <Clock size={14} className="text-[#008080]" />
                  <span className="text-[10px] md:text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">
                    {session.start_time ? new Date(`2000-01-01T${session.start_time}`).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD'}
                  </span>
                </div>

                <div className="flex flex-col gap-1 w-full md:w-auto md:min-w-[150px]">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Topic</span>
                  <p className="text-[10px] md:text-xs font-black text-slate-900 truncate">{session.topic || 'General Session'}</p>
                </div>

                {session.status === 'Completed' && (
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase flex items-center gap-1">
                    <Timer size={12} /> {session.minutes_taken}m
                  </div>
                )}
              </div>

              {activeTab !== 'upcoming' && (
                <div className="flex items-center justify-end md:justify-start gap-2 md:gap-3 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 w-full md:w-auto mt-2 md:mt-0">
                  {session.meeting_link && session.status !== 'Completed' && session.date && session.date.split('T')[0] === localTodayStr && (
                    <button 
                      onClick={() => handleJoinSession(session)}
                      title="Watch Session"
                      className={`px-4 h-11 rounded-[1rem] flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all ${
                        checkIsLive(session)
                        ? `bg-red-500 text-white hover:bg-red-600 hover:scale-[1.05] ${!joinedSessions[session.id] ? 'shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse' : 'shadow-sm'}`
                        : 'bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white shadow-sm'
                      }`}
                    >
                      <Video size={14} /> LIVE
                    </button>
                  )}
                  
                  {!session.reminder_1 ? (
                    <button 
                      onClick={() => saveQuickReminder1(session)}
                      title="Send Reminder 1"
                      className="px-4 h-11 rounded-[1rem] flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-600 hover:text-white shadow-sm"
                    >
                      <Bell size={14} /> R1
                    </button>
                  ) : (
                    <div title="Reminder 1 Sent" className="px-4 h-11 rounded-[1rem] flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm cursor-help" onClick={() => toast(`Reminder 1: ${session.reminder_1_remark}`, { icon: 'ℹ️' })}>
                      <CheckSquare size={14} /> R1
                    </div>
                  )}

                  <button 
                    onClick={() => openDetailsModal(session)}
                    title="Session Details"
                    className="w-11 h-11 bg-slate-50 text-slate-700 border border-slate-200 rounded-[1rem] flex items-center justify-center hover:border-[#008080] hover:text-[#008080] transition-all shadow-sm"
                  >
                    <BookOpen size={16} />
                  </button>

                  {session.status === 'Completed' ? (
                    <div title="Completed" className="w-11 h-11 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-[1rem] flex items-center justify-center shadow-sm">
                      <CheckSquare size={16} />
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setSelectedSession(session); setMinutesTaken(''); setIsCompleteModalOpen(true); }}
                      title="Class Completed"
                      className="w-11 h-11 bg-slate-900 text-white hover:bg-[#008080] rounded-[1rem] flex items-center justify-center transition-all shadow-sm"
                    >
                      <CheckSquare size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {currentData.length === 0 && (
        <div className="bg-white p-20 rounded-[3rem] border border-slate-100 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
            <AlertCircle size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">No sessions detected</h3>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-3">There are no academic logs matching this tab filter</p>
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

              {/* Reminder Section (Direct remark inputs) */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Bell size={14} className="text-[#008080]" /> Communication Triggers & Remarks
                </h4>
                <div className="space-y-4">
                  {[2, 3].map(n => {
                    const isSent = selectedSession[`reminder_${n}`];
                    return (
                      <div key={n} className={`p-6 rounded-2xl border transition-all ${isSent ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/50 border-slate-100'} flex flex-col gap-3`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${isSent ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                              {n}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Reminder {n}</span>
                          </div>
                          <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-full ${isSent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                            {isSent ? 'Sent' : 'Pending'}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <input 
                              type="text"
                              value={reminderRemarks[n]}
                              onChange={(e) => setReminderRemarks(prev => ({ ...prev, [n]: e.target.value }))}
                              placeholder={`Type remark for Reminder ${n}...`}
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 ring-[#008080]/15 outline-none transition-all"
                            />
                          </div>
                          <button
                            onClick={() => handleReminderSave(n, reminderRemarks[n])}
                            className="px-4 py-2.5 bg-slate-900 hover:bg-[#008080] text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Only Academic Head can edit duration now</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setMinutesTaken(''); setIsCompleteModalOpen(true); }}
                    className="w-full p-8 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-between hover:bg-[#008080] transition-all group animate-pulse"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                        <CheckSquare size={32} />
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-black uppercase tracking-tighter">Mark as Completed</p>
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

      {/* Completion Modal */}
      {isCompleteModalOpen && selectedSession && (
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
