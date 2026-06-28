import React, { useState, useEffect, useDeferredValue } from 'react';
import axios from 'axios';
import { RefreshCw, Search, ArrowRight, User, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentShift = () => {
  const [students, setStudents] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);
  
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState('');
  const [shifting, setShifting] = useState(false);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const [studentsRes, mentorsRes] = await Promise.all([
        axios.get('/api/mentor-head/all-students', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/mentor-head/mentors-all', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (studentsRes.data.success) {
        setStudents((studentsRes.data.data || []).sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      }
      if (mentorsRes.data.success) {
        setMentors(mentorsRes.data.data);
      }
    } catch {
      toast.error("Failed to load data. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleShift = async () => {
    if (!selectedStudent || !selectedMentor) {
      toast.error("Please select both a student and a new mentor.");
      return;
    }

    if (selectedStudent.mentor_id === parseInt(selectedMentor)) {
      toast.error("Student is already assigned to this mentor.");
      return;
    }

    setShifting(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.put(`/api/mentor-head/students/${selectedStudent.id}/shift`,
        { newMentorId: selectedMentor },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        toast.success(`Successfully shifted ${selectedStudent.name}`);
        
        // Optimistic local update to prevent jarring re-render
        setStudents(prev => prev.map(s => {
          if (s.id === selectedStudent.id) {
            return { ...s, mentor_id: parseInt(selectedMentor) };
          }
          return s;
        }));

        setSelectedStudent(null);
        setSelectedMentor('');
        setShowConfirmModal(false);
        
        // Background sync
        fetchData(); 
      }
    } catch {
      toast.error("Failed to shift student. Please try again.");
    } finally {
      setShifting(false);
    }
  };

  const confirmReassignment = () => {
    if (!selectedStudent || !selectedMentor) return;
    setShowConfirmModal(true);
  };

  const filteredStudents = students.filter(s => {
    const nameStr = s.name || '';
    const courseStr = s.course || '';
    return nameStr.toLowerCase().includes(deferredSearchTerm.toLowerCase()) ||
           courseStr.toLowerCase().includes(deferredSearchTerm.toLowerCase());
  });

  const getMentorName = (id) => mentors.find(m => m.id === id)?.name || 'None';
  const getMentorObject = (id) => mentors.find(m => m.id === parseInt(id));

  if (loading) return <div className="p-8 text-center text-slate-600 font-bold">Loading system...</div>;

  return (
    <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 relative">
      
      {/* Page Title (Hero Section) */}
      <div className="bg-white p-6 md:p-10 rounded-[1.5rem] md:rounded-[4rem] border border-slate-100 shadow-sm md:mb-10 flex flex-col items-start gap-4 hover:shadow-md transition-all duration-300">
        <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#008080] rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#008080]/30 rotate-3 shrink-0">
            <RefreshCw size={24} className="md:w-[28px] md:h-[28px]" />
          </div>
          Student Reassignment
        </h2>
        <p className="text-slate-500 text-[9px] md:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 md:gap-2">
          <ArrowRight size={14} className="text-emerald-500 shrink-0" />
          Manage student roster distributions and reallocate assignments
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        
        {/* Step 1: Select Student */}
        <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 flex flex-col h-[500px] md:h-[600px]">
          <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
            <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-[#008080] flex items-center justify-center text-white text-[10px] md:text-xs shrink-0">1</span>
            Select Student
          </h3>

          <div className="relative mb-4 md:mb-6 shrink-0">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or course..."
              className="w-full py-3 md:py-4 pl-12 pr-4 bg-slate-50 border border-slate-200 md:border-slate-100 rounded-xl md:rounded-2xl text-[13px] md:text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#008080]/20 transition-all font-semibold min-h-[44px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 md:space-y-3 custom-scrollbar pr-1 md:pr-2.5">
            {filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <div
                  key={student.id}
                  onClick={() => {
                    setSelectedStudent(student);
                    setSelectedMentor('');
                  }}
                  className={`p-3 md:p-4 rounded-xl md:rounded-2xl cursor-pointer border transition-all active:scale-[0.98] ${
                    selectedStudent?.id === student.id 
                      ? 'bg-teal-50 border-teal-200 shadow-md' 
                      : 'bg-white md:bg-slate-50 border-slate-200 md:border-slate-100 hover:bg-slate-100/50 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 md:gap-4 justify-between">
                    <div className="flex items-center gap-3 md:gap-4 min-w-0">
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${selectedStudent?.id === student.id ? 'bg-[#008080] text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <User size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className={`font-bold text-[13px] md:text-sm truncate flex items-center gap-2 ${selectedStudent?.id === student.id ? 'text-[#008080]' : 'text-slate-800'}`}>
                          <span className="truncate">{student.name}</span>
                          {student.onboarding_status === 'pending' && (
                            <span className="px-2 py-0.5 bg-rose-50 rounded-md text-[8px] font-black text-rose-600 shadow-sm border border-rose-100 uppercase tracking-widest shrink-0">
                              New
                            </span>
                          )}
                        </h4>
                        <p className="text-[9px] md:text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-0.5 md:mt-1 truncate">
                          Mentor: {getMentorName(student.mentor_id)}
                        </p>
                      </div>
                    </div>
                    {selectedStudent?.id === student.id && (
                      <CheckCircle2 size={18} className="text-[#008080] shrink-0 ml-2" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4">
                <Search size={32} className="mb-3 opacity-30" />
                <p className="text-[11px] md:text-xs font-bold uppercase tracking-widest">No students found</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Select New Mentor */}
        <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm hover:shadow-md transition-all duration-300 border border-slate-100 flex flex-col h-[500px] md:h-[600px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-slate-50 rounded-full opacity-50 blur-2xl md:blur-3xl -mr-16 -mt-16 md:-mr-32 md:-mt-32"></div>

          <h3 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2 relative z-10">
            <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-[10px] md:text-xs shrink-0">2</span>
            Reassign Mentor
          </h3>

          <div className="flex-1 flex flex-col gap-4 md:gap-6 relative z-10">
            {selectedStudent ? (
              <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm animate-in fade-in zoom-in-95">
                <p className="text-[9px] md:text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1 md:mb-2">Target Student</p>
                <h4 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2 flex-wrap">
                  {selectedStudent.name}
                  {selectedStudent.onboarding_status === 'pending' && (
                    <span className="px-2 py-0.5 bg-rose-50 rounded-md text-[9px] md:text-[10px] font-black text-rose-600 shadow-sm border border-rose-100 uppercase tracking-widest">
                      New
                    </span>
                  )}
                </h4>
                <div className="mt-3 md:mt-4 flex flex-wrap items-center gap-2 md:gap-3">
                  <span className="px-2.5 py-1 md:px-3 md:py-1 bg-white border border-slate-200 text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg truncate max-w-full">{selectedStudent.course}</span>
                  <span className="px-2.5 py-1 md:px-3 md:py-1 bg-white border border-slate-200 text-slate-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-lg truncate max-w-full">{selectedStudent.grade}</span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-2xl md:rounded-3xl border border-dashed border-slate-300 text-center flex-1 flex flex-col items-center justify-center">
                <User size={32} className="text-slate-300 mb-3" />
                <p className="text-slate-500 font-bold text-[11px] md:text-xs">Select a student first to unlock reassignment.</p>
              </div>
            )}

            <div className={`transition-all duration-300 flex-1 ${!selectedStudent ? 'opacity-40 pointer-events-none' : ''}`}>
              <label className="text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 block ml-1 md:ml-2">Select New Mentor</label>
              <select
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
                className="w-full py-3 md:py-4 px-4 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-[13px] md:text-sm font-bold text-slate-700 outline-none focus:ring-4 ring-[#008080]/20 shadow-sm min-h-[44px] appearance-none"
              >
                <option value="" disabled>-- Choose a Mentor --</option>
                {mentors.map(m => {
                  const isCurrent = m.id === selectedStudent?.mentor_id;
                  return (
                    <option key={m.id} value={m.id} disabled={isCurrent}>
                      {m.name} {isCurrent ? '(Current)' : `- ${m.studentCount || 0} Students`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mt-auto shrink-0">
              <button
                onClick={confirmReassignment}
                disabled={!selectedStudent || !selectedMentor || shifting}
                className="w-full min-h-[44px] md:min-h-[56px] flex items-center justify-center gap-2 md:gap-3 bg-[#008080] hover:bg-teal-700 text-white p-3 md:p-5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all disabled:opacity-50 disabled:hover:translate-y-0 md:hover:-translate-y-1 active:scale-95 shadow-lg shadow-[#008080]/30"
              >
                {shifting ? 'Shifting Data...' : 'Confirm Reassignment'}
                <ArrowRight size={16} />
              </button>
              <p className="text-center text-[9px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3 md:mt-4">
                Note: Past interaction logs will be preserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md p-6 md:p-8 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                <AlertTriangle size={24} />
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <h3 className="text-lg md:text-xl font-black text-slate-900 mb-2 leading-tight">Confirm Reassignment</h3>
            <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
              Are you sure you want to reassign <span className="font-bold text-slate-900">{selectedStudent?.name}</span>? 
              Past interaction logs will be preserved under their profile.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between mb-6">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">From Mentor</span>
                <span className="text-xs font-bold text-slate-700 truncate">{getMentorName(selectedStudent?.mentor_id)}</span>
              </div>
              <ArrowRight size={16} className="text-slate-300 shrink-0" />
              <div className="flex flex-col text-right min-w-0 pl-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#008080] mb-1">To Mentor</span>
                <span className="text-xs font-bold text-[#008080] truncate">{getMentorObject(selectedMentor)?.name}</span>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 min-h-[44px] px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl transition-colors active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleShift}
                disabled={shifting}
                className="flex-1 min-h-[44px] px-4 py-3 bg-[#008080] hover:bg-teal-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md shadow-[#008080]/20 active:scale-95 flex items-center justify-center"
              >
                {shifting ? <RefreshCw size={16} className="animate-spin" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentShift;
