import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    ScrollText, Search, User, Clock, Calendar, 
    ChevronLeft, ChevronRight, History, ExternalLink, 
    ArrowLeft, Users, ShieldAlert, CheckSquare, Filter, BookOpen,
    ChevronDown, SlidersHorizontal, X
} from 'lucide-react';
import toast from 'react-hot-toast';

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

    // Dynamic API prefix based on role
    const getApiPrefix = () => {
        if (role === 'mentor_head') return '/mentor-head';
        if (role === 'academic_head') return '/academic-head';
        if (role === 'ssc') return '/ssc';
        return '/admin';
    };
    const apiPrefix = getApiPrefix();

    useEffect(() => {
        fetchEntities();
        fetchMentors();
    }, [activeTab, role]);

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
            if (activeTab === 'student') {
                endpoint = (role === 'mentor_head' || role === 'academic_head') ? `${apiPrefix}/students-all` : `${apiPrefix}/students`;
            } else {
                if (role !== 'mentor_head' && role !== 'academic_head') {
                    endpoint = `${apiPrefix}/faculties`;
                } else {
                    endpoint = (role === 'mentor_head' || role === 'academic_head') ? `${apiPrefix}/mentors-all` : `${apiPrefix}/mentors`;
                }
            }
            const res = await api.get(endpoint);
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

    const resetFilters = () => {
        setDateFilter('all');
        setCustomRange({ start: '', end: '' });
        setMentorFilter('all');
        setShowFilterPanel(false);
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
                            onClick={() => setActiveTab('student')}
                            className={`flex-1 md:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'student' ? 'bg-white text-[#008080] shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Student Focus
                        </button>
                        <button 
                            onClick={() => setActiveTab('faculty')}
                            className={`flex-1 md:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'faculty' ? 'bg-white text-purple-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Faculty Nexus
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#008080] transition-colors" size={18} />
                            <input 
                                type="text"
                                placeholder={`Search ${activeTab}s by name, email or ID...`}
                                className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-[2rem] border border-slate-100 text-xs font-bold focus:bg-white focus:ring-4 focus:ring-[#008080]/5 outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Matrix:</span>
                            <span className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-black border border-slate-100">{filteredEntities.length} Entities</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50">
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Identify</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Metadata</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Operational Status</th>
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
                                                        {entity.status === 'active' ? 'Operational' : (activeTab === 'student' ? 'Active Account' : 'Inactive')}
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
                                            <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em]">No entity matches detected in current search matrix.</p>
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
                            <span className="px-3 py-1 bg-[#008080]/10 text-[#008080] rounded-lg text-[8px] font-black uppercase tracking-widest border border-[#008080]/20">Audit Active</span>
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
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all shadow-sm border ${showFilterPanel ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-100 hover:border-[#008080]'}`}
                    >
                        <SlidersHorizontal size={16} />
                        Custom Filter
                    </button>
                    
                    { (dateFilter !== 'all' || mentorFilter !== 'all') && (
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-10 bg-slate-900 rounded-[3.5rem] shadow-2xl animate-in slide-in-from-top-6 duration-700">
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-2">Time Horizon</label>
                        <select 
                            value={dateFilter} 
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full bg-white/10 p-5 rounded-[1.8rem] border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-white/5 cursor-pointer hover:bg-white/20 transition-all"
                        >
                            <option value="all" className="text-slate-900">Full History</option>
                            <option value="today" className="text-slate-900">Today's Cycle</option>
                            <option value="week" className="text-slate-900">Past 7 Cycles</option>
                            <option value="month" className="text-slate-900">Last 30 Cycles</option>
                            <option value="custom" className="text-slate-900">Custom Range</option>
                        </select>
                    </div>

                    {dateFilter === 'custom' ? (
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-2">Start</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-white/10 p-5 rounded-[1.8rem] border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-white/5 transition-all"
                                    value={customRange.start}
                                    onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-2">End</label>
                                <input 
                                    type="date" 
                                    className="w-full bg-white/10 p-5 rounded-[1.8rem] border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-white/5 transition-all"
                                    value={customRange.end}
                                    onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-2">Coordinator View</label>
                            <select 
                                value={mentorFilter} 
                                onChange={(e) => setMentorFilter(e.target.value)}
                                className="w-full bg-white/10 p-5 rounded-[1.8rem] border border-white/10 text-xs font-black uppercase tracking-widest text-white outline-none focus:ring-4 focus:ring-white/5 cursor-pointer hover:bg-white/20 transition-all"
                            >
                                <option value="all" className="text-slate-900">Global View</option>
                                {mentors.map(m => <option key={m.id} value={m.id} className="text-slate-900">{m.name}</option>)}
                            </select>
                        </div>
                    )}

                    <div className="flex items-end pb-1 pl-4">
                        <button 
                            onClick={() => setShowFilterPanel(false)}
                            className="text-[9px] font-black text-[#008080] uppercase tracking-widest hover:text-white transition-colors"
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
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-2">Decrypting Interaction Stream</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Compiling historical data packets from encrypted storage</p>
                    </div>
                </div>
            ) : logs.length > 0 ? (
                <div className="space-y-16">
                    {['QUICK', 'MEDIUM', 'DEEP', 'FACULTY CALL', 'SESSION LOG', 'FACULTY TRACKING'].map(type => {
                        const typeLogs = logs.filter(l => (l.session_type || l.type || l.source || 'QUICK').toUpperCase().includes(type));
                        if (typeLogs.length === 0) return null;

                        return (
                            <div key={type} className="space-y-8">
                                <div className="flex items-center gap-6">
                                    <div className={`w-2 h-10 rounded-full ${
                                        type.includes('QUICK') ? 'bg-[#008080]' : (type.includes('MEDIUM') || type.includes('SESSION') ? 'bg-purple-600' : 'bg-pink-600')
                                    }`}></div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-4">
                                        {type} SESSIONS
                                        <span className="text-xs font-bold text-slate-400">({typeLogs.length} Sequences)</span>
                                    </h3>
                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {typeLogs.map((log) => (
                                        <div 
                                            key={log.id} 
                                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                            className={`bg-white/90 backdrop-blur-sm p-4 md:p-6 rounded-[2rem] border transition-all cursor-pointer relative overflow-hidden group ${
                                                expandedLogId === log.id 
                                                ? 'ring-2 ring-[#008080] border-transparent shadow-xl' 
                                                : 'border-slate-100 shadow-sm hover:shadow-md hover:border-[#008080]/30'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md ${
                                                        type.includes('QUICK') ? 'bg-[#008080]' : (type.includes('MEDIUM') || type.includes('SESSION') ? 'bg-purple-600' : 'bg-pink-600')
                                                    }`}>
                                                        <Clock size={18} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-slate-900 leading-none mb-1">
                                                            {new Date(log.created_at || log.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                                            {new Date(log.created_at || log.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 hidden md:block">
                                                    <p className="text-[11px] font-medium text-slate-600 truncate max-w-[400px]">
                                                        {log.mentor_notes || log.notes || log.remarks || 'No descriptive data captured.'}
                                                    </p>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-slate-900 uppercase leading-none">{log.mentor_name || 'System'}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Coordinator</p>
                                                    </div>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform ${expandedLogId === log.id ? 'rotate-180 bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                        <ChevronDown size={14} />
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedLogId === log.id && (
                                                <div className="mt-6 pt-6 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
                                                    <div className="space-y-6">
                                                        <div>
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Qualitative Narrative</p>
                                                            <div className="text-sm font-medium text-slate-700 leading-relaxed italic p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                                                                "{log.mentor_notes || log.notes || log.remarks || 'No qualitative narrative provided for this sequence.'}"
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                            {Object.entries(log).map(([key, val]) => {
                                                                if (['mentor_notes', 'notes', 'remarks', 'student_id', 'mentor_id', 'id', 'created_at', 'date', 'student_name', 'mentor_name', 'source', 'type', 'session_type', 'session_number'].includes(key)) return null;
                                                                if (val === null || val === undefined || val === '') return null;
                                                                return (
                                                                    <div key={key} className="p-4 bg-white border border-slate-100 rounded-2xl flex flex-col gap-1 shadow-sm">
                                                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                                                                        <span className="text-[10px] font-black text-[#008080] uppercase">{String(val)}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-8 pl-4">
                                                            {log.understanding_level !== undefined && log.understanding_level !== null && (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Understanding</span>
                                                                    <span className="text-sm font-black text-slate-900">{log.understanding_level}%</span>
                                                                </div>
                                                            )}
                                                            {log.student_confidence !== undefined && log.student_confidence !== null && (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Confidence</span>
                                                                    <span className="text-sm font-black text-[#008080]">{log.student_confidence}/5</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="py-60 text-center bg-white/50 backdrop-blur-sm rounded-[5rem] border-2 border-dashed border-slate-200 animate-in zoom-in duration-1000">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8 border border-slate-100 shadow-inner">
                        <History size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">No Sessions Found</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 max-w-md mx-auto leading-loose">
                        No interaction sequences discovered in the current matrix for this entity.
                    </p>
                </div>
            )}
        </div>
    );
};

export default CommonInteractionLogs;
