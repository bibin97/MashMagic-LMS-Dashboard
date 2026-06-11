import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, Calendar, Clock, Video, FileText, PlusCircle, CheckCircle2, 
  BookOpen, ListTodo, Presentation
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const ParentMeetings = ({ isEmbedded }) => {
  const { user } = useAuth();
  const isAOE = user?.role === 'academic_operation_executive';
  
  const [activeTab, setActiveTab] = useState(isAOE ? 'view' : 'schedule'); // 'schedule', 'report', 'view'
  const [students, setStudents] = useState([]);
  const [meetings, setMeetings] = useState([]);
  
  const [formData, setFormData] = useState({
    student_id: '',
    meeting_date: new Date().toISOString().split('T')[0],
    meeting_time: '10:00',
    meeting_link: '',
    notes: ''
  });

  const [reportData, setReportData] = useState({
    id: null,
    notes: ''
  });

  useEffect(() => {
    fetchStudents();
    fetchMeetings();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/aoe/students-all');
      setStudents((res.data.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    } catch (err) {
      toast.error('Failed to fetch students');
    }
  };

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/aoe/parent-meetings');
      setMeetings(res.data.data || []);
    } catch (err) {
      toast.error('Failed to fetch meetings');
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id) return toast.error('Please select a student');

    try {
      await api.post('/aoe/parent-meetings', formData);
      toast.success('Meeting scheduled successfully');
      setFormData({
        ...formData,
        student_id: '',
        meeting_link: '',
        notes: ''
      });
      fetchMeetings();
      setActiveTab('report');
    } catch (err) {
      toast.error('Failed to schedule meeting');
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportData.id) return toast.error('Invalid meeting');

    try {
      await api.put(`/aoe/parent-meetings/${reportData.id}/report`, {
        status: 'Completed',
        report_data: { summary: reportData.notes } // Using JSON structure for future extensibility
      });
      toast.success('Meeting reported successfully');
      setReportData({ id: null, notes: '' });
      fetchMeetings();
      setActiveTab('view');
    } catch (err) {
      toast.error('Failed to submit report');
    }
  };

  const scheduledMeetings = meetings.filter(m => m.status === 'Scheduled');
  const completedMeetings = meetings.filter(m => m.status === 'Completed');

  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-slate-50/50 p-4 md:p-8"}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600">
              <Presentation size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">Parent Meetings</h1>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Schedule and Report Parent Meetings</p>
            </div>
          </div>
        </div>

        {/* Tabs - Only show if not AOE */}
        {!isAOE && (
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('schedule')}
              className={`pb-4 px-4 font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'schedule' 
                ? 'text-indigo-600 border-b-2 border-indigo-600' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <PlusCircle size={16} /> Schedule Meeting
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className={`pb-4 px-4 font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'report' 
                ? 'text-amber-500 border-b-2 border-amber-500' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ListTodo size={16} /> Report / Active ({scheduledMeetings.length})
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`pb-4 px-4 font-black uppercase text-xs tracking-widest transition-all flex items-center gap-2 ${
                activeTab === 'view' 
                ? 'text-emerald-500 border-b-2 border-emerald-500' 
                : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <CheckCircle2 size={16} /> Completed View
            </button>
          </div>
        )}

        {/* Content */}
        {activeTab === 'schedule' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm max-w-3xl">
            <form onSubmit={handleScheduleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Student</label>
                <select 
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  <option value="">-- Select Student --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.registration_number})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meeting Date</label>
                  <input 
                    type="date"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData({...formData, meeting_date: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meeting Time</label>
                  <input 
                    type="time"
                    value={formData.meeting_time}
                    onChange={(e) => setFormData({...formData, meeting_time: e.target.value})}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meeting Link (Optional)</label>
                <input 
                  type="text"
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({...formData, meeting_link: e.target.value})}
                  placeholder="https://meet.google.com/..."
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reason / Notes</label>
                <textarea 
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
                  placeholder="What is the agenda of this meeting?"
                />
              </div>

              <button 
                type="submit"
                className="h-12 px-8 rounded-xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 w-full md:w-auto"
              >
                <Calendar size={16} /> Schedule Meeting
              </button>

            </form>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="space-y-4">
            {scheduledMeetings.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-700">No Pending Meetings</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">There are no scheduled meetings waiting to be reported.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {scheduledMeetings.map(m => (
                  <div key={m.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-black text-slate-900 text-lg">{m.student_name}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit">
                          <Calendar size={12} /> {new Date(m.meeting_date).toLocaleDateString('en-GB')} at {m.meeting_time}
                        </div>
                      </div>
                    </div>
                    
                    {m.notes && (
                      <div className="text-sm font-medium text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl flex-grow">
                        <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest block mb-1">Agenda</span>
                        {m.notes}
                      </div>
                    )}
                    
                    {m.meeting_link && (
                      <a href={m.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-600 mb-4">
                        <Video size={14} /> Join Meeting
                      </a>
                    )}
                    
                    <div className="pt-4 border-t border-slate-100 mt-auto">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Submit Report</h4>
                      <textarea
                        value={reportData.id === m.id ? reportData.notes : ''}
                        onChange={(e) => setReportData({ id: m.id, notes: e.target.value })}
                        placeholder="Enter meeting summary/report here..."
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 min-h-[100px] mb-3"
                      />
                      <button 
                        onClick={handleReportSubmit}
                        disabled={reportData.id !== m.id || !reportData.notes}
                        className="w-full h-10 rounded-xl bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        <FileText size={14} /> Mark as Completed
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'view' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Date & Time</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Student</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Agenda</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Report / Summary</th>
                    <th className="p-4 text-xs font-black text-slate-500 uppercase tracking-widest">Handled By</th>
                  </tr>
                </thead>
                <tbody>
                  {completedMeetings.length > 0 ? completedMeetings.map(m => {
                    let summary = '';
                    try {
                      summary = typeof m.report_data === 'string' 
                        ? JSON.parse(m.report_data).summary 
                        : m.report_data?.summary || '';
                    } catch(e) { summary = m.report_data; }
                    
                    return (
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="p-4 text-sm font-bold text-slate-900 whitespace-nowrap">
                        {new Date(m.meeting_date).toLocaleDateString('en-GB')} <span className="text-slate-400 text-xs ml-1">{m.meeting_time}</span>
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-700">
                        {m.student_name}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500 max-w-xs">
                        {m.notes || '-'}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-700 max-w-md bg-emerald-50/30">
                        {summary}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500 whitespace-nowrap">
                        {m.academic_operation_executive_name}
                      </td>
                    </tr>
                  )}) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-400 font-medium">
                        No completed meetings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ParentMeetings;
