import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { User, Users, ChevronRight, Search, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import StudentListFilterDropdown, { sortStudentsByOption } from '../../components/StudentListFilterDropdown';

const StudentRow = ({ student, navigate }) => {
  const isPending = student.onboarding_status === 'pending';
  const [isExpanded, setIsExpanded] = useState(false);

  const alertClass = student.payment_alert_level === 'Critical' ? 'payment-alert-critical' : student.payment_alert_level === 'Warning' ? 'payment-alert-warning' : '';

  return (
    <div
      onClick={() => navigate(`/ssc/students/${student.id}`)}
      className={`group relative bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 flex flex-col gap-6 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 cursor-pointer ${isPending ? 'border-amber-100 bg-amber-50/10' : ''} ${alertClass}`}
      title={student.payment_alert_level && student.payment_alert_level !== 'None' ? `Payment Alert: ${student.consumed_hours} consumed / ${student.paid_hours} paid hours` : ''}
    >
      <div className="flex flex-col lg:flex-row items-center gap-8 w-full">
        {/* Student Profile Info */}
        <div className="flex items-center gap-5 flex-1 min-w-0 w-full">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500 ${isPending ? 'bg-amber-100 border-amber-200 text-amber-600' : 'bg-slate-50 border-slate-100 text-[#008080] group-hover:bg-[#008080] group-hover:text-white group-hover:border-[#008080]'}`}>
            <User size={28} strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xl font-black text-slate-900 truncate leading-none uppercase tracking-tighter">{student.name}</h3>
              {isPending && (
                <span className="px-3 py-1 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Onboarding Phase</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: MM-{student.id.toString().padStart(4, '0')}</span>
              <span className="w-1 h-1 rounded-full bg-slate-200"></span>
              <span className="text-[10px] font-bold text-[#008080] uppercase tracking-widest font-black">{student.course || 'Technical Course'}</span>
            </div>
          </div>
        </div>

        {/* Support Team Area */}
        <div className="flex flex-col md:flex-row items-center gap-8 px-8 py-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100/50 w-full lg:w-auto min-w-[400px]">
          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Academic Mentor</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#008080]"></div>
              <p className="text-[11px] font-black text-slate-800 uppercase truncate">{student.mentor_name || 'Not Assigned'}</p>
            </div>
          </div>
          
          <div className="hidden md:block w-[1px] h-10 bg-slate-200"></div>

          <div className="flex-1 min-w-0">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Faculty Experts</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
              {student.faculty_names ? (
                <button 
                  type="button" 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setIsExpanded(!isExpanded);
                  }}
                  className="text-[11px] font-black text-[#008080] hover:text-[#006666] underline uppercase tracking-widest cursor-pointer text-left block"
                >
                  View Faculties ({student.faculty_names.split(',').length})
                </button>
              ) : (
                <p className="text-[11px] font-black text-slate-800 uppercase truncate max-w-[150px]">
                  None Assigned
                </p>
              )}
            </div>
          </div>

          <div className="hidden md:block w-[1px] h-10 bg-slate-200"></div>

          <div className="flex-1 min-w-0" title={`Consumed: ${student.consumed_hours || 0} | Paid: ${student.paid_hours || 0}`}>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Class Hours</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${student.payment_alert_level === 'Critical' ? 'bg-rose-500 animate-pulse' : student.payment_alert_level === 'Warning' ? 'bg-amber-500' : 'bg-slate-300'} shrink-0`}></div>
              <p className={`text-[11px] font-black uppercase truncate ${student.payment_alert_level === 'Critical' ? 'text-rose-600' : student.payment_alert_level === 'Warning' ? 'text-amber-600' : 'text-slate-700'}`}>
                {student.consumed_hours || 0} / {student.paid_hours || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Arrow */}
        <div className="hidden lg:flex items-center justify-center w-12 h-12 bg-white rounded-2xl border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all shrink-0">
          <ChevronRight size={20} />
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

const SSCStudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'new'
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/mentor/students');
      setStudents(res.data.data);
    } catch (error) {
      toast.error("Database connection failed");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    const filtered = students.filter(s => {
      const isPending = s.onboarding_status === 'pending';
      if (viewMode === 'new' && !isPending) return false;
      return s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (s.course || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
    return sortStudentsByOption(filtered, sortBy);
  }, [students, viewMode, searchTerm, sortBy]);

  return (
    <div className="space-y-12 pb-20">
      {/* Page Header */}
      <div className="bg-white/70 backdrop-blur-xl p-12 rounded-[40px] border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="text-center md:text-left">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-3 ">Student Success Tracker</h2>
          <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center md:justify-start gap-3 mt-1">
            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
            Coordinating Global Academic Support Teams
          </p>
        </div>
        <div className="w-20 h-20 bg-indigo-600 rounded-[28px] shadow-2xl shadow-indigo-600/30 flex items-center justify-center text-white">
          <Users size={36} strokeWidth={2.5} />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search student or course..."
            className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StudentListFilterDropdown value={sortBy} onChange={setSortBy} />
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <button
              onClick={() => setViewMode('active')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              All Students ({students.length})
            </button>
            <button
              onClick={() => setViewMode('new')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'new' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Onboarding ({students.filter(s => s.onboarding_status === 'pending').length})
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-32 space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aggregating Student Data...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => (
            <StudentRow key={student.id} student={student} navigate={navigate} />
          ))}
          
          {filteredStudents.length === 0 && (
            <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle size={40} className="text-slate-200" />
              </div>
              <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No student profiles detected</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SSCStudentList;
