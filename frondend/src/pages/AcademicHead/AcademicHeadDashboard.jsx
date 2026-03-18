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
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [data, setData] = useState({
        stats: {
            totalStudents: 0,
            totalFaculties: 0,
            totalMentors: 0,
            todaySessions: 0
        },
        schedule: [],
        activityFeed: [],
        examAnalytics: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashRes, examRes, studentsRes] = await Promise.all([
                api.get('/academic-head/dashboard'),
                api.get('/academic-head/exam-analytics'),
                api.get('/academic-head/students')
            ]);

            if (dashRes.data.success) {
                setData(prev => ({
                    ...prev,
                    ...dashRes.data.data,
                    examAnalytics: examRes.data.success ? examRes.data.data : []
                }));
            }
            if (studentsRes.data.success) {
                setStudents(studentsRes.data.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    const handleStudentChange = async (e) => {
        const studentId = e.target.value;
        setSelectedStudent(studentId);
        try {
            const params = studentId ? { student_id: studentId } : {};
            const res = await api.get('/academic-head/exam-analytics', { params });
            if (res.data.success) {
                setData(prev => ({ ...prev, examAnalytics: res.data.data }));
            }
        } catch (error) {
            toast.error("Failed to load student exam analytics");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#f8ba2b] border-t-transparent rounded-full animate-spin"></div>
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
                    <TrendingUp size={14} className="text-[#008080]" />
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
                    color="bg-[#f8ba2b]"
                />
                <StatCard
                    title="Mentor Network"
                    subtitle="Operational mentors"
                    value={data.stats.totalMentors}
                    icon={UserCheck}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Faculties Name"
                    subtitle="Live interactions"
                    value={data.stats.todaySessions}
                    icon={Clock}
                    color="bg-rose-500"
                />
            </div>

            {/* Exam Analytics Graph Section */}
            <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">Individual Performance Analysis</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Select a student to view their marks</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <select 
                            value={selectedStudent} 
                            onChange={handleStudentChange}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-4 py-3 font-bold focus:outline-none focus:ring-2 focus:ring-[#f8ba2b] cursor-pointer min-w-[200px]"
                        >
                            <option value="">Overview (Class Average)</option>
                            {students.map(student => (
                                <option key={student.id} value={student.id}>{student.name}</option>
                            ))}
                        </select>
                        <div className="w-12 h-12 bg-[#008080]/10 rounded-2xl flex items-center justify-center text-[#008080] shrink-0">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="h-[400px] w-full relative">
                    {data.examAnalytics.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                                        <Cell key={`cell-${index}`} fill={entry.percentage > 50 ? '#008080' : '#f8ba2b'} />
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

            {/* Today's Schedule Section */}
            <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
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
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Faculty In-Charge</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.schedule.map((session, idx) => (
                                        <tr key={session.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                                            <td className="px-8 py-6 first:rounded-l-[2rem]">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-[#008080]/10 rounded-2xl flex items-center justify-center text-[#008080] border border-[#f8ba2b]">
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
                                                    <span className="text-[10px] font-bold text-[#008080] uppercase tracking-widest mt-0.5">{session.subject || 'Academic Session'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-500 border border-slate-200">
                                                        {session.faculty_name?.charAt(0) || '?'}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-600">{session.faculty_name || 'Unassigned'}</span>
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
                                                <button className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#008080] hover:border-[#f8ba2b] transition-all hover:shadow-lg shadow-slate-100 group-hover:-translate-x-1">
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

            {/* Faculty Intelligence Feed */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Activity Logs</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Daily interaction logs from Mentors and Faculties</p>
                        </div>
                        <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-[#008080] transition-all">
                            <Activity size={18} />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {!data.activityFeed || data.activityFeed.length === 0 ? (
                            <p className="text-center py-10 text-slate-400 font-bold italic">No activity recorded yet today.</p>
                        ) : (
                            data.activityFeed.map((activity, i) => (
                                <div key={i} className="flex gap-6 p-6 rounded-[2rem] bg-slate-50/50 border border-slate-50 hover:border-[#f8ba2b] hover:bg-white hover:shadow-xl transition-all duration-500 group">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${activity.type === 'Student Report' ? 'bg-[#f8ba2b] text-slate-900' :
                                        activity.type === 'Student Interaction' ? 'bg-emerald-500 text-white' :
                                            'bg-purple-600 text-white'
                                        }`}>
                                        <ClipboardList size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-black text-slate-900 truncate">{activity.type} for {activity.student_name}</h4>
                                            <span className="text-[8px] font-black text-slate-300 uppercase shrink-0 ml-4">{new Date(activity.date).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                                        </div>
                                        <p className="text-sm font-medium text-slate-600 line-clamp-1 italic mb-2">"{activity.details || 'No details'}"</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black text-[#008080] uppercase tracking-widest">By: {activity.origin_name}</span>
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
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Performance Overview</span>
                            </div>
                            <h4 className="text-2xl font-black leading-tight">Academic performance <br /><span className="text-[#008080]">trending up</span> by 12.4%</h4>
                        </div>
                        <div className="relative z-10 mt-10">
                            <p className="text-4xl font-black text-emerald-400 tracking-tighter">Gold</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cohort Rating</p>
                        </div>
                    </div>

                    <div className="bg-[#f8ba2b] p-10 rounded-[3rem] text-slate-900 flex flex-col justify-center relative overflow-hidden group shadow-2xl shadow-[#f8ba2b]">
                        <div className="absolute left-0 bottom-0 w-48 h-48 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl group-hover:bg-black/20 transition-all duration-700"></div>
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h4 className="text-2xl font-black mb-2 tracking-tight italic text-shadow-sm">System Status</h4>
                                <p className="text-[#008080]/60 text-[10px] font-black uppercase tracking-widest max-w-[150px]">Advanced tracking systems fully operational.</p>
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
