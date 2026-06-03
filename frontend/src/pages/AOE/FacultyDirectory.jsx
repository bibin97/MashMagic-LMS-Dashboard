import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  Users, User, Mail, Phone, Calendar, Search,
  Filter, Activity, Edit2, Trash2, X, Save, BookOpen, MapPin, ShieldCheck, Eye, GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { premiumConfirm } from '../../utils/premiumConfirm';

const FacultyDirectory = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const navigate = useNavigate();

  const LANG_OPTIONS = [
    { id: 'ENG', label: 'ENG(100%)' },
    { id: 'BL-AD', label: 'BILINGUAL ADVANCE' },
    { id: 'BL-SM', label: 'BILINGUAL SIMPLE' },
    { id: 'MLM', label: 'MAL' },
    { id: 'HIN', label: 'HINDI' },
    { id: 'TML', label: 'TML' }
  ];

  const SUBJECT_OPTIONS = [
    "Mathematics", "Science", "Social Science", "English", "Malayalam", 
    "Hindi", "Physics", "Chemistry", "Biology", "Accountancy", 
    "Business Studies", "Economics", "Computer Science", "Arabic", "French", "IT", "EVS"
  ];

  useEffect(() => {
    fetchFaculties();
  }, [sortBy]);

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/aoe/faculties?sortBy=${sortBy}`);
      if (res.data.success) {
        setFaculties(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to fetch faculty directory");
    } finally {
      setLoading(false);
    }
  };

  const handleEditFaculty = (faculty) => {
    navigate(`/aoe/edit-faculty/${faculty.id}`);
  };

  const handleDeleteFaculty = async (facultyParam) => {
    const id = typeof facultyParam === 'object' ? facultyParam.id : facultyParam;
    const name = typeof facultyParam === 'object' ? facultyParam.name : 'this faculty';
    
    const confirm = await premiumConfirm({
      title: "Terminate Faculty Access?",
      message: `You are about to permanently delete ${name}'s profile and all associated academic records. This action cannot be undone.`,
      confirmText: "Permanently Delete",
      type: "danger"
    });

    if (confirm) {
      try {
        const res = await api.delete(`/aoe/faculties/${id}`);
        if (res.data.success) {
          toast.success("Faculty access revoked successfully");
          fetchFaculties();
        }
      } catch (error) {
        toast.error("Operation failed");
      }
    }
  };

  const filteredFaculties = faculties.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
              Faculty Directory
              <div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] tracking-widest font-black">
                {faculties.length} TOTAL
              </div>
            </h1>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Manage academic staff credentials and subject mappings</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group min-w-[300px]">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#008080] transition-colors" />
              <input 
                type="text" 
                placeholder="Search by name, email or subject..." 
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-[#008080]/10 focus:border-[#008080] transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#008080] shadow-sm cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="name">Sort: Alphabetical</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Users size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Staff</p>
              <h3 className="text-2xl font-black text-slate-900">{faculties.filter(f => f.status === 'active').length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-[#008080]/10 text-[#008080] rounded-2xl flex items-center justify-center">
              <GraduationCap size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Expertise</p>
              <h3 className="text-2xl font-black text-slate-900">{SUBJECT_OPTIONS.length}+</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <Activity size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Onboarding Pipeline</p>
              <h3 className="text-2xl font-black text-slate-900">{faculties.filter(f => f.status === 'pending').length}</h3>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
          {loading ? (
            <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
              <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-black text-xs uppercase tracking-widest">Retrieving Staff Data...</p>
            </div>
          ) : filteredFaculties.length === 0 ? (
            <div className="p-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-black text-slate-900">No Faculty Found</h3>
              <p className="text-slate-500 font-bold max-w-xs mx-auto text-sm">We couldn't find any staff matching your search criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Faculty Profile</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Subject Focus</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Joined Date</th>
                    <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredFaculties.map((faculty) => (
                    <tr key={faculty.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-[#008080] text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-[#008080]/20 group-hover:scale-110 transition-transform">
                            {faculty.name.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{faculty.name}</h4>
                            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] mt-1">
                              <Mail size={12} /> {faculty.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-2">
                          {faculty.subject ? faculty.subject.split(',').map((sub, idx) => (
                            <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-200">
                              {sub}
                            </span>
                          )) : (
                            <span className="text-slate-300 font-bold text-[10px] uppercase">Unassigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          faculty.status === 'active' 
                            ? 'bg-emerald-100 text-emerald-600' 
                            : 'bg-amber-100 text-amber-600'
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${faculty.status === 'active' ? 'bg-emerald-600' : 'bg-amber-600 animate-pulse'}`} />
                          {faculty.status}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-widest">
                          {new Date(faculty.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => {
                              setSelectedFaculty(faculty);
                              setIsDetailModalOpen(true);
                            }}
                            className="w-10 h-10 bg-white text-[#008080] rounded-xl flex items-center justify-center hover:bg-[#008080] hover:text-white transition-all shadow-sm border border-slate-100"
                            title="Quick View"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => handleEditFaculty(faculty)}
                            className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-slate-100"
                            title="Edit Faculty"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFaculty(faculty)}
                            className="w-10 h-10 bg-white text-rose-600 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all shadow-sm border border-slate-100"
                            title="Delete Faculty"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Faculty Detail Modal */}
      {isDetailModalOpen && selectedFaculty && (
        <div className="fixed inset-0 bg-[#008080]/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#008080] text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                  {selectedFaculty.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">Faculty Identity</h2>
                  <p className="text-[10px] font-black text-[#008080] uppercase tracking-widest">Live Credential Audit</p>
                </div>
              </div>
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-slate-400 hover:text-slate-900 shadow-sm border border-slate-100 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</span>
                    <p className="text-sm font-black text-slate-900 uppercase">{selectedFaculty.name}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Email</span>
                    <p className="text-sm font-bold text-slate-700">{selectedFaculty.email}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</span>
                    <p className="text-sm font-bold text-slate-700">{selectedFaculty.phone_number || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Location</span>
                    <p className="text-sm font-bold text-slate-700">{selectedFaculty.place || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Faculty ID</span>
                    <p className="text-sm font-bold text-slate-700">{selectedFaculty.faculty_id_card || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Qualification</span>
                    <p className="text-sm font-bold text-slate-700">{selectedFaculty.qualification || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Experience</span>
                    <p className="text-sm font-bold text-slate-700">{selectedFaculty.experience || 'N/A'}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hourly Rate</span>
                    <p className="text-sm font-bold text-slate-700">{selectedFaculty.hourly_rate ? `₹${selectedFaculty.hourly_rate}` : 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Onboarding Date</span>
                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">
                      {selectedFaculty.created_at && !isNaN(new Date(selectedFaculty.created_at)) 
                        ? new Date(selectedFaculty.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) 
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Expertise</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedFaculty.subject ? selectedFaculty.subject.split(',').map((sub, idx) => (
                        <span key={idx} className="px-3 py-1 bg-[#008080]/10 text-[#008080] rounded-lg text-[9px] font-black uppercase tracking-widest border border-[#008080]/20">
                          {sub.trim()}
                        </span>
                      )) : <span className="text-xs text-slate-400">N/A</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${selectedFaculty.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest">{selectedFaculty.status}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authorization</p>
                    <p className="text-xs font-black text-slate-900 uppercase">Verified Faculty Account</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FacultyDirectory;
