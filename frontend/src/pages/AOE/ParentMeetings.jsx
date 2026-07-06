import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, Calendar, Clock, Video, FileText, PlusCircle, CheckCircle2, BookOpen, ListTodo, Presentation } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/common/Pagination';
import MobileCard from '../../components/common/MobileCard';
const ParentMeetings = ({
  isEmbedded
}) => {
  const {
    user
  } = useAuth();
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
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalRecords, setTotalRecords] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedMeetingId, setExpandedMeetingId] = useState(null);

  // Modals state
  const [editModalData, setEditModalData] = useState(null);
  const [cancelModalData, setCancelModalData] = useState(null);
  const [deleteModalData, setDeleteModalData] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);

  useEffect(() => {
    fetchMeetings();
  }, [page, activeTab]);
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
      setLoading(true);
      if (activeTab === 'schedule') {
        const res = await api.get('/aoe/parent-meetings?status=Scheduled&page=1&limit=1');
        setPendingCount(res.data.total || 0);
        setLoading(false);
        return;
      }
      const status = activeTab === 'report' ? 'Scheduled' : 'Completed,Cancelled';
      const res = await api.get(`/aoe/parent-meetings?status=${status}&page=${page}&limit=${limit}`);
      if (activeTab === 'report') {
        setPendingCount(res.data.total || 0);
      }
      setMeetings(res.data.data || []);
      setTotalRecords(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };
  const handleScheduleSubmit = async e => {
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
  const handleReportSubmit = async e => {
    e.preventDefault();
    if (!reportData.id) return toast.error('Invalid meeting');
    try {
      await api.put(`/aoe/parent-meetings/${reportData.id}/report`, {
        status: 'Completed',
        report_data: {
          summary: reportData.notes
        } // Using JSON structure for future extensibility
      });
      toast.success('Meeting reported successfully');
      setReportData({
        id: null,
        notes: ''
      });
      fetchMeetings();
      setActiveTab('view');
    } catch (err) {
      toast.error('Failed to submit report');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editModalData.reason && editModalData.is_postponed) {
        return toast.error('Please provide a reason for postponing');
    }
    try {
        await api.put(`/aoe/parent-meetings/${editModalData.id}`, editModalData);
        toast.success('Meeting updated successfully');
        setEditModalData(null);
        fetchMeetings();
    } catch (err) {
        toast.error('Failed to update meeting');
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalData.reason) {
        return toast.error('Please provide a reason for cancelling');
    }
    try {
        await api.put(`/aoe/parent-meetings/${cancelModalData.id}`, { status: 'Cancelled', reason: cancelModalData.reason });
        toast.success('Meeting cancelled successfully');
        setCancelModalData(null);
        fetchMeetings();
    } catch (err) {
        toast.error('Failed to cancel meeting');
    }
  };

  const handleDeleteSubmit = async () => {
    try {
        await api.delete(`/aoe/parent-meetings/${deleteModalData.id}`);
        toast.success('Meeting deleted successfully');
        setDeleteModalData(null);
        fetchMeetings();
    } catch (err) {
        toast.error('Failed to delete meeting');
    }
  };

  const scheduledMeetings = activeTab === 'report' ? meetings : [];
  const completedMeetings = activeTab === 'view' ? meetings : [];
  return <div className={isEmbedded ? "" : "min-h-screen bg-slate-50/50 p-4 md:p-8"}>
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
        {!isAOE && <div className="flex w-full border-b border-slate-200 bg-white sm:bg-transparent rounded-t-3xl sm:rounded-none overflow-hidden">
            <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-3 px-1 sm:pb-4 sm:px-4 font-black uppercase text-[9px] sm:text-xs tracking-widest transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center whitespace-normal min-h-[60px] sm:min-h-0 ${activeTab === 'schedule' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
              <PlusCircle size={16} className="shrink-0" /> <span className="leading-tight">Schedule<span className="hidden sm:inline"> Meeting</span></span>
            </button>
            <button onClick={() => setActiveTab('report')} className={`flex-1 py-3 px-1 sm:pb-4 sm:px-4 font-black uppercase text-[9px] sm:text-xs tracking-widest transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center whitespace-normal min-h-[60px] sm:min-h-0 ${activeTab === 'report' ? 'text-amber-500 border-b-2 border-amber-500 bg-amber-50/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
              <ListTodo size={16} className="shrink-0" /> <span className="leading-tight">Report<span className="hidden sm:inline"> / Active</span><br className="sm:hidden" /> ({pendingCount})</span>
            </button>
            <button onClick={() => setActiveTab('view')} className={`flex-1 py-3 px-1 sm:pb-4 sm:px-4 font-black uppercase text-[9px] sm:text-xs tracking-widest transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-center whitespace-normal min-h-[60px] sm:min-h-0 ${activeTab === 'view' ? 'text-emerald-500 border-b-2 border-emerald-500 bg-emerald-50/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
              <CheckCircle2 size={16} className="shrink-0" /> <span className="leading-tight">Completed<span className="hidden sm:inline"> View</span></span>
            </button>
          </div>}

        {/* Content */}
        {activeTab === 'schedule' && <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm max-w-3xl">
            <form onSubmit={handleScheduleSubmit} className="space-y-6">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Student</label>
                <select value={formData.student_id} onChange={e => setFormData({
              ...formData,
              student_id: e.target.value
            })} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required>
                  <option value="">-- Select Student --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.registration_number})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meeting Date</label>
                  <input type="date" value={formData.meeting_date} onChange={e => setFormData({
                ...formData,
                meeting_date: e.target.value
              })} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meeting Time</label>
                  <input type="time" value={formData.meeting_time} onChange={e => setFormData({
                ...formData,
                meeting_time: e.target.value
              })} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Meeting Link (Optional)</label>
                <input type="text" value={formData.meeting_link} onChange={e => setFormData({
              ...formData,
              meeting_link: e.target.value
            })} placeholder="https://meet.google.com/..." className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reason / Notes</label>
                <textarea value={formData.notes} onChange={e => setFormData({
              ...formData,
              notes: e.target.value
            })} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px]" placeholder="What is the agenda of this meeting?" />
              </div>

              <button type="submit" className="h-12 px-4 md:px-8 rounded-xl bg-indigo-600 text-white font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 w-full md:w-auto">
                <Calendar size={16} /> Schedule Meeting
              </button>

            </form>
          </div>}

        {activeTab === 'report' && <div className="space-y-4">
            {scheduledMeetings.length === 0 ? <div className="bg-white rounded-3xl p-6 md:p-12 border border-slate-100 shadow-sm text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-black text-slate-700">No Pending Meetings</h3>
                <p className="text-sm font-medium text-slate-500 mt-1">There are no scheduled meetings waiting to be reported.</p>
              </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {scheduledMeetings.map(m => <div key={m.id} className="bg-white rounded-[20px] sm:rounded-3xl p-4 sm:p-6 border border-slate-100 shadow-sm flex flex-col h-full">
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="w-full">
                        <h3 className="font-black text-slate-900 text-base sm:text-lg truncate">{m.student_name}</h3>
                        <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 text-[10px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit flex-wrap">
                          <Calendar size={12} className="shrink-0" /> <span>{new Date(m.meeting_date).toLocaleDateString('en-GB')}</span> <span>at {m.meeting_time}</span>
                        </div>
                      </div>
                    </div>
                    
                    {m.notes && <div className="text-sm font-medium text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl flex-grow">
                        <span className="font-bold text-slate-400 uppercase text-[10px] tracking-widest block mb-1">Agenda</span>
                        {m.notes}
                      </div>}
                    
                    {m.meeting_link && <a href={m.meeting_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-600 mb-4">
                        <Video size={14} /> Join Meeting
                      </a>}
                    
                    {(() => {
                        let isPostponed = false;
                        let actionReason = '';
                        try {
                            const rd = typeof m.report_data === 'string' ? JSON.parse(m.report_data) : (m.report_data || {});
                            isPostponed = rd.is_postponed;
                            actionReason = rd.action_reason;
                        } catch(e) {}
                        return (
                            <>
                                {isPostponed && (
                                    <div className="mb-4 bg-orange-50 border border-orange-100 rounded-xl p-3">
                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-1">Postponed</span>
                                        {actionReason && <p className="text-xs font-medium text-orange-700">{actionReason}</p>}
                                    </div>
                                )}
                                <div className="flex items-center gap-2 mb-4">
                                    <button onClick={() => setEditModalData(m)} className="flex-1 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider hover:bg-slate-200 transition-all">Edit/Postpone</button>
                                    <button onClick={() => setCancelModalData(m)} className="flex-1 h-8 rounded-lg bg-red-50 text-red-600 font-bold uppercase text-[10px] tracking-wider hover:bg-red-100 transition-all">Cancel</button>
                                    <button onClick={() => setDeleteModalData(m)} className="flex-1 h-8 rounded-lg bg-slate-800 text-white font-bold uppercase text-[10px] tracking-wider hover:bg-slate-900 transition-all">Delete</button>
                                </div>
                            </>
                        );
                    })()}
                    
                    <div className="pt-4 border-t border-slate-100 mt-auto">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Submit Report</h4>
                      <textarea value={reportData.id === m.id ? reportData.notes : ''} onChange={e => setReportData({
                id: m.id,
                notes: e.target.value
              })} placeholder="Enter meeting summary/report here..." className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 min-h-[100px] mb-3" />
                      <button onClick={handleReportSubmit} disabled={reportData.id !== m.id || !reportData.notes} className="w-full h-10 rounded-xl bg-amber-500 text-white font-black uppercase text-[10px] tracking-widest hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                        <FileText size={14} /> Mark as Completed
                      </button>
                    </div>
                  </div>)}
              </div>}
            
            {/* Pagination Component */}
            {(!loading && scheduledMeetings.length > 0) && (
              <div className="p-4 md:p-6 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
                <Pagination 
                  currentPage={page} 
                  totalPages={Math.ceil(totalRecords / limit) || 1} 
                  totalRecords={totalRecords} 
                  onPageChange={setPage} 
                />
              </div>
            )}
          </div>}

        {activeTab === 'view' && <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
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
                  {completedMeetings.length > 0 ? completedMeetings.map((m, index) => {
                let summary = '';
                try {
                  summary = typeof m.report_data === 'string' ? JSON.parse(m.report_data).summary : m.report_data?.summary || '';
                } catch (e) {
                  summary = m.report_data;
                }
                const isCancelled = m.status === 'Cancelled';
                let reason = '';
                try {
                    const rd = typeof m.report_data === 'string' ? JSON.parse(m.report_data) : (m.report_data || {});
                    reason = rd.action_reason || '';
                } catch(e) {}
                
                return <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/50"><td className="p-6 text-sm font-black text-slate-400 border-b border-slate-50">{index + 1}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 whitespace-nowrap">
                        {new Date(m.meeting_date).toLocaleDateString('en-GB')} <span className="text-slate-400 text-xs ml-1">{m.meeting_time}</span>
                        {isCancelled && <span className="ml-2 px-2 py-0.5 bg-red-50 text-red-600 text-[9px] font-black uppercase rounded tracking-widest">Cancelled</span>}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-700">
                        {m.student_name}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500 max-w-xs">
                        {m.notes || '-'}
                      </td>
                      <td className={`p-4 text-sm font-medium max-w-md ${isCancelled ? 'bg-red-50/30 text-red-700' : 'bg-emerald-50/30 text-slate-700'}`}>
                        {isCancelled ? `Reason: ${reason || '-'}` : (summary || '-')}
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500 whitespace-nowrap">
                        {m.academic_operation_executive_name}
                      </td>
                    </tr>;
              }) : <tr>
                      <td colSpan="5" className="p-4 md:p-8 text-center text-slate-400 font-medium">
                        No completed meetings found
                      </td>
                    </tr>}
                </tbody>
              </table>
            </div>
            
            <div className="md:hidden flex flex-col gap-4 p-4 bg-slate-50/50">
                {completedMeetings.length > 0 ? completedMeetings.map((m) => {
                    let summary = '';
                    try {
                        summary = typeof m.report_data === 'string' ? JSON.parse(m.report_data).summary : m.report_data?.summary || '';
                    } catch (e) {
                        summary = m.report_data;
                    }
                    
                    return (
                        <MobileCard
                            key={m.id}
                            isExpanded={expandedMeetingId === m.id}
                            onToggle={() => setExpandedMeetingId(expandedMeetingId === m.id ? null : m.id)}
                            avatar={
                                <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-slate-600 font-black shadow-inner">
                                    <Presentation size={18} />
                                </div>
                            }
                            title={
                                <span className="flex items-center gap-1 text-slate-900 font-bold">
                                    {m.student_name}
                                </span>
                            }
                            subtitle={
                                <span className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                    <Calendar size={10} /> {new Date(m.meeting_date).toLocaleDateString('en-GB')} at {m.meeting_time}
                                </span>
                            }
                            expandedContent={
                                <div className="flex flex-col gap-3">
                                    {m.notes && (
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Agenda</span>
                                            <p className="text-xs text-slate-700 font-medium break-words bg-slate-50 p-3 rounded-xl border border-slate-100">{m.notes}</p>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest block mb-1 flex items-center gap-1"><FileText size={10} /> Report / Summary</span>
                                        <p className="text-xs text-slate-700 font-medium p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 break-words">{summary || '-'}</p>
                                    </div>
                                    <div className="pt-2 border-t border-slate-100 flex justify-between items-center flex-wrap gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Handled By</span>
                                            <span className="text-xs text-slate-700 font-bold truncate max-w-[150px]">{m.academic_operation_executive_name}</span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${m.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {m.status === 'Cancelled' ? 'Cancelled' : 'Completed'}
                                            </span>
                                        </div>
                                    </div>
                                    {m.status === 'Cancelled' && (
                                        <div className="mt-2 p-2 bg-red-50/50 rounded-xl border border-red-100">
                                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block mb-1">Reason for Cancellation</span>
                                            <p className="text-xs text-red-700 font-medium break-words">
                                                {(() => {
                                                    try {
                                                        const rd = typeof m.report_data === 'string' ? JSON.parse(m.report_data) : (m.report_data || {});
                                                        return rd.action_reason || '-';
                                                    } catch(e) { return '-'; }
                                                })()}
                                            </p>
                                        </div>
                                    )}
                                    {m.meeting_link && (
                                        <div className="pt-2 border-t border-slate-100">
                                            <a href={m.meeting_link} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 p-2 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                                                <Video size={14} /> View Meeting Link
                                            </a>
                                        </div>
                                    )}
                                </div>
                            }
                        />
                    );
                }) : (
                    <div className="px-4 md:px-8 py-6 md:py-12 text-center bg-white rounded-2xl border border-slate-100">
                        <p className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em]">No completed meetings found</p>
                    </div>
                )}
            </div>
            {/* Pagination Component */}
            {(!loading && completedMeetings.length > 0) && (
              <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50">
                <Pagination 
                  currentPage={page} 
                  totalPages={Math.ceil(totalRecords / limit) || 1} 
                  totalRecords={totalRecords} 
                  onPageChange={setPage} 
                />
              </div>
            )}
          </div>}

      </div>

      {/* Edit / Postpone Modal */}
      {editModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden my-auto">
                  <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="text-lg font-black text-slate-900">Edit / Postpone Meeting</h3>
                      <button onClick={() => setEditModalData(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <CheckCircle2 size={24} className="rotate-45" />
                      </button>
                  </div>
                  <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting Date</label>
                              <input type="date" value={editModalData.meeting_date ? new Date(editModalData.meeting_date).toISOString().split('T')[0] : ''} onChange={e => setEditModalData({...editModalData, meeting_date: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting Time</label>
                              <input type="time" value={editModalData.meeting_time || ''} onChange={e => setEditModalData({...editModalData, meeting_time: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" required />
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting Link</label>
                          <input type="text" value={editModalData.meeting_link || ''} onChange={e => setEditModalData({...editModalData, meeting_link: e.target.value})} className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Agenda / Notes</label>
                          <textarea value={editModalData.notes || ''} onChange={e => setEditModalData({...editModalData, notes: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[80px]" />
                      </div>
                      <div className="flex items-center gap-2 mt-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
                          <input type="checkbox" id="is_postponed" checked={editModalData.is_postponed || false} onChange={e => setEditModalData({...editModalData, is_postponed: e.target.checked})} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                          <label htmlFor="is_postponed" className="text-xs font-bold text-orange-700">Mark as Postponed</label>
                      </div>
                      {editModalData.is_postponed && (
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Reason for Postponing <span className="text-red-500">*</span></label>
                              <textarea value={editModalData.reason || ''} onChange={e => setEditModalData({...editModalData, reason: e.target.value})} placeholder="Why is this meeting being postponed?" className="w-full p-3 rounded-xl border border-orange-200 bg-white text-sm font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 min-h-[80px]" required />
                          </div>
                      )}
                      <div className="flex items-center justify-end gap-3 pt-4">
                          <button type="button" onClick={() => setEditModalData(null)} className="px-6 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest">Close</button>
                          <button type="submit" className="px-6 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all uppercase tracking-widest">Save Changes</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Cancel Modal */}
      {cancelModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden">
                  <div className="p-6 border-b border-red-50 bg-red-50/30 flex items-center gap-3 text-red-600">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <CheckCircle2 size={20} className="rotate-45" />
                      </div>
                      <h3 className="text-base font-black">Cancel Meeting</h3>
                  </div>
                  <form onSubmit={handleCancelSubmit} className="p-6 space-y-4">
                      <p className="text-sm font-medium text-slate-600">Are you sure you want to cancel the meeting with <span className="font-bold text-slate-900">{cancelModalData.student_name}</span>?</p>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-red-400 uppercase tracking-widest">Reason for Cancellation <span className="text-red-500">*</span></label>
                          <textarea value={cancelModalData.reason || ''} onChange={e => setCancelModalData({...cancelModalData, reason: e.target.value})} placeholder="Please provide a valid reason..." className="w-full p-3 rounded-xl border border-red-200 bg-red-50/30 text-sm font-medium focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 min-h-[100px]" required />
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                          <button type="button" onClick={() => setCancelModalData(null)} className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all uppercase tracking-widest">Go Back</button>
                          <button type="submit" className="flex-1 py-3 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 transition-all uppercase tracking-widest">Confirm Cancel</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Delete Modal */}
      {deleteModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden p-6 text-center">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} className="rotate-45" />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2">Delete Meeting?</h3>
                  <p className="text-sm font-medium text-slate-500 mb-6">This action cannot be undone. The meeting record will be permanently removed.</p>
                  <div className="flex items-center gap-3">
                      <button onClick={() => setDeleteModalData(null)} className="flex-1 py-3 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all uppercase tracking-widest">Cancel</button>
                      <button onClick={handleDeleteSubmit} className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all uppercase tracking-widest">Delete</button>
                  </div>
              </div>
          </div>
      )}
    </div>;
};
export default ParentMeetings;