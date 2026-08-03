import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { Calendar, User, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import MultiDatePicker from 'react-multi-date-picker';
import Modal from '../../components/Modal';
import api from '../../services/api';

const DatePicker = MultiDatePicker.default ? MultiDatePicker.default : MultiDatePicker;

const getISTDate = () => {
  return new Date().toLocaleString('en-CA', { timeZone: 'Asia/Kolkata' }).split(',')[0];
};

const DailyRotation = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingStudents, setPendingStudents] = useState([]);
  const [completedStudents, setCompletedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [sessionType, setSessionType] = useState('QUICK');
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchRotation = async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate instanceof Date 
        ? selectedDate.toLocaleDateString('en-CA') 
        : selectedDate?.format?.('YYYY-MM-DD') || getISTDate();

      const res = await api.get(`/mentor-interactions/daily-rotation?date=${dateStr}`);

      if (res.data.success) {
        setPendingStudents(res.data.pending || []);
        setCompletedStudents(res.data.completed || []);
      }
    } catch (error) {
      console.error('Error fetching rotation:', error);
      toast.error('Failed to load daily rotation');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRotation();
  }, [selectedDate]);

  const handleOpenModal = (student) => {
    setSelectedStudent(student);
    setSessionType(student.sessionType || 'QUICK');
    setFormData({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    setSubmitting(true);
    try {
      const dateStr = selectedDate instanceof Date 
        ? selectedDate.toLocaleDateString('en-CA') 
        : selectedDate?.format?.('YYYY-MM-DD') || getISTDate();

      const payload = {
        student_id: selectedStudent.id,
        session_type: sessionType,
        interaction_date: dateStr,
        report_data: {
          notes: formData.notes || '',
          action_plan: formData.action_plan || '',
          cancel_reason: formData.cancel_reason || ''
        }
      };

      const formDataObj = new FormData();
      Object.keys(payload).forEach(key => {
        if (key === 'report_data') {
          formDataObj.append('report_data', JSON.stringify(payload[key]));
        } else {
          formDataObj.append(key, payload[key]);
        }
      });

      await api.post('/mentor-interactions/submit-report', formDataObj, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Interaction saved successfully');
      setIsModalOpen(false);
      fetchRotation();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save interaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight uppercase">Daily Rotation</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage today's 15 student rotation</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 p-2 rounded-2xl border border-slate-200 flex items-center gap-2">
            <Calendar size={16} className="text-slate-400 ml-2" />
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
              format="YYYY-MM-DD"
              className="rmdp-mobile"
              inputClass="bg-transparent border-none text-sm font-bold text-slate-700 outline-none w-32 text-center cursor-pointer uppercase tracking-widest"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 p-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'pending' 
              ? 'bg-[#008080] text-white shadow-lg shadow-[#008080]/30 scale-[1.02]' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Clock size={16} /> Today's Interaction ({pendingStudents.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`flex-1 p-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${
            activeTab === 'completed' 
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]' 
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 size={16} /> Completed ({completedStudents.length})
          </div>
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center bg-white rounded-[2rem] border border-slate-100 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-[#008080]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(activeTab === 'pending' ? pendingStudents : completedStudents).map((student) => (
            <div key={student.id} className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition-all hover:-translate-y-1">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 shrink-0 shadow-inner">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-800 text-sm">{student.name}</h3>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{student.enrollment_type}</p>
                    </div>
                  </div>
                  {activeTab === 'completed' && (
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                      Completed
                    </span>
                  )}
                </div>
                
                <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-bold uppercase tracking-widest">Target Session</span>
                    <span className={`font-black uppercase px-2 py-1 rounded-lg text-[9px] ${
                      student.sessionType === 'DEEP' ? 'bg-rose-100 text-rose-700' :
                      student.sessionType === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {student.sessionType}
                    </span>
                  </div>
                </div>
              </div>

              {activeTab === 'pending' && (
                <button
                  onClick={() => handleOpenModal(student)}
                  className="w-full p-4 bg-[#008080] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#006666] transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#008080]/20"
                >
                  Log Interaction <ArrowRight size={14} />
                </button>
              )}
            </div>
          ))}
          
          {(activeTab === 'pending' ? pendingStudents : completedStudents).length === 0 && (
            <div className="col-span-full h-48 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-100 shadow-xl border-dashed">
              <CheckCircle2 size={40} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">No students found for this tab</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Log Interaction: ${selectedStudent?.name}`}>
          <form onSubmit={handleSubmit} className="space-y-6 p-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['QUICK', 'MEDIUM', 'DEEP', 'CANCELLED'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSessionType(type)}
                  className={`p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    sessionType === type 
                      ? (type === 'CANCELLED' ? 'bg-slate-800 text-white' : type === 'DEEP' ? 'bg-rose-600 text-white' : type === 'MEDIUM' ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white')
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {sessionType === 'CANCELLED' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Cancellation Reason</label>
                <textarea
                  required
                  value={formData.cancel_reason || ''}
                  onChange={e => setFormData({...formData, cancel_reason: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#008080]"
                  placeholder="Why was the session cancelled?"
                  rows={3}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Session Notes</label>
                  <textarea
                    required
                    value={formData.notes || ''}
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#008080]"
                    placeholder="Enter discussion notes..."
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Action Plan</label>
                  <textarea
                    required
                    value={formData.action_plan || ''}
                    onChange={e => setFormData({...formData, action_plan: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-[#008080]"
                    placeholder="Next steps or action plan..."
                    rows={3}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full p-4 bg-[#008080] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#006666] disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Interaction'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default DailyRotation;
