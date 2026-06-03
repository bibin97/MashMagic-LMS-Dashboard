import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { 
    User, Mail, GraduationCap, BookOpen, Clock, 
    CheckCircle, ArrowLeft, Plus, Trash2, Edit2, Lock, Unlock, Eye, EyeOff,
    Link as LinkIcon, UserCheck, Shield, Phone, Globe, Calendar, DollarSign, X
} from 'lucide-react';

const SUBJECT_OPTIONS = [
    "Mathematics", "Science", "Social Science", "English", "Malayalam", "Hindi",
    "Physics", "Chemistry", "Biology", "Accountancy", "Business Studies",
    "Economics", "Computer Science", "Arabic", "French", "IT", "EVS", "All Subjects"
];

const DAYS_LIST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIME_SLOTS = [];
for (let h = 8; h <= 22; h++) {
    for (let m of ['00', '30']) {
        if (h === 22 && m === '30') continue;
        const hour = h > 12 ? h - 12 : h;
        const ampm = h >= 12 ? 'PM' : 'AM';
        TIME_SLOTS.push(`${hour.toString().padStart(2, '0')}:${m} ${ampm}`);
    }
}
TIME_SLOTS.push("10:00 PM");

const EditStudent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // Determine API base path based on role
    const basePath = user?.role === 'mentor_head' ? '/mentor-head' : '/aoe';
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contact: '',
        grade: '',
        syllabus: '',
        course: '',
        registration_number: '',
        meeting_link: '',
        hour: '',
        next_installment_date: '',
        admission_date: '',
        enrollment_type: '',
        school_name: '',
        preferred_language: '',
        country: '',
        total_fees: '',
        total_paid: '',
        mentor_id: '',
        password: '',
        course_completed: 0
    });

    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [mentors, setMentors] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [facultySearch, setFacultySearch] = useState({});
    
    // Refs for clicking outside
    const subRefs = useRef([]);
    const dayRefs = useRef([]);

    const [editModes, setEditModes] = useState({
        personal: false,
        academic: false,
        enrollment: false,
        subjects: false,
        admin: false
    });
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event) => {
            let updated = false;
            const newSubjects = selectedSubjects.map((row, idx) => {
                const subContainer = subRefs.current[idx];
                const dayContainer = dayRefs.current[idx];
                let newRow = { ...row };
                
                let rowUpdated = false;
                if (subContainer && !subContainer.contains(event.target) && row.isSubjectDropdownOpen) {
                    newRow.isSubjectDropdownOpen = false;
                    rowUpdated = true;
                }
                if (dayContainer && !dayContainer.contains(event.target) && row.isDayDropdownOpen) {
                    newRow.isDayDropdownOpen = false;
                    rowUpdated = true;
                }
                if (rowUpdated) updated = true;
                return newRow;
            });

            if (updated) {
                setSelectedSubjects(newSubjects);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedSubjects]);

    useEffect(() => {
        fetchInitialData();
    }, [id]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [dropdownRes, studentRes] = await Promise.all([
                api.get(`${basePath}/dropdowns`),
                api.get(`${basePath}/students/${id}`)
            ]);

            setMentors(dropdownRes.data.data.mentors);
            setFaculties(dropdownRes.data.data.faculties);

            const student = studentRes.data.data;
            
            if (student) {
                setFormData({
                    name: student.name || '',
                    email: student.email || '',
                    contact: student.contact || '',
                    grade: student.grade || '',
                    syllabus: student.syllabus || '',
                    course: student.course || '',
                    registration_number: student.registration_number || '',
                    meeting_link: student.meeting_link || '',
                    hour: student.hour || '',
                    next_installment_date: student.next_installment_date ? student.next_installment_date.split('T')[0] : '',
                    admission_date: student.admission_date ? student.admission_date.split('T')[0] : '',
                    enrollment_type: student.enrollment_type || '',
                    school_name: student.school_name || '',
                    preferred_language: student.preferred_language || '',
                    country: student.country || '',
                    total_fees: student.total_fees || '',
                    total_paid: student.total_paid || '',
                    mentor_id: student.mentor_id || '',
                    password: '',
                    course_completed: student.course_completed || 0
                });

                if (student.subjects_json) {
                    try {
                        const parsed = typeof student.subjects_json === 'string' 
                            ? JSON.parse(student.subjects_json) 
                            : student.subjects_json;
                        
                        if (Array.isArray(parsed)) {
                            // Convert old format (days array + single startTime/endTime) to dayConfigs
                            const formatted = parsed.map(s => {
                                const configs = s.dayConfigs || (s.days || []).map(d => ({
                                    day: d,
                                    startTime: s.startTime || '',
                                    endTime: s.endTime || ''
                                }));
                                return {
                                    ...s,
                                    dayConfigs: configs,
                                    isDayDropdownOpen: false,
                                    isSubjectDropdownOpen: false
                                };
                            });
                            setSelectedSubjects(formatted);
                        } else {
                            setSelectedSubjects([]);
                        }
                    } catch (e) {
                        setSelectedSubjects([]);
                    }
                }
            } else {
                toast.error("Student not found");
                navigate(`${basePath}/students`);
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
        setSelectedSubjects([...selectedSubjects, { 
            subject: '', dayConfigs: [], hourlyRate: '', facultyId: '', facultyName: '',
            isDayDropdownOpen: false, isSubjectDropdownOpen: false 
        }]);
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

    const handleDayToggle = (index, day) => {
        const newSubjects = [...selectedSubjects];
        const currentConfigs = newSubjects[index].dayConfigs || [];
        const exists = currentConfigs.find(c => c.day === day);
        
        if (exists) {
            newSubjects[index].dayConfigs = currentConfigs.filter(c => c.day !== day);
        } else {
            newSubjects[index].dayConfigs = [...currentConfigs, { 
                day, 
                startTime: '', 
                endTime: '' 
            }];
        }
        setSelectedSubjects(newSubjects);
    };

    const handleDayTimeChange = (subjectIdx, dayIdx, field, value) => {
        const newSubjects = [...selectedSubjects];
        newSubjects[subjectIdx].dayConfigs[dayIdx][field] = value;
        setSelectedSubjects(newSubjects);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`${basePath}/students/${id}`, {
                ...formData,
                selectedSubjects: selectedSubjects
            });

            if (res.data.success) {
                toast.success("Student profile updated successfully");
                navigate(`${basePath}/students`);
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
        <div className="max-w-6xl mx-auto pb-20 px-4">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-10 py-6">
                <button 
                    onClick={() => navigate(`${basePath}/students`)}
                    className="flex items-center gap-2 text-slate-600 hover:text-[#008080] transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Student Directory</span>
                </button>
                <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 text-[10px] font-black uppercase tracking-widest">
                    Live Record Modification
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[40px] border border-white/60 shadow-xl mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">Reconfigure Profile</h1>
                    <p className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em]">Updating account identity for <span className="text-[#008080]">{formData.name}</span></p>
                </div>
                <div className="w-16 h-16 bg-[#008080] rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3">
                    <UserCheck size={32} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Section 1: Personal Profile */}
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-[#008080]/10 rounded-xl flex items-center justify-center text-[#008080]">
                                <User size={20} />
                            </div>
                            Personal Profile
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setEditModes(prev => ({ ...prev, personal: !prev.personal }))}
                            className={`p-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${editModes.personal ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-100'}`}
                        >
                            {editModes.personal ? <><Unlock size={14} /> Editing</> : <><Lock size={14} /> Edit Section</>}
                        </button>
                    </h2>

                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-300 ${!editModes.personal ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Full Name</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} disabled={!editModes.personal} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!editModes.personal} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Contact Number</label>
                            <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} disabled={!editModes.personal} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Update Password (Optional)</label>
                            <div className="relative group">
                                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-400 transition-colors" />
                                <input 
                                    type={showPassword ? "text" : "password"} 
                                    name="password" 
                                    value={formData.password} 
                                    onChange={handleInputChange} 
                                    disabled={!editModes.personal} 
                                    placeholder="Leave blank to keep current" 
                                    className="w-full p-4 pl-12 pr-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-rose-200 outline-none transition-all" 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={!editModes.personal}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 focus:outline-none transition-colors disabled:opacity-50"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Country</label>
                            <input type="text" name="country" value={formData.country} onChange={handleInputChange} disabled={!editModes.personal} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Preferred Language</label>
                            <input type="text" name="preferred_language" value={formData.preferred_language} onChange={handleInputChange} disabled={!editModes.personal} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none" />
                        </div>
                    </div>
                </div>

                {/* Section 2: Academic Details */}
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                <GraduationCap size={20} />
                            </div>
                            Academic Parameters
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setEditModes(prev => ({ ...prev, academic: !prev.academic }))}
                            className={`p-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${editModes.academic ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-100'}`}
                        >
                            {editModes.academic ? <><Unlock size={14} /> Editing</> : <><Lock size={14} /> Edit Section</>}
                        </button>
                    </h2>

                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 transition-opacity duration-300 ${!editModes.academic ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Grade / Level</label>
                            <input type="text" name="grade" value={formData.grade} onChange={handleInputChange} disabled={!editModes.academic} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Syllabus</label>
                            <input type="text" name="syllabus" value={formData.syllabus} onChange={handleInputChange} disabled={!editModes.academic} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Course Name</label>
                            <input type="text" name="course" value={formData.course} onChange={handleInputChange} disabled={!editModes.academic} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">School / Institution</label>
                            <input type="text" name="school_name" value={formData.school_name} onChange={handleInputChange} disabled={!editModes.academic} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                        </div>
                    </div>
                </div>

                {/* Enrollment Plan */}
                <div className="bg-[#008080] p-8 md:p-12 rounded-[48px] shadow-2xl shadow-[#008080]/40 text-white relative">
                    <div className="flex justify-between items-center mb-6">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 block">Current Enrollment Plan</label>
                        <button 
                            type="button" 
                            onClick={() => setEditModes(prev => ({ ...prev, enrollment: !prev.enrollment }))}
                            className={`p-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${editModes.enrollment ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'}`}
                        >
                            {editModes.enrollment ? <><Unlock size={14} /> Editing</> : <><Lock size={14} /> Edit Section</>}
                        </button>
                    </div>
                    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 transition-opacity duration-300 ${!editModes.enrollment ? 'opacity-60 pointer-events-none' : ''}`}>
                        {['Mentorship Only', 'Tuition Only', 'Mentorship & Tuition'].map(plan => (
                            <button
                                key={plan}
                                type="button"
                                onClick={() => setFormData({...formData, enrollment_type: plan})}
                                className={`p-6 rounded-3xl border-2 transition-all text-center ${formData.enrollment_type === plan ? 'bg-yellow-400 border-yellow-400 shadow-xl shadow-yellow-400/30 text-slate-900' : 'bg-white/5 border-white/10 hover:border-white/30 text-white'}`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">{plan}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 3: Subject & Faculty Matrix */}
                <div className="rounded-[48px] border-2 border-dashed border-[#008080]/30 bg-[#008080]/5 p-8 md:p-12 space-y-10 relative">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-[#008080]/10 pb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Subject Assignment Matrix</h2>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Map multiple specialized faculties to unique academic sequences</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                type="button" 
                                onClick={() => setEditModes(prev => ({ ...prev, subjects: !prev.subjects }))}
                                className={`p-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${editModes.subjects ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white text-slate-400 hover:text-slate-600 border border-[#008080]/20 shadow-sm'}`}
                            >
                                {editModes.subjects ? <><Unlock size={14} /> Editing</> : <><Lock size={14} /> Edit Section</>}
                            </button>
                            <button type="button" onClick={addSubjectRow} disabled={!editModes.subjects} className="flex items-center gap-3 bg-white text-[#008080] px-6 py-4 rounded-[20px] border-2 border-[#008080]/20 text-[10px] font-black uppercase tracking-widest hover:bg-[#008080] hover:text-white transition-all shadow-sm disabled:opacity-50 disabled:pointer-events-none">
                                <Plus size={16} strokeWidth={3} /> Add Sequencing Pair
                            </button>
                        </div>
                    </div>

                    <div className={`space-y-6 transition-opacity duration-300 ${!editModes.subjects ? 'opacity-60 pointer-events-none' : ''}`}>
                        {selectedSubjects.map((row, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative animate-in slide-in-from-bottom-4 duration-300 items-end">
                                {/* Custom Subject Dropdown (Multiple Selection) */}
                                <div className="flex flex-col gap-2 relative" ref={el => subRefs.current[idx] = el}>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Academic Subjects</label>
                                    <div 
                                        onClick={() => {
                                            const newSubjects = [...selectedSubjects];
                                            newSubjects[idx].isSubjectDropdownOpen = !newSubjects[idx].isSubjectDropdownOpen;
                                            setSelectedSubjects(newSubjects);
                                        }}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-800 cursor-pointer flex justify-between items-center min-h-[52px]"
                                    >
                                        <span className="truncate">
                                            {Array.isArray(row.subject) && row.subject.length > 0 
                                                ? row.subject.join(', ') 
                                                : (typeof row.subject === 'string' && row.subject ? row.subject : 'Select Subjects')}
                                        </span>
                                        <span className="text-slate-400">▼</span>
                                    </div>
                                    {row.isSubjectDropdownOpen && (
                                        <div className="absolute top-[100%] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-[120] mt-1 p-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                            {SUBJECT_OPTIONS.map(sub => {
                                                const isSelected = Array.isArray(row.subject) ? row.subject.includes(sub) : row.subject === sub;
                                                return (
                                                    <div 
                                                        key={sub} 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const newSubjects = [...selectedSubjects];
                                                            let current = Array.isArray(newSubjects[idx].subject) 
                                                                ? newSubjects[idx].subject 
                                                                : (newSubjects[idx].subject ? [newSubjects[idx].subject] : []);
                                                            
                                                            if (current.includes(sub)) {
                                                                current = current.filter(s => s !== sub);
                                                            } else {
                                                                current = [...current, sub];
                                                            }
                                                            newSubjects[idx].subject = current;
                                                            setSelectedSubjects(newSubjects);
                                                        }}
                                                        className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-[#008080]/10 text-[#008080]' : 'hover:bg-slate-50 text-slate-600'}`}
                                                    >
                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                                                            {isSelected && <CheckCircle size={10} className="text-white" />}
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase">{sub}</span>
                                                    </div>
                                                );
                                            })}
                                            {/* Clear All Option */}
                                            <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newSubjects = [...selectedSubjects];
                                                    newSubjects[idx].subject = [];
                                                    setSelectedSubjects(newSubjects);
                                                }}
                                                className="mt-2 p-2 text-center text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 rounded-lg cursor-pointer transition-colors border border-dashed border-rose-200"
                                            >
                                                Clear All
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Custom Days Dropdown (Matches Registration) */}
                                <div className="flex flex-col gap-2 relative" ref={el => dayRefs.current[idx] = el}>
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Session Configuration (Days & Time)</label>
                                    <div 
                                        onClick={() => {
                                            const newSubjects = [...selectedSubjects];
                                            newSubjects[idx].isDayDropdownOpen = !newSubjects[idx].isDayDropdownOpen;
                                            setSelectedSubjects(newSubjects);
                                        }}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-800 cursor-pointer flex justify-between items-center"
                                    >
                                        <span className="truncate">
                                            {row.dayConfigs?.length > 0 
                                                ? row.dayConfigs.map(d => `${d.day.substring(0,3)} ${d.startTime || ''}`).join(', ') 
                                                : 'Configure Days & Time'}
                                        </span>
                                        <span>▼</span>
                                    </div>
                                    {row.isDayDropdownOpen && (
                                        <div className="absolute top-[100%] left-0 w-[300px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-[120] mt-1 p-3 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                                {DAYS_LIST.map(day => {
                                                    const configIdx = row.dayConfigs?.findIndex(c => c.day === day);
                                                    const isSelected = configIdx !== -1;
                                                    return (
                                                        <div key={day} className={`p-2 rounded-xl border ${isSelected ? 'bg-[#008080]/5 border-[#008080]/20' : 'border-transparent'}`}>
                                                            <div className="flex items-center gap-3 mb-1 cursor-pointer" onClick={() => handleDayToggle(idx, day)}>
                                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                                                                    {isSelected && <CheckCircle size={10} className="text-white" />}
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase">{day}</span>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                                    <div className="relative group/time">
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="10:00 AM"
                                                                            value={row.dayConfigs[configIdx].startTime}
                                                                            onChange={(e) => handleDayTimeChange(idx, configIdx, 'startTime', e.target.value)}
                                                                            className="w-full p-2 pr-7 bg-white border border-slate-200 rounded-lg text-[9px] font-bold outline-none focus:border-[#008080]"
                                                                        />
                                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#008080] cursor-pointer" onClick={(e) => {
                                                                            document.querySelectorAll('.time-picker-dropdown').forEach(el => el.classList.add('hidden'));
                                                                            const picker = e.currentTarget.nextElementSibling;
                                                                            picker.classList.toggle('hidden');
                                                                        }}>
                                                                            <Clock size={10} />
                                                                        </div>
                                                                        <div className="time-picker-dropdown hidden absolute top-full left-0 w-full bg-white border border-slate-100 rounded-lg shadow-2xl z-[150] mt-1 p-1 max-h-32 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                                                            {TIME_SLOTS.map(t => (
                                                                                <div key={t} onClick={() => {
                                                                                    handleDayTimeChange(idx, configIdx, 'startTime', t);
                                                                                    document.querySelectorAll('.time-picker-dropdown').forEach(el => el.classList.add('hidden'));
                                                                                }} className="p-1.5 hover:bg-[#008080]/10 rounded-md text-[9px] font-black cursor-pointer transition-colors uppercase">
                                                                                    {t}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                    <div className="relative group/time">
                                                                        <input 
                                                                            type="text" 
                                                                            placeholder="11:00 AM"
                                                                            value={row.dayConfigs[configIdx].endTime}
                                                                            onChange={(e) => handleDayTimeChange(idx, configIdx, 'endTime', e.target.value)}
                                                                            className="w-full p-2 pr-7 bg-white border border-slate-200 rounded-lg text-[9px] font-bold outline-none focus:border-[#008080]"
                                                                        />
                                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#008080] cursor-pointer" onClick={(e) => {
                                                                            document.querySelectorAll('.time-picker-dropdown').forEach(el => el.classList.add('hidden'));
                                                                            const picker = e.currentTarget.nextElementSibling;
                                                                            picker.classList.toggle('hidden');
                                                                        }}>
                                                                            <Clock size={10} />
                                                                        </div>
                                                                        <div className="time-picker-dropdown hidden absolute top-full left-0 w-full bg-white border border-slate-100 rounded-lg shadow-2xl z-[150] mt-1 p-1 max-h-32 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                                                            {TIME_SLOTS.map(t => (
                                                                                <div key={t} onClick={() => {
                                                                                    handleDayTimeChange(idx, configIdx, 'endTime', t);
                                                                                    document.querySelectorAll('.time-picker-dropdown').forEach(el => el.classList.add('hidden'));
                                                                                }} className="p-1.5 hover:bg-[#008080]/10 rounded-md text-[9px] font-black cursor-pointer transition-colors uppercase">
                                                                                    {t}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-[#008080] uppercase tracking-widest ml-1">Assigned Faculty</label>
                                    <input 
                                        type="text" 
                                        placeholder="Search faculty by name..."
                                        value={facultySearch[idx] || ''}
                                        onChange={(e) => setFacultySearch({...facultySearch, [idx]: e.target.value})}
                                        className="w-full p-2 px-4 bg-[#008080]/5 border border-[#008080]/20 rounded-t-2xl text-[10px] font-black outline-none text-[#008080]"
                                    />
                                    <select value={row.facultyId} onChange={(e) => handleSubjectChange(idx, 'facultyId', e.target.value)} className="w-full p-4 bg-[#008080]/5 border border-[#008080]/20 rounded-b-2xl border-t-0 text-[10px] font-black outline-none focus:ring-2 focus:ring-[#008080] appearance-none text-[#008080]">
                                        <option value="">Select Faculty</option>
                                        {faculties.filter(f => f.name.toLowerCase().includes((facultySearch[idx] || '').toLowerCase())).map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Faculty Rate (₹)</label>
                                    <input type="number" value={row.hourlyRate} onChange={(e) => handleSubjectChange(idx, 'hourlyRate', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black outline-none focus:ring-2 focus:ring-[#008080]" />
                                </div>

                                <button type="button" onClick={() => removeSubjectRow(idx)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 4: Admin & Finance */}
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                                <Shield size={20} />
                            </div>
                            Administration & Infrastructure
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setEditModes(prev => ({ ...prev, admin: !prev.admin }))}
                            className={`p-3 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${editModes.admin ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-100'}`}
                        >
                            {editModes.admin ? <><Unlock size={14} /> Editing</> : <><Lock size={14} /> Edit Section</>}
                        </button>
                    </h2>

                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 transition-opacity duration-300 ${!editModes.admin ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Registration #</label>
                            <input type="text" name="registration_number" value={formData.registration_number} onChange={handleInputChange} disabled={!editModes.admin} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Total Fee Authority</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="number" name="total_fees" value={formData.total_fees} onChange={handleInputChange} disabled={!editModes.admin} className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Amount Paid (Confirmed)</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                                <input type="number" name="total_paid" value={formData.total_paid} onChange={handleInputChange} disabled={!editModes.admin} className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Next Installment</label>
                            <input type="date" name="next_installment_date" value={formData.next_installment_date} onChange={handleInputChange} disabled={!editModes.admin} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold" />
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8 border-t border-slate-100 pt-8 transition-opacity duration-300 ${!editModes.admin ? 'opacity-60 pointer-events-none' : ''}`}>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Assigned Academic Mentor</label>
                            <select name="mentor_id" value={formData.mentor_id} onChange={handleInputChange} disabled={!editModes.admin} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold appearance-none outline-none">
                                <option value="">Select Mentor</option>
                                {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Live Session Link</label>
                            <div className="relative">
                                <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#008080]" />
                                <input type="text" name="meeting_link" value={formData.meeting_link} onChange={handleInputChange} disabled={!editModes.admin} className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="meet.google.com/..." />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Course Status</label>
                            <div className="flex items-center gap-4 h-full">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, course_completed: formData.course_completed === 1 ? 0 : 1})}
                                    disabled={!editModes.admin}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${formData.course_completed === 1 ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-500/30'}`}
                                >
                                    {formData.course_completed === 1 ? (
                                        <><CheckCircle size={16} strokeWidth={3} /> Graduated / Completed</>
                                    ) : (
                                        <><Clock size={16} strokeWidth={3} /> In Progress / Active</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-10">
                    <button type="button" onClick={() => navigate(`${basePath}/students`)} className="w-full sm:w-auto px-10 py-5 rounded-[24px] border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Discard Changes
                    </button>
                    <button disabled={saving} type="submit" className="w-full sm:w-auto px-12 py-5 rounded-[24px] bg-[#008080] text-white text-xs font-black uppercase tracking-[0.25em] shadow-2xl hover:bg-[#008080] hover:-translate-y-1 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                Save Profile Update <CheckCircle size={18} strokeWidth={3} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditStudent;
