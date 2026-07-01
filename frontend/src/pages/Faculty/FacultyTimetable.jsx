import React, { useState, useEffect, useDeferredValue } from 'react';
import api from '../../services/api';
import { Calendar as CalendarIcon, Search, Clock, User, BookOpen, Video } from 'lucide-react';
import toast from 'react-hot-toast';

const formatTime12h = (timeStr) => {
  if (!timeStr) return 'N/A';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
};

const FacultyTimetable = () => {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const deferredSearchTerm = useDeferredValue(searchTerm);

  useEffect(() => {
    fetchTimetable();
    const t = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const res = await api.get('/faculty/timetable');
      if (res.data.success) {
        setTimetable(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  const checkIsLive = (item) => {
    if (!item.start_time || !item.end_time || !item.date) return false;
    if (item.status !== 'Scheduled') return false;
    const now = currentTime;
    const sessionDate = new Date(item.date);
    if (now.getFullYear() !== sessionDate.getFullYear() ||
        now.getMonth() !== sessionDate.getMonth() ||
        now.getDate() !== sessionDate.getDate()) return false;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = item.start_time.split(':').map(Number);
    const [eh, em] = item.end_time.split(':').map(Number);
    return nowMins >= sh * 60 + sm && nowMins <= eh * 60 + em;
  };

  const filteredTimetable = timetable
  .filter(item => item.student_name?.toLowerCase().includes(deferredSearchTerm.toLowerCase()) || item.student_subject?.toLowerCase().includes(deferredSearchTerm.toLowerCase())); 

  return <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="space-y-1">
        <h1 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
          My Timetable
          <div className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[10px] tracking-widest font-black">
            {timetable.length} SESSIONS
          </div>
        </h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">View all assigned sessions</p>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <div className="relative group min-w-full md:w-[300px]">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
        <input type="text" placeholder="Search by student or subject..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold placeholder:font-medium focus:outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" />
      </div>
    </div>

    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
      {loading ? <div className="p-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-xs uppercase tracking-widest">Loading Timetable...</p>
      </div> : filteredTimetable.length === 0 ? <div className="p-20 text-center space-y-4">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
          <CalendarIcon size={40} />
        </div>
        <h3 className="text-xl font-black text-slate-900">No Sessions Found</h3>
      </div> : <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-4 md:px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Date & Time</th>
              <th className="px-4 md:px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Student Details</th>
              <th className="px-4 md:px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Subject</th>
              <th className="px-4 md:px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Status</th>
              <th className="px-4 md:px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Meet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredTimetable.map((item, index) => <tr key={item.id} className="hover:bg-slate-50/50 transition-colors"><td className="p-6 text-sm font-black text-slate-400 border-b border-slate-50">{index + 1}</td>
              <td className="px-4 md:px-8 py-6 align-top">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-black text-slate-900 whitespace-nowrap flex items-center gap-2">
                    <CalendarIcon size={14} className="text-slate-400" />
                    {new Date(item.date).toLocaleDateString('en-GB')}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap flex items-center gap-2">
                    <Clock size={12} className="text-slate-400" />
                    {formatTime12h(item.start_time)} - {formatTime12h(item.end_time)}
                  </span>
                  {checkIsLive(item) && (
                    <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span> LIVE NOW
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 md:px-8 py-6 align-top">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-black text-[#008080] uppercase tracking-tight">{item.student_name}</span>
                  {item.grade && <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Grade: {item.grade}
                  </span>}
                </div>
              </td>
              <td className="px-4 md:px-8 py-6 align-top">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {item.student_subject || 'N/A'}
                  </span>
                </div>
              </td>
              <td className="px-4 md:px-8 py-6 align-top">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${item.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : item.status === 'Scheduled' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Completed' ? 'bg-emerald-500' : item.status === 'Scheduled' ? 'bg-blue-500' : 'bg-slate-400'}`} />
                  {item.status}
                </span>
              </td>
              <td className="px-4 md:px-8 py-6 align-top">
                {item.meet_link ? (
                  <a
                    href={item.meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      checkIsLive(item)
                        ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/30'
                        : 'bg-[#008080]/10 text-[#008080] hover:bg-[#008080] hover:text-white'
                    }`}
                  >
                    <Video size={12} />
                    {checkIsLive(item) ? 'Join Live' : 'Join'}
                  </a>
                ) : (
                  <span className="text-[10px] text-slate-300 font-bold">—</span>
                )}
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </div>
  </div>;
};
export default FacultyTimetable;