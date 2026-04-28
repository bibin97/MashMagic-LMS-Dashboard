import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
    User, Mail, GraduationCap, BookOpen, Clock, 
    CheckCircle, ArrowLeft, Plus, Trash2, 
    Link as LinkIcon, UserCheck, Shield 
} from 'lucide-react';

const EditStudent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        grade: '',
        syllabus: '',
        course: '',
        registration_number: '',
        meeting_link: '',
        hour: '',
        next_installment_date: '',
        mentor_id: '',
        password: '' // Optional for reset
    });

    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [faculties, setFaculties] = useState([]);

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [dropdownRes, studentRes] = await Promise.all([
                api.get('/academic-head/dropdowns'),
                api.get(`/academic-head/students`) // We'll filter from the list or add a single fetch if needed
            ]);

            setMentors(dropdownRes.data.data.mentors);
            setFaculties(dropdownRes.data.data.faculties);

            // Since we don't have a single GET student by ID yet in academicHeadController, 
            // we filter from the list or I should have added a dedicated route. 
            // Better to assume we can get it from the list for now or we add the route.
            const student = studentRes.data.data.find(s => s.id.toString() === id);
            
            if (student) {
                setFormData({
                    name: student.name || '',
                    email: student.email || '',
                    grade: student.grade || '',
                    syllabus: student.syllabus || '',
                    course: student.course || '',
                    registration_number: student.registration_number || '',
                    meeting_link: student.meeting_link || '',
                    hour: student.hour || '',
                    next_installment_date: student.next_installment_date ? student.next_installment_date.split('T')[0] : '',
                    mentor_id: student.mentor_id || '',
                    password: ''
                });

                // Parse subjects_json
                if (student.subjects_json) {
                    try {
                        const parsed = typeof student.subjects_json === 'string' 
                            ? JSON.parse(student.subjects_json) 
                            : student.subjects_json;
                        setSelectedSubjects(Array.isArray(parsed) ? parsed : []);
                    } catch (e) {
                        setSelectedSubjects([]);
                    }
                }
            } else {
                toast.error("Student not found");
                navigate('/academic-head/students');
            }
        } catch (error) {
            toast.error("Failed to load student data");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const addSubjectRow = () => {
        setSelectedSubjects([...selectedSubjects, { subject: '', facultyId: '', facultyName: '' }]);
    };

    const removeSubjectRow = (index) => {
        setSelectedSubjects(selectedSubjects.filter((_, i) => i !== index));
    };

    const handleSubjectChange = (index, field, value) => {
        const newSubjects = [...selectedSubjects];
        newSubjects[index][field] = value;
        
        if (field === 'facultyId') {
            const faculty = faculties.find(f => f.id.toString() === value.toString());
            newSubjects[index].facultyName = faculty ? faculty.name : '';
        }
        
        setSelectedSubjects(newSubjects);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await api.put(`/academic-head/students/${id}`, {
                ...formData,
                selectedSubjects: selectedSubjects
            });

            if (res.data.success) {
                toast.success("Student profile updated successfully");
                navigate('/academic-head/students');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update student");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Deciphering Records...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-10">
                <button 
                    onClick={() => navigate('/academic-head/students')}
                    className="flex items-center gap-2 text-slate-600 hover:text-[#008080] transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Student Directory</span>
                </button>
                <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                    Live Record Modification
                </div>
            </div>

            {/* Main Title */}
            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[40px] border border-white/60 shadow-xl mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">Reconfigure Profile</h1>
                    <p className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em]">Updating account identity for <span className="text-[#008080]">{formData.name}</span></p>
                </div>
                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3">
                    <UserCheck size={32} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Core Credentials */}
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#008080]/5 rounded-full -mr-32 -mt-32"></div>
                    
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#008080]/10 rounded-xl flex items-center justify-center text-[#008080]">
                            <Shield size={20} />
                        </div>
                        Primary Identity & Access
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Full Identity Name</label>
                            <div className="relative group">
                                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#008080] transition-colors" />
                                <input 
                                    type="text" name="name" required value={formData.name} onChange={handleInputChange}
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Email Authority</label>
                            <div className="relative group">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#008080] transition-colors" />
                                <input 
                                    type="email" name="email" value={formData.email} onChange={handleInputChange}
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Update Password (Leave blank to keep current)</label>
                            <div className="relative group">
                                <BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-500 transition-colors" />
                                <input 
                                    type="password" name="password" value={formData.password} onChange={handleInputChange}
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                                    placeholder="Enter new master key"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Academic Grade & Syllabus</label>
                            <div className="grid grid-cols-2 gap-4">
                                <input 
                                    type="text" name="grade" value={formData.grade} onChange={handleInputChange}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-800 focus:bg-white outline-none transition-all"
                                    placeholder="Grade"
                                />
                                <input 
                                    type="text" name="syllabus" value={formData.syllabus} onChange={handleInputChange}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-800 focus:bg-white outline-none transition-all"
                                    placeholder="Syllabus"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Subject Matrix */}
                <div className="md:col-span-2 rounded-[48px] border-2 border-dashed border-[#008080]/30 bg-[#008080]/5 p-8 md:p-12 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-[#008080]/10 pb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Subject Assignment Matrix</h2>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Map multiple specialized faculties to unique academic sequences</p>
                        </div>
                        <button 
                            type="button" 
                            onClick={addSubjectRow} 
                            className="flex items-center gap-3 bg-white text-[#008080] px-6 py-4 rounded-[20px] border-2 border-[#008080]/20 text-[10px] font-black uppercase tracking-widest hover:bg-[#008080] hover:text-white hover:border-[#008080] transition-all shadow-sm"
                        >
                            <Plus size={16} strokeWidth={3} /> Add Sequencing Pair
                        </button>
                    </div>

                    <div className="space-y-4">
                        {selectedSubjects.map((row, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-6 bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm transition-all hover:shadow-md animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Academic Subject</label>
                                    <select
                                        required
                                        value={row.subject}
                                        onChange={(e) => handleSubjectChange(idx, 'subject', e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[18px] text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#008080]"
                                    >
                                        <option value="" disabled>Select Sector</option>
                                        <option value="Mathematics">Mathematics</option>
                                        <option value="Science">Science</option>
                                        <option value="Social Science">Social Science</option>
                                        <option value="English">English</option>
                                        <option value="Malayalam">Malayalam</option>
                                        <option value="Hindi">Hindi</option>
                                        <option value="Physics">Physics</option>
                                        <option value="Chemistry">Chemistry</option>
                                        <option value="Biology">Biology</option>
                                        <option value="Accountancy">Accountancy</option>
                                        <option value="Business Studies">Business Studies</option>
                                        <option value="Economics">Economics</option>
                                        <option value="Computer Science">Computer Science</option>
                                        <option value="Arabic">Arabic</option>
                                        <option value="All Subjects">All Subjects</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Specialized Faculty</label>
                                    <select
                                        required
                                        value={row.facultyId}
                                        onChange={(e) => handleSubjectChange(idx, 'facultyId', e.target.value)}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[18px] text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#008080]"
                                    >
                                        <option value="" disabled>Select Authority</option>
                                        {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        type="button" 
                                        onClick={() => removeSubjectRow(idx)} 
                                        className="w-12 h-12 flex items-center justify-center bg-rose-50 text-rose-500 rounded-2xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {selectedSubjects.length === 0 && (
                            <div className="py-12 bg-white/50 rounded-[32px] border-2 border-dashed border-slate-200 text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">No subject sequences defined for this student</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section 3: Administrative Parameters */}
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-900/10 rounded-xl flex items-center justify-center text-slate-900">
                            <Clock size={20} />
                        </div>
                        Infrastructure Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Registration #</label>
                            <input 
                                type="text" name="registration_number" value={formData.registration_number} onChange={handleInputChange}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-800 focus:bg-white outline-none transition-all"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Assigned Mentor</label>
                            <select 
                                name="mentor_id" value={formData.mentor_id} onChange={handleInputChange}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-800 focus:bg-white outline-none transition-all appearance-none"
                            >
                                <option value="">No Mentor</option>
                                {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Session Protocol (Link)</label>
                            <div className="relative group">
                                <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#008080]" />
                                <input 
                                    type="text" name="meeting_link" value={formData.meeting_link} onChange={handleInputChange}
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-800 focus:bg-white outline-none transition-all"
                                    placeholder="meet.google.com/..."
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Enrollment Date</label>
                            <input 
                                type="date" name="next_installment_date" value={formData.next_installment_date} onChange={handleInputChange}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-800"
                            />
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-10">
                    <button 
                        type="button" 
                        onClick={() => navigate('/academic-head/students')}
                        className="w-full sm:w-auto px-10 py-5 rounded-[24px] border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-sans"
                    >
                        Discard Changes
                    </button>
                    <button 
                        disabled={saving}
                        type="submit" 
                        className="w-full sm:w-auto px-12 py-5 rounded-[24px] bg-slate-900 border border-slate-800 text-white text-xs font-black uppercase tracking-[0.25em] shadow-2xl hover:bg-emerald-600 hover:border-emerald-500 hover:-translate-y-1 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Updating Sequencer...
                            </>
                        ) : (
                            <>
                                Commit Profile Update <CheckCircle size={18} strokeWidth={3} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditStudent;
