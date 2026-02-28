import React, { useState, useEffect } from 'react';
import {
    Activity,
    Search,
    Filter,
    Phone,
    MessageSquare,
    ClipboardList,
    Clock,
    User,
    Calendar,
    ChevronRight,
    Loader2
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const MentorHeadInteractions = () => {
    const [activeTab, setActiveTab] = useState('mentors');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [mentorLogs, setMentorLogs] = useState({ studentLogs: [], facultyLogs: [] });
    const [facultyLogs, setFacultyLogs] = useState([]);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const [mentorRes, facultyRes] = await Promise.all([
                api.get('/mentor-head/mentor-logs'),
                api.get('/mentor-head/faculty-intelligence')
            ]);

            if (mentorRes.data.success) {
                setMentorLogs(mentorRes.data.data);
            }
            if (facultyRes.data.success) {
                setFacultyLogs(facultyRes.data.data);
            }
        } catch (error) {
            console.error("Error fetching logs:", error);
            toast.error("Failed to load interaction logs");
        } finally {
            setLoading(false);
        }
    };

    const combinedMentorLogs = [
        ...mentorLogs.studentLogs.map(log => ({ ...log, category: 'Student Call' })),
        ...mentorLogs.facultyLogs.map(log => ({ ...log, category: 'Faculty Call' }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    const filteredMentorLogs = combinedMentorLogs.filter(log =>
        log.mentor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredFacultyLogs = facultyLogs.filter(log =>
        log.faculty_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling interaction matrix...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Section */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">Interaction Log Archive</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                        <Activity size={14} className="text-indigo-500" />
                        Complete repository of mentor-student calls and mentor-faculty interaction reports
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-[2rem] shadow-inner">
                    <button
                        onClick={() => setActiveTab('mentors')}
                        className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'mentors'
                            ? 'bg-slate-900 text-white shadow-xl'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        Mentor - Student Interactions
                    </button>
                    <button
                        onClick={() => setActiveTab('faculties')}
                        className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === 'faculties'
                            ? 'bg-slate-900 text-white shadow-xl'
                            : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        Mentor - Faculty Interactions
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="relative group max-w-2xl">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder={`Search by ${activeTab === 'mentors' ? 'mentor, student or call type' : 'faculty, student or remarks'}...`}
                    className="w-full p-6 pl-16 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm outline-none focus:ring-4 focus:ring-indigo-50 transition-all font-bold text-slate-800 placeholder:text-slate-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Content Area */}
            {activeTab === 'mentors' ? (
                <div className="grid grid-cols-1 gap-6">
                    {filteredMentorLogs.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 italic font-bold text-slate-400">
                            No mentor - student interaction logs found.
                        </div>
                    ) : (
                        filteredMentorLogs.map((log, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-slate-50 rounded-full -mr-10 -mt-10 group-hover:bg-indigo-50 transition-colors"></div>

                                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                                    <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg shrink-0 ${log.category === 'Student Call' ? 'bg-indigo-600' : 'bg-emerald-500'
                                        } text-white`}>
                                        {log.category === 'Student Call' ? <Phone size={24} /> : <MessageSquare size={24} />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${log.category === 'Student Call'
                                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                }`}>
                                                {log.category}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-300 flex items-center gap-1">
                                                <Calendar size={12} />
                                                {new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 mb-1">
                                            {log.mentor_name} <span className="text-slate-400 font-medium mx-2 font-serif">→</span> {log.student_name}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 line-clamp-2 italic leading-relaxed">
                                            "{log.mentor_notes || log.notes || 'No detailed notes provided for this interaction.'}"
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        {log.connected_today ? (
                                            <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100 shadow-sm">
                                                Connected Successfully
                                            </span>
                                        ) : log.connected_today === false ? (
                                            <span className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-rose-100 shadow-sm">
                                                Call Missed/Rejected
                                            </span>
                                        ) : null}
                                        <button className="p-4 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredFacultyLogs.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 italic font-bold text-slate-400">
                            No mentor - faculty interaction logs found.
                        </div>
                    ) : (
                        filteredFacultyLogs.map((log, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                                <div className="absolute right-0 bottom-0 w-32 h-32 bg-rose-50 rounded-full -mr-10 -mb-10 group-hover:bg-indigo-50 transition-colors"></div>

                                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
                                    <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg shrink-0 ${log.type === 'Academic' ? 'bg-indigo-600' : 'bg-rose-500'
                                        } text-white`}>
                                        <ClipboardList size={24} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${log.type === 'Academic'
                                                ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                                : 'bg-rose-50 text-rose-600 border border-rose-100'
                                                }`}>
                                                {log.type} Issue
                                            </span>
                                            <span className="text-[10px] font-black text-slate-300 flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 mb-1">
                                            {log.faculty_name} <span className="text-slate-400 font-medium mx-2 font-serif">reported on</span> {log.student_name}
                                        </h3>
                                        <p className="text-sm font-medium text-slate-500 line-clamp-2 italic leading-relaxed">
                                            "{log.remarks}"
                                        </p>
                                    </div>

                                    <div className="flex flex-col items-end gap-3 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black">
                                                {log.faculty_name?.charAt(0)}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Submitted By Faculty</span>
                                        </div>
                                        <span className={`px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm border ${log.status === 'Open'
                                            ? 'bg-amber-50 text-amber-600 border-amber-100'
                                            : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                            }`}>
                                            {log.status} Phase
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default MentorHeadInteractions;
