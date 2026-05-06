import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Users, User, Mail, Phone, Calendar,
  Clock, List, ChevronDown, ChevronUp, Search,
  Briefcase, GraduationCap, ArrowRight, ExternalLink,
  Filter, Activity, Edit2, Trash2, X, Save, BookOpen, MapPin, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { premiumConfirm } from '../../utils/premiumConfirm';

const FacultyDirectory = () => {
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);

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
    "Business Studies", "Economics", "Computer Science", "Arabic"
  ];

  useEffect(() => {
    fetchFaculties();
  }, [sortBy]);

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/academic-head/faculties?sortBy=${sortBy}`);
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
    // Parse subjects: first is primary, rest are secondary
    const allSubjects = faculty.subject ? faculty.subject.split(',') : [];
    const primary_subject = allSubjects.length > 0 ? allSubjects[0] : '';
    const secondary_subjects = allSubjects.length > 1 ? allSubjects.slice(1) : [];

    let languages = [];
    try {
      languages = faculty.languages_proficiency 
        ? (typeof faculty.languages_proficiency === 'string' ? JSON.parse(faculty.languages_proficiency) : faculty.languages_proficiency) 
        : [];
    } catch (e) {
      languages = [];
    }

    let syllabus = [];
    if (faculty.syllabus) {
      syllabus = typeof faculty.syllabus === 'string' ? faculty.syllabus.split(',') : (Array.isArray(faculty.syllabus) ? faculty.syllabus : [faculty.syllabus]);
    }

    setEditingFaculty({ 
      ...faculty, 
      primary_subject,
      secondary_subjects,
      languages_proficiency: languages,
      syllabus,
      joining_date: faculty.joining_date ? new Date(faculty.joining_date).toISOString().split('T')[0] : ''
    });
    setIsEditModalOpen(true);
  };

  const handleSyllabusToggle = (syll) => {
    setEditingFaculty(prev => {
      const current = prev.syllabus || [];
      return {
        ...prev,
        syllabus: current.includes(syll) ? current.filter(s => s !== syll) : [...current, syll]
      };
    });
  };

  const handleLanguageToggle = (langId) => {
    setEditingFaculty(prev => {
      const current = prev.languages_proficiency || [];
      return {
        ...prev,
        languages_proficiency: current.includes(langId) ? current.filter(id => id !== langId) : [...current, langId]
      };
    });
  };

  const handleUpdateFaculty = async () => {
    try {
      const res = await api.put(`/academic-head/faculties/${editingFaculty.id}`, editingFaculty);
      if (res.data.success) {
        toast.success("Faculty record updated successfully");
        setIsEditModalOpen(false);
        fetchFaculties();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update operation failed");
    }
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
        const res = await api.delete(`/academic-head/faculties/${id}`);
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
                            onClick={() => handleEditFaculty(faculty)}
                            className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center hover:bg-[#008080] hover:text-white transition-all shadow-sm border border-slate-100"
                            title="Edit Profile"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteFaculty(faculty)}
                            className="w-10 h-10 bg-slate-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-slate-100"
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

      {/* Faculty Edit Modal */}
      {isEditModalOpen && editingFaculty && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-white/20 flex flex-col">
            
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#008080] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#008080]/30">
                  <Edit2 size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Edit Faculty Profile</h2>
                  <p className="text-[10px] font-black text-[#008080] uppercase tracking-widest">Update professional credentials and academic mapping</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-slate-400 hover:text-slate-600 hover:shadow-md transition-all border border-slate-100">
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              
              {/* Section 1: Basic Identity */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Basic Identity</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Full Name</label>
                    <input type="text" value={editingFaculty.name} onChange={(e) => setEditingFaculty({...editingFaculty, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Email Address</label>
                    <input type="email" value={editingFaculty.email} onChange={(e) => setEditingFaculty({...editingFaculty, email: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Phone Number</label>
                    <input type="text" value={editingFaculty.phone_number || ''} onChange={(e) => setEditingFaculty({...editingFaculty, phone_number: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Place / City</label>
                    <input type="text" value={editingFaculty.place || ''} onChange={(e) => setEditingFaculty({...editingFaculty, place: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold" />
                  </div>
                </div>
              </div>

              {/* Section 2: Academic Profile */}
              <div className="space-y-6 pt-10 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                    <GraduationCap size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Academic & Professional</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Faculty ID Card #</label>
                    <input type="text" value={editingFaculty.faculty_id_card || ''} onChange={(e) => setEditingFaculty({...editingFaculty, faculty_id_card: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Section Coverage</label>
                    <select value={editingFaculty.section || ''} onChange={(e) => setEditingFaculty({...editingFaculty, section: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold appearance-none">
                      <option value="">Select Section</option>
                      {["KG", "LP", "UP", "HS", "HSS"].map(sec => <option key={sec} value={sec}>{sec}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Highest Qualification</label>
                    <input type="text" value={editingFaculty.qualification || ''} onChange={(e) => setEditingFaculty({...editingFaculty, qualification: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Experience (Years)</label>
                    <input type="text" value={editingFaculty.experience || ''} onChange={(e) => setEditingFaculty({...editingFaculty, experience: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Teaching Mode</label>
                    <select value={editingFaculty.teaching_mode || 'Both'} onChange={(e) => setEditingFaculty({...editingFaculty, teaching_mode: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold appearance-none">
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Expertise Mapping */}
              <div className="space-y-8 pt-10 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Expertise Mapping</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Primary Subject</label>
                    <select 
                      value={editingFaculty.primary_subject || ''} 
                      onChange={(e) => setEditingFaculty({...editingFaculty, primary_subject: e.target.value})} 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold appearance-none"
                    >
                      <option value="">Select Primary</option>
                      {SUBJECT_OPTIONS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Secondary Subjects</label>
                    <select
                      multiple
                      value={editingFaculty.secondary_subjects || []}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value);
                        setEditingFaculty(prev => ({ ...prev, secondary_subjects: values }));
                      }}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold min-h-[46px]"
                    >
                      {SUBJECT_OPTIONS.map(sub => (
                        <option key={sub} value={sub} disabled={sub === editingFaculty.primary_subject}>{sub}</option>
                      ))}
                    </select>
                    <p className="text-[7px] text-slate-400 uppercase font-black ml-1">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Syllabus Expertise</label>
                  <div className="flex flex-wrap gap-2">
                    {["CBSE", "STATE", "ICSE"].map((syll) => (
                      <button
                        key={syll}
                        type="button"
                        onClick={() => handleSyllabusToggle(syll)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                          (editingFaculty.syllabus || []).includes(syll)
                            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100 scale-105'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-200'
                        }`}
                      >
                        {syll}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Language Proficiency</label>
                  <div className="flex flex-wrap gap-2">
                    {LANG_OPTIONS.map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => handleLanguageToggle(lang.id)}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                          (editingFaculty.languages_proficiency || []).includes(lang.id)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100 scale-105'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-200'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 4: Logistics & Admin */}
              <div className="space-y-6 pt-10 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Logistics & Admin</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Hourly Rate (₹)</label>
                    <input type="number" value={editingFaculty.hourly_rate || ''} onChange={(e) => setEditingFaculty({...editingFaculty, hourly_rate: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Joining Date</label>
                    <input type="date" value={editingFaculty.joining_date || ''} onChange={(e) => setEditingFaculty({...editingFaculty, joining_date: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Availability (Time Slots)</label>
                    <input type="text" value={editingFaculty.availability || ''} onChange={(e) => setEditingFaculty({...editingFaculty, availability: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold" placeholder="E.g. 4PM - 9PM" />
                  </div>
                  <div className="lg:col-span-3 flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Internal Remarks</label>
                    <textarea value={editingFaculty.remarks || ''} onChange={(e) => setEditingFaculty({...editingFaculty, remarks: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]/10 font-bold resize-none h-24" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-8 border-t border-slate-100 bg-slate-50 flex justify-end gap-4">
              <button onClick={() => setIsEditModalOpen(false)} className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-all">Discard Changes</button>
              <button onClick={handleUpdateFaculty} className="px-10 py-4 bg-[#008080] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#008080]/30 hover:bg-[#008080] hover:-translate-y-0.5 transition-all flex items-center gap-2">
                <Save size={18} /> Commit Faculty Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyDirectory;
