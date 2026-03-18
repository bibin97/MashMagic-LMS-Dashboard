import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Users, CalendarClock, ListTodo, CheckCircle2, Phone, MessageSquare, Activity, ChevronRight, Clock, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200 border border-slate-50 relative overflow-hidden group hover:-translate-y-2 transition-all duration-500">
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-[0.03] rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700`}></div>
        <div className="flex flex-col gap-6">
            <div className={`w-14 h-14 ${color.replace('bg-', 'text-')} bg-slate-50 rounded-2xl flex items-center justify-center`}>
                <Icon size={28} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <h3 className="text-4xl font-black text-slate-900 leading-none">{value}</h3>
            </div>
        </div>
    </div>
);

const SessionCard = ({ session, isLive, isPast }) => (
    <div className={`p-6 rounded-[2rem] border transition-all duration-500 relative group overflow-hidden ${isLive
        ? 'bg-[#f8ba2b] border-[#f8ba2b] shadow-xl shadow-[#f8ba2b]'
        : isPast ? 'bg-slate-50 border-slate-100 opacity-80' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-xl'
        }`}>
        {isLive && (
            <div className="absolute top-0 right-0 p-4">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full animate-pulse">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-[8px] font-black text-white uppercase tracking-tighter">Live Now</span>
                </div>
            </div>
        )}

        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <CalendarClock className={isLive ? 'text-[#008080]' : 'text-[#008080]'} size={12} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${isLive ? 'text-[#008080]' : 'text-slate-400'}`}>
                    {new Date(session.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isLive ? 'bg-white/10' : 'bg-[#008080]/10'}`}>
                <Clock className={isLive ? 'text-white' : 'text-[#008080]'} size={10} />
                <span className={`text-[10px] font-black italic ${isLive ? 'text-white' : 'text-[#008080]'}`}>
                    {session.start_time ? session.start_time.substring(0, 5) : 'TBD'}
                </span>
            </div>
        </div>
        <div className="mb-4">
            <h4 className={`font-black text-base mb-1 transition-colors uppercase italic leading-tight ${isLive ? 'text-white' : 'text-slate-900 group-hover:text-[#008080]'}`}>
                {session.topic || 'General Session'}
            </h4>
            <p className={`text-[10px] font-black uppercase tracking-widest ${isLive ? 'text-[#008080]' : 'text-slate-500'}`}>
                Student: <span className={isLive ? 'text-white' : 'text-slate-900'}>{session.student_name || 'N/A'}</span>
            </p>
        </div>

        {isLive && session.meeting_link && (
            <a 
                href={session.meeting_link.startsWith('http') ? session.meeting_link : `https://${session.meeting_link}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="block w-full text-center bg-white text-[#008080] py-3 rounded-xl font-black text-[10px] uppercase tracking-widest mb-4 hover:bg-opacity-90 transition-all shadow-lg active:scale-95"
            >
                Join Google Meet
            </a>
        )}

        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-white/10">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${isLive ? 'bg-white/20 text-white' : 'bg-[#f8ba2b] text-slate-900'}`}>
                {session.faculty_name?.charAt(0)}
            </div>
            <div>
                <p className={`text-[10px] font-black uppercase tracking-tight ${isLive ? 'text-[#008080]' : 'text-slate-400'}`}>Faculty</p>
                <p className={`text-xs font-black ${isLive ? 'text-white' : 'text-slate-700'}`}>{session.faculty_name}</p>
            </div>
        </div>
    </div>
);

const MilestoneAlert = ({ count, navigate }) => (
    <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-top duration-700">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-rose-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-rose-100 rotate-3 animate-pulse">
                <BookOpen size={32} />
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-900 italic tracking-tight uppercase">Critical Action Required</h3>
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mt-1">
                    You have {count} student{count > 1 ? 's' : ''} awaiting exam assessments. Record scores to maintain academic compliance.
                </p>
            </div>
        </div>
        <button 
            onClick={() => navigate('/mentor/exams')}
            className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:bg-slate-800 transition-all active:scale-95 italic"
        >
            Resolve Pending Milestones <ChevronRight size={18} />
        </button>
    </div>
);

const MentorDashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalSessions: 0,
        pendingTasks: 0,
        completedTasks: 0,
        pendingExams: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/mentor/dashboard');
            // Fetch pending exams count separately if not in dashboard stats
            const examsRes = await api.get('/mentor/exams/pending');
            setStats({
                ...res.data.data,
                pendingExams: examsRes.data.data.length
            });
        } catch (error) {
            toast.error("Failed to load dashboard statistics");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Initializing Dashboard Data...</div>;

    return (
        <div className="space-y-12 pb-20">
            {/* Header Section */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Mentor Oversight</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-[#008080]" />
                        Real-time tracking of student progress, academic milestones, and session schedules
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                    <Clock size={16} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
            </div>

            {/* Assessment Milestone Alerts */}
            {stats.pendingExams > 0 && (
                <MilestoneAlert count={stats.pendingExams} navigate={navigate} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <StatCard
                    title="Assigned Students"
                    value={stats.totalStudents}
                    icon={Users}
                    color="bg-[#f8ba2b]"
                />
                <StatCard
                    title="Scheduled Sessions"
                    value={stats.totalSessions}
                    icon={CalendarClock}
                    color="bg-purple-600"
                />
                <StatCard
                    title="Student Interactions"
                    value={stats.totalStudentInteractions}
                    icon={Users}
                    color="bg-[#f8ba2b]"
                />
                <StatCard
                    title="Faculty Interactions"
                    value={stats.totalFacultyInteractions}
                    icon={Users}
                    color="bg-rose-600"
                />
                <StatCard
                    title="Pending Actions"
                    value={stats.pendingTasks}
                    icon={ListTodo}
                    color="bg-amber-600"
                />
                <StatCard
                    title="Goal Achievements"
                    value={stats.completedTasks}
                    icon={CheckCircle2}
                    color="bg-emerald-600"
                />
            </div>

            {/* Academic Session Intelligence Area */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="mb-14">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic font-serif">Academic Session Intelligence</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Status-based classification of faculty-led sessions</p>
                </div>

                <div className="space-y-16">
                    {/* 1. Live Sessions Section - Always visible to confirm the area exists */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-8 bg-[#f8ba2b] rounded-full animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
                            <h3 className="text-lg font-black text-slate-900 uppercase italic flex items-center gap-3">
                                Live Now
                                {stats.liveSessions?.length > 0 && (
                                    <span className="flex h-2 w-2 rounded-full bg-[#f8ba2b] animate-ping"></span>
                                )}
                            </h3>
                            <div className="h-[1px] flex-1 bg-slate-100 italic"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {stats.liveSessions?.length > 0 ? (
                                stats.liveSessions.map((session, idx) => (
                                    <SessionCard key={`live-${idx}`} session={session} isLive={true} />
                                ))
                            ) : (
                                <div className="col-span-full py-10 text-center bg-[#008080]/10/30 rounded-[2rem] border border-dashed border-[#f8ba2b] group transition-all duration-700">
                                    <Activity className="mx-auto text-[#008080] mb-3 animate-pulse" size={32} />
                                    <p className="text-[#008080] text-[10px] font-black uppercase tracking-[0.2em] italic">Waiting for active sessions...</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Upcoming Sessions Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-8 bg-[#f8ba2b] rounded-full"></div>
                            <h3 className="text-lg font-black text-slate-900 uppercase italic">Upcoming Schedules</h3>
                            <div className="h-[1px] flex-1 bg-slate-100"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {stats.upcomingSessions?.length > 0 ? (
                                stats.upcomingSessions.slice(0, 8).map((session, idx) => (
                                    <SessionCard key={`upcoming-${idx}`} session={session} isLive={false} />
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">No future sessions scheduled</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Concluded Sessions Section */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-2 h-8 bg-slate-300 rounded-full"></div>
                            <h3 className="text-lg font-black text-slate-900 uppercase italic">Recently Concluded</h3>
                            <div className="h-[1px] flex-1 bg-slate-100"></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {stats.pastSessions?.length > 0 ? (
                                stats.pastSessions.slice(0, 4).map((session, idx) => (
                                    <SessionCard key={`past-${idx}`} session={session} isLive={false} isPast={true} />
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest italic">No historical session data discovered</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MentorDashboard;
