import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Clock, Search, BookOpen, AlertCircle, Calendar, User, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const SSCDailyUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/ssc/daily-updates');
      if (res.data.success) {
        setUpdates(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to fetch daily updates');
    } finally {
      setLoading(false);
    }
  };

  const filteredUpdates = updates.filter(update => 
    update.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    update.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    update.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
            Faculty Daily Updates
            <div className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[10px] tracking-widest font-black">
              {updates.length} TOTAL
            </div>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Track daily class reports submitted by faculties</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative group min-w-[300px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Search by student, faculty, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold placeholder:font-medium focus:outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-xs uppercase tracking-widest">Retrieving Updates...</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <BookOpen size={40} />
            </div>
            <h3 className="text-xl font-black text-slate-900">No Updates Found</h3>
            <p className="text-slate-500 font-bold max-w-xs mx-auto text-sm">No daily class reports have been submitted yet or match your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Date & Time</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Faculty Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Student Details</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Class Info</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Student Performance</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">Issues / Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredUpdates.map((update) => (
                  <tr key={update.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Date & Time */}
                    <td className="px-8 py-6 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black text-slate-900 whitespace-nowrap flex items-center gap-2">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(update.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap flex items-center gap-2">
                          <Clock size={12} className="text-slate-400" />
                          {new Date(update.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Faculty */}
                    <td className="px-8 py-6 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                          <User size={14} />
                        </div>
                        <span className="text-sm font-black text-slate-900 uppercase tracking-tight">{update.faculty_name}</span>
                      </div>
                    </td>

                    {/* Student */}
                    <td className="px-8 py-6 align-top">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-black text-[#008080] uppercase tracking-tight">{update.student_name}</span>
                        {update.student_grade && (
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            Grade: {update.student_grade}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Class Info */}
                    <td className="px-8 py-6 align-top max-w-[250px]">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100 whitespace-nowrap">
                            {update.subject || 'N/A'}
                          </span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-200 whitespace-nowrap">
                            {update.class_duration || 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 line-clamp-2" title={update.topic_taught}>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Topic:</span>
                          {update.topic_taught || 'No topic details'}
                        </p>
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                          <FileText size={14} className={update.homework_given ? "text-emerald-500" : "text-slate-400"} />
                          {update.homework_given ? 'Homework Given' : 'No Homework'}
                        </div>
                      </div>
                    </td>

                    {/* Student Performance */}
                    <td className="px-8 py-6 align-top">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Attention:</span>
                          <span className={`text-xs font-black uppercase tracking-wider ${update.attention_level === 'Low' ? 'text-rose-500' : update.attention_level === 'Medium' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {update.attention_level || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Participation:</span>
                          <span className={`text-xs font-black uppercase tracking-wider ${update.participation_level === 'Passive' ? 'text-rose-500' : update.participation_level === 'Moderate' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {update.participation_level || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Understanding:</span>
                          <span className={`text-xs font-black uppercase tracking-wider ${update.understanding_level === 'Poor' ? 'text-rose-500' : update.understanding_level === 'Average' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {update.understanding_level || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Issues / Remarks */}
                    <td className="px-8 py-6 align-top max-w-[200px]">
                      {update.issue_flag ? (
                        <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl flex flex-col gap-2">
                          <div className="flex items-center gap-2 text-rose-600">
                            <AlertCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Issue Flagged</span>
                          </div>
                          <span className="text-xs font-bold text-rose-700">{update.issue_type}</span>
                        </div>
                      ) : (
                        <span className="inline-block px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100 flex items-center gap-2 w-max">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                          No Issues
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SSCDailyUpdates;
