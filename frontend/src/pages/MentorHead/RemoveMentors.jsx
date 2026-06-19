import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Users, UserMinus, Search, ChevronRight } from 'lucide-react';
import StudentListFilterDropdown, { sortStudentsByOption } from '../../components/StudentListFilterDropdown';

const RemoveMentors = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' or 'removed'
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/mentor-head/students');
      let data = res.data.data || [];
      // If we are in Mentor Head, we only care about students that have mentors or had mentors.
      // But let's show all students as requested.
      setStudents(data);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMentor = async (studentId) => {
    if (!window.confirm("Are you sure you want to remove the mentor for this student?")) return;
    
    setActionLoading(studentId);
    try {
      await api.put(`/mentor-head/students/${studentId}/remove-mentor`);
      toast.success("Mentor removed successfully");
      fetchStudents(); // Refresh to get updated previous_mentor_name
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove mentor");
    } finally {
      setActionLoading(null);
    }
  };

  const filteredStudents = useMemo(() => {
    let filtered = students;
    
    if (filterMode === 'removed') {
      filtered = filtered.filter(s => !s.mentor_id && s.previous_mentor_name);
    } else if (filterMode === 'completed') {
      filtered = filtered.filter(s => s.course_status === 'completed');
    } else if (filterMode === 'active') {
      filtered = filtered.filter(s => s.course_status !== 'completed' && s.connected_today);
    }

    if (searchTerm) {
      filtered = filtered.filter(s => 
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.mentor_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.previous_mentor_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return sortStudentsByOption(filtered, sortBy);
  }, [students, searchTerm, sortBy, filterMode]);

  const removedCount = students.filter(s => !s.mentor_id && s.previous_mentor_name).length;
  const courseCompletedCount = students.filter(s => s.course_status === 'completed').length;
  const activeCount = students.filter(s => s.course_status !== 'completed' && s.connected_today).length;
  const totalEnrollment = students.length;

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl p-10 md:p-14 rounded-[40px] md:rounded-[48px] border border-white/60 shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="text-center md:text-left">
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">Mentor Removal</h2>
          <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center md:justify-start gap-3 mt-3">
            <div className="w-2 h-2 rounded-full bg-[#008080] animate-pulse"></div>
            Manage Mentor Assignments
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setFilterMode('all')}
          className={`p-6 rounded-[32px] border transition-all cursor-pointer ${filterMode === 'all' ? 'bg-[#008080] text-white shadow-xl shadow-[#008080]/20 border-[#008080]' : 'bg-white border-slate-100 hover:border-[#008080]/30'}`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${filterMode === 'all' ? 'bg-white/20' : 'bg-slate-50 text-[#008080]'}`}>
              <Users size={24} />
            </div>
            <p className={`text-sm font-black uppercase tracking-widest ${filterMode === 'all' ? 'text-white/80' : 'text-slate-500'}`}>Total Enrollment</p>
          </div>
          <p className="text-4xl font-black tracking-tighter">{totalEnrollment}</p>
        </div>

        <div 
          onClick={() => setFilterMode('active')}
          className={`p-6 rounded-[32px] border transition-all cursor-pointer ${filterMode === 'active' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200 border-emerald-500' : 'bg-white border-slate-100 hover:border-emerald-200'}`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${filterMode === 'active' ? 'bg-white/20' : 'bg-emerald-50 text-emerald-500'}`}>
              <UserMinus size={24} />
            </div>
            <p className={`text-sm font-black uppercase tracking-widest ${filterMode === 'active' ? 'text-white/80' : 'text-slate-500'}`}>Active</p>
          </div>
          <p className="text-4xl font-black tracking-tighter">{activeCount}</p>
        </div>

        <div 
          onClick={() => setFilterMode('completed')}
          className={`p-6 rounded-[32px] border transition-all cursor-pointer ${filterMode === 'completed' ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-200 border-indigo-500' : 'bg-white border-slate-100 hover:border-indigo-200'}`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${filterMode === 'completed' ? 'bg-white/20' : 'bg-indigo-50 text-indigo-500'}`}>
              <Users size={24} />
            </div>
            <p className={`text-sm font-black uppercase tracking-widest ${filterMode === 'completed' ? 'text-white/80' : 'text-slate-500'}`}>Course Completed</p>
          </div>
          <p className="text-4xl font-black tracking-tighter">{courseCompletedCount}</p>
        </div>

        <div 
          onClick={() => setFilterMode('removed')}
          className={`p-6 rounded-[32px] border transition-all cursor-pointer ${filterMode === 'removed' ? 'bg-rose-500 text-white shadow-xl shadow-rose-200 border-rose-500' : 'bg-white border-slate-100 hover:border-rose-200'}`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${filterMode === 'removed' ? 'bg-white/20' : 'bg-rose-50 text-rose-500'}`}>
              <UserMinus size={24} />
            </div>
            <p className={`text-sm font-black uppercase tracking-widest ${filterMode === 'removed' ? 'text-white/80' : 'text-slate-500'}`}>Removed Mentors</p>
          </div>
          <p className="text-4xl font-black tracking-tighter">{removedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            placeholder="Search student or mentor..."
            className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StudentListFilterDropdown value={sortBy} onChange={setSortBy} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-20 animate-pulse text-slate-400 font-bold uppercase tracking-widest">Scanning Database...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">#</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Mentor</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Removed Mentor</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-all group">
                      <td className="px-8 py-6 text-slate-400 font-black">{idx + 1}</td>
                      <td className="px-8 py-6">
                        <p className="font-black text-slate-900 leading-none">{student.name}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ID: MM-{student.id.toString().padStart(4, '0')}</p>
                      </td>
                      <td className="px-8 py-6">
                        {student.mentor_id ? (
                          <span className="bg-[#008080]/10 text-[#008080] px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest inline-block">
                            {student.mentor_name}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold text-xs uppercase tracking-widest">No Mentor</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        {student.previous_mentor_name ? (
                          <span className="bg-rose-50 text-rose-500 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest inline-block">
                            {student.previous_mentor_name}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold text-xs uppercase tracking-widest">None</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        {student.mentor_id && (
                          <button
                            onClick={() => handleRemoveMentor(student.id)}
                            disabled={actionLoading === student.id}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-md shadow-rose-200 disabled:opacity-50"
                          >
                            {actionLoading === student.id ? 'Removing...' : 'Remove Mentor'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-8 py-20 text-center">
                      <p className="text-slate-400 font-bold uppercase tracking-widest">No students found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RemoveMentors;
