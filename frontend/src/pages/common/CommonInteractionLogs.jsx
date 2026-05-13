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
    const [logTypeTab, setLogTypeTab] = useState('QUICK'); // 'QUICK', 'MEDIUM', 'DEEP'

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
                // Prioritize database integer ID, fall back to other common ID keys
                const entityId = selectedStudent.id || selectedStudent._id || selectedStudent.student_id || selectedStudent.faculty_id;
                const idKey = activeTab === 'student' ? 'student_id' : 'faculty_id';
                if (entityId) params.append(idKey, entityId);
                console.log(`FETCH_LOGS: Using ${idKey}=${entityId} for ${selectedStudent.name}`);
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

                {/* Enhanced Entity List (Transitioned from Grid to List) */}
                <div className="bg-white/80 backdrop-blur-md rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Entity Identity</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Academic Matrix</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Pulse</th>
                                    <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Audit Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    [...Array(6)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="4" className="px-10 py-10"><div className="h-12 bg-slate-100 rounded-2xl w-full"></div></td>
                                        </tr>
                                    ))
                                ) : filteredEntities.length > 0 ? (
                                    filteredEntities.map(entity => (
                                        <tr 
                                            key={entity.id} 
                                            onClick={() => handleEntityClick(entity)}
                                            className="group hover:bg-[#008080]/5 transition-all cursor-pointer"
                                        >
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-6">
                                                    <div className={`w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl border border-slate-100 group-hover:text-white transition-all group-hover:scale-110 shadow-sm ${activeTab === 'student' ? 'group-hover:bg-[#008080]' : 'group-hover:bg-purple-600'}`}>
                                                        {entity.name?.charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-none mb-1 group-hover:text-[#008080] transition-colors">{entity.name}</h3>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{entity.registration_number || entity.email || `ID-${entity.id}`}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'student' ? 'text-[#008080]' : 'text-purple-600'}`}>
                                                        {entity.course || entity.role || 'General'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                                        {entity.grade ? `Grade ${entity.grade}` : 'Staff Faculty'}
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
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedStudent.registration_number || `MM-${selectedStudent.id}`}</span>
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

            {/* Session Type Tabs */}
            <div className="flex gap-4 p-2 bg-slate-100/50 rounded-[2.5rem] border border-slate-200/50 backdrop-blur-sm w-fit mx-auto md:mx-0">
                {[
                    { id: 'QUICK', label: 'Quick Sessions', color: '#008080' },
                    { id: 'MEDIUM', label: 'Medium Sessions', color: '#8B5CF6' },
                    { id: 'DEEP', label: 'Deep Sessions', color: '#EC4899' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setLogTypeTab(tab.id)}
                        className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                            logTypeTab === tab.id 
                            ? 'bg-slate-900 text-white shadow-2xl' 
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        <span className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tab.color }}></div>
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 gap-8">
                    <div className="w-16 h-16 border-4 border-[#008080] border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(0,128,128,0.2)]"></div>
                    <div className="text-center">
                        <p className="text-[11px] font-black text-slate-900 uppercase tracking-[0.4em] mb-2">Decrypting Interaction Stream</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Compiling historical data packets from encrypted storage</p>
                    </div>
                </div>
            ) : logs.filter(l => l.session_type === logTypeTab).length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                    {logs.filter(l => l.session_type === logTypeTab).map((log) => (
                        <div key={log.id} className="bg-white/90 backdrop-blur-sm p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-[#008080]/30 transition-all group relative overflow-hidden">
                            <div className="flex flex-col md:flex-row justify-between gap-8">
                                {/* Left: DateTime Matrix */}
                                <div className="flex items-center gap-6 min-w-[200px]">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg ${
                                        logTypeTab === 'QUICK' ? 'bg-[#008080]' : (logTypeTab === 'MEDIUM' ? 'bg-purple-600' : 'bg-pink-600')
                                    }`}>
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[#008080] uppercase tracking-widest mb-1">Session Execution</p>
                                        <h4 className="text-xl font-black text-slate-900 leading-none">
                                            {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
                                        </h4>
                                        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-tight">
                                            {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </p>
                                    </div>
                                </div>

                                {/* Center: Narrative */}
                                <div className="flex-1 border-l border-slate-100 pl-8">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Qualitative Narrative</p>
                                    <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                                        "{log.report_data ? (typeof log.report_data === 'string' ? JSON.parse(log.report_data).observation : log.report_data.observation) : (log.mentor_notes || log.notes || 'No qualitative data provided.')}"
                                    </p>
                                    {log.report_data && (
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {Object.entries(typeof log.report_data === 'string' ? JSON.parse(log.report_data) : log.report_data).map(([key, val]) => {
                                                if (['observation', 'action_plan'].includes(key)) return null;
                                                return (
                                                    <div key={key} className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">{key.replace(/_/g, ' ')}:</span>
                                                        <span className="text-[9px] font-bold text-slate-700 uppercase">{String(val)}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Right: Coordinator */}
                                <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 min-w-[200px]">
                                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                                        {(log.mentor_name || 'M').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Coordinator</p>
                                        <p className="text-[11px] font-black text-slate-900 uppercase truncate">{log.mentor_name || 'System Auto'}</p>
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
                        No {logTypeTab} sessions detected for this student in the current audit window.
                    </p>
                    
                    <div className="mt-8 flex items-center justify-center gap-4">
                        <button onClick={resetFilters} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#008080] transition-all">Purge Filters</button>
                        <button onClick={fetchLogs} className="px-10 py-5 bg-white text-slate-900 border border-slate-200 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] hover:border-[#008080] transition-all">Re-Sync Stream</button>
                    </div>
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
