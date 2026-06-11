import React, {  useState, useEffect, useMemo , useDeferredValue } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { User, Users, ChevronRight, Search, CheckCircle2, Calendar, Clock, Plus, Trash2, XCircle, Activity, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentListFilterDropdown, { sortStudentsByOption } from '../../components/StudentListFilterDropdown';

const StudentRow = ({ student, navigate, handleToggleConnection, handleCompleteOnboarding, handleLogHoursClick }) => {
  const isPending = student.onboarding_status === 'pending';
  const isNew = student.onboarding_status === 'completed' && (!student.session_count || student.session_count < 5);
  const [isExpanded, setIsExpanded] = useState(false);

  const alertClass = student.payment_alert_level === 'Critical' ? 'payment-alert-critical' : student.payment_alert_level === 'Warning' ? 'payment-alert-warning' : '';

  return (
    <div
      onClick={() => navigate(`/mentor/students/${student.id}`)}
      className={`group relative bg-white border border-slate-100 rounded-[2rem] p-5 flex flex-col gap-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer ${alertClass}`}
      title={student.payment_alert_level && student.payment_alert_level !== 'None' ? `Payment Alert: ${student.consumed_hours} consumed / ${student.paid_hours} paid hours` : ''}
    >
      <div className="flex flex-col lg:flex-row items-center gap-6 w-full">
        {/* Student Profile Info */}
        <div className="flex items-center gap-5 flex-1 min-w-0 w-full">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${isPending ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-100 text-[#008080] group-hover:bg-[#008080] group-hover:text-white group-hover:border-[#008080]'}`}>
            <User size={28} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-black text-slate-900 truncate leading-none">{student.name}</h3>
              {isNew && (
                <span className="px-3 py-1 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-200 animate-pulse">New Member</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: MM-{student.id.toString().padStart(4, '0')}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.course || 'Technical Course'}</span>
            </div>
          </div>
        </div>

        {/* Stats Area */}
        <div className="flex flex-wrap items-center justify-between gap-4 md:gap-8 px-4 md:px-8 py-4 bg-slate-50/50 rounded-2xl border border-slate-100/50 w-full lg:w-auto">
          <div className="text-center" title={`Consumed: ${student.consumed_hours || 0} | Paid: ${student.paid_hours || 0}`}>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Class Hrs</p>
            <p className={`text-sm font-black leading-none ${student.payment_alert_level === 'Critical' ? 'text-rose-600' : student.payment_alert_level === 'Warning' ? 'text-amber-600' : 'text-slate-700'}`}>{student.consumed_hours || 0} / {student.paid_hours || 0}</p>
          </div>
          <div className="w-[1px] h-8 bg-slate-200"></div>
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
            <p className={`text-xs font-black leading-none ${student.connected_today ? 'text-emerald-500' : 'text-slate-400'}`}>
              {student.connected_today ? 'Connected' : 'Offline'}
            </p>
          </div>
          <div className="w-[1px] h-8 bg-slate-200"></div>
          <div className="text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Faculties</p>
            {student.faculty_names ? (
              <button 
                type="button" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setIsExpanded(!isExpanded);
                }}
                className="text-[11px] font-black text-[#008080] hover:text-[#006666] underline uppercase tracking-widest cursor-pointer block"
              >
                View ({student.faculty_names.split(',').length})
              </button>
            ) : (
              <p className="text-[11px] font-black text-slate-400 uppercase leading-none mt-1">N/A</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 w-full lg:w-auto shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate('/mentor/interaction-logs', { state: { studentId: student.id } })}
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-[#008080] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:shadow-2xl transition-all active:scale-95"
            title="Interaction Log"
          >
            <MessageSquare size={16} /> Chat
          </button>
        </div>
      </div>

      {/* Sub Row for Faculties */}
      {isExpanded && student.faculty_names && (
        <div onClick={(e) => e.stopPropagation()} className="w-full mt-2 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300 cursor-default">
          <div className="flex items-center justify-between pb-4 mb-4 pl-2 border-b border-slate-50">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-tight">
              <span className="w-2 h-2 rounded-full bg-[#008080]"></span> Assigned Faculties: {student.name.toUpperCase()}
            </h4>
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
            >
              <span className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600">Close</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {student.faculty_names.split(',').map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm hover:bg-white hover:border-[#008080]/30 transition-all group">
                <div className="w-8 h-8 bg-[#008080]/10 text-[#008080] rounded-xl flex items-center justify-center font-black text-xs uppercase shrink-0 group-hover:bg-[#008080] group-hover:text-white transition-all">
                  {f.trim().charAt(0)}
                </div>
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">{f.trim()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MyStudents = () => {
 const [students, setStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
	const deferredSearchTerm = useDeferredValue(searchTerm);
 const [sortBy, setSortBy] = useState('');
 const [viewMode, setViewMode] = useState('active'); // 'active' or 'new'
 const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
 const [isHoursModalOpen, setIsHoursModalOpen] = useState(false);
 const [hoursFormData, setHoursFormData] = useState({ date: new Date().toISOString().split('T')[0], hours: '' });
 const [selectedStudent, setSelectedStudent] = useState(null);
 const [batchSessions, setBatchSessions] = useState([
 { date: '', start_time: '10:00', end_time: '11:00', chapter: '', session_type: 'Regular Class' }
 ]);
 const navigate = useNavigate();

 useEffect(() => {
 fetchStudents();
 }, []);

 const fetchStudents = async () => {
 try {
 const res = await api.get('/mentor/students');
 setStudents((res.data.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
 } catch (error) {
 toast.error("Failed to load students");
 } finally {
 setLoading(false);
 }
 };

 const handleToggleConnection = async (studentId, currentStatus, e) => {
 e.stopPropagation(); // prevent navigation
 try {
 await api.put(`/mentor/students/${studentId}/connection`, {
 connected_today: !currentStatus
 });
 // update UI locally
 setStudents(prev => prev.map(s => s.id === studentId ? { ...s, connected_today: !currentStatus ? 1 : 0 } : s));
 toast.success(!currentStatus ? 'Marked as connected today!' : 'Connection marked as incomplete.');
 } catch (error) {
 toast.error("Failed to update connection status");
 }
 };

 const handleCompleteOnboarding = (student, e) => {
 e.stopPropagation();
 setSelectedStudent(student);
 setBatchSessions([{ date: '', start_time: '10:00', end_time: '11:00', chapter: '', session_type: 'Regular Class' }]);
 setIsTimetableModalOpen(true);
 };

 const handleLogHoursClick = (student, e) => {
 e.stopPropagation();
 setSelectedStudent(student);
 setHoursFormData({ date: new Date().toISOString().split('T')[0], hours: '' });
 setIsHoursModalOpen(true);
 };

 const handleHoursSubmit = async (e) => {
 e.preventDefault();
 try {
 await api.post('/mentor/daily-hours', {
 student_id: selectedStudent.id,
 hours: hoursFormData.hours,
 date: hoursFormData.date
 });
 toast.success('Daily hours logged successfully');
 setIsHoursModalOpen(false);
 } catch (error) {
 toast.error(error.response?.data?.message || 'Failed to log hours');
 }
 };

 const addBatchRow = () => {
 setBatchSessions([...batchSessions, { date: '', start_time: '10:00', end_time: '11:00', chapter: '', session_type: 'Regular Class' }]);
 };

 const removeBatchRow = (index) => {
 if (batchSessions.length === 1) return;
 setBatchSessions(batchSessions.filter((_, i) => i !== index));
 };

 const updateBatchRow = (index, field, value) => {
 const updated = [...batchSessions];
 updated[index][field] = value;
 setBatchSessions(updated);
 };

 const handleBatchSubmit = async (e) => {
 e.preventDefault();
 try {
 await api.post('/mentor/timetable/batch', {
 student_id: selectedStudent.id,
 sessions: batchSessions
 });
 setStudents(prev => prev.map(s => s.id === selectedStudent.id ? { ...s, onboarding_status: 'completed' } : s));
 setIsTimetableModalOpen(false);
 toast.success("Timetable created and student activated!");
 setViewMode('active');
 } catch (error) {
 toast.error(error.response?.data?.message || "Batch update failed");
 }
 };

  const filteredStudents = useMemo(() => {
    const filtered = students.filter(s => {
      const isNew = s.onboarding_status === 'pending';
      if (viewMode === 'new' && !isNew) return false;
      // In 'active' view, show all students
      const nameStr = s.name || '';
      const subjStr = s.subject || '';
      return nameStr.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
      subjStr.toLowerCase().includes(deferredSearchTerm.toLowerCase());
    });
    
    // Auto-Rotation: Completed interactions move to the bottom
    const rotated = [...filtered].sort((a, b) => {
      if (a.connected_today === b.connected_today) return 0;
      return a.connected_today ? 1 : -1;
    });

    return sortStudentsByOption(rotated, sortBy);
  }, [students, viewMode, searchTerm, sortBy]);

 return (
 <div className="space-y-12 pb-20">
 {/* Page Header */}
 <div className="bg-white/70 backdrop-blur-xl p-12 rounded-[40px] border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-center gap-10">
 <div className="text-center md:text-left">
 <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-3 ">Student Fleet</h2>
 <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center md:justify-start gap-3 mt-1">
 <div className="w-2 h-2 rounded-full bg-[#008080] animate-pulse"></div>
 Direct assignments
 </p>
 </div>
 <div className="w-20 h-20 bg-[#008080] rounded-[28px] shadow-2xl shadow-[#008080]/30 flex items-center justify-center text-white">
 <Users size={36} strokeWidth={2.5} />
 </div>
 </div>

 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
 <div className="relative w-full md:w-96">
 <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
 <input
 type="text"
 placeholder="Search student or subject..."
 className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all font-semibold"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 <div className="flex flex-wrap items-center gap-2">
 <StudentListFilterDropdown value={sortBy} onChange={setSortBy} />
 </div>
 </div>

 {loading ? (
 <div className="text-center p-20 text-slate-600 font-bold animate-pulse">Scanning Student Database...</div>
 ) : (
  <div className="space-y-4">
    {/* Unified List View */}
    {filteredStudents.map((student) => (
  <StudentRow 
    key={student.id} 
    student={student} 
    navigate={navigate} 
    handleToggleConnection={handleToggleConnection} 
    handleCompleteOnboarding={handleCompleteOnboarding} 
    handleLogHoursClick={handleLogHoursClick} 
  />
  ))}
  </div>
 )}

 {filteredStudents.length === 0 && (
 <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-dashed border-slate-200">
 <p className="text-slate-600 font-bold">No students matched your search criteria.</p>
 </div>
  )}

 {/* Batch Timetable Modal */}
 {isTimetableModalOpen && (
 <div className="fixed inset-0 bg-[#008080]/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
 <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
 <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white">
 <div>
 <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight ">Onboarding Workflow</h2>
 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mt-1">Setup Timetable for {selectedStudent?.name}</p>
 </div>
 <button onClick={() => setIsTimetableModalOpen(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 hover:text-rose-500 transition-all">
 <XCircle size={24} />
 </button>
 </div>

 <form onSubmit={handleBatchSubmit} className="flex-1 overflow-y-auto p-10">
 <div className="space-y-4">
 {batchSessions.map((session, index) => (
 <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 relative group">
 <div className="space-y-1">
 <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Date</label>
 <input
 type="date"
 required
 className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
 value={session.date}
 onChange={(e) => updateBatchRow(index, 'date', e.target.value)}
 />
 </div>
 <div className="space-y-1">
 <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Start Time</label>
 <input
 type="time"
 required
 className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
 value={session.start_time}
 onChange={(e) => updateBatchRow(index, 'start_time', e.target.value)}
 />
 </div>
 <div className="space-y-1">
 <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">End Time</label>
 <input
 type="time"
 required
 className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
 value={session.end_time}
 onChange={(e) => updateBatchRow(index, 'end_time', e.target.value)}
 />
 </div>
 <div className="space-y-1">
 <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Chapter/Topic</label>
 <input
 type="text"
 placeholder="e.g. Calculus Intro"
 className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
 value={session.chapter}
 onChange={(e) => updateBatchRow(index, 'chapter', e.target.value)}
 />
 </div>
 <div className="flex items-end gap-2">
 <div className="flex-1 space-y-1">
 <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest pl-1">Type</label>
 <select
 className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
 value={session.session_type}
 onChange={(e) => updateBatchRow(index, 'session_type', e.target.value)}
 >
 <option>Regular Class</option>
 <option>Revision</option>
 <option>Test</option>
 </select>
 </div>
 <button
 type="button"
 onClick={() => removeBatchRow(index)}
 className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </div>
 ))}

 <button
 type="button"
 onClick={addBatchRow}
 className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-600 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 hover:border-[#008080] hover:text-[#008080] transition-all flex items-center justify-center gap-2"
 >
 <Plus size={16} /> Add Session To Schedule
 </button>
 </div>
 </form>

 <div className="px-10 py-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
 <button
 type="submit"
 onClick={handleBatchSubmit}
 className="flex-1 bg-[#008080] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-[#008080] transition-all flex items-center justify-center gap-3 "
 >
 <CheckCircle2 size={18} /> Initialize Activation
 </button>
 <button onClick={() => setIsTimetableModalOpen(false)} className="px-8 bg-white border border-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition-all">
 Abort
 </button>
 </div>
 </div>
 </div>
 )}
 {/* Log Hours Modal */}
 {isHoursModalOpen && selectedStudent && (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
 <div className="absolute inset-0 bg-[#008080]/60 backdrop-blur-sm max-h-[90vh] overflow-y-auto" onClick={() => setIsHoursModalOpen(false)}></div>
 <div className="bg-white rounded-[3rem] w-full max-w-md shadow-2xl overflow-hidden relative z-10 animate-in zoom-in duration-300">
 <div className="px-10 py-8 bg-[#008080] text-white relative">
 <div className="absolute top-0 right-0 p-6 opacity-20">
 <Clock size={48} />
 </div>
 <h3 className="text-2xl font-black tracking-tighter uppercase relative z-10">Log Working Hours</h3>
 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1 relative z-10">Record time spent for {selectedStudent.name}</p>
 </div>
 <form onSubmit={handleHoursSubmit} className="p-10 space-y-6">
 <div>
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2 mb-2 block">Date</label>
 <input
 type="date"
 required
 className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-[#008080]"
 value={hoursFormData.date}
 onChange={(e) => setHoursFormData({ ...hoursFormData, date: e.target.value })}
 />
 </div>
 <div>
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2 mb-2 block">Total Hours</label>
 <input
 type="number"
 step="0.5"
 min="0.5"
 required
 placeholder="e.g. 2.5"
 className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-[#008080]"
 value={hoursFormData.hours}
 onChange={(e) => setHoursFormData({ ...hoursFormData, hours: e.target.value })}
 />
 </div>
 <div className="flex gap-4 pt-4 border-t border-slate-50">
 <button
 type="submit"
 className="flex-[2] bg-[#008080] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#008080]/30 hover:bg-[#008080] transition-all"
 >
 Log Hours
 </button>
 <button
 type="button"
 onClick={() => setIsHoursModalOpen(false)}
 className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
 >
 Cancel
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
};

export default MyStudents;
