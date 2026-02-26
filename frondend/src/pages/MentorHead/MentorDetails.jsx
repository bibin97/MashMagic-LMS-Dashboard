import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    User,
    Phone,
    MapPin,
    Calendar,
    ArrowLeft,
    ScrollText,
    GraduationCap,
    CheckCircle2,
    Clock,
    Loader2,
    BookOpen,
    Search,
    Filter,
    ChevronRight,
    Activity,
    ShieldCheck,
    Users,
    AlertCircle,
    History
} from 'lucide-react';
import toast from 'react-hot-toast';

const MentorDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mentorData, setMentorData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('student');

    // Search & Filter States
    const [studentSearch, setStudentSearch] = useState('');
    const [studentFilter, setStudentFilter] = useState('all');
    const [logSearch, setLogSearch] = useState('');

    useEffect(() => {
        const fetchMentorDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const [detailsRes, monitoringRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/mentor-head/mentor/${id}/details`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`http://localhost:5000/api/mentor-head/mentors/${id}/monitoring`, { headers: { Authorization: `Bearer ${token}` } })
                ]);

                if (detailsRes.data.success && monitoringRes.data.success) {
                    setMentorData({
                        ...detailsRes.data.data,
                        monitoring: monitoringRes.data.data
                    });
                }
            } catch (error) {
                console.error('Error details:', error);
                toast.error("Failed to fetch mentor details");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchMentorDetails();
    }, [id]);

    const enrichedStudents = useMemo(() => {
        if (!mentorData) return [];
        const { assignedStudents, logs, facultyLogs } = mentorData;

        return assignedStudents.map(student => {
            const studentLogs = logs.filter(l => l.student_id === student.id);
            const studentFacultyLogs = facultyLogs.filter(l => l.student_id === student.id);
            const lastLog = studentLogs.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

            return {
                ...student,
                lastInteractionDate: lastLog ? lastLog.date : null,
                totalInteractions: studentLogs.length,
                verificationCount: studentFacultyLogs.length
            };
        });
    }, [mentorData]);

    const filteredStudents = useMemo(() => {
        return enrichedStudents.filter(s => {
            const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                s.faculty_name?.toLowerCase().includes(studentSearch.toLowerCase());
            const matchesFilter = studentFilter === 'all' || s.onboarding_status === studentFilter;
            return matchesSearch && matchesFilter;
        });
    }, [enrichedStudents, studentSearch, studentFilter]);

    const filteredLogs = useMemo(() => {
        if (!mentorData) return [];
        const currentLogs = activeTab === 'student' ? mentorData.logs : mentorData.facultyLogs;

        return currentLogs.filter(log => {
            const matchesSearch = log.student_name?.toLowerCase().includes(logSearch.toLowerCase()) ||
                (log.details || log.notes || log.chapter)?.toLowerCase().includes(logSearch.toLowerCase());
            return matchesSearch;
        });
    }, [mentorData, activeTab, logSearch]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <Activity className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={20} />
                </div>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest animate-pulse">Syncing Dashboard...</p>
            </div>
        );
    }

    if (!mentorData) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-6">
                <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-xl shadow-rose-100">
                    <AlertCircle size={48} />
                </div>
                <div className="text-center">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Mentor Not Found</h2>
                    <p className="text-slate-500 font-bold mt-2">The record you are looking for does not exist or has been removed.</p>
                </div>
                <button
                    onClick={() => navigate(-1)}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-105 transition-transform"
                >
                    Return to Directory
                </button>
            </div>
        );
    }

    const { profile, logs, facultyLogs, monitoring } = mentorData;
    const totalStudentsCount = monitoring?.assignedStudents?.length || 0;
    const connectedToday = monitoring?.todayConnectionCount || 0;
    const progressPercent = totalStudentsCount > 0 ? (connectedToday / totalStudentsCount) * 100 : 0;

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Navigation */}
            <div className="flex items-center justify-between px-4">
                <button
                    onClick={() => navigate(-1)}
                    className="group flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-all font-bold uppercase tracking-widest text-[10px]"
                >
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                        <ArrowLeft size={14} />
                    </div>
                    Back to List
                </button>
                <div className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
                    <User size={14} className="opacity-70" />
                    Mentor Profile
                </div>
            </div>

            {/* SECTION 1: PROFILE HEADER + ACTIVITY SCORE */}
            <div className="flex flex-col xl:flex-row gap-8">
                {/* Profile Card */}
                <div className="flex-grow bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 rounded-full -mr-40 -mt-40 blur-3xl opacity-60"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                            <div className="w-40 h-40 bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-2xl relative z-10">
                                {profile.name.charAt(0)}
                            </div>
                        </div>

                        <div className="text-center md:text-left">
                            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
                                <div className={`w-2 h-2 rounded-full ${profile.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{profile.status} Member</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-6">
                                {profile.name}
                            </h1>

                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <div className="flex items-center gap-3 text-slate-600 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                                    <Phone size={14} className="text-indigo-500" />
                                    <span className="text-xs font-bold font-mono tracking-wider">{profile.phone_number || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                                    <MapPin size={14} className="text-indigo-500" />
                                    <span className="text-xs font-bold uppercase tracking-widest">{profile.place || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 bg-white px-5 py-3 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-colors">
                                    <Calendar size={14} className="text-indigo-500" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Activity Score Card */}
                <div className="w-full xl:w-[450px] bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl shadow-indigo-900/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="relative z-10 space-y-10">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Real-time Metrics</p>
                                <h3 className="text-2xl font-black text-white">Activity Score</h3>
                            </div>
                            <div className="p-3 bg-white/5 rounded-2xl backdrop-blur-md">
                                <Activity size={20} className="text-indigo-400" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Total Connections</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-indigo-400">{monitoring?.monthlyConnections || 0}</span>
                                    <span className="text-[10px] font-bold text-slate-600 uppercase">/ Month</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2">Daily Goal</p>
                                <div className="flex items-baseline justify-end gap-1">
                                    <span className="text-4xl font-black text-white">{connectedToday}</span>
                                    <span className="text-xl font-bold text-slate-600">/ {totalStudentsCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marking Progress</span>
                                <span className="text-lg font-black text-indigo-400">{progressPercent.toFixed(0)}%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-emerald-400 via-indigo-500 to-purple-600 transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION 2: KPI SUMMARY ROW */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Students', value: totalStudentsCount, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', unit: 'Members' },
                    { label: 'Connected Today', value: connectedToday, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', unit: 'Sessions' },
                    { label: 'Total Interactions', value: logs.length, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50', unit: 'Logs' },
                    { label: 'Total Verifications', value: facultyLogs?.length || 0, icon: ShieldCheck, color: 'text-purple-600', bg: 'bg-purple-50', unit: 'Checks' }
                ].map((kpi, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-6">
                            <div className={`w-14 h-14 ${kpi.bg} rounded-2xl flex items-center justify-center ${kpi.color} group-hover:scale-110 transition-transform`}>
                                <kpi.icon size={26} />
                            </div>
                            <ChevronRight size={18} className="text-slate-200 group-hover:text-indigo-300 transition-colors" />
                        </div>
                        <div className="flex justify-between items-baseline mb-1">
                            <span className="text-4xl font-black text-slate-900">{kpi.value}</span>
                            <span className="text-[10px] font-black text-slate-300 uppercase">{kpi.unit}</span>
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</div>
                    </div>
                ))}
            </div>

            {/* SECTION 3: ASSIGNED STUDENTS & FACULTY (FULL WIDTH) */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50/20">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl shadow-slate-200/50">
                            <GraduationCap size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Assigned Students & Faculty</h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Portfolio Management</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <div className="relative flex-grow md:flex-grow-0 md:min-w-[350px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by student or faculty identity..."
                                value={studentSearch}
                                onChange={(e) => setStudentSearch(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-4 pl-14 pr-6 text-sm font-bold focus:shadow-2xl focus:shadow-indigo-100 focus:border-indigo-300 transition-all outline-none"
                            />
                        </div>
                        <div className="relative">
                            <Filter size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-500" />
                            <select
                                value={studentFilter}
                                onChange={(e) => setStudentFilter(e.target.value)}
                                className="bg-white border border-slate-200 text-indigo-600 rounded-[1.5rem] py-4 pl-12 pr-10 text-[11px] font-black uppercase tracking-widest appearance-none focus:ring-4 focus:ring-indigo-100 outline-none cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Onboarding</option>
                                <option value="completed">Active</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Identity</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assigned Faculty</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Last Interaction</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Sessions</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Verifications</th>
                                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStudents.length > 0 ? filteredStudents.map((s) => (
                                <tr key={s.id} className="hover:bg-indigo-50/20 transition-all group">
                                    <td className="px-10 py-8">
                                        <div className="flex flex-col">
                                            <span className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{s.name}</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.grade} • {s.course}</span>
                                                {s.is_shifted && (
                                                    <span className="px-2 py-0.5 bg-rose-50 text-rose-500 rounded text-[8px] font-black uppercase tracking-widest border border-rose-100">Shifted from {s.shifted_from}</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ${s.faculty_name === 'Not Assigned' ? 'bg-rose-400 animate-pulse' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)]'}`}></div>
                                            <span className={`text-sm font-black ${s.faculty_name === 'Not Assigned' ? 'text-rose-500' : 'text-slate-600'}`}>
                                                {s.faculty_name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        {s.lastInteractionDate ? (
                                            <div className="flex flex-col items-center">
                                                <span className="text-xs font-black text-slate-700">{new Date(s.lastInteractionDate).toLocaleDateString()}</span>
                                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Chronological</span>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No Data</span>
                                        )}
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 text-xs font-black border border-indigo-100 shadow-sm">
                                            {s.totalInteractions}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 text-xs font-black border border-purple-100 shadow-sm">
                                            {s.verificationCount}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${s.onboarding_status === 'completed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                            {s.onboarding_status === 'completed' ? 'Active' : 'Onboarding'}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="px-10 py-24 text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-inner">
                                            <Search size={40} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight">Data Not Found</h4>
                                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Try adjusting your search or filters</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION 4: ACTIVITY LOGS (TABS – FULL WIDTH) */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex flex-col lg:flex-row justify-between lg:items-center gap-10 bg-slate-50/10">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-2xl shadow-slate-200/40 border border-slate-50">
                            <History size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-1">Detailed Activity Logs</h3>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Interaction Intelligence</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                        {/* Tab Switcher */}
                        <div className="inline-flex p-2 bg-slate-100 rounded-[1.75rem] border border-slate-200 shadow-inner">
                            <button
                                onClick={() => setActiveTab('student')}
                                className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'student' ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-200 translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <GraduationCap size={16} /> Student Matrix
                            </button>
                            <button
                                onClick={() => setActiveTab('faculty')}
                                className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.25rem] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'faculty' ? 'bg-purple-600 text-white shadow-2xl shadow-purple-200 translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <ShieldCheck size={16} /> Faculty Matrix
                            </button>
                        </div>

                        {/* Search in logs */}
                        <div className="relative min-w-[300px]">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                placeholder="Filter chronological records..."
                                value={logSearch}
                                onChange={(e) => setLogSearch(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-3.5 pl-14 pr-6 text-xs font-bold focus:shadow-xl focus:shadow-indigo-50 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[500px]">
                    {activeTab === 'student' ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Engagement Mode</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Session Abstract</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-indigo-50/10 transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    <Clock size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-slate-900">{new Date(log.date).toLocaleDateString()}</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Synchronized</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <span className="text-sm font-black text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{log.student_name}</span>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${log.connected_today ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.4)] animate-pulse' : 'bg-slate-300'}`}></div>
                                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{log.connected_today ? 'Real-time Link' : 'Asynchronous'}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
                                                <p className="text-[11px] font-bold text-slate-500 line-clamp-2 max-w-xl leading-relaxed">{log.details || 'No abstract documented for this session cycle.'}</p>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <div className="inline-flex p-2 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-100 shadow-sm">
                                                <CheckCircle2 size={18} />
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-10 py-32 text-center text-slate-300">
                                            <ScrollText size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em]">Operational Void - No Logs Found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verification Timestamp</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Context</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Efficiency Rating</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Risk Vector</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Intelligence Notes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-purple-50/10 transition-colors group">
                                        <td className="px-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all font-black text-[10px]">
                                                    {new Date(log.date).getDate()}/{new Date(log.date).getMonth() + 1}
                                                </div>
                                                <span className="text-xs font-black text-slate-900">{new Date(log.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-700 group-hover:text-purple-600 transition-colors">{log.chapter || 'Knowledge Unit Check'}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{log.session_type || 'Operational'} Session</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${log.student_performance === 'Excellent' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                    log.student_performance === 'Good' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                                        log.student_performance === 'Average' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                            'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}>
                                                {log.student_performance || 'Inconclusive'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-center">
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className={`w-2 h-2 rounded-full ${log.issues_reported ? 'bg-rose-500 animate-ping' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`}></div>
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                    {log.issues_reported ? 'Critical Flag' : 'Stable Ops'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-8">
                                            <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 group-hover:bg-white transition-colors">
                                                <p className="text-[11px] font-bold text-slate-500 line-clamp-2 max-w-xl leading-relaxed">{log.issues_reported || log.topics_covered || 'No anomalies or complex topics documented for this cycle.'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="px-10 py-32 text-center text-slate-300">
                                            <ShieldCheck size={48} className="mx-auto mb-4 opacity-20" />
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em]">Verification Void - No Logs Found</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MentorDetails;
