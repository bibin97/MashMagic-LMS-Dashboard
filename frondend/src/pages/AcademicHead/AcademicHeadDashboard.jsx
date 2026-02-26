import React, { useState, useEffect } from 'react';
import {
    Users,
    BookOpen,
    UserCheck,
    Clock,
    Calendar,
    ChevronRight,
    TrendingUp,
    ShieldCheck,
    ClipboardList,
    Activity
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group flex-1">
        <div className="flex flex-col gap-6">
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
                <Icon size={28} />
            </div>
            <div>
                <h3 className="text-4xl font-black text-slate-900 leading-none mb-2">{value}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{title}</p>
                {subtitle && <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">{subtitle}</p>}
            </div>
        </div>
    </div>
);

const AcademicHeadDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        stats: {
            totalStudents: 0,
            totalFaculties: 0,
            totalMentors: 0,
            todaySessions: 0
        },
        schedule: [],
        recentReports: [],
        examAnalytics: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashRes, examRes] = await Promise.all([
                api.get('/academic-head/dashboard'),
                api.get('/academic-head/exam-analytics')
            ]);

            if (dashRes.data.success) {
                setData(prev => ({
                    ...prev,
                    ...dashRes.data.data,
                    examAnalytics: examRes.data.success ? examRes.data.data : []
                }));
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compiling academic metrics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header Section */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Academic Dashboard</h2>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                    <TrendingUp size={14} className="text-indigo-500" />
                    Central monitoring of academic performance, student enrollment, and daily educational schedules
                </p>
            </div>

            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Active Students"
                    subtitle="Overall enrollment"
                    value={data.stats.totalStudents}
                    icon={Users}
                    color="bg-slate-900"
                />
                <StatCard
                    title="Faculty Leads"
                    subtitle="Academic staff"
                    value={data.stats.totalFaculties}
                    icon={ShieldCheck}
                    color="bg-indigo-500"
                />
                <StatCard
                    title="Mentor Network"
                    subtitle="Operational mentors"
                    value={data.stats.totalMentors}
                    icon={UserCheck}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Sessions Today"
                    subtitle="Live interactions"
                    value={data.stats.todaySessions}
                    icon={Clock}
                    color="bg-rose-500"
                />
            </div>

            {/* Today's Schedule Section */}
            <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Today's Academic Schedule</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Live session monitoring & oversight</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Tracking</span>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    {data.schedule.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6 border border-slate-100">
                                <Calendar size={40} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900 italic">No scheduled sessions for today.</h4>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2 font-medium">Any new schedules added by mentors will appear here in real-time.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-separate border-spacing-y-2">
                                <thead>
                                    <tr>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student & Subject</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mentor In-Charge</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.schedule.map((session, idx) => (
                                        <tr key={session.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                            <td className="px-8 py-6 first:rounded-l-[2rem]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                                                        <Clock size={16} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-slate-900">{session.start_time} - {session.end_time}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter italic">Phase {idx + 1}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-900">{session.student_name}</span>
                                                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">{session.subject || 'Academic Session'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                                                        {session.mentor_name?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-600">{session.mentor_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm border ${session.status === 'Completed'
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                    : session.status === 'Cancelled'
                                                        ? 'bg-rose-50 text-rose-600 border-rose-100'
                                                        : 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                                                    }`}>
                                                    {session.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right last:rounded-r-[2rem]">
                                                <button className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 transition-all hover:shadow-lg shadow-slate-100 group-hover:-translate-x-1">
                                                    <ChevronRight size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* Exam Analytics Graph Section */}
            <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Academic Yield Analysis</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Average performance metrics across subjects & terms</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="h-[400px] w-full relative">
                    {data.examAnalytics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.examAnalytics} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="subject"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                                <Bar
                                    name="Success Percentage (%)"
                                    dataKey="percentage"
                                    radius={[15, 15, 0, 0]}
                                    barSize={60}
                                >
                                    {data.examAnalytics.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.percentage > 80 ? '#10b981' : entry.percentage > 50 ? '#6366f1' : '#f43f5e'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-200">
                            <Activity size={60} strokeWidth={1} />
                            <p className="text-[10px] font-black uppercase tracking-widest mt-4">No exam data compiled for this session</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Faculty Intelligence Feed */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Intelligence Feed</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Daily interaction logs from faculty leads</p>
                        </div>
                        <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all">
                            <Activity size={18} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {!data.recentReports || data.recentReports.length === 0 ? (
                            <p className="text-center py-10 text-slate-400 font-bold italic">No intelligence reports submitted yet today.</p>
                        ) : (
                            data.recentReports.map((report, i) => (
                                <div key={i} className="flex gap-6 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-50 hover:border-indigo-100 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${report.type === 'Academic' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white'
                                        }`}>
                                        <ClipboardList size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-black text-slate-900 truncate">Report on {report.student_name}</h4>
                                            <span className="text-[8px] font-black text-slate-300 uppercase shrink-0 ml-4">{new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 line-clamp-1 italic mb-2">"{report.remarks}"</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Lead: {report.faculty_name}</span>
                                            <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${report.status === 'Open' ? 'text-amber-500' : 'text-emerald-500'}`}>{report.status} Phase</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-8">
                    <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col justify-between overflow-hidden relative group">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <TrendingUp size={20} className="text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Yield Analysis</span>
                            </div>
                            <h4 className="text-2xl font-black leading-tight">Academic performance <br /><span className="text-indigo-400">trending up</span> by 12.4%</h4>
                        </div>
                        <div className="relative z-10 mt-10">
                            <p className="text-4xl font-black text-emerald-400 tracking-tighter">Gold</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cohort Rating</p>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-10 rounded-[3rem] text-white flex flex-col justify-center relative overflow-hidden group shadow-2xl shadow-indigo-200">
                        <div className="absolute left-0 bottom-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl group-hover:bg-black/20 transition-all duration-700"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h4 className="text-2xl font-black mb-2 tracking-tight italic text-shadow-sm">MashMagic Engine</h4>
                                <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-widest max-w-[150px]">Advanced tracking systems fully operational.</p>
                            </div>
                            <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] border border-white/20 flex items-center justify-center backdrop-blur-md">
                                <ShieldCheck size={32} className="text-white" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcademicHeadDashboard;
