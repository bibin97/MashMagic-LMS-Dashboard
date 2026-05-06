import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
    User, Mail, GraduationCap, BookOpen, Clock, 
    CheckCircle, ArrowLeft, Plus, Trash2, 
    Link as LinkIcon, UserCheck, Shield, Phone, MapPin, Briefcase, Calendar, Info
} from 'lucide-react';

const SUBJECT_OPTIONS = [
    "Mathematics", "Science", "Social Science", "English", "Malayalam", 
    "Hindi", "Physics", "Chemistry", "Biology", "Accountancy", 
    "Business Studies", "Economics", "Computer Science", "Arabic"
];

const LANG_OPTIONS = [
    { id: 'ENG', label: 'ENG(100%)' },
    { id: 'BL-AD', label: 'BILINGUAL ADVANCE' },
    { id: 'BL-SM', label: 'BILINGUAL SIMPLE' },
    { id: 'MLM', label: 'MAL' },
    { id: 'HIN', label: 'HINDI' },
    { id: 'TML', label: 'TML' }
];

const SYLLABUS_OPTIONS = ["CBSE", "STATE", "ICSE", "IGCSE", "IB"];
const SECTION_OPTIONS = ["KG", "LP", "UP", "HS", "HSS"];

const EditFaculty = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone_number: '',
        place: '',
        faculty_id_card: '',
        qualification: '',
        experience: '',
        availability: '',
        hourly_rate: '',
        teaching_mode: 'Both',
        joining_date: '',
        remarks: '',
        primary_subject: '',
        secondary_subjects: [],
        syllabus: [],
        languages_proficiency: [],
        section: '', // This will be comma separated string in DB
        password: '',
        isSecondaryDropdownOpen: false,
        isSectionDropdownOpen: false,
        isSyllabusDropdownOpen: false,
        isLangDropdownOpen: false
    });

    useEffect(() => {
        fetchFacultyData();
    }, [id]);

    const fetchFacultyData = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/academic-head/faculties`);
            const faculty = res.data.data.find(f => f.id.toString() === id);
            
            if (faculty) {
                // Parse subjects
                const allSubjects = faculty.subject ? faculty.subject.split(',') : [];
                const primary_subject = allSubjects.length > 0 ? allSubjects[0] : '';
                const secondary_subjects = allSubjects.length > 1 ? allSubjects.slice(1) : [];

                // Parse JSON/Strings
                let languages = [];
                try {
                    languages = faculty.languages_proficiency 
                        ? (typeof faculty.languages_proficiency === 'string' ? JSON.parse(faculty.languages_proficiency) : faculty.languages_proficiency) 
                        : [];
                } catch (e) { languages = []; }

                let syllabus = [];
                if (faculty.syllabus) {
                    syllabus = typeof faculty.syllabus === 'string' ? faculty.syllabus.split(',') : (Array.isArray(faculty.syllabus) ? faculty.syllabus : [faculty.syllabus]);
                }

                setFormData({
                    ...faculty,
                    name: faculty.name || '',
                    email: faculty.email || '',
                    phone_number: faculty.phone_number || '',
                    place: faculty.place || '',
                    primary_subject,
                    secondary_subjects,
                    languages_proficiency: languages,
                    syllabus,
                    section: faculty.section || '',
                    joining_date: faculty.joining_date ? new Date(faculty.joining_date).toISOString().split('T')[0] : '',
                    password: '',
                    isSecondaryDropdownOpen: false,
                    isSectionDropdownOpen: false,
                    isSyllabusDropdownOpen: false,
                    isLangDropdownOpen: false
                });
            } else {
                toast.error("Faculty not found");
                navigate('/academic-head/faculties');
            }
        } catch (error) {
            toast.error("Failed to load faculty data");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleDropdown = (field) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleMultiSelect = (field, value) => {
        setFormData(prev => {
            const current = prev[field] || [];
            const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const handleSectionToggle = (sec) => {
        setFormData(prev => {
            const current = prev.section ? prev.section.split(', ') : [];
            const updated = current.includes(sec) ? current.filter(s => s !== sec) : [...current, sec];
            return { ...prev, section: updated.join(', ') };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const res = await api.put(`/academic-head/faculties/${id}`, formData);
            if (res.data.success) {
                toast.success("Faculty profile updated successfully");
                navigate('/academic-head/faculties');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black text-slate-600 uppercase tracking-widest">Accessing Credentials...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto pb-20 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-10 py-6">
                <button onClick={() => navigate('/academic-head/faculties')} className="flex items-center gap-2 text-slate-600 hover:text-[#008080] transition-colors">
                    <ArrowLeft size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">Faculty Directory</span>
                </button>
                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-[10px] font-black uppercase tracking-widest">
                    Expertise Modification
                </div>
            </div>

            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[40px] border border-white/60 shadow-xl mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase mb-2">Refine Faculty</h1>
                    <p className="text-slate-600 font-bold text-[10px] uppercase tracking-[0.2em]">Updating professional profile for <span className="text-[#008080]">{formData.name}</span></p>
                </div>
                <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl rotate-3">
                    <Briefcase size={32} />
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
                {/* Section 1: Core Credentials */}
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                            <User size={20} />
                        </div>
                        Basic Identity
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Full Name</label>
                            <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-[#008080]" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Phone Number</label>
                            <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Place / City</label>
                            <input type="text" name="place" value={formData.place} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Faculty ID Card #</label>
                            <input type="text" name="faculty_id_card" value={formData.faculty_id_card} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Update Access Key (Optional)</label>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="Leave blank to keep current" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                    </div>
                </div>

                {/* Section 2: Expertise & Mapping */}
                <div className="bg-slate-900 p-8 md:p-12 rounded-[48px] shadow-2xl shadow-slate-900/40 text-white space-y-10">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                            <GraduationCap size={20} />
                        </div>
                        Academic Expertise
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Primary & Secondary Subjects */}
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Primary Subject Focus</label>
                                <select name="primary_subject" value={formData.primary_subject} onChange={handleInputChange} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold outline-none focus:border-[#008080] transition-all appearance-none">
                                    <option value="" className="text-slate-900">Select Primary</option>
                                    {SUBJECT_OPTIONS.map(sub => <option key={sub} value={sub} className="text-slate-900">{sub}</option>)}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2 relative">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Secondary Subject Expertise</label>
                                <div onClick={() => toggleDropdown('isSecondaryDropdownOpen')} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold cursor-pointer flex justify-between items-center">
                                    <span className="truncate max-w-[300px]">{formData.secondary_subjects?.length > 0 ? formData.secondary_subjects.join(', ') : 'Select Secondary Subjects'}</span>
                                    <span>▼</span>
                                </div>
                                {formData.isSecondaryDropdownOpen && (
                                    <div className="absolute top-[100%] left-0 w-full bg-white text-slate-900 border border-slate-100 rounded-2xl shadow-2xl z-[150] mt-1 p-2 max-h-60 overflow-y-auto animate-in fade-in duration-200">
                                        {SUBJECT_OPTIONS.map(sub => (
                                            <div key={sub} onClick={() => handleMultiSelect('secondary_subjects', sub)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${formData.secondary_subjects?.includes(sub) ? 'bg-[#008080]/10 text-[#008080]' : 'hover:bg-slate-50'}`}>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.secondary_subjects?.includes(sub) ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                                                    {formData.secondary_subjects?.includes(sub) && <CheckCircle size={10} className="text-white" />}
                                                </div>
                                                <span className="text-xs font-bold">{sub}</span>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => toggleDropdown('isSecondaryDropdownOpen')} className="w-full mt-2 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">Confirm</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section & Syllabus */}
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2 relative">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Section Coverage</label>
                                <div onClick={() => toggleDropdown('isSectionDropdownOpen')} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold cursor-pointer flex justify-between items-center">
                                    <span className="truncate">{formData.section || 'Select Sections'}</span>
                                    <span>▼</span>
                                </div>
                                {formData.isSectionDropdownOpen && (
                                    <div className="absolute top-[100%] left-0 w-full bg-white text-slate-900 border border-slate-100 rounded-2xl shadow-2xl z-[150] mt-1 p-2 animate-in fade-in duration-200">
                                        {SECTION_OPTIONS.map(sec => (
                                            <div key={sec} onClick={() => handleSectionToggle(sec)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${formData.section?.includes(sec) ? 'bg-[#008080]/10 text-[#008080]' : 'hover:bg-slate-50'}`}>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.section?.includes(sec) ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                                                    {formData.section?.includes(sec) && <CheckCircle size={10} className="text-white" />}
                                                </div>
                                                <span className="text-xs font-bold">{sec}</span>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => toggleDropdown('isSectionDropdownOpen')} className="w-full mt-2 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">Confirm</button>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 relative">
                                <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Syllabus Expertise</label>
                                <div onClick={() => toggleDropdown('isSyllabusDropdownOpen')} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold cursor-pointer flex justify-between items-center">
                                    <span className="truncate">{formData.syllabus?.length > 0 ? formData.syllabus.join(', ') : 'Select Syllabus'}</span>
                                    <span>▼</span>
                                </div>
                                {formData.isSyllabusDropdownOpen && (
                                    <div className="absolute top-[100%] left-0 w-full bg-white text-slate-900 border border-slate-100 rounded-2xl shadow-2xl z-[150] mt-1 p-2 animate-in fade-in duration-200">
                                        {SYLLABUS_OPTIONS.map(syl => (
                                            <div key={syl} onClick={() => handleMultiSelect('syllabus', syl)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${formData.syllabus?.includes(syl) ? 'bg-blue-600/10 text-blue-600' : 'hover:bg-slate-50'}`}>
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.syllabus?.includes(syl) ? 'bg-blue-600 border-blue-600' : 'border-slate-300'}`}>
                                                    {formData.syllabus?.includes(syl) && <CheckCircle size={10} className="text-white" />}
                                                </div>
                                                <span className="text-xs font-bold">{syl}</span>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => toggleDropdown('isSyllabusDropdownOpen')} className="w-full mt-2 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">Confirm</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/10">
                        <div className="flex flex-col gap-2 relative max-w-md">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Language Proficiency</label>
                            <div onClick={() => toggleDropdown('isLangDropdownOpen')} className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold cursor-pointer flex justify-between items-center">
                                <span className="truncate">{formData.languages_proficiency?.length > 0 ? formData.languages_proficiency.map(id => LANG_OPTIONS.find(l => l.id === id)?.label || id).join(', ') : 'Select Languages'}</span>
                                <span>▼</span>
                            </div>
                            {formData.isLangDropdownOpen && (
                                <div className="absolute top-[100%] left-0 w-full bg-white text-slate-900 border border-slate-100 rounded-2xl shadow-2xl z-[150] mt-1 p-2 animate-in fade-in duration-200">
                                    {LANG_OPTIONS.map(lang => (
                                        <div key={lang.id} onClick={() => handleMultiSelect('languages_proficiency', lang.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer ${formData.languages_proficiency?.includes(lang.id) ? 'bg-emerald-600/10 text-emerald-600' : 'hover:bg-slate-50'}`}>
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.languages_proficiency?.includes(lang.id) ? 'bg-emerald-600 border-emerald-600' : 'border-slate-300'}`}>
                                                {formData.languages_proficiency?.includes(lang.id) && <CheckCircle size={10} className="text-white" />}
                                            </div>
                                            <span className="text-xs font-bold">{lang.label}</span>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => toggleDropdown('isLangDropdownOpen')} className="w-full mt-2 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase">Confirm</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 3: Professional & Logistics */}
                <div className="bg-white p-8 md:p-12 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 space-y-10">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                            <Clock size={20} />
                        </div>
                        Logistics & Administration
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Hourly Rate (₹) (Multiple Typing)</label>
                            <input type="text" name="hourly_rate" value={formData.hourly_rate} onChange={handleInputChange} placeholder="e.g. 500, 600, 750" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Joining Date</label>
                            <input type="date" name="joining_date" value={formData.joining_date} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Teaching Mode</label>
                            <select name="teaching_mode" value={formData.teaching_mode} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold appearance-none">
                                <option value="Online">Online Only</option>
                                <option value="Offline">Offline Only</option>
                                <option value="Both">Both Modes</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Experience (Years)</label>
                            <input type="text" name="experience" value={formData.experience} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Highest Qualification</label>
                            <input type="text" name="qualification" value={formData.qualification} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Daily Availability</label>
                            <input type="text" name="availability" value={formData.availability} onChange={handleInputChange} placeholder="E.g. 4PM - 9PM IST" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 pt-6 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest ml-1">Internal Academic Remarks</label>
                        <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-3xl text-sm font-bold outline-none h-32 resize-none" placeholder="Enter notes about faculty performance or specialization..." />
                    </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-6 pt-10">
                    <button type="button" onClick={() => navigate('/academic-head/faculties')} className="w-full sm:w-auto px-10 py-5 rounded-[24px] border border-slate-200 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all font-sans">
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
                                Commit Faculty Update <CheckCircle size={18} strokeWidth={3} />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditFaculty;
