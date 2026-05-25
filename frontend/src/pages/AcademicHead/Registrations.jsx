import React, { useState, useEffect, useRef } from 'react';
import { UserPlus, User, GraduationCap, MapPin, Mail, Phone, Lock, BookOpen, Clock, Calendar, CheckCircle, ShieldCheck, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Registrations = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);


  // Dropdowns data
  const [mentors, setMentors] = useState([]);
  const [faculties, setFaculties] = useState([]);

  // Forms data
  const [studentForm, setStudentForm] = useState({
    name: '', email: '', contact: '', password: '', confirmPassword: '',
    grade: '', syllabus: '', mentorId: '', course: '', 
    admissionDate: new Date().toISOString().split('T')[0],
    schoolName: '', preferredLanguage: '', country: '',
    totalFees: '', totalPaid: '', nextInstallmentDate: '', 
    admissionType: 'new', registrationNumber: '', meetingLink: '',
    enrollmentType: 'Mentorship'
  });

  const [selectedSubjects, setSelectedSubjects] = useState([
    { 
      subject: '', 
      dayConfigs: [], // Array of { day: string, startTime: string, endTime: string }
      facultyId: '', 
      facultyName: '', 
      hourlyRate: '', 
      availableFaculties: [], 
      isDayDropdownOpen: false, 
      isSubjectDropdownOpen: false 
    }
  ]);

  const [facultyForm, setFacultyForm] = useState({
    name: '', email: '', phone_number: '', place: '', password: '', confirmPassword: '',
    faculty_id_card: '', section: '', syllabus: [], languages_proficiency: [],
    qualification: '', experience: '', availability: '', hourly_rate: '',
    teaching_mode: 'Both', joining_date: new Date().toISOString().split('T')[0], 
    remarks: '', primary_subject: '', secondary_subjects: [],
    isSecondaryDropdownOpen: false, isSectionDropdownOpen: false,
    isSyllabusDropdownOpen: false, isLangDropdownOpen: false
  });

  const [sscForm, setSscForm] = useState({
    name: '', email: '', phone_number: '', place: '', password: '', confirmPassword: ''
  });

  // Refs for clicking outside
  const secondaryRef = useRef(null);
  const sectionRef = useRef(null);
  const syllabusRef = useRef(null);
  const langRef = useRef(null);
  const subRefs = useRef([]);
  const dayRefs = useRef([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Faculty form dropdowns
      if (secondaryRef.current && !secondaryRef.current.contains(event.target)) {
        setFacultyForm(prev => ({ ...prev, isSecondaryDropdownOpen: false }));
      }
      if (sectionRef.current && !sectionRef.current.contains(event.target)) {
        setFacultyForm(prev => ({ ...prev, isSectionDropdownOpen: false }));
      }
      if (syllabusRef.current && !syllabusRef.current.contains(event.target)) {
        setFacultyForm(prev => ({ ...prev, isSyllabusDropdownOpen: false }));
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setFacultyForm(prev => ({ ...prev, isLangDropdownOpen: false }));
      }

      // Student registration row dropdowns
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

  const DAYS_LIST = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const coursesList = ["Mission X", "Classmate", "Crash 45", "Bright Bridge", "Magic Revision"];
  const SYLLABUS_OPTIONS = ["CBSE", "STATE", "ICSE", "IGCSE", "IB"];

  const TIME_SLOTS = [];
  for (let h = 8; h <= 22; h++) {
    for (let m of ['00', '30']) {
      if (h === 22 && m === '30') continue; // Stop at 10:00 PM
      const hour = h > 12 ? h - 12 : h;
      const ampm = h >= 12 ? 'PM' : 'AM';
      TIME_SLOTS.push(`${hour.toString().padStart(2, '0')}:${m} ${ampm}`);
    }
  }
  TIME_SLOTS.push("10:00 PM");

  const fetchTimeoutRef = useRef(null);

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchDropdowns = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await api.get('/academic-head/dropdowns', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setMentors(res.data.data.mentors || []);
        setFaculties(res.data.data.faculties || []);
      }
    } catch (error) {
      console.error("Failed to fetch dropdowns:", error);
    }
  };

  const fetchAvailableFaculties = async (index, subject, dayConfigs) => {
    const subjectsToFetch = Array.isArray(subject) ? subject : (subject ? [subject] : []);
    if (subjectsToFetch.length === 0 || !dayConfigs || dayConfigs.length === 0) return;
    
    // Check if all configs have day, startTime and endTime
    const isValid = dayConfigs.every(c => c.day && c.startTime && c.endTime);
    if (!isValid) return;

    try {
      const subjectParam = subjectsToFetch.join(',');
      // Send dayConfigs as JSON string for complex availability checking
      const configsParam = encodeURIComponent(JSON.stringify(dayConfigs));
      const res = await api.get(`/academic-head/available-faculties?subject=${subjectParam}&dayConfigs=${configsParam}`);
      if (res.data.success) {
        setSelectedSubjects(prev => {
          const newSubjects = [...prev];
          if (newSubjects[index]) {
            newSubjects[index].availableFaculties = res.data.data;
          }
          return newSubjects;
        });
      }
    } catch (error) {
      console.error("Failed to fetch available faculties:", error);
    }
  };

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...selectedSubjects];
    newSubjects[index][field] = value;
    if (field === 'facultyId') {
      const faculty = newSubjects[index].availableFaculties.find(f => f.id.toString() === value);
      newSubjects[index].facultyName = faculty ? faculty.name : '';
    }
    setSelectedSubjects(newSubjects);
    if (['subject', 'dayConfigs'].includes(field)) {
      const row = newSubjects[index];
      const hasSubject = Array.isArray(row.subject) ? row.subject.length > 0 : !!row.subject;
      if (hasSubject && row.dayConfigs && row.dayConfigs.length > 0) {
        fetchAvailableFaculties(index, row.subject, row.dayConfigs);
      }
    }
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
    
    const row = newSubjects[index];
    const hasSubject = Array.isArray(row.subject) ? row.subject.length > 0 : !!row.subject;
    if (hasSubject && row.dayConfigs.length > 0) {
      fetchAvailableFaculties(index, row.subject, row.dayConfigs);
    }
  };

  const handleDayTimeChange = (subjectIdx, dayIdx, field, value) => {
    const newSubjects = [...selectedSubjects];
    newSubjects[subjectIdx].dayConfigs[dayIdx][field] = value;
    setSelectedSubjects(newSubjects);
    
    const row = newSubjects[subjectIdx];
    const hasSubject = Array.isArray(row.subject) ? row.subject.length > 0 : !!row.subject;
    if (hasSubject && row.dayConfigs.length > 0) {
      fetchAvailableFaculties(subjectIdx, row.subject, row.dayConfigs);
    }
  };



  const handleLanguageToggle = (langId) => {
    setFacultyForm(prev => {
      const current = prev.languages_proficiency;
      return {
        ...prev,
        languages_proficiency: current.includes(langId) ? current.filter(id => id !== langId) : [...current, langId]
      };
    });
  };

  const handleSyllabusToggle = (syll) => {
    setFacultyForm(prev => {
      const current = prev.syllabus || [];
      return {
        ...prev,
        syllabus: current.includes(syll) ? current.filter(s => s !== syll) : [...current, syll]
      };
    });
  };

  const handleStudentChange = (e) => setStudentForm({ ...studentForm, [e.target.name]: e.target.value });
  const handleFacultyChange = (e) => setFacultyForm({ ...facultyForm, [e.target.name]: e.target.value });
  const handleSSCChange = (e) => setSscForm({ ...sscForm, [e.target.name]: e.target.value });

  const addSubjectRow = () => {
    setSelectedSubjects([...selectedSubjects, { 
      subject: '', 
      dayConfigs: [], 
      facultyId: '', 
      facultyName: '', 
      hourlyRate: '', 
      availableFaculties: [],
      isDayDropdownOpen: false, 
      isSubjectDropdownOpen: false 
    }]);
  };

  const submitStudent = async (e) => {
    e.preventDefault();
    if (studentForm.password && studentForm.password !== studentForm.confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    setLoading(true);
    try {
      const flattenedSubjects = [];
      selectedSubjects.forEach(s => {
        if (s.dayConfigs && s.dayConfigs.length > 0) {
          s.dayConfigs.forEach(config => {
            flattenedSubjects.push({
              ...s,
              day: config.day,
              startTime: config.startTime,
              endTime: config.endTime,
              days: [config.day] // For backward compatibility with some controller logic
            });
          });
        }
      });
      const res = await api.post('/academic-head/register-student', { ...studentForm, selectedSubjects: flattenedSubjects });
      if (res.data.success) {
        toast.success('Student Registered Successfully!');
        setStudentForm({
          name: '', email: '', contact: '', password: '', confirmPassword: '',
          grade: '', syllabus: '', mentorId: '', course: '', 
          admissionDate: new Date().toISOString().split('T')[0],
          schoolName: '', preferredLanguage: '', country: '',
          totalFees: '', totalPaid: '', totalHours: '', nextInstallmentDate: '', 
          admissionType: 'new', registrationNumber: '', meetingLink: '',
          enrollmentType: 'Mentorship'
        });
        setSelectedSubjects([{ subject: '', dayConfigs: [], facultyId: '', facultyName: '', hourlyRate: '', availableFaculties: [] }]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register student');
    } finally {
      setLoading(false);
    }
  };

  const submitFaculty = async (e) => {
    e.preventDefault();
    if (facultyForm.password && facultyForm.password !== facultyForm.confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    setLoading(true);
    try {
      const res = await api.post('/academic-head/register-faculty', facultyForm);
      if (res.data.success) {
        toast.success('Faculty Account Created Successfully!');
        setFacultyForm({
          name: '', email: '', phone_number: '', place: '', password: '', confirmPassword: '',
          faculty_id_card: '', section: '', syllabus: [], languages_proficiency: [],
          qualification: '', experience: '', availability: '', hourly_rate: '',
          teaching_mode: 'Both', joining_date: new Date().toISOString().split('T')[0], remarks: '', primary_subject: '', secondary_subjects: []
        });
        fetchDropdowns();
      }
    } finally {
      setLoading(false);
    }
  };

  const submitSSC = async (e) => {
    e.preventDefault();
    if (sscForm.password && sscForm.password !== sscForm.confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    setLoading(true);
    try {
      const res = await api.post('/academic-head/register-ssc', sscForm);
      if (res.data.success) {
        toast.success('SSC Account Created Successfully!');
        setSscForm({
          name: '', email: '', phone_number: '', place: '', password: '', confirmPassword: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register SSC');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 md:px-8 py-4 bg-slate-50/50 min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="bg-white p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] shadow-sm border border-slate-100 mb-6 md:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Onboarding Gateway</h1>
            <p className="text-slate-500 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mt-1">Unified registration portal for students and faculty</p>
          </div>
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#008080]/10 rounded-2xl flex items-center justify-center text-[#008080] rotate-3 shrink-0">
            <UserPlus size={20} className="md:w-6 md:h-6" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-slate-200/50 p-1.5 rounded-2xl w-fit mx-auto shadow-inner">
          {[
            { id: 'student', label: 'Student' },
            { id: 'faculty', label: 'Faculty Registration' },
            { id: 'ssc', label: 'SSC' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === tab.id
                ? 'bg-white text-[#008080] shadow-sm scale-100'
                : 'text-slate-500 hover:text-slate-800 scale-95'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Formal Registration Container */}
        <div className="bg-white p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] shadow-[0_10px_40px_rgba(0,128,128,0.05)] border border-slate-100">
          {activeTab === 'student' && (
            <form onSubmit={submitStudent} className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
                <div className="w-8 h-8 bg-[#008080] text-white rounded-lg flex items-center justify-center">
                  <GraduationCap size={18} />
                </div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Normal Registration</h2>
              </div>
              {/* Top Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 mb-8 bg-[#008080]/5 p-6 rounded-3xl border border-[#008080]/20">
                ${admissionTypeMatch[0]}
                ${enrollmentPlanMatch[0].replace(' mt-8', ' mt-0').replace('{/* Enrollment Type Selection */}', '')}

                {(studentForm.admissionType === 'new' || studentForm.admissionType === 'rejoining') && (
                  <div className="col-span-1 md:col-span-2 pt-6 border-t border-[#008080]/10">
                    <h3 className="text-[10px] font-black text-[#008080] uppercase tracking-widest mb-4">Fee Configuration</h3>
                    ${feesMatch[0].replace(' mt-6', ' mt-0')}
                  </div>
                )}
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Student Name</label>
                  <div className="relative group">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors" />
                    <input type="text" name="name" required value={studentForm.name} onChange={handleStudentChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" placeholder="Full Name" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Email Address (Optional)</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors" />
                    <input type="email" name="email" value={studentForm.email} onChange={handleStudentChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" placeholder="Email Address (Optional)" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Login Password (Optional)</label>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors" />
                    <input type="password" name="password" value={studentForm.password} onChange={handleStudentChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Confirm Password (Optional)</label>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors" />
                    <input type="password" name="confirmPassword" value={studentForm.confirmPassword} onChange={handleStudentChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Contact Number</label>
                  <div className="relative group">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors" />
                    <input type="tel" name="contact" value={studentForm.contact} onChange={handleStudentChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" placeholder="Phone Number" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Date of Admission</label>
                  <div className="relative group">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors" />
                    <input type="date" name="admissionDate" value={studentForm.admissionDate} onChange={handleStudentChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Current School Name</label>
                  <input type="text" name="schoolName" value={studentForm.schoolName} onChange={handleStudentChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" placeholder="E.g. Model Excellence School" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Preferred Language</label>
                  <select name="preferredLanguage" value={studentForm.preferredLanguage} onChange={handleStudentChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold appearance-none">
                    <option value="">Select Language</option>
                    <option value="Eng">Eng</option>
                    <option value="BL-AD">BL-AD</option>
                    <option value="BL-SM">BL-SM</option>
                    <option value="MLM">MLM</option>
                    <option value="HIN">HIN</option>
                    <option value="TML">TML</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Country</label>
                  <div className="relative group">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors" />
                    <input type="text" name="country" value={studentForm.country} onChange={handleStudentChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" placeholder="E.g. UAE, India" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Next Installment Date</label>
                  <input type="date" name="nextInstallmentDate" value={studentForm.nextInstallmentDate} onChange={handleStudentChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" />
                </div>
              </div>

              

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Grade</label>
                  <select name="grade" required value={studentForm.grade} onChange={handleStudentChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold appearance-none">
                    <option value="" disabled>Select Grade</option>
                    <option value="KG 1">KG 1</option>
                    <option value="KG 2">KG 2</option>
                    {[...Array(12)].map((_, i) => (
                      <option key={i + 1} value={`Class ${i + 1}`}>Class {i + 1}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Syllabus</label>
                  <select name="syllabus" required value={studentForm.syllabus} onChange={handleStudentChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold appearance-none">
                    <option value="" disabled>Select Syllabus</option>
                    <option value="CBSE">CBSE</option>
                    <option value="STATE">STATE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="IGCSE">IGCSE</option>
                    <option value="IB">IB</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Course</label>
                  <select name="course" required value={studentForm.course} onChange={handleStudentChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold appearance-none">
                    <option value="" disabled>Select Course</option>
                    {coursesList.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Assigned Mentor</label>
                  <select name="mentorId" required value={studentForm.mentorId} onChange={handleStudentChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold appearance-none">
                    <option value="" disabled>Select Mentor</option>
                    {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Student ID #</label>
                  <input type="text" name="registrationNumber" value={studentForm.registrationNumber} onChange={handleStudentChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" placeholder="E.g. ST-2024-001" />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-6">
                <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Meeting Link</label>
                <input type="text" name="meetingLink" value={studentForm.meetingLink} onChange={handleStudentChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] font-bold" placeholder="Google Meet Link" />
              </div>

              

              {/* Multiple Subjects & Faculties */}
              <div className="mt-8 rounded-2xl border border-[#008080]/30 bg-[#008080]/5 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <label className="text-[10px] font-black text-[#0f172a] uppercase tracking-widest ml-1">Subjects & Assigned Faculties</label>
                    <p className="text-[10px] font-bold text-slate-700 ml-1 mt-1">Add one or more subject-faculty pairs for this student.</p>
                  </div>
                  <button type="button" onClick={addSubjectRow} className="text-[10px] font-black text-[#008080] uppercase tracking-widest hover:text-[#0f172a] transition-colors bg-white px-3 py-2 rounded-lg border border-[#008080]/40 w-fit">
                    + Add Subject
                  </button>
                </div>



                <div className="space-y-6">
                  {selectedSubjects.map((row, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/20 relative animate-in slide-in-from-right-4 duration-500 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
                        {/* Custom Subject Dropdown (Multiple Selection) */}
                        <div className="flex flex-col gap-2 relative" ref={el => subRefs.current[idx] = el}>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Subjects</label>
                          <div 
                            onClick={() => {
                              const newSubjects = [...selectedSubjects];
                              newSubjects[idx].isSubjectDropdownOpen = !newSubjects[idx].isSubjectDropdownOpen;
                              setSelectedSubjects(newSubjects);
                            }}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 cursor-pointer flex justify-between items-center"
                          >
                            <span className="truncate">
                              {Array.isArray(row.subject) && row.subject.length > 0 
                                  ? row.subject.join(', ') 
                                  : (typeof row.subject === 'string' && row.subject ? row.subject : 'Select Subjects')}
                            </span>
                            <span className="text-slate-400">▼</span>
                          </div>

                          {row.isSubjectDropdownOpen && (
                            <div className="absolute top-[100%] left-0 w-full bg-white border border-slate-100 rounded-2xl shadow-2xl z-[110] mt-1 p-3 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
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
                                      
                                      // Trigger debounced faculty fetch
                                      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
                                      fetchTimeoutRef.current = setTimeout(() => {
                                        fetchAvailableFaculties(idx, newSubjects[idx].subject, newSubjects[idx].dayConfigs);
                                      }, 500);
                                    }}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-[#008080]/10 text-[#008080]' : 'hover:bg-slate-50 text-slate-600'}`}
                                  >
                                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                                      {isSelected && <CheckCircle size={12} className="text-white" />}
                                    </div>
                                    <span className="text-[11px] font-bold uppercase tracking-tight">{sub}</span>
                                  </div>
                                );
                              })}
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSubjects = [...selectedSubjects];
                                  newSubjects[idx].isSubjectDropdownOpen = false;
                                  setSelectedSubjects(newSubjects);
                                }}
                                className="w-full mt-4 bg-[#008080] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#008080]/20 hover:scale-[1.02] transition-all"
                              >
                                Done
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Days Picker (Dropdown to toggle) */}
                        <div className="flex flex-col gap-2 relative" ref={el => dayRefs.current[idx] = el}>
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned Days</label>
                          <div 
                            onClick={() => {
                              const newSubjects = [...selectedSubjects];
                              newSubjects[idx].isDayDropdownOpen = !newSubjects[idx].isDayDropdownOpen;
                              setSelectedSubjects(newSubjects);
                            }}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-700 cursor-pointer flex justify-between items-center"
                          >
                            <span className="truncate">
                               {row.dayConfigs && row.dayConfigs.length > 0 
                                ? row.dayConfigs.map(c => `${c.day.substring(0, 3)} ${c.startTime || ''}${c.startTime && c.endTime ? ' - ' : ''}${c.endTime || ''}`).join(', ') 
                                : 'Add Days'}
                            </span>
                            <span className="text-slate-400">▼</span>
                          </div>
                          
                          {row.isDayDropdownOpen && (
                            <div 
                              className="absolute top-[100%] left-0 w-[320px] md:w-[400px] bg-white border border-slate-100 rounded-2xl shadow-2xl z-[100] mt-1 p-4 animate-in fade-in zoom-in-95 duration-200"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-3">
                                {DAYS_LIST.map(day => {
                                  const configIdx = row.dayConfigs?.findIndex(c => c.day === day);
                                  const isSelected = configIdx !== -1;
                                  return (
                                    <div 
                                      key={day} 
                                      className={`p-3 rounded-2xl transition-all border ${isSelected ? 'bg-[#008080]/5 border-[#008080]/20' : 'hover:bg-slate-50 border-transparent'}`}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div 
                                          className="flex items-center gap-3 cursor-pointer"
                                          onClick={() => handleDayToggle(idx, day)}
                                        >
                                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                                            {isSelected && <CheckCircle size={12} className="text-white" />}
                                          </div>
                                          <span className={`text-[11px] font-black uppercase tracking-tight ${isSelected ? 'text-[#008080]' : 'text-slate-600'}`}>{day}</span>
                                        </div>
                                        {isSelected && (
                                          <div className="flex items-center gap-1">
                                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Configured</span>
                                          </div>
                                        )}
                                      </div>

                                      {isSelected && (
                                        <div className="grid grid-cols-2 gap-2 mt-2 animate-in slide-in-from-top-1 duration-300">
                                          <div className="relative group/time">
                                            <input 
                                              type="text"
                                              placeholder="Start"
                                              value={row.dayConfigs[configIdx].startTime}
                                              onChange={(e) => handleDayTimeChange(idx, configIdx, 'startTime', e.target.value)}
                                              className="w-full bg-white p-2 pr-7 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border border-slate-200 focus:border-[#008080]"
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#008080] cursor-pointer" onClick={(e) => {
                                              document.querySelectorAll('.time-picker-dropdown').forEach(el => el.classList.add('hidden'));
                                              const picker = e.currentTarget.nextElementSibling;
                                              picker.classList.toggle('hidden');
                                            }}>
                                              <Clock size={12} />
                                            </div>
                                            <div className="time-picker-dropdown hidden absolute top-full left-0 w-full bg-white border border-slate-100 rounded-xl shadow-2xl z-[150] mt-1 p-1 max-h-40 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                              {TIME_SLOTS.map(t => (
                                                <div key={t} onClick={() => {
                                                  handleDayTimeChange(idx, configIdx, 'startTime', t);
                                                  document.querySelectorAll('.time-picker-dropdown').forEach(el => el.classList.add('hidden'));
                                                }} className="p-2 hover:bg-[#008080]/10 rounded-lg text-[9px] font-black cursor-pointer transition-colors uppercase">
                                                  {t}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                          <div className="relative group/time">
                                            <input 
                                              type="text"
                                              placeholder="End"
                                              value={row.dayConfigs[configIdx].endTime}
                                              onChange={(e) => handleDayTimeChange(idx, configIdx, 'endTime', e.target.value)}
                                              className="w-full bg-white p-2 pr-7 rounded-xl text-[9px] font-black uppercase tracking-widest outline-none border border-slate-200 focus:border-[#008080]"
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#008080] cursor-pointer" onClick={(e) => {
                                              document.querySelectorAll('.time-picker-dropdown').forEach(el => el.classList.add('hidden'));
                                              const picker = e.currentTarget.nextElementSibling;
                                              picker.classList.toggle('hidden');
                                            }}>
                                              <Clock size={12} />
                                            </div>
                                            <div className="time-picker-dropdown hidden absolute top-full left-0 w-full bg-white border border-slate-100 rounded-xl shadow-2xl z-[150] mt-1 p-1 max-h-40 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                              {TIME_SLOTS.map(t => (
                                                <div key={t} onClick={() => {
                                                  handleDayTimeChange(idx, configIdx, 'endTime', t);
                                                  document.querySelectorAll('.time-picker-dropdown').forEach(el => el.classList.add('hidden'));
                                                }} className="p-2 hover:bg-[#008080]/10 rounded-lg text-[9px] font-black cursor-pointer transition-colors uppercase">
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
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSubjects = [...selectedSubjects];
                                  newSubjects[idx].isDayDropdownOpen = false;
                                  setSelectedSubjects(newSubjects);
                                }}
                                className="w-full mt-4 bg-[#008080] text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#008080]/20 hover:scale-[1.02] transition-all"
                              >
                                Done
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Faculty Selector */}
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-black text-[#008080] uppercase tracking-widest ml-1">Assigned Faculty</label>
                          <select 
                            required 
                            value={row.facultyId} 
                            onChange={(e) => handleSubjectChange(idx, 'facultyId', e.target.value)} 
                            className="w-full p-4 bg-[#008080]/5 border border-[#008080]/20 rounded-2xl text-xs font-bold outline-none focus:ring-4 ring-[#008080]/10 appearance-none"
                          >
                            <option value="" disabled>
                              {(row.dayConfigs?.length === 0) ? 'Select Days First' : 'Select Faculty'}
                            </option>
                            {row.availableFaculties?.map(f => (
                              <option 
                                key={f.id} 
                                value={f.id} 
                                style={{ color: f.isAvailable ? 'inherit' : '#ef4444' }}
                              >
                                {f.name} {!f.isAvailable ? ' (NOT AVAILABLE)' : ''} {f.subject ? ` - [${f.subject}]` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-4">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hourly Rate:</label>
                           <input 
                              type="number" 
                              value={row.hourlyRate} 
                              onChange={(e) => handleSubjectChange(idx, 'hourlyRate', e.target.value)}
                              className="w-24 p-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[#008080]" 
                              placeholder="₹ 500"
                           />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            const newSubjects = [...selectedSubjects];
                            newSubjects.splice(idx, 1);
                            setSelectedSubjects(newSubjects);
                          }}
                          className="text-rose-500 hover:text-rose-700 p-2 transition-colors"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full mt-8 bg-slate-900 text-white p-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl hover:shadow-[#008080] flex items-center justify-center gap-3">
                {loading ? 'Processing...' : 'Register Student'}
                {!loading && <CheckCircle size={16} />}
              </button>
            </form>
          )}

          {activeTab === 'faculty' && (
            <form onSubmit={submitFaculty} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <ShieldCheck size={18} />
                </div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest">Faculty Onboarding System</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" />
                    <input type="text" name="name" required value={facultyForm.name} onChange={handleFacultyChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold" placeholder="Faculty Name" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" />
                    <input type="email" name="email" required value={facultyForm.email} onChange={handleFacultyChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold" placeholder="Email Address" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" />
                    <input type="tel" name="phone_number" required value={facultyForm.phone_number} onChange={handleFacultyChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold" placeholder="Phone Number" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Place / City</label>
                  <div className="relative group">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" />
                    <input type="text" name="place" required value={facultyForm.place} onChange={handleFacultyChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold" placeholder="Location" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Assign Login Password</label>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" />
                    <input type="password" name="password" required value={facultyForm.password} onChange={handleFacultyChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold" placeholder="••••••••" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" />
                    <input type="password" name="confirmPassword" required value={facultyForm.confirmPassword} onChange={handleFacultyChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              {/* Faculty Academic Section */}
              <div className="pt-8 border-t border-slate-100 space-y-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <BookOpen size={18} />
                  </div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Academic & Professional Profile</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Primary Subject</label>
                    <select name="primary_subject" value={facultyForm.primary_subject} onChange={handleFacultyChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold appearance-none text-black">
                      <option value="">Select Primary</option>
                      {SUBJECT_OPTIONS.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 relative" ref={secondaryRef}>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Secondary Subjects</label>
                    <div 
                      onClick={() => setFacultyForm(prev => ({ ...prev, isSecondaryDropdownOpen: !prev.isSecondaryDropdownOpen }))}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-black cursor-pointer flex justify-between items-center min-h-[46px]"
                    >
                      <span className="truncate max-w-[250px]">
                        {facultyForm.secondary_subjects.length > 0 ? facultyForm.secondary_subjects.join(', ') : 'Select Secondary Subjects'}
                      </span>
                      <span className="text-slate-400">▼</span>
                    </div>
                    
                    {facultyForm.isSecondaryDropdownOpen && (
                      <div className="absolute top-[100%] left-0 w-full bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] mt-1 p-2 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        {SUBJECT_OPTIONS.filter(s => s !== facultyForm.primary_subject).map(sub => (
                          <div 
                            key={sub} 
                            onClick={(e) => {
                              e.stopPropagation();
                              const current = facultyForm.secondary_subjects;
                              const updated = current.includes(sub) ? current.filter(s => s !== sub) : [...current, sub];
                              setFacultyForm(prev => ({ ...prev, secondary_subjects: updated }));
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${facultyForm.secondary_subjects.includes(sub) ? 'bg-[#008080]/10 text-[#008080]' : 'hover:bg-slate-50 text-slate-600'}`}
                          >
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${facultyForm.secondary_subjects.includes(sub) ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                              {facultyForm.secondary_subjects.includes(sub) && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <span className="text-xs font-bold">{sub}</span>
                          </div>
                        ))}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFacultyForm(prev => ({ ...prev, isSecondaryDropdownOpen: false }));
                          }}
                          className="w-full mt-3 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Confirm Selection
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Faculty ID #</label>
                    <input type="text" name="faculty_id_card" value={facultyForm.faculty_id_card} onChange={handleFacultyChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold" placeholder="FAC-ID-001" />
                  </div>

                  <div className="flex flex-col gap-2 relative" ref={sectionRef}>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Section Coverage</label>
                    <div 
                      onClick={() => setFacultyForm(prev => ({ ...prev, isSectionDropdownOpen: !prev.isSectionDropdownOpen }))}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-black cursor-pointer flex justify-between items-center min-h-[46px]"
                    >
                      <span className="truncate max-w-[250px]">
                        {facultyForm.section ? facultyForm.section : 'Select Sections'}
                      </span>
                      <span className="text-slate-400">▼</span>
                    </div>
                    
                    {facultyForm.isSectionDropdownOpen && (
                      <div className="absolute top-[100%] left-0 w-full bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] mt-1 p-2 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        {["KG", "LP", "UP", "HS", "HSS"].map(sec => (
                          <div 
                            key={sec} 
                            onClick={(e) => {
                              e.stopPropagation();
                              const current = facultyForm.section ? facultyForm.section.split(', ') : [];
                              const updated = current.includes(sec) ? current.filter(s => s !== sec) : [...current, sec];
                              setFacultyForm(prev => ({ ...prev, section: updated.join(', ') }));
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${facultyForm.section?.includes(sec) ? 'bg-[#008080]/10 text-[#008080]' : 'hover:bg-slate-50 text-slate-600'}`}
                          >
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${facultyForm.section?.includes(sec) ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                              {facultyForm.section?.includes(sec) && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <span className="text-xs font-bold">{sec}</span>
                          </div>
                        ))}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setFacultyForm(prev => ({ ...prev, isSectionDropdownOpen: false }));
                          }}
                          className="w-full mt-3 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                        >
                          Confirm Selection
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Highest Qualification</label>
                    <input type="text" name="qualification" value={facultyForm.qualification} onChange={handleFacultyChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold text-black" placeholder="E.g. MSc, BEd" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Experience (Years)</label>
                    <input type="text" name="experience" value={facultyForm.experience} onChange={handleFacultyChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold text-black" placeholder="E.g. 5 Years" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Teaching Mode</label>
                    <select name="teaching_mode" value={facultyForm.teaching_mode} onChange={handleFacultyChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold appearance-none text-black">
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Hourly Rate (₹) (Multiple Typing)</label>
                    <div className="relative group">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                      <input 
                        type="text" 
                        name="hourly_rate" 
                        value={facultyForm.hourly_rate} 
                        onChange={handleFacultyChange} 
                        className="w-full p-3 pl-10 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold text-black" 
                        placeholder="e.g. 500, 600, 750" 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Joining Date</label>
                    <div className="relative group">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" />
                      <input type="date" name="joining_date" value={facultyForm.joining_date} onChange={handleFacultyChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold text-black" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <div className="flex flex-col gap-2 relative" ref={syllabusRef}>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Syllabus Expertise</label>
                    <div 
                      onClick={() => setFacultyForm(prev => ({ ...prev, isSyllabusDropdownOpen: !prev.isSyllabusDropdownOpen }))}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-black cursor-pointer flex justify-between items-center min-h-[46px]"
                    >
                      <span className="truncate max-w-[250px]">
                        {facultyForm.syllabus?.length > 0 ? facultyForm.syllabus.join(', ') : 'Select Syllabus'}
                      </span>
                      <span className="text-slate-400">▼</span>
                    </div>
                    {facultyForm.isSyllabusDropdownOpen && (
                      <div className="absolute top-[100%] left-0 w-full bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] mt-1 p-2 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        {SYLLABUS_OPTIONS.map(syl => (
                          <div 
                            key={syl} 
                            onClick={(e) => {
                              e.stopPropagation();
                              const current = facultyForm.syllabus || [];
                              const updated = current.includes(syl) ? current.filter(s => s !== syl) : [...current, syl];
                              setFacultyForm(prev => ({ ...prev, syllabus: updated }));
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${facultyForm.syllabus?.includes(syl) ? 'bg-[#008080]/10 text-[#008080]' : 'hover:bg-slate-50 text-slate-600'}`}
                          >
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${facultyForm.syllabus?.includes(syl) ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                              {facultyForm.syllabus?.includes(syl) && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <span className="text-xs font-bold">{syl}</span>
                          </div>
                        ))}
                        <button onClick={(e) => { e.stopPropagation(); setFacultyForm(prev => ({ ...prev, isSyllabusDropdownOpen: false })); }} className="w-full mt-3 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Confirm</button>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 relative" ref={langRef}>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Language Proficiency</label>
                    <div 
                      onClick={() => setFacultyForm(prev => ({ ...prev, isLangDropdownOpen: !prev.isLangDropdownOpen }))}
                      className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-black cursor-pointer flex justify-between items-center min-h-[46px]"
                    >
                      <span className="truncate max-w-[250px]">
                        {facultyForm.languages_proficiency?.length > 0 ? facultyForm.languages_proficiency.map(id => LANG_OPTIONS.find(l => l.id === id)?.label || id).join(', ') : 'Select Languages'}
                      </span>
                      <span className="text-slate-400">▼</span>
                    </div>
                    {facultyForm.isLangDropdownOpen && (
                      <div className="absolute top-[100%] left-0 w-full bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] mt-1 p-2 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                        {LANG_OPTIONS.map(lang => (
                          <div 
                            key={lang.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              const current = facultyForm.languages_proficiency || [];
                              const updated = current.includes(lang.id) ? current.filter(id => id !== lang.id) : [...current, lang.id];
                              setFacultyForm(prev => ({ ...prev, languages_proficiency: updated }));
                            }}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${facultyForm.languages_proficiency?.includes(lang.id) ? 'bg-[#008080]/10 text-[#008080]' : 'hover:bg-slate-50 text-slate-600'}`}
                          >
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${facultyForm.languages_proficiency?.includes(lang.id) ? 'bg-[#008080] border-[#008080]' : 'border-slate-300'}`}>
                              {facultyForm.languages_proficiency?.includes(lang.id) && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <span className="text-xs font-bold">{lang.label}</span>
                          </div>
                        ))}
                        <button onClick={(e) => { e.stopPropagation(); setFacultyForm(prev => ({ ...prev, isLangDropdownOpen: false })); }} className="w-full mt-3 p-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Confirm</button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Availability (Time Slots)</label>
                    <div className="relative group">
                      <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600" />
                      <input type="text" name="availability" value={facultyForm.availability} onChange={handleFacultyChange} className="w-full p-3 pl-12 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold text-black" placeholder="E.g. 4PM - 9PM Weekdays" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Internal Remarks</label>
                    <textarea name="remarks" value={facultyForm.remarks} onChange={handleFacultyChange} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-emerald-100 font-bold resize-none h-[46px] text-black" placeholder="Additional notes about faculty expertise..." />
                  </div>
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full mt-8 bg-slate-900 text-white p-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-xl hover:shadow-emerald-100 flex items-center justify-center gap-3">
                {loading ? 'Processing...' : 'Securely Onboard Faculty'}
                {!loading && <CheckCircle size={16} />}
              </button>
            </form>
          )}

          {activeTab === 'ssc' && (
            <form onSubmit={submitSSC} className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500 pb-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">SSC Onboarding</h2>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Register Student Success Coordinator</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative group">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="text" name="name" required value={sscForm.name} onChange={handleSSCChange} className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 ring-indigo-500/10 transition-all text-black" placeholder="Enter full name" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="email" name="email" required value={sscForm.email} onChange={handleSSCChange} className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 ring-indigo-500/10 transition-all text-black" placeholder="email@example.com" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Phone Number</label>
                  <div className="relative group">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="tel" name="phone_number" required value={sscForm.phone_number} onChange={handleSSCChange} className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 ring-indigo-500/10 transition-all text-black" placeholder="Contact number" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Place / City</label>
                  <div className="relative group">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="text" name="place" required value={sscForm.place} onChange={handleSSCChange} className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 ring-indigo-500/10 transition-all text-black" placeholder="Work location" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Login Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="password" name="password" required value={sscForm.password} onChange={handleSSCChange} className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 ring-indigo-500/10 transition-all text-black" placeholder="••••••••" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="password" name="confirmPassword" required value={sscForm.confirmPassword} onChange={handleSSCChange} className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 ring-indigo-500/10 transition-all text-black" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <div className="pt-8 flex justify-end">
                <button 
                  disabled={loading} 
                  type="submit" 
                  className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                >
                  {loading ? 'Processing...' : 'Complete SSC Registration'}
                  {!loading && <CheckCircle size={18} />}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Registrations;
