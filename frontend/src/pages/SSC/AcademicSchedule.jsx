import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  CalendarClock, Clock, BookOpen, Users,
  Search, Filter, ChevronRight, Activity,
  Calendar, AlertCircle, Bell, CheckSquare, MessageSquareText, Lock, 
  ShieldCheck, Timer, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const AcademicSchedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('today');
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

  const getFilteredData = () => {
    const today = new Date().toISOString().split('T')[0];
    let filtered = schedule.filter(session => {
      const matchesSearch =
        (session.topic || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.faculty_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (session.student_name || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    if (activeTab === 'today') {
      return filtered.filter(s => s.date.split('T')[0] === today && s.status !== 'Completed');
    } else if (activeTab === 'upcoming') {
      return filtered.filter(s => s.date.split('T')[0] > today && s.status !== 'Completed');
    } else {
      return filtered.filter(s => s.status === 'Completed');
    }
  };

  const currentData = getFilteredData();

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
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase ">Academic Schedule Coordination</h1>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1">Success monitoring of faculty-led sessions</p>
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

      {/* Tabs and Search Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex p-1.5 bg-slate-100 rounded-2xl gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'today', label: 'Today\'s Sessions', icon: <Clock size={14} />, color: 'bg-emerald-500' },
              { id: 'upcoming', label: 'Upcoming', icon: <CalendarClock size={14} />, color: 'bg-indigo-500' },
              { id: 'completed', label: 'Completed', icon: <CheckSquare size={14} />, color: 'bg-slate-500' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
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

          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Filter by student or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none rounded-2xl text-[10px] font-black uppercase tracking-widest focus:bg-white focus:ring-4 ring-[#008080]/5 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {currentData.map((session, idx) => (
          <div key={idx} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group overflow-hidden flex flex-col">
            {/* Session Card Content */}
            <div className="p-8 space-y-6 flex-1">
              <div className="flex items-center justify-between">
                <div className="px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-2">
                  <Clock size={12} className="text-[#008080]" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    {session.start_time ? new Date(`2000-01-01T${session.start_time}`).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : 'TBD'}
                  </span>
                </div>
                <div className={`w-3 h-3 rounded-full ${session.status === 'Completed' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]' : 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]'} animate-pulse`}></div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-[#008080] transition-colors">{session.topic || 'General Session'}</h3>
                  {session.status === 'Completed' && (
                    <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black uppercase flex items-center gap-1">
                      <Timer size={10} /> {session.minutes_taken}m
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Users size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{session.student_name}</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Faculty Charge</span>
                  <span className="text-[10px] font-black text-slate-700 uppercase">{session.faculty_name}</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map(n => (
                    <div 
                      key={n}
                      className={`flex-1 h-1.5 rounded-full ${session[`reminder_${n}`] ? 'bg-emerald-500' : 'bg-slate-200'}`}
                      title={`Reminder ${n}: ${session[`reminder_${n}_remark`] || 'Not sent'}`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Session Card Actions */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 grid grid-cols-2 gap-3">
              {session.meeting_link && (
                <button 
                  onClick={() => window.open(session.meeting_link, '_blank')}
                  className="col-span-2 py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Activity size={14} /> Watch Session
                </button>
              )}
              
              <button 
                onClick={() => { setSelectedSession(session); setIsDetailsModalOpen(true); }}
                className="py-3 bg-white text-slate-700 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-[#008080] hover:text-[#008080] transition-all flex items-center justify-center gap-2"
              >
                <Bell size={14} /> Reminders
              </button>

              <button 
                onClick={() => { setSelectedSession(session); setIsDetailsModalOpen(true); }}
                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                  session.status === 'Completed' 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                  : 'bg-slate-900 text-white hover:bg-[#008080]'
                }`}
              >
                <CheckSquare size={14} /> {session.status === 'Completed' ? 'Completed' : 'Finish'}
              </button>
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
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-md p-10 space-y-8">
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
