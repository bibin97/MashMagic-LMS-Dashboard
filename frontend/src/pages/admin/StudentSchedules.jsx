import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Users, Clock, Calendar } from 'lucide-react';
const StudentSchedules = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetchSchedules();
  }, []);
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/student-schedules');
      setSchedules(res.data.data || []);
    } catch (e) {
      toast.error("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };
  return <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Student Schedules</h1>
                    <p className="text-sm text-slate-500 font-medium">View all student and faculty assignments</p>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100"><th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">#</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Student</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Faculty</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Subject</th>
                                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Day & Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? <tr><td colSpan="4" className="p-8 text-center"><div className="w-8 h-8 border-4 border-[#008080] border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr> : schedules.length > 0 ? schedules.map((s, index) => <tr key={s.id} className="hover:bg-slate-50/50 transition-colors"><td className="p-6 text-sm font-black text-slate-400 border-b border-slate-50">{index + 1}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2">
                                            <Users size={16} className="text-slate-400" />
                                            {s.student_name}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700">{s.faculty_name}</td>
                                        <td className="px-6 py-4 font-semibold text-[#008080]">{s.subject}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                                                <Calendar size={14} className="text-[#008080]" /> {s.day_of_week}
                                                <span className="mx-2 text-slate-300">|</span>
                                                <Clock size={14} className="text-[#008080]" /> {s.start_time} - {s.end_time}
                                            </div>
                                        </td>
                                    </tr>) : <tr>
                                    <td colSpan="4" className="p-12 text-center text-slate-400">
                                        <Clock size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="font-semibold text-sm">No student schedules found.</p>
                                    </td>
                                </tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>;
};
export default StudentSchedules;