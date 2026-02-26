import React, { useState, useEffect } from 'react';
import axios from '../../services/api';
import {
    Users,
    ClipboardList,
    Calendar,
    CheckCircle,
    AlertCircle,
    TrendingUp,
    CalendarDays
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend, Cell
} from 'recharts';
import toast from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('bg-', 'bg-')}/5 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150`}></div>
        <div className="flex flex-col gap-6 relative z-10">
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 group-hover:rotate-6 transition-transform duration-500`}>
                <Icon size={28} />
            </div>
            <div>
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                    {trend && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">{trend}</span>}
                </div>
                <h3 className="text-4xl font-black text-slate-900 leading-none tabular-nums">{value}</h3>
            </div>
        </div>
    </div>
);

const FacultyDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const fetchStats = async () => {
            try {
                const res = await axios.get('/faculty/dashboard');
                if (res.data.success) {
                    setStats(res.data.data);
                }
            } catch (error) {
                toast.error("Failed to fetch dashboard data");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 animate-pulse">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-44 bg-slate-100 rounded-[2.5rem]"></div>)}
        </div>
    );

    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-12">
            {/* Header Section */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Faculty Dashboard</h2>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        <CheckCircle size={14} className="text-indigo-500" />
                        Monitoring of assigned students and upcoming sessions
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                <StatCard
                    title="Assigned Students"
                    value={stats?.badges?.totalStudents || 0}
                    icon={Users}
                    color="bg-indigo-600"
                    trend="+2 this month"
                />
                <StatCard
                    title="Pending Reports"
                    value={stats?.badges?.pendingReports || 0}
                    icon={ClipboardList}
                    color="bg-rose-500"
                />
                <StatCard
                    title="Upcoming Sessions"
                    value={stats?.badges?.upcomingSessions || 0}
                    icon={CalendarDays}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Today's Completed"
                    value={stats?.badges?.completedSessions || 0}
                    icon={CheckCircle}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Tasks Pending"
                    value={stats?.badges?.pendingTasks || 0}
                    icon={AlertCircle}
                    color="bg-blue-600"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Performance Bar Chart */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-700">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Performance Distribution</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Student Academic Status</p>
                        </div>
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <div className="h-[300px] w-full relative">
                        {mounted && stats && (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <BarChart data={stats?.charts?.performance || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="status"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                    />
                                    <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={40}>
                                        {stats?.charts?.performance?.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.status === 'Green' ? '#10b981' : entry.status === 'Yellow' ? '#f59e0b' : '#ef4444'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Attendance Line Chart */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-700">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Attendance Pipeline</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">7-Day Attendance Trend (%)</p>
                        </div>
                        <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500">
                            <Calendar size={24} />
                        </div>
                    </div>
                    <div className="h-[300px] w-full relative">
                        {mounted && stats && (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <LineChart data={stats?.charts?.attendance || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                        dy={10}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                        domain={[0, 100]}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="percentage"
                                        stroke="#6366f1"
                                        strokeWidth={4}
                                        dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                                        activeDot={{ r: 8, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section - Recent Activity or Upcoming */}
            <div className="bg-slate-900 p-12 rounded-[3.5rem] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[100px] transition-all duration-1000 group-hover:scale-150"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl font-black text-white tracking-tight leading-tight">Academic Engine Status</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Unified Management Interface</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all duration-500 shadow-xl shadow-white/5 hover:shadow-indigo-500/20">
                            Generate Report
                        </button>
                        <button className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-700 transition-all duration-500">
                            Download Sync Log
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyDashboard;
