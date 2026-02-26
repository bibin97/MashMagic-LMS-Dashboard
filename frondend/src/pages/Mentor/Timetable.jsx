import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
    CalendarClock, CheckCircle, XCircle, Clock, ChevronRight,
    MessageSquare, Plus, Filter, Calendar, Users,
    MoreVertical, Edit2, Trash2, AlertTriangle, Info,
    ArrowRight, MapPin, Search, ChevronDown, Clock3, Target, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Timetable = () => {
    const [sessions, setSessions] = useState([]);
    const [students, setStudents] = useState([]);
    const [summary, setSummary] = useState({
        total: 0, completed: 0, cancelled: 0, postponed: 0, upcoming: 0
    });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSession, setEditingSession] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        student_id: '',
        status: '',
        start_date: '',
        end_date: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        student_id: '',
        date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '11:00',
        chapter: '',
        session_type: 'Regular Class',
        status: 'Scheduled',
        status_reason: '',
        notes: ''
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchTimetable();
        fetchStudents();
    }, [filters]);

    const fetchTimetable = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });
            const res = await api.get(`/mentor/timetable?${params.toString()}`);
            setSessions(res.data.data);
            setSummary(res.data.summary);
        } catch (error) {
            toast.error("Failed to load timetable");
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get('/mentor/students');
            setStudents(res.data.data);
        } catch (error) {
            console.error("Failed to load students");
        }
    };

    const handleCreateOpen = () => {
        setEditingSession(null);
        setFormData({
            student_id: '',
            date: new Date().toISOString().split('T')[0],
            start_time: '10:00',
            end_time: '11:00',
            chapter: '',
            session_type: 'Regular Class',
            status: 'Scheduled',
            status_reason: '',
            notes: ''
        });
        setIsModalOpen(true);
    };

    const handleEditOpen = (session) => {
        setEditingSession(session);
        setFormData({
            student_id: session.student_id,
            date: new Date(session.date).toISOString().split('T')[0],
            start_time: (session.start_time || '10:00').substring(0, 5),
            end_time: (session.end_time || '11:00').substring(0, 5),
            chapter: session.chapter || '',
            session_type: session.session_type || 'Regular Class',
            status: session.status,
            status_reason: session.status_reason || '',
            notes: session.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this session?")) return;
        try {
            await api.delete(`/mentor/timetable/${id}`);
            toast.success("Session deleted");
            fetchTimetable();
        } catch (error) {
            toast.error(error.response?.data?.message || "Delete failed");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation: End > Start
        if (formData.end_time <= formData.start_time) {
            toast.error("End time must be after start time");
            return;
        }

        try {
            if (editingSession) {
                await api.put(`/mentor/timetable/${editingSession.id}`, formData);
                toast.success("Session updated");
            } else {
                await api.post('/mentor/timetable', formData);
                toast.success("Session created");
            }
            setIsModalOpen(false);
            fetchTimetable();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Scheduled': return 'bg-blue-100 text-blue-600 border-blue-200';
            case 'Completed': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
            case 'Postponed': return 'bg-amber-100 text-amber-600 border-amber-200';
            case 'Cancelled': return 'bg-rose-100 text-rose-600 border-rose-200';
            case 'No Show': return 'bg-slate-800 text-white border-slate-900';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const calculateDurationDisplay = (start, end) => {
        if (!start || !end) return '0h 0m';
        const s = new Date(`1970-01-01T${start}`);
        const e = new Date(`1970-01-01T${end}`);
        if (isNaN(s) || isNaN(e)) return '0h 0m';
        const diff = (e - s) / 60000;
        return `${Math.floor(diff / 60)}h ${diff % 60}m`;
    };

    return (
        <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 border-b-4 border-b-blue-600">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3 group hover:rotate-0 transition-all duration-500">
                        <CalendarClock size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Academic Scheduling</h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Global Timetable & Session Registry for tracking all student sessions</p>
                    </div>
                </div>

                <button
                    onClick={handleCreateOpen}
                    className="flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-1 transition-all active:scale-95 italic"
                >
                    <Plus size={18} /> Create Session
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                {[
                    { label: 'Total Sessions', value: summary.total, icon: Calendar, color: 'text-slate-900', bg: 'bg-white' },
                    { label: 'Completed', value: summary.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50/50' },
                    { label: 'Planned', value: summary.upcoming, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50/50' },
                    { label: 'Postponed', value: summary.postponed, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50/50' },
                    { label: 'Cancelled', value: summary.cancelled, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50/50' },
                ].map((stat, i) => (
                    <div key={i} className={`${stat.bg} p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center text-center group hover:shadow-lg transition-all`}>
                        <stat.icon className={`${stat.color} mb-3 opacity-40 group-hover:opacity-100 transition-opacity`} size={20} />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <h4 className={`text-2xl font-black ${stat.color} tracking-tighter`}>{stat.value}</h4>
                    </div>
                ))}
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl text-slate-400 mr-2">
                    <Filter size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Filters</span>
                </div>

                <select
                    value={filters.student_id}
                    onChange={(e) => setFilters({ ...filters, student_id: e.target.value })}
                    className="bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-2 ring-blue-500/20 outline-none min-w-[200px]"
                >
                    <option value="">All Students</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-2 ring-blue-500/20 outline-none"
                >
                    <option value="">All Statuses</option>
                    {['Scheduled', 'Completed', 'Postponed', 'Cancelled', 'No Show'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={filters.start_date}
                        onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                        className="bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-2 ring-blue-500/20 outline-none"
                    />
                    <span className="text-slate-300 text-xs font-black italic">to</span>
                    <input
                        type="date"
                        value={filters.end_date}
                        onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                        className="bg-slate-50 border-none rounded-xl px-4 py-3 text-xs font-bold text-slate-700 focus:ring-2 ring-blue-500/20 outline-none"
                    />
                </div>

                <button
                    onClick={() => setFilters({ student_id: '', status: '', start_date: '', end_date: '' })}
                    className="ml-auto text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-lg transition-colors"
                >
                    Clear All
                </button>
            </div>

            {/* Sessions List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Syncing Scheduler...</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {sessions.map((session) => (
                        <div key={session.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden flex flex-col md:flex-row items-stretch">
                            {/* Horizontal Left Indicator */}
                            <div className={`w-2 shrink-0 ${getStatusColor(session.status).split(' ')[0]}`}></div>

                            <div className="flex-grow p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                {/* Student & Basic Info */}
                                <div className="flex items-center gap-4 min-w-[200px]">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                        <Users size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 italic tracking-tight">{session.student_name}</h3>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">SN #{session.session_number} • {session.session_type}</p>
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 flex-grow max-w-2xl px-2">
                                    <div className="flex items-center gap-3 bg-slate-50/50 px-4 py-2 rounded-xl border border-slate-100 min-w-[140px]">
                                        <Calendar className="text-blue-500" size={14} />
                                        <span className="text-[11px] font-black text-slate-700 italic">{new Date(session.date).toLocaleDateString()}</span>
                                    </div>

                                    <div className="flex items-center gap-3 bg-slate-50/50 px-4 py-2 rounded-xl border border-slate-100 min-w-[160px]">
                                        <Clock className="text-blue-500" size={14} />
                                        <span className="text-[11px] font-black text-slate-700 italic">
                                            {(session.start_time || '00:00').substring(0, 5)} - {(session.end_time || '00:00').substring(0, 5)}
                                        </span>
                                    </div>

                                    <div className="flex flex-col gap-1 flex-grow">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest pl-1">Chapter / Topic</span>
                                        <p className="text-[11px] font-bold text-slate-600 truncate max-w-[200px]">{session.chapter || 'No topic assigned'}</p>
                                    </div>
                                </div>

                                {/* Status & Reason */}
                                <div className="flex flex-col items-end gap-2 min-w-[140px]">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(session.status)} shadow-sm whitespace-nowrap`}>
                                        {session.status}
                                    </span>
                                    {session.status_reason && (
                                        <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest italic bg-rose-50 px-2 py-0.5 rounded-md">
                                            {session.status_reason}
                                        </span>
                                    )}
                                </div>

                                {/* Actions Area */}
                                <div className="flex items-center gap-4 pl-4 md:border-l border-slate-100">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditOpen(session)}
                                            className="p-2.5 bg-slate-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                            title="Edit Session"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(session.id)}
                                            className="p-2.5 bg-slate-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                                            title="Delete Session"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="w-px h-8 bg-slate-100 hidden md:block"></div>

                                    {session.status === 'Completed' ? (
                                        <div className="flex items-center gap-2 text-emerald-600 px-2">
                                            <CheckCircle size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-widest italic">Logged</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => navigate('/mentor/faculty-log')}
                                            className="whitespace-nowrap flex items-center gap-2 text-slate-400 hover:text-blue-600 text-[9px] font-black uppercase tracking-widest transition-all group/btn"
                                        >
                                            LOG <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {sessions.length === 0 && (
                        <div className="col-span-full py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                <Search size={40} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight italic">No sessions discovered</h3>
                            <p className="text-xs font-bold text-slate-400 max-w-sm mt-2">Adjust your filters or deploy a new session from the master control above.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Creation/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-500">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white/80 backdrop-blur-xl px-10 py-6 border-b border-slate-100 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">
                                    {editingSession ? 'Reconfigure Session' : 'Deploy New Session'}
                                </h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Master Scheduling Module</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-90"
                            >
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-12">
                            {/* SECTION 1: Basic Details */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Info size={16} /> SECTION 1: Basic Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Select *</label>
                                        <select
                                            required
                                            value={formData.student_id}
                                            onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                            disabled={!!editingSession}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-blue-500/10 transition-all outline-none disabled:opacity-50"
                                        >
                                            <option value="">Choose Student</option>
                                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-blue-500/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Auto Session #</label>
                                        <input
                                            type="text"
                                            readOnly
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-400 outline-none italic"
                                            value={editingSession ? `SN #${editingSession.session_number}` : 'Auto-calculated'}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Window *</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.start_time}
                                            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-blue-500/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Window *</label>
                                        <input
                                            type="time"
                                            required
                                            value={formData.end_time}
                                            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-blue-500/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Duration</label>
                                        <div className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs font-black text-blue-600 flex items-center gap-2 italic">
                                            <Clock size={14} /> {calculateDurationDisplay(formData.start_time, formData.end_time)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Academic Details */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <CheckCircle size={16} /> SECTION 2: Academic Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chapter / Technical Topic</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Calculus: Integration by parts"
                                            value={formData.chapter}
                                            onChange={(e) => setFormData({ ...formData, chapter: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-blue-500/10 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Protocol Type</label>
                                        <select
                                            value={formData.session_type}
                                            onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-blue-500/10 transition-all outline-none"
                                        >
                                            {['Regular Class', 'Revision', 'Test Discussion', 'Doubt Clearing', 'PYQ Practice'].map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: Status Management */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Target size={16} /> SECTION 3: Status Management
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deployment Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 ring-blue-500/10 transition-all outline-none"
                                        >
                                            {['Scheduled', 'Completed', 'Postponed', 'Cancelled', 'No Show'].map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {(['Postponed', 'Cancelled', 'No Show'].includes(formData.status)) && (
                                        <div className="space-y-2 animate-in slide-in-from-left-4 duration-300">
                                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1">Inactivity Factor (Reason) *</label>
                                            <select
                                                required
                                                value={formData.status_reason}
                                                onChange={(e) => setFormData({ ...formData, status_reason: e.target.value })}
                                                className="w-full p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-700 focus:bg-white focus:ring-4 ring-rose-500/10 transition-all outline-none"
                                            >
                                                <option value="">Select Primary Reason</option>
                                                {[
                                                    'Student Requested', 'Faculty Cancelled', 'Mentor Unavailable',
                                                    'Technical Issue', 'Emergency', 'Holiday',
                                                    'Student No Show', 'Mentor No Show'
                                                ].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* SECTION 4: Notes */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black text-purple-600 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <FileText size={16} /> SECTION 4: Operational Notes
                                </h3>
                                <textarea
                                    rows="4"
                                    placeholder="Add any additional coordination details here..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-xs font-bold focus:bg-white focus:ring-4 ring-blue-500/10 transition-all outline-none"
                                ></textarea>
                            </div>

                            {/* Modal Footer Buttons */}
                            <div className="flex flex-col md:flex-row gap-4 pt-10 border-t border-slate-50">
                                <button
                                    type="submit"
                                    className="flex-1 bg-slate-900 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:shadow-2xl transition-all h-16 italic"
                                >
                                    {editingSession ? 'Update Intelligence' : 'Deploy Session'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-slate-50 text-slate-400 p-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all h-16"
                                >
                                    Abort Operation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Timetable;
