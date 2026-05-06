import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
    User, Mail, GraduationCap, BookOpen, Clock, 
    CheckCircle, ArrowLeft, Plus, Trash2, 
    Link as LinkIcon, UserCheck, Shield, Phone, Globe, Calendar, DollarSign, X
} from 'lucide-react';

const SUBJECT_OPTIONS = [
    "Mathematics", "Science", "Social Science", "English", "Malayalam", "Hindi",
    "Physics", "Chemistry", "Biology", "Accountancy", "Business Studies",
    "Economics", "Computer Science", "Arabic", "All Subjects"
];

const DAYS_LIST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EditStudent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
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
        password: ''
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
                api.get(`/academic-head/students`)
            ]);

            setMentors(dropdownRes.data.data.mentors);
            setFaculties(dropdownRes.data.data.faculties);

            const student = studentRes.data.data.find(s => s.id.toString() === id);
            
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
                    password: ''
                });

                if (student.subjects_json) {
                    try {
                        const parsed = typeof student.subjects_json === 'string' 
                            ? JSON.parse(student.subjects_json) 
                            : student.subjects_json;
                        setSelectedSubjects(Array.isArray(parsed) ? parsed.map(s => ({...s, isDayDropdownOpen: false, isSubjectDropdownOpen: false})) : []);
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
        setSelectedSubjects([...selectedSubjects, { 
            subject: '', days: [], startTime: '', endTime: '', hourlyRate: '', facultyId: '', facultyName: '',
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
        const currentDays = newSubjects[index].days || [];
        if (currentDays.includes(day)) {
            newSubjects[index].days = currentDays.filter(d => d !== day);
        } else {
            newSubjects[index].days = [...currentDays, day];
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
        <div className="max-w-6xl mx-auto pb-20 px-4">
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-10 py-6">
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

            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[40px] border border-white/60 shadow-xl mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">Reconfigure Profile</h1>
                    <p className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em]">Updating account identity for <span className="text-[#008080]">{formData.name}</span></p>
                </div>
                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3">
                    <UserCheck size={32} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Section 1: Personal Profile */}
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#008080]/10 rounded-xl flex items-center justify-center text-[#008080]">
                            <User size={20} />
                        </div>
                        Personal Profile
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Full Name</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Contact Number</label>
                            <input type="text" name="contact" value={formData.contact} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Update Password (Optional)</label>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Leave blank to keep current" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-rose-200 outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Country</label>
                            <input type="text" name="country" value={formData.country} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Preferred Language</label>
                            <input type="text" name="preferred_language" value={formData.preferred_language} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white focus:ring-2 focus:ring-[#008080] outline-none" />
                        </div>
                    </div>
                </div>

                {/* Section 2: Academic Details */}
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                            <GraduationCap size={20} />
                        </div>
                        Academic Parameters
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Grade / Level</label>
                            <input type="text" name="grade" value={formData.grade} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Syllabus</label>
                            <input type="text" name="syllabus" value={formData.syllabus} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Course Name</label>
                            <input type="text" name="course" value={formData.course} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">School / Institution</label>
                            <input type="text" name="school_name" value={formData.school_name} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:bg-white outline-none" />
                        </div>
                    </div>
                </div>

                {/* Enrollment Plan */}
                <div className="bg-slate-900 p-8 md:p-12 rounded-[48px] shadow-2xl shadow-slate-900/40 text-white">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-6 block">Current Enrollment Plan</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {['Mentorship Only', 'Tuition Only', 'Mentorship & Tuition'].map(plan => (
                            <button
                                key={plan}
                                type="button"
                                onClick={() => setFormData({...formData, enrollment_type: plan})}
                                className={`p-6 rounded-3xl border-2 transition-all text-center ${formData.enrollment_type === plan ? 'bg-[#008080] border-[#008080] shadow-xl shadow-[#008080]/30' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">{plan}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Section 3: Subject & Faculty Matrix */}
                <div className="rounded-[48px] border-2 border-dashed border-[#008080]/30 bg-[#008080]/5 p-8 md:p-12 space-y-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-[#008080]/10 pb-8">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Subject Assignment Matrix</h2>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Map multiple specialized faculties to unique academic sequences</p>
                        </div>
                        <button type="button" onClick={addSubjectRow} className="flex items-center gap-3 bg-white text-[#008080] px-6 py-4 rounded-[20px] border-2 border-[#008080]/20 text-[10px] font-black uppercase tracking-widest hover:bg-[#008080] hover:text-white transition-all shadow-sm">
                            <Plus size={16} strokeWidth={3} /> Add Sequencing Pair
                        </button>
                    </div>

                    <div className="space-y-6">
                        {selectedSubjects.map((row, idx) => (
                            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm relative animate-in slide-in-from-bottom-4 duration-300 items-end">
                                {/* Custom Subject Dropdown (Multiple Selection) */}
                                <div className="flex flex-col gap-2 relative">
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

                                {/* Custom Days Dropdown */}
                                <div className="flex flex-col gap-2 relative">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Session Days</label>
                                    <div 
                                        onClick={() => {
                                            const newSubjects = [...selectedSubjects];
                                            newSubjects[idx].isDayDropdownOpen = !newSubjects[idx].isDayDropdownOpen;
                                            setSelectedSubjects(newSubjects);
                                        }}
                                        className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-800 cursor-pointer flex justify-between items-center"
                                    >
                                        <span className="truncate">{row.days?.length > 0 ? row.days.map(d => d.substring(0, 3)).join(', ') : 'Select Days'}</span>
                                        <span>▼</span>
                                    </div>
                                    {row.isDayDropdownOpen && (
                                        <div className="absolute top-[100%] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-[120] mt-1 p-2 animate-in fade-in zoom-in-95 duration-200">
                                            {DAYS_LIST.map(day => (
                                                <div 
                                                    key={day} 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDayToggle(idx, day);
                                                    }}
                                                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer ${row.days?.includes(day) ? 'bg-[#008080]/10 text-[#008080]' : 'hover:bg-slate-50 text-slate-600'}`}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${row.days?.includes(day) ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                                                        {row.days?.includes(day) && <CheckCircle size={10} className="text-white" />}
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase">{day}</span>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newSubjects = [...selectedSubjects];
                                                    newSubjects[idx].isDayDropdownOpen = false;
                                                    setSelectedSubjects(newSubjects);
                                                }}
                                                className="w-full mt-2 p-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Start Time</label>
                                    <input type="time" value={row.startTime} onChange={(e) => handleSubjectChange(idx, 'startTime', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black outline-none focus:ring-2 focus:ring-[#008080]" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">End Time</label>
                                    <input type="time" value={row.endTime} onChange={(e) => handleSubjectChange(idx, 'endTime', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black outline-none focus:ring-2 focus:ring-[#008080]" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Faculty Rate (₹)</label>
                                    <input type="number" value={row.hourlyRate} onChange={(e) => handleSubjectChange(idx, 'hourlyRate', e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black outline-none focus:ring-2 focus:ring-[#008080]" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[9px] font-black text-[#008080] uppercase tracking-widest ml-1">Assigned Faculty</label>
                                    <select value={row.facultyId} onChange={(e) => handleSubjectChange(idx, 'facultyId', e.target.value)} className="w-full p-4 bg-[#008080]/5 border border-[#008080]/20 rounded-2xl text-[10px] font-black outline-none focus:ring-2 focus:ring-[#008080] appearance-none text-[#008080]">
                                        <option value="">Select Faculty</option>
                                        {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                    </select>
                                </div>

                                <button type="button" onClick={() => removeSubjectRow(idx)} className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 rounded-full hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section 4: Admin & Finance */}
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                            <Shield size={20} />
                        </div>
                        Administration & Infrastructure
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Registration #</label>
                            <input type="text" name="registration_number" value={formData.registration_number} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Total Fee Authority</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="number" name="total_fees" value={formData.total_fees} onChange={handleInputChange} className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Amount Paid (Confirmed)</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" />
                                <input type="number" name="total_paid" value={formData.total_paid} onChange={handleInputChange} className="w-full p-4 pl-10 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Next Installment</label>
                            <input type="date" name="next_installment_date" value={formData.next_installment_date} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 border-t border-slate-100 pt-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Assigned Academic Mentor</label>
                            <select name="mentor_id" value={formData.mentor_id} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold appearance-none outline-none">
                                <option value="">Select Mentor</option>
                                {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Live Session Protocol (Link)</label>
                            <div className="relative">
                                <LinkIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#008080]" />
                                <input type="text" name="meeting_link" value={formData.meeting_link} onChange={handleInputChange} className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" placeholder="meet.google.com/..." />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-10">
                    <button type="button" onClick={() => navigate('/academic-head/students')} className="w-full sm:w-auto px-10 py-5 rounded-[24px] border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        Discard Changes
                    </button>
                    <button disabled={saving} type="submit" className="w-full sm:w-auto px-12 py-5 rounded-[24px] bg-slate-900 text-white text-xs font-black uppercase tracking-[0.25em] shadow-2xl hover:bg-[#008080] hover:-translate-y-1 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                        {saving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Synchronizing...
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
