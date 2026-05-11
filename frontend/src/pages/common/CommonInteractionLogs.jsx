import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
    ScrollText, Search, User, Clock, Calendar, 
    ChevronLeft, ChevronRight, History, ExternalLink, 
    ArrowLeft, Users, ShieldAlert, CheckSquare, Filter, BookOpen
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

    const baseApi = role === 'super_admin' ? '/admin' : (role === 'mentor_head' ? '/mentor-head' : '/academic-head');

    useEffect(() => {
        if (viewMode === 'list') {
            fetchEntities();
        } else {
            fetchLogs();
        }
        fetchMentors();
    }, [viewMode, activeTab, selectedStudent, dateFilter, customRange, mentorFilter]);

    const fetchEntities = async () => {
        setLoading(true);
        try {
            let endpoint = '';
            if (activeTab === 'student') {
                endpoint = role === 'super_admin' ? '/admin/students' : `${baseApi}/students-all`;
            } else {
                // Standardize faculty endpoint across roles
                endpoint = role === 'super_admin' ? '/admin/faculties' : (role === 'mentor_head' ? '/mentor-head/faculties-all' : '/academic-head/faculties');
            }
            
            const res = await api.get(endpoint);
            setEntities(res.data.data || []);
        } catch (error) {
            toast.error(`Failed to fetch ${activeTab} directory`);
        } finally {
            setLoading(false);
        }
    };

    const fetchMentors = async () => {
        try {
            const endpoint = role === 'super_admin' ? '/admin/users' : `${baseApi}/mentors-all`;
            const res = await api.get(endpoint);
            const users = res.data.data || [];
            setMentors(role === 'super_admin' ? users.filter(u => u.role === 'mentor') : users);
        } catch (error) {
            console.error("Failed to fetch mentors list");
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            let params = new URLSearchParams();
            if (selectedStudent) {
                // If it's faculty tab, the "selectedStudent" state actually holds the faculty object
                const idKey = activeTab === 'student' ? 'student_id' : 'faculty_id';
                params.append(idKey, selectedStudent.id);
            }
            
            if (mentorFilter !== 'all') params.append('mentor_id', mentorFilter);
            
            if (dateFilter === 'today') {
                const today = new Date().toISOString().split('T')[0];
                params.append('startDate', today);
                params.append('endDate', today);
            } else if (dateFilter === 'week') {
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                params.append('startDate', weekAgo);
            } else if (dateFilter === 'month') {
                const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                params.append('startDate', monthAgo);
            } else if (dateFilter === 'custom' && customRange.start && customRange.end) {
                params.append('startDate', customRange.start);
                params.append('endDate', customRange.end);
            }

            // Standardize endpoint for logs
            const logEndpoint = activeTab === 'student' ? `${baseApi}/student-logs` : `${baseApi}/faculty-logs`;
            const res = await api.get(`${logEndpoint}?${params.toString()}`);
            setLogs(res.data.data);
        } catch (error) {
            toast.error("Audit sync failed");
        } finally {
            setLoading(false);
        }
    };

    const filteredEntities = entities.filter(e => 
        (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (e.registration_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEntityClick = (entity) => {
        setSelectedStudent(entity);
        setViewMode('detail');
    };

    const resetFilters = () => {
        setDateFilter('all');
        setCustomRange({ start: '', end: '' });
        setMentorFilter('all');
        setSearchTerm('');
    };

    if (viewMode === 'list') {
        return (
            <div className="space-y-10 animate-in fade-in duration-500 pb-20">
                <header className="bg-white/80 backdrop-blur-xl p-10 md:p-14 rounded-[3.5rem] border border-white/60 shadow-xl shadow-slate-200/40 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none mb-4">Audit Intelligence Hub</h1>
                        <p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center md:justify-start gap-3 mt-1">
                            <span className={`w-2.5 h-2.5 rounded-full ${activeTab === 'student' ? 'bg-[#008080]' : 'bg-purple-600'} animate-pulse shadow-lg`}></span>
                            Centralized Administrative Oversight
                        </p>
                    </div>
                    <div className="flex bg-slate-100/50 p-2 rounded-[2.5rem] border border-slate-200/50 backdrop-blur-sm">
                        <button onClick={() => { setActiveTab('student'); setViewMode('list'); setSelectedStudent(null); }} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'student' ? 'bg-[#008080] text-white shadow-2xl shadow-[#008080]/30' : 'text-slate-500 hover:text-slate-900'}`}>Student Logs</button>
                        <button onClick={() => { setActiveTab('faculty'); setViewMode('list'); setSelectedStudent(null); }} className={`px-10 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'faculty' ? 'bg-purple-600 text-white shadow-2xl shadow-purple-600/30' : 'text-slate-500 hover:text-slate-900'}`}>Faculty Logs</button>
                    </div>
                </header>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="flex-1 relative group w-full">
                        <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#008080] transition-colors" />
                        <input 
                            type="text" 
                            placeholder={`Identify ${activeTab} by name, identifier or contact matrix...`} 
                            className="w-full bg-white/80 p-6 pl-16 rounded-[2.5rem] border border-slate-100 shadow-sm outline-none focus:ring-4 focus:ring-[#008080]/5 focus:border-[#008080]/20 font-bold text-slate-700 transition-all backdrop-blur-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm px-10 py-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-4">
                        <Users size={22} className={activeTab === 'student' ? 'text-[#008080]' : 'text-purple-600'} />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Entity Count</span>
                            <span className="text-xl font-black text-slate-900 leading-none">{entities.length}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {loading ? (
                        [...Array(8)].map((_, i) => <div key={i} className="h-48 bg-slate-100 rounded-[3.5rem] animate-pulse"></div>)
                    ) : filteredEntities.length > 0 ? (
                        filteredEntities.map(entity => (
                            <button 
                                key={entity.id} 
                                onClick={() => handleEntityClick(entity)}
                                className="group bg-white/80 backdrop-blur-sm p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-[#008080]/10 hover:border-[#008080]/30 transition-all text-left flex flex-col justify-between h-56 relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${activeTab === 'student' ? 'from-[#008080]/10' : 'from-purple-600/10'} to-transparent rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-1000`}></div>
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 font-black text-lg border border-slate-100 group-hover:text-white transition-all group-hover:scale-110 ${activeTab === 'student' ? 'group-hover:bg-[#008080]' : 'group-hover:bg-purple-600'}`}>
                                            {entity.name?.charAt(0)}
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${activeTab === 'student' ? 'text-[#008080]' : 'text-purple-600'}`}>{entity.course || entity.role}</span>
                                            <span className="text-[10px] font-black text-slate-900">{entity.grade || (entity.status === 'active' ? 'Operational' : 'Inactive')}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-2">{entity.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] truncate">{entity.registration_number || entity.email || `ID-${entity.id}`}</p>
                                </div>
                                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                    <div className="flex items-center gap-2">
                                        <History size={14} className={activeTab === 'student' ? 'text-[#008080]' : 'text-purple-600'} />
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.15em]">Access Timeline</span>
                                    </div>
                                    <ArrowLeft size={18} className="text-slate-300 rotate-180 group-hover:text-slate-900 transition-all transform group-hover:translate-x-2" />
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="col-span-full py-40 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-200">
                            <History size={48} className="text-slate-200 mx-auto mb-6" />
                            <p className="text-slate-400 font-black text-[11px] uppercase tracking-[0.3em]">No entity matches detected in current search matrix.</p>
                        </div>
                    )}
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
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedStudent.registration_number || `MM-${selectedStudent.id}`}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            {selectedStudent.name} <span className="text-slate-300 font-light mx-2">|</span> <span className={`${activeTab === 'student' ? 'text-[#008080]' : 'text-purple-600'}`}>{activeTab === 'student' ? 'Mentorship' : 'Academic'}</span>
                        </h1>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 bg-white/50 p-2 rounded-[2.5rem] border border-slate-100 backdrop-blur-sm">
                    <div className="flex items-center gap-2 pl-4 pr-2">
                        <Filter size={16} className="text-slate-400" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter Matrix</span>
                    </div>
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="bg-white px-8 py-4 rounded-[1.8rem] border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-[#008080]/5 cursor-pointer hover:bg-slate-50 transition-all"
                    >
                        <option value="all">Full History</option>
                        <option value="today">Today's Cycle</option>
                        <option value="week">Past 7 Cycles</option>
                        <option value="month">Last 30 Cycles</option>
                        <option value="custom">Custom Range</option>
                    </select>

                    <select 
                        value={mentorFilter} 
                        onChange={(e) => setMentorFilter(e.target.value)}
                        className="bg-white px-8 py-4 rounded-[1.8rem] border border-slate-100 shadow-sm text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-[#008080]/5 cursor-pointer hover:bg-slate-50 transition-all"
                    >
                        <option value="all">Global Mentor View</option>
                        {mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </header>

            {dateFilter === 'custom' && (
                <div className="flex flex-col md:flex-row gap-6 p-10 bg-white rounded-[3.5rem] border border-slate-100 shadow-xl animate-in slide-in-from-top-6 duration-700">
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-4">Audit Start Point</label>
                        <input 
                            type="date" 
                            className="w-full bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 text-xs font-black uppercase tracking-widest focus:bg-white focus:ring-4 ring-[#008080]/5 outline-none transition-all"
                            value={customRange.start}
                            onChange={(e) => setCustomRange({...customRange, start: e.target.value})}
                        />
                    </div>
                    <div className="flex items-center justify-center pt-6 text-slate-200">
                        <ChevronRight size={32} className="rotate-90 md:rotate-0" />
                    </div>
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-4">Audit Termination Point</label>
                        <input 
                            type="date" 
                            className="w-full bg-slate-50 p-5 rounded-[1.8rem] border border-slate-100 text-xs font-black uppercase tracking-widest focus:bg-white focus:ring-4 ring-[#008080]/5 outline-none transition-all"
                            value={customRange.end}
                            onChange={(e) => setCustomRange({...customRange, end: e.target.value})}
                        />
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
                <div className="space-y-12 relative">
                    <div className="absolute left-[31px] md:left-[39px] top-4 bottom-0 w-1 bg-gradient-to-b from-[#008080]/20 via-purple-500/20 to-transparent z-0 rounded-full"></div>
                    {logs.map((log, index) => (
                        <div key={log.id} className="relative z-10 flex flex-col md:flex-row gap-10 group">
                            {/* Timestamp Component */}
                            <div className="flex flex-row md:flex-col items-center gap-6 md:w-20 pt-4">
                                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[2.5rem] border-8 border-white shadow-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110 duration-500 ${log.is_flagged ? 'bg-rose-500 animate-pulse' : (activeTab === 'student' ? 'bg-[#008080]' : 'bg-purple-600')}`}>
                                    {log.is_flagged ? <ShieldAlert size={28} /> : (activeTab === 'student' ? <History size={28} /> : <BookOpen size={28} />)}
                                </div>
                                <div className="md:text-center">
                                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).toUpperCase()}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.created_at).toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                                </div>
                            </div>

                            {/* Interaction Packet Card */}
                            <div className="flex-1 bg-white/90 backdrop-blur-sm p-10 md:p-14 rounded-[4rem] border border-slate-100 shadow-sm group-hover:shadow-3xl group-hover:shadow-slate-200 group-hover:border-[#008080]/30 transition-all relative overflow-hidden">
                                {log.is_flagged && (
                                    <div className="absolute top-0 right-0 bg-rose-500 text-white px-10 py-3 rounded-bl-[2.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg animate-in slide-in-from-right-4 duration-1000">
                                        ANOMALY DETECTED
                                    </div>
                                )}
                                
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12 border-b border-slate-50 pb-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[#008080]/10 rounded-xl flex items-center justify-center text-[#008080]">
                                                <Clock size={20} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[14px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">
                                                    {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                                                    {new Date(log.created_at).toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).replace(/,/g, '')}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{log.source || (activeTab === 'student' ? 'Mentorship Session' : 'Academic Check')}</h3>
                                    </div>
                                    <div className="flex items-center gap-5 bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 border border-slate-800 group-hover:scale-105 transition-all">
                                        <div className="w-14 h-14 bg-gradient-to-br from-[#008080] to-teal-400 text-white rounded-[1.5rem] flex items-center justify-center font-black text-xl shadow-lg ring-4 ring-white/10">
                                            {(log.mentor_name || log.faculty_name || '?').charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Primary Coordinator</span>
                                            <span className="text-sm font-black text-white leading-none tracking-tight">{log.mentor_name || log.faculty_name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                                    <div className="lg:col-span-2 space-y-10">
                                        <div className="p-10 bg-slate-50/50 rounded-[3rem] border border-slate-100 group-hover:bg-white transition-all relative group/inner">
                                            <div className="absolute -top-4 left-10 bg-white px-6 py-2 rounded-full border border-slate-100 text-[9px] font-black uppercase tracking-widest text-[#008080] shadow-sm">Qualitative Narrative</div>
                                            <p className="text-base font-medium text-slate-700 leading-relaxed italic">
                                                "{log.mentor_notes || log.notes || 'Protocol executed within standard parameters. No significant variances detected.'}"
                                            </p>
                                        </div>
                                        {log.flag_reason && (
                                            <div className="p-8 bg-rose-50 rounded-[2.5rem] border border-rose-100 flex items-center gap-6 shadow-sm">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                                                    <ShieldAlert size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Audit Flag Detail</p>
                                                    <p className="text-sm font-black text-rose-800 uppercase tracking-tight">{log.flag_reason}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group-hover:shadow-xl transition-all">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-1 flex items-center gap-2">
                                                <History size={14} className="text-[#008080]" /> Performance Matrix
                                            </p>
                                            <div className="space-y-5">
                                                <MetricLine label="Cognitive Clarity" value={log.understanding_level} color="#10B981" />
                                                <MetricLine label="Student Confidence" value={log.student_confidence} max={5} color="#008080" />
                                                <MetricLine label="Anxiety Index" value={log.stress_level} max={5} color="#F43F5E" invert />
                                            </div>
                                        </div>
                                        {log.screenshot_url && (
                                            <a 
                                                href={log.screenshot_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-4 w-full p-6 bg-slate-900 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#008080] hover:shadow-2xl hover:shadow-[#008080]/30 hover:-translate-y-1 transition-all group/btn"
                                            >
                                                Verify Artifact <ExternalLink size={16} className="group-hover/btn:translate-x-2 transition-transform" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-60 text-center bg-white/50 backdrop-blur-sm rounded-[5rem] border-2 border-dashed border-slate-200 animate-in zoom-in duration-1000">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-8 border border-slate-100 shadow-inner">
                        <History size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Timeline Silence</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-3 max-w-md mx-auto leading-loose">
                        No historical interaction packets detected within the current filter coordinates. Initiate a new search or clear the filter stack.
                    </p>
                    <button onClick={resetFilters} className="mt-12 px-14 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#008080] hover:shadow-2xl hover:shadow-[#008080]/30 hover:-translate-y-1 transition-all shadow-xl">Purge Filters</button>
                </div>
            )}
        </div>
    );
};

const MetricLine = ({ label, value, max = 100, color, invert }) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    
    const percentage = (numValue / max) * 100;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
                <span className="text-[11px] font-black text-slate-900 tracking-tighter">{numValue}{max === 5 ? '/5' : '%'}</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                    className="h-full rounded-full transition-all duration-[1.5s] ease-out" 
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                ></div>
            </div>
        </div>
    );
};

export default CommonInteractionLogs;
