import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    ScrollText, Search, User, Clock, Calendar, 
    ChevronLeft, ChevronRight, History, ExternalLink, 
    ArrowLeft, Users, ShieldAlert, CheckSquare, Filter, BookOpen,
    ChevronDown, SlidersHorizontal, X, SortAsc, CalendarClock
} from 'lucide-react';
import toast from 'react-hot-toast';

const DEEP_QUESTION_LABELS = {
    student_status_before: 'Student Status Before Session',
    main_problem: 'Main Problem/Concern Raised',
    root_cause: 'Root Cause of the Problem',
    mentor_guidance: 'Mentor Guidance / Advice Provided',
    action_plan: 'Agreed Action Plan / Next Steps',
    student_response: 'Student Response / Motivation Level',
    followup_required: 'Is Follow-up Required?',
    followup_when: 'Follow-up Date / Timeline',
    priority_tag: 'Priority Level (Category)',
    next_session_type: 'Next Session Scheduled Type',
    session_date: 'Session Date',
    main_issue: 'Main Issue',
    secondary_issue: 'Secondary Issue',
    weak_subject: 'Weak Subject',
    consistency_rating: 'Consistency Rating',
    focus_rating: 'Focus Rating',
    effort_level: 'Effort Level',
    homework_status: 'Homework Status',
    action_type: 'Action Type',
    action_details: 'Action Details',
    follow_up_required: 'Follow-up Required?',
    follow_up_date: 'Follow-up Date',
    priority: 'Priority',
    student_status: 'Student Status'
};

const MEDIUM_QUESTION_LABELS = {
    progress: 'Current Progress Status',
    class_attendance: 'Class Attendance Status',
    issue_found: 'Any Issues Found?',
    issue_category: 'Issue Category',
    quick_guidance: 'Quick Guidance Provided',
    next_task: 'Next Task / Action Required',
    upgrade_to_deep: 'Should Upgrade to DEEP Session?',
    next_session_type: 'Next Session Scheduled Type',
    connection_method: 'Connection Method',
    session_duration_minutes: 'Session Duration (Minutes)',
    focus_level: 'Focus Level',
    energy_level: 'Energy Level',
    stress_level: 'Stress Level',
    homework_status: 'Homework Status',
    revision_done: 'Revision Done',
    doubts_present: 'Doubts Present',
    main_issue: 'Main Issue',
    secondary_issue: 'Secondary Issue',
    weak_subject: 'Weak Subject',
    problem_clarity: 'Problem Clarity',
    action_type: 'Action Type',
    action_detail: 'Action Detail',
    action_specific: 'Action Specific / Task Assigned',
    student_engagement: 'Student Engagement',
    understanding_after_session: 'Understanding After Session',
    previous_task_status: 'Previous Task Status',
    followup_required: 'Follow-up Required?',
    followup_date: 'Follow-up Date',
    student_status: 'Student Status',
    session_quality_rating: 'Session Quality Rating'
};

const QUICK_QUESTION_LABELS = {
    availability: 'Call Availability Status',
    study_status: 'Today\'s Study Status',
    attendance: 'Attendance Confirmed',
    immediate_concern: 'Any Immediate Concerns?',
    motivation_given: 'Motivation/Encouragement Given?',
    quick_notes: 'Session Discussion Notes',
    next_session_type: 'Next Session Scheduled Type',
    connection_method: 'Connection Method',
    self_clarity: 'Self Clarity',
    confusing_topic: 'Confusing Topic',
    can_solve_independently: 'Can Solve Independently?',
    homework_status: 'Homework Status',
    homework_difficulty: 'Homework Difficulty',
    revision_quality: 'Revision Quality',
    confidence: 'Confidence Level',
    motivation_level: 'Motivation Level',
    exam_anxiety: 'Exam Anxiety',
    focus_level: 'Focus Level',
    student_requests: 'Student Requests',
    parent_update_priority: 'Parent Update Priority',
    mentor_action_needed: 'Mentor Action Needed',
    connected_today: 'Connected Today?'
};

const CommonInteractionLogs = ({ role }) => {
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'detail'
    const [activeTab, setActiveTab] = useState('student'); // 'student' or 'faculty'
    const [entities, setEntities] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [mentorFilter, setMentorFilter] = useState('all');
    const [mentors, setMentors] = useState([]);
    const [expandedLogId, setExpandedLogId] = useState(null);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [listDateFilter, setListDateFilter] = useState('all');
    const [listCustomRange, setListCustomRange] = useState({ start: '', end: '' });
    const [showListFilter, setShowListFilter] = useState(false);
    const [selectedLogTab, setSelectedLogTab] = useState('ALL');
    const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'
    const [staffTypeFilter, setStaffTypeFilter] = useState('all'); // 'all', 'mentor', 'faculty'

    // Dynamic API prefix based on role
    const getApiPrefix = () => {
        if (role === 'mentor_head') return '/mentor-head';
        if (role === 'academic_head') return '/academic-head';
        if (role === 'ssc') return '/ssc';
        return '/admin';
    };
    const apiPrefix = getApiPrefix();

    const groupLogsByDate = (logsList) => {
        const groups = {};
        const sorted = [...logsList].sort((a, b) => {
            const dateA = new Date(a.created_at || a.date).getTime();
            const dateB = new Date(b.created_at || b.date).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });
        
        sorted.forEach(log => {
            const d = new Date(log.created_at || log.date);
            const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
            const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const groupKey = `${weekday}, ${dateStr}`;
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(log);
        });
        return groups;
    };

    const isConductedByMentor = (log) => {
        if (activeTab === 'faculty') {
            return !!log.mentor_name;
        }
        if (!log.mentor_name) return false;
        return mentors.some(m => m.name && m.name.toLowerCase() === log.mentor_name.toLowerCase());
    };

    const isConductedByFaculty = (log) => {
        if (activeTab === 'faculty') {
            return !log.mentor_name && !!log.faculty_name;
        }
        if (!log.mentor_name) return false;
        return !mentors.some(m => m.name && m.name.toLowerCase() === log.mentor_name.toLowerCase());
    };

    useEffect(() => {
        fetchEntities();
        fetchMentors();
    }, [activeTab, role, listDateFilter, listCustomRange]);

    useEffect(() => {
        if (viewMode === 'detail' && selectedStudent) {
            fetchLogs();
        }
    }, [viewMode, selectedStudent, dateFilter, customRange, mentorFilter, role]);

    const fetchMentors = async () => {
        try {
            const endpoint = (role === 'mentor_head' || role === 'academic_head') 
                ? `${apiPrefix}/mentors-all` 
                : `${apiPrefix}/mentors`;
            const res = await api.get(endpoint);
            setMentors(res.data.data || []);
        } catch (error) {
            console.error("Error fetching mentors:", error);
        }
    };

    const fetchEntities = async () => {
        try {
            setLoading(true);
            let endpoint;
            const params = {
                startDate: listDateFilter === 'custom' ? listCustomRange.start : undefined,
                endDate: listDateFilter === 'custom' ? listCustomRange.end : undefined,
                dateFilter: listDateFilter !== 'all' ? listDateFilter : undefined
            };

            if (activeTab === 'student') {
                endpoint = (role === 'mentor_head' || role === 'academic_head') ? `${apiPrefix}/students-all` : `${apiPrefix}/students`;
            } else {
                if (role !== 'mentor_head' && role !== 'academic_head') {
                    endpoint = `${apiPrefix}/faculties`;
                } else {
                    endpoint = (role === 'mentor_head' || role === 'academic_head') ? `${apiPrefix}/mentors-all` : `${apiPrefix}/mentors`;
                }
            }
            const res = await api.get(endpoint, { params });
            setEntities(res.data.data || []);
        } catch (error) {
            toast.error(`Failed to load ${activeTab}s`);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = {
                dateFilter,
                startDate: customRange.start,
                endDate: customRange.end,
                mentor_id: mentorFilter !== 'all' ? mentorFilter : undefined,
                student_id: activeTab === 'student' ? selectedStudent.id : undefined,
                faculty_id: activeTab === 'faculty' ? selectedStudent.id : undefined
            };

            let endpoint;
            if (activeTab === 'student') {
                endpoint = `${apiPrefix}/student-logs`;
            } else {
                if (role === 'mentor_head') {
                    endpoint = `${apiPrefix}/mentor-logs`;
                } else {
                    endpoint = `${apiPrefix}/faculty-logs`;
                }
            }

            const res = await api.get(endpoint, { params });
            setLogs(res.data.data || []);
        } catch (error) {
            toast.error("Failed to load interaction history");
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = async (studentId = null) => {
        const loadingToast = toast.loading("Preparing CSV export...");
        try {
            const params = {
                dateFilter: studentId ? dateFilter : listDateFilter,
                startDate: studentId 
                    ? (dateFilter === 'custom' ? customRange.start : undefined)
                    : (listDateFilter === 'custom' ? listCustomRange.start : undefined),
                endDate: studentId 
                    ? (dateFilter === 'custom' ? customRange.end : undefined)
                    : (listDateFilter === 'custom' ? listCustomRange.end : undefined),
                student_id: studentId || undefined,
                mentor_id: studentId && mentorFilter !== 'all' ? mentorFilter : undefined
            };

            let endpoint;
            if (activeTab === 'student') {
                endpoint = `${apiPrefix}/student-logs`;
            } else {
                endpoint = role === 'mentor_head' ? `${apiPrefix}/mentor-logs` : `${apiPrefix}/faculty-logs`;
            }

            const res = await api.get(endpoint, { params });
            const exportData = res.data.data || [];

            if (exportData.length === 0) {
                toast.dismiss(loadingToast);
                toast.error("No logs found to export");
                return;
            }

            // Convert to CSV
            const headers = [
                "ID", "Date", "Student Name", "Mentor/Faculty Name", 
                "Source/Type", "Session Type", "Notes/Remarks", 
                "Understanding Level (%)", "Confidence (1-5)", "Stress Level",
                "Is Flagged", "Flag Reason", "Detailed Questionnaire Responses"
            ];

            const csvRows = [headers.join(",")];

            for (const item of exportData) {
                // Parse report_data for Questionnaire Answers
                let reportAnswersStr = "";
                if (item.report_data) {
                    try {
                        const parsed = typeof item.report_data === 'string' ? JSON.parse(item.report_data) : item.report_data;
                        reportAnswersStr = Object.entries(parsed)
                            .map(([k, v]) => {
                                let label = k.replace(/_/g, ' ');
                                label = label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                const sessionTypeUpper = (item.session_type || '').toUpperCase();
                                if (sessionTypeUpper === 'DEEP' && DEEP_QUESTION_LABELS[k]) {
                                    label = DEEP_QUESTION_LABELS[k];
                                } else if (sessionTypeUpper === 'MEDIUM' && MEDIUM_QUESTION_LABELS[k]) {
                                    label = MEDIUM_QUESTION_LABELS[k];
                                } else if (sessionTypeUpper === 'QUICK' && QUICK_QUESTION_LABELS[k]) {
                                    label = QUICK_QUESTION_LABELS[k];
                                }
                                return `${label}: ${v}`;
                            })
                            .join(" | ");
                    } catch (e) {}
                }

                // escape quotes and clean newlines
                const cleanStr = (val) => {
                    if (val === null || val === undefined) return "";
                    return String(val).replace(/"/g, '""').replace(/\r?\n|\r/g, " ");
                };

                const row = [
                    cleanStr(item.id),
                    cleanStr(item.created_at || item.date),
                    `"${cleanStr(item.student_name)}"`,
                    `"${cleanStr(item.mentor_name || item.faculty_name)}"`,
                    `"${cleanStr(item.source || item.type)}"`,
                    `"${cleanStr(item.session_type)}"`,
                    `"${cleanStr(item.mentor_notes || item.notes || item.remarks)}"`,
                    cleanStr(item.understanding_level),
                    cleanStr(item.student_confidence),
                    cleanStr(item.stress_level),
                    item.is_flagged ? "Yes" : "No",
                    `"${cleanStr(item.flag_reason)}"`,
                    `"${cleanStr(reportAnswersStr)}"`
                ];
                csvRows.push(row.join(","));
            }

            const csvContent = csvRows.join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            
            const fileName = studentId 
                ? `${selectedStudent?.name || 'student'}_interaction_logs.csv` 
                : `all_student_interaction_logs.csv`;
                
            link.setAttribute("download", fileName.toLowerCase().replace(/\s+/g, "_"));
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.dismiss(loadingToast);
            toast.success("CSV exported successfully");
        } catch (error) {
            console.error("Export failed:", error);
            toast.dismiss(loadingToast);
            toast.error("Failed to export logs");
        }
    };

    const resetFilters = () => {
        setDateFilter('all');
        setCustomRange({ start: '', end: '' });
        setMentorFilter('all');
        setSortOrder('newest');
        setStaffTypeFilter('all');
        setShowFilterPanel(false);
    };

    const resetListFilters = () => {
        setListDateFilter('all');
        setListCustomRange({ start: '', end: '' });
        setShowListFilter(false);
    };

    const filteredEntities = entities.filter(e => 
        (e.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.registration_number?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (viewMode === 'list') {
        return (
            <div className="space-y-8 animate-in fade-in duration-700">
                <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[40px] border border-white/60 shadow-xl flex flex-col md:flex-row justify-between items-center gap-8">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3 uppercase">Interaction Archive</h2>
                        <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.25em]">Centralized monitoring of academic & mentorship logs</p>
                    </div>
                    <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-full md:w-auto">
                        <button 
                            onClick={() => { setActiveTab('student'); resetListFilters(); }}
                            className={`flex-1 md:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'student' ? 'bg-white text-[#008080] shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Student Focus
                        </button>
                        <button 
                            onClick={() => { setActiveTab('faculty'); resetListFilters(); }}
                            className={`flex-1 md:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'faculty' ? 'bg-white text-purple-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Faculty Focus
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex flex-1 items-center gap-4">
                            <div className="relative flex-1 max-w-md group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#008080] transition-colors" size={18} />
                                <input 
                                    type="text"
                                    placeholder={`Search ${activeTab}s by name, email or ID...`}
                                    className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-xs font-bold focus:bg-white focus:ring-4 focus:ring-[#008080]/5 outline-none transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={() => setShowListFilter(!showListFilter)}
                                    className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${showListFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:border-[#008080]'}`}
                                >
                                    <CalendarClock size={16} />
                                    Date Filter
                                </button>
                                <button 
                                    onClick={() => exportToCSV()}
                                    className="flex items-center gap-3 px-6 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border bg-[#008080] text-white border-[#008080] hover:bg-[#006666] active:scale-95 shadow-sm"
                                >
                                    Export Logs
                                </button>
                                { listDateFilter !== 'all' && (
                                    <button 
                                        onClick={resetListFilters}
                                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                ) }
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Count:</span>
                            <span className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black border border-slate-100">{filteredEntities.length} Entities</span>
                        </div>
                    </div>

                    {showListFilter && (
                        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 animate-in slide-in-from-top-4 duration-500">
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-2">Time Filter:</span>
                                    {['all', 'today', 'week', 'month', 'custom'].map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setListDateFilter(opt)}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${listDateFilter === opt ? 'bg-[#008080] text-white shadow-md' : 'bg-white text-slate-500 border border-slate-100 hover:border-[#008080]/30'}`}
                                        >
                                            {opt.replace('all', 'Global')}
                                        </button>
                                    ))}
                                </div>
                                
                                {listDateFilter === 'custom' && (
                                    <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                                        <input 
                                            type="date"
                                            className="bg-white px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-[#008080]/5"
                                            value={listCustomRange.start}
                                            onChange={(e) => setListCustomRange({...listCustomRange, start: e.target.value})}
                                        />
                                        <span className="text-slate-300">to</span>
                                        <input 
                                            type="date"
                                            className="bg-white px-4 py-2 rounded-xl border border-slate-100 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-[#008080]/5"
                                            value={listCustomRange.end}
                                            onChange={(e) => setListCustomRange({...listCustomRange, end: e.target.value})}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Name</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Details</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Status</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-10 py-20 text-center">
                                            <div className="w-10 h-10 border-4 border-[#008080] border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        </td>
                                    </tr>
                                ) : filteredEntities.length > 0 ? (
                                    filteredEntities.map((entity) => (
                                        <tr 
                                            key={entity.id} 
                                            className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                                            onClick={() => { setSelectedStudent(entity); setViewMode('detail'); }}
                                        >
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg ${activeTab === 'student' ? 'bg-[#008080]' : 'bg-purple-600'}`}>
                                                        {entity.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{entity.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{entity.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'student' ? 'text-[#008080]' : 'text-purple-600'}`}>
                                                        {entity.course || entity.role || 'General'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        {entity.grade ? `Grade ${entity.grade}` : (entity.role === 'faculty' ? 'Teaching Faculty' : 'Staff/Coord')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${entity.status === 'active' || activeTab === 'student' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                                        {entity.status === 'active' ? 'Active' : (activeTab === 'student' ? 'Active Account' : 'Inactive')}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <button className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-sm border border-slate-100 bg-white ${activeTab === 'student' ? 'text-[#008080] group-hover:bg-[#008080] group-hover:text-white' : 'text-purple-600 group-hover:bg-purple-600 group-hover:text-white'}`}>
                                                    Access Timeline
                                                    <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-10 py-40 text-center">
                                            <History size={48} className="text-slate-200 mx-auto mb-6" />
                                            <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em]">No records found matching your search.</p>
                                            <button 
                                                onClick={resetListFilters}
                                                className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                                            >
                                                Clear Filters
                                            </button>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-700 pb-20">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => { setViewMode('list'); setSelectedStudent(null); resetFilters(); }}
                        className="w-16 h-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-[#008080] transition-all group flex items-center justify-center active:scale-90"
                    >
                        <ArrowLeft size={24} className="text-slate-400 group-hover:text-[#008080] transition-colors" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-[#008080]/10 text-[#008080] rounded-lg text-[8px] font-black uppercase tracking-widest border border-[#008080]/20">Active Audit</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedStudent.registration_number || selectedStudent.id}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            {selectedStudent.name || 'Unknown Entity'} 
                            <span className="text-slate-300 font-light mx-4">|</span> 
                            <span className={`${activeTab === 'student' ? 'text-[#008080]' : 'text-purple-600'}`}>
                                {activeTab === 'student' ? 'Mentorship Audit' : 'Academic Audit'}
                            </span>
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => exportToCSV(selectedStudent.id)}
                        className="flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border bg-[#008080] text-white border-[#008080] hover:bg-[#006666] active:scale-95"
                    >
                        Export Timeline
                    </button>
                    <button 
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${showFilterPanel ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:border-[#008080]'}`}
                    >
                        <SlidersHorizontal size={16} />
                        Custom Filter
                    </button>
                    
                    { (dateFilter !== 'all' || mentorFilter !== 'all' || sortOrder !== 'newest' || staffTypeFilter !== 'all') && (
                        <button 
                            onClick={resetFilters}
                            className="flex items-center gap-2 px-4 py-4 rounded-[1.5rem] bg-rose-50 text-rose-600 border border-rose-100 text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all"
                        >
                            <X size={14} />
                            Reset
                        </button>
                    ) }
                </div>
            </header>

            {showFilterPanel && (
                <div className="flex flex-col md:flex-row gap-8 p-10 bg-slate-900 rounded-[3.5rem] shadow-2xl animate-in slide-in-from-top-6 duration-700 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-2">Start Date</label>
                        <div className="relative group">
                            <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#008080] transition-colors" />
                            <input 
                                type="date" 
                                className="w-full bg-white/10 p-5 pl-14 rounded-[1.8rem] border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-white/5 transition-all"
                                value={customRange.start}
                                onChange={(e) => {
                                    setCustomRange({...customRange, start: e.target.value});
                                    setDateFilter('custom');
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex-1 w-full">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-2">End Date</label>
                        <div className="relative group">
                            <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#008080] transition-colors" />
                            <input 
                                type="date" 
                                className="w-full bg-white/10 p-5 pl-14 rounded-[1.8rem] border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-white/5 transition-all"
                                value={customRange.end}
                                onChange={(e) => {
                                    setCustomRange({...customRange, end: e.target.value});
                                    setDateFilter('custom');
                                }}
                            />
                        </div>
                    </div>

                    <div className="pb-1 px-4">
                        <button 
                            onClick={() => setShowFilterPanel(false)}
                            className="text-[9px] font-black text-[#008080] uppercase tracking-widest hover:text-white transition-colors h-12"
                        >
                            Collapse Panel
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-8">
                    <div className="w-16 h-16 border-4 border-[#008080] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,128,128,0.2)]"></div>
                    <div className="text-center">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-2">Loading Interaction History</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Fetching records from the database</p>
                    </div>
                </div>
            ) : logs.length > 0 ? (
                <div className="space-y-10">
                    {/* Interaction Type Tabs and Sort/Filter Controls */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50 p-4 rounded-[2.5rem]">
                        <div className="flex flex-wrap gap-3 bg-white p-2 rounded-[2rem] shadow-sm w-fit border border-slate-100">
                            {['ALL', 'QUICK', 'MEDIUM', 'DEEP'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setSelectedLogTab(tab)}
                                    className={`px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.15em] transition-all ${
                                        selectedLogTab === tab 
                                        ? 'bg-slate-900 text-white shadow-md scale-105' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                            {logs.some(l => !['QUICK', 'MEDIUM', 'DEEP'].includes((l.session_type || l.type || l.source || '').toUpperCase())) && (
                                <button
                                    onClick={() => setSelectedLogTab('OTHERS')}
                                    className={`px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.15em] transition-all ${
                                        selectedLogTab === 'OTHERS' 
                                        ? 'bg-slate-900 text-white shadow-md scale-105' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                >
                                    OTHERS
                                </button>
                            )}
                        </div>
                    </div>
 
                    <div className="grid grid-cols-1 gap-6">
                        {selectedLogTab === 'ALL' ? (
                            (() => {
                                const processedLogs = logs.filter(log => {
                                    if (staffTypeFilter === 'mentor') return isConductedByMentor(log);
                                    if (staffTypeFilter === 'faculty') return isConductedByFaculty(log);
                                    return true;
                                });
                                const grouped = groupLogsByDate(processedLogs);
                                const dateKeys = Object.keys(grouped).sort((a, b) => {
                                    const dateA = new Date(a.split(', ')[1].split('/').reverse().join('-'));
                                    const dateB = new Date(b.split(', ')[1].split('/').reverse().join('-'));
                                    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
                                });

                                if (dateKeys.length === 0) {
                                    return (
                                        <div className="py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">No interactions recorded for this timeline.</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-12">
                                        {dateKeys.map(dateKey => {
                                            const dayLogs = grouped[dateKey];
                                            return (
                                                <div key={dateKey} className="space-y-6">
                                                    {/* Day Header */}
                                                    <div className="bg-slate-900 text-white px-8 py-5 rounded-[2rem] flex items-center justify-between shadow-xl">
                                                        <div className="flex items-center gap-3">
                                                            <Calendar size={18} className="text-[#008080]" />
                                                            <span className="text-xs font-black uppercase tracking-wider">{dateKey}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-[#008080] uppercase tracking-widest bg-[#008080]/10 px-4 py-1.5 rounded-xl border border-[#008080]/20">{dayLogs.length} Interactions</span>
                                                    </div>

                                                    {/* Timeline list of day's logs */}
                                                    <div className="space-y-4">
                                                        {dayLogs.map((log) => (
                                                            <div key={log.id} className="flex flex-col md:flex-row gap-6 pl-4 md:pl-8 relative border-l-2 border-slate-100 py-4 last:border-l-transparent">
                                                                {/* Exact Time Highlighted */}
                                                                <div className="shrink-0 w-32 flex flex-col items-start pt-2">
                                                                    <span className="inline-block px-3.5 py-2 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-wide shadow-md border border-slate-800">
                                                                        {new Date(log.created_at || log.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                                    </span>
                                                                    <div className="mt-2 text-[9px] font-black uppercase tracking-widest text-[#008080] leading-tight pl-1 max-w-[120px] break-words">
                                                                        {(role === 'super_admin' || role === 'mentor_head') 
                                                                            ? (log.mentor_name || log.faculty_name || 'Not Specified') 
                                                                            : (log.mentor_name || 'Mentor')}
                                                                    </div>
                                                                </div>

                                                                {/* Full Details Display */}
                                                                <div 
                                                                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                                                    className={`flex-1 bg-white rounded-[2.5rem] border transition-all relative overflow-hidden group cursor-pointer p-8 ${
                                                                        expandedLogId === log.id 
                                                                        ? 'ring-4 ring-slate-900/5 border-slate-900 shadow-2xl' 
                                                                        : 'border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-300'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between mb-4">
                                                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                                                                            (log.session_type || log.type || '').toUpperCase() === 'DEEP' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                                            (log.session_type || log.type || '').toUpperCase() === 'MEDIUM' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                                                            'bg-emerald-50 text-[#008080] border-emerald-100'
                                                                        }`}>
                                                                            {(log.session_type || log.type || 'QUICK').toUpperCase()}
                                                                        </span>
                                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                                                                            expandedLogId === log.id 
                                                                            ? 'bg-slate-900 text-white rotate-180 scale-110 shadow-lg' 
                                                                            : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                                                                        }`}>
                                                                            <ChevronDown size={18} strokeWidth={3} />
                                                                        </div>
                                                                    </div>

                                                                    {/* Notes Preview when collapsed, or full detail section when expanded */}
                                                                    {expandedLogId !== log.id ? (
                                                                        <div className="mb-2">
                                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Notes Preview</p>
                                                                            <p className="text-sm font-bold text-slate-500 leading-relaxed italic truncate">
                                                                                "{log.mentor_notes || log.notes || log.remarks || 'No notes provided.'}"
                                                                            </p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="mt-6 pt-6 border-t border-slate-100 space-y-8 animate-in slide-in-from-top-4 duration-500">
                                                                            {/* Narrative Section */}
                                                                            <div className="relative">
                                                                                <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-900 rounded-full opacity-10"></div>
                                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                                                    <ScrollText size={12} /> Detailed Notes
                                                                                </p>
                                                                                <div className="text-sm font-bold text-slate-700 leading-relaxed p-8 bg-slate-50 rounded-[2rem] border border-slate-100 relative shadow-inner">
                                                                                    <div className="absolute top-4 left-4 opacity-5">
                                                                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21C21.017 22.1046 20.1216 23 19.017 23H16.017C14.9124 23 14.017 22.1046 14.017 21ZM14.017 21V18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21C21.017 22.1046 20.1216 23 19.017 23H16.017C14.9124 23 14.017 22.1046 14.017 21ZM3 18C3 16.8954 3.89543 16 5 16H8C9.10457 16 10 16.8954 10 18V21C10 22.1046 9.10457 23 8 23H5C3.89543 23 3 22.1046 3 21V18ZM3 18V16C3 13.7909 4.79086 12 7 12H10V14H7C5.89543 14 5 14.8954 5 16V18H3Z"/></svg>
                                                                                    </div>
                                                                                    {log.mentor_notes || log.notes || log.remarks || 'No notes provided for this session.'}
                                                                                </div>
                                                                            </div>

                                                                            {/* Questionnaire Section */}
                                                                            {(() => {
                                                                                let parsedReportData = null;
                                                                                if (log.report_data) {
                                                                                    try {
                                                                                        parsedReportData = typeof log.report_data === 'string' ? JSON.parse(log.report_data) : log.report_data;
                                                                                    } catch (e) {
                                                                                        console.error("Failed to parse report_data:", e);
                                                                                    }
                                                                                }
                                                                                if (!parsedReportData) return null;
                                                                                return (
                                                                                    <div className="space-y-4">
                                                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                                            <BookOpen size={12} /> Questionnaire Responses
                                                                                        </p>
                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                            {Object.entries(parsedReportData).map(([key, val]) => {
                                                                                                if (['notes', 'quick_notes', 'notes_text'].includes(key)) return null; 
                                                                                                let label = key.replace(/_/g, ' ');
                                                                                                label = label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                                                                                
                                                                                                const sessionTypeUpper = (log.session_type || '').toUpperCase();
                                                                                                if (sessionTypeUpper === 'DEEP' && DEEP_QUESTION_LABELS[key]) {
                                                                                                    label = DEEP_QUESTION_LABELS[key];
                                                                                                } else if (sessionTypeUpper === 'MEDIUM' && MEDIUM_QUESTION_LABELS[key]) {
                                                                                                    label = MEDIUM_QUESTION_LABELS[key];
                                                                                                } else if (sessionTypeUpper === 'QUICK' && QUICK_QUESTION_LABELS[key]) {
                                                                                                    label = QUICK_QUESTION_LABELS[key];
                                                                                                }
                                                                                                
                                                                                                if (val === null || val === undefined || val === '') return null;

                                                                                                return (
                                                                                                    <div key={key} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col gap-2 shadow-inner">
                                                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                                                                                                        <span className="text-sm font-bold text-slate-800 leading-relaxed">{String(val)}</span>
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })()}

                                                                            {/* Metrics Grid */}
                                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                                                {Object.entries(log).map(([key, val]) => {
                                                                                    if (['mentor_notes', 'notes', 'remarks', 'student_id', 'mentor_id', 'id', 'created_at', 'date', 'student_name', 'mentor_name', 'source', 'type', 'session_type', 'session_number', 'report_data'].includes(key)) return null;
                                                                                    if (val === null || val === undefined || val === '') return null;
                                                                                    return (
                                                                                        <div key={key} className="p-5 bg-white border border-slate-100 rounded-3xl flex flex-col gap-1.5 shadow-sm hover:border-[#008080]/30 transition-colors">
                                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                                                                                            <span className="text-xs font-black text-[#008080] uppercase truncate">{String(val)}</span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                                {log.understanding_level !== undefined && log.understanding_level !== null && (
                                                                                    <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col gap-1.5 shadow-sm">
                                                                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Understanding Level</span>
                                                                                        <span className="text-lg font-black text-emerald-700">{log.understanding_level}%</span>
                                                                                    </div>
                                                                                )}
                                                                                {log.student_confidence !== undefined && log.student_confidence !== null && (
                                                                                    <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col gap-1.5 shadow-sm text-white">
                                                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Self Confidence</span>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <span className="text-lg font-black">{log.student_confidence}</span>
                                                                                            <div className="flex gap-0.5">
                                                                                                {[...Array(5)].map((_, i) => (
                                                                                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < log.student_confidence ? 'bg-[#008080]' : 'bg-white/20'}`}></div>
                                                                                                ))}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()
                        ) : (
                            logs.filter(log => {
                                const type = (log.session_type || log.type || log.source || 'QUICK').toUpperCase();
                                if (selectedLogTab === 'OTHERS') {
                                    if (['QUICK', 'MEDIUM', 'DEEP'].includes(type)) return false;
                                } else {
                                    if (!type.includes(selectedLogTab)) return false;
                                }
                                if (staffTypeFilter === 'mentor') return isConductedByMentor(log);
                                if (staffTypeFilter === 'faculty') return isConductedByFaculty(log);
                                return true;
                            }).length > 0 ? (
                                logs.filter(log => {
                                    const type = (log.session_type || log.type || log.source || 'QUICK').toUpperCase();
                                    if (selectedLogTab === 'OTHERS') {
                                        if (['QUICK', 'MEDIUM', 'DEEP'].includes(type)) return false;
                                    } else {
                                        if (!type.includes(selectedLogTab)) return false;
                                    }
                                    if (staffTypeFilter === 'mentor') return isConductedByMentor(log);
                                    if (staffTypeFilter === 'faculty') return isConductedByFaculty(log);
                                    return true;
                                }).sort((a, b) => {
                                    const timeA = new Date(a.created_at || a.date).getTime();
                                    const timeB = new Date(b.created_at || b.date).getTime();
                                    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
                                }).map((log) => (
                                <div 
                                    key={log.id} 
                                    className={`bg-white rounded-[2.5rem] border transition-all relative overflow-hidden group ${
                                        expandedLogId === log.id 
                                        ? 'ring-4 ring-slate-900/5 border-slate-900 shadow-2xl' 
                                        : 'border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-300'
                                    }`}
                                >
                                    <div 
                                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                        className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 cursor-pointer"
                                    >
                                        {/* Date & Time Highlight */}
                                        <div className="flex items-center gap-6 shrink-0">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                                                selectedLogTab === 'QUICK' ? 'bg-[#008080]' : selectedLogTab === 'MEDIUM' ? 'bg-purple-600' : 'bg-pink-600'
                                            }`}>
                                                <CalendarClock size={24} strokeWidth={2.5} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900 leading-none mb-1.5 uppercase tracking-tight bg-slate-100 px-3 py-1 rounded-lg">
                                                    {new Date(log.created_at || log.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                                                </span>
                                                <span className="text-[10px] font-bold text-[#008080] uppercase tracking-widest pl-1">
                                                    {new Date(log.created_at || log.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Mentor/Faculty Identity */}
                                        <div className="flex-1 border-x border-slate-100 px-8 hidden md:block">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg">
                                                    {((role === 'super_admin' || role === 'mentor_head') 
                                                        ? (log.mentor_name || log.faculty_name || 'M') 
                                                        : (log.mentor_name || 'M')).charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Conducted By</p>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-[#008080] transition-colors">
                                                        {(role === 'super_admin' || role === 'mentor_head') 
                                                            ? (log.mentor_name || log.faculty_name || 'Not Specified') 
                                                            : (log.mentor_name || 'Academic Mentor')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-6">
                                            <div className="text-right hidden sm:block">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase border border-emerald-100">Synchronized</span>
                                            </div>
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                                expandedLogId === log.id 
                                                ? 'bg-slate-900 text-white rotate-180 scale-110 shadow-xl shadow-slate-900/20' 
                                                : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                                            }`}>
                                                <ChevronDown size={20} strokeWidth={3} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content (Accordion) */}
                                    {expandedLogId === log.id && (
                                        <div className="px-8 pb-8 animate-in slide-in-from-top-4 duration-500">
                                            <div className="pt-8 border-t border-slate-100 space-y-8">
                                                {/* Narrative Section */}
                                                <div className="relative">
                                                    <div className="absolute -left-4 top-0 bottom-0 w-1 bg-slate-900 rounded-full opacity-10"></div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                        <ScrollText size={12} /> Detailed Notes
                                                    </p>
                                                    <div className="text-sm font-bold text-slate-700 leading-relaxed p-8 bg-slate-50 rounded-[2rem] border border-slate-100 relative shadow-inner">
                                                        <div className="absolute top-4 left-4 opacity-5">
                                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21C21.017 22.1046 20.1216 23 19.017 23H16.017C14.9124 23 14.017 22.1046 14.017 21ZM14.017 21V18C14.017 16.8954 14.9124 16 16.017 16H19.017C20.1216 16 21.017 16.8954 21.017 18V21C21.017 22.1046 20.1216 23 19.017 23H16.017C14.9124 23 14.017 22.1046 14.017 21ZM3 18C3 16.8954 3.89543 16 5 16H8C9.10457 16 10 16.8954 10 18V21C10 22.1046 9.10457 23 8 23H5C3.89543 23 3 22.1046 3 21V18ZM3 18V16C3 13.7909 4.79086 12 7 12H10V14H7C5.89543 14 5 14.8954 5 16V18H3Z"/></svg>
                                                        </div>
                                                        {log.mentor_notes || log.notes || log.remarks || 'No notes provided for this session.'}
                                                    </div>
                                                </div>

                                                {/* Questionnaire Section */}
                                                {(() => {
                                                    let parsedReportData = null;
                                                    if (log.report_data) {
                                                        try {
                                                            parsedReportData = typeof log.report_data === 'string' ? JSON.parse(log.report_data) : log.report_data;
                                                        } catch (e) {
                                                            console.error("Failed to parse report_data:", e);
                                                        }
                                                    }
                                                    if (!parsedReportData) return null;
                                                    return (
                                                        <div className="space-y-4">
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                                <BookOpen size={12} /> Questionnaire Responses
                                                            </p>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                {Object.entries(parsedReportData).map(([key, val]) => {
                                                                    if (['notes', 'quick_notes', 'notes_text'].includes(key)) return null; 
                                                                    let label = key.replace(/_/g, ' ');
                                                                    label = label.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                                                                    
                                                                    const sessionTypeUpper = (log.session_type || '').toUpperCase();
                                                                    if (sessionTypeUpper === 'DEEP' && DEEP_QUESTION_LABELS[key]) {
                                                                        label = DEEP_QUESTION_LABELS[key];
                                                                    } else if (sessionTypeUpper === 'MEDIUM' && MEDIUM_QUESTION_LABELS[key]) {
                                                                        label = MEDIUM_QUESTION_LABELS[key];
                                                                    } else if (sessionTypeUpper === 'QUICK' && QUICK_QUESTION_LABELS[key]) {
                                                                        label = QUICK_QUESTION_LABELS[key];
                                                                    }
                                                                    
                                                                    if (val === null || val === undefined || val === '') return null;

                                                                    return (
                                                                        <div key={key} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col gap-2 shadow-inner">
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                                                                            <span className="text-sm font-bold text-slate-800 leading-relaxed">{String(val)}</span>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}

                                                {/* Metrics Grid */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {Object.entries(log).map(([key, val]) => {
                                                        if (['mentor_notes', 'notes', 'remarks', 'student_id', 'mentor_id', 'id', 'created_at', 'date', 'student_name', 'mentor_name', 'source', 'type', 'session_type', 'session_number', 'report_data'].includes(key)) return null;
                                                        if (val === null || val === undefined || val === '') return null;
                                                        return (
                                                            <div key={key} className="p-5 bg-white border border-slate-100 rounded-3xl flex flex-col gap-1.5 shadow-sm hover:border-[#008080]/30 transition-colors">
                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                                                                <span className="text-xs font-black text-[#008080] uppercase truncate">{String(val)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {log.understanding_level !== undefined && log.understanding_level !== null && (
                                                        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-3xl flex flex-col gap-1.5 shadow-sm">
                                                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Understanding Level</span>
                                                            <span className="text-lg font-black text-emerald-700">{log.understanding_level}%</span>
                                                        </div>
                                                    )}
                                                    {log.student_confidence !== undefined && log.student_confidence !== null && (
                                                        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col gap-1.5 shadow-sm text-white">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Self Confidence</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-lg font-black">{log.student_confidence}</span>
                                                                <div className="flex gap-0.5">
                                                                    {[...Array(5)].map((_, i) => (
                                                                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < log.student_confidence ? 'bg-[#008080]' : 'bg-white/20'}`}></div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className="py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 font-black text-xs uppercase tracking-[0.2em]">No {selectedLogTab} sequences identified for this timeline</p>
                            </div>
                        )
                        )}
                    </div>
                </div>
            ) : (
                <div className="py-60 text-center bg-white/50 backdrop-blur-sm rounded-[5rem] border-2 border-dashed border-slate-200 animate-in zoom-in duration-1000">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8 border border-slate-100 shadow-inner">
                        <History size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No Sessions Found</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 max-w-md mx-auto leading-loose">
                        No interaction logs found for this user.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CommonInteractionLogs;
