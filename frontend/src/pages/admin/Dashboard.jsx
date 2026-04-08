import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    GraduationCap,
    UserSquare2,
    BarChart3,
    TrendingUp,
    ListTodo,
    CheckCircle2,
    Activity,
    Target,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Sparkles
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
    LineChart,
    Line,
    AreaChart,
    Area
} from 'recharts';
import StatCard from '../../components/StatCard';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [stats, setStats] = useState({
        students: 240, // Base demo defaults
        mentors: 12,
        faculties: 8,
        pendingApprovals: 4
    });
    const [taskFilter, setTaskFilter] = useState('last7');
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
            setLoading(false);
        }, 1200); // Simulate premium load
        return () => clearTimeout(timer);
    }, []);

    // Premium Color System
    const COLORS = {
        primary: '#14B8A6',
        secondary: '#6366F1',
        warning: '#F59E0B',
        danger: '#EF4444',
        neutral: '#64748B',
        success: '#10B981'
    };

    const taskData = [
        { day: 'Mon', completed: 45, pending: 12, velocity: 88 },
        { day: 'Tue', completed: 52, pending: 8, velocity: 92 },
        { day: 'Wed', completed: 38, pending: 15, velocity: 85 },
        { day: 'Thu', completed: 65, pending: 5, velocity: 96 },
        { day: 'Fri', completed: 48, pending: 10, velocity: 90 },
        { day: 'Sat', completed: 25, pending: 5, velocity: 94 },
        { day: 'Sun', completed: 32, pending: 3, velocity: 98 },
    ];

    const distributionData = [
        { name: 'Active Students', value: 185, color: COLORS.primary },
        { name: 'Onboarding', value: 45, color: COLORS.secondary },
        { name: 'Internship', value: 10, color: COLORS.warning },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-2xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
                    {payload.map((entry, idx) => (
                        <div key={idx} className="flex items-center gap-3 mb-1 last:mb-0">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <p className="text-xs font-bold text-white">
                                {entry.name}: <span className="ml-1 text-teal-400">{entry.value}</span>
                            </p>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="page-transition space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-40 glass-card rounded-[32px] animate-pulse"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[500px] glass-card rounded-[32px] animate-pulse"></div>
                    <div className="h-[500px] glass-card rounded-[32px] animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="page-transition flex flex-col gap-10 pb-10">
            {/* Context Heading */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em]">Live Overview</p>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Intelligence Dashboard</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <Activity size={14} /> View Analytics
                    </button>
                    <button className="px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[11px] font-bold hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10">
                        <Zap size={14} className="text-teal-400 fill-teal-400" /> Export Insights
                    </button>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Global Students" value={stats.students} icon={<Users size={20} />} trend={14.2} />
                <StatCard title="Expert Mentors" value={stats.mentors} icon={<UserSquare2 size={20} />} trend={5.8} />
                <StatCard title="Resource Pool" value={stats.faculties} icon={<GraduationCap size={20} />} trend={-2.4} />
                <StatCard title="Pending Sync" value={stats.pendingApprovals} icon={<Activity size={20} />} trend={22.5} type="warning" />
            </div>

            {/* Main Operational Hub */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Task Velocity - Wide Card */}
                <div className="lg:col-span-2 glass-card p-10 rounded-[40px] flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles size={14} className="text-teal-500" />
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">Operational Velocity</h3>
                            </div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">+24% internal efficiency vs last month</p>
                        </div>
                        <select 
                            value={taskFilter}
                            onChange={(e) => setTaskFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 text-[11px] font-black text-slate-500 outline-none hover:border-teal-500/30 transition-all shadow-sm focus:ring-4 focus:ring-teal-500/5"
                        >
                            <option value="last7">Last 7 Cycles</option>
                            <option value="last30">Monthly Analysis</option>
                        </select>
                    </div>

                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={taskData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#14B8A6" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#0F766E" stopOpacity={0.8} />
                                    </linearGradient>
                                    <linearGradient id="barPending" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366F1" stopOpacity={0.1} />
                                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                                    dy={15}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(20, 184, 166, 0.03)' }} />
                                <Bar 
                                    name="Completed" 
                                    dataKey="completed" 
                                    fill="url(#barGradient)" 
                                    radius={[12, 12, 4, 4]} 
                                    barSize={32}
                                />
                                <Bar 
                                    name="Pending" 
                                    dataKey="pending" 
                                    fill="url(#barPending)" 
                                    radius={[12, 12, 4, 4]} 
                                    barSize={32}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Growth Perspective - Right Card */}
                <div className="glass-card p-10 rounded-[40px] flex flex-col">
                    <div className="mb-10">
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Student Pulse</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Core Ecosystem Distribution</p>
                    </div>

                    <div className="flex-1 relative flex flex-col items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={distributionData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={105}
                                    paddingAngle={8}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {distributionData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        
                        {/* Center Text Layer */}
                        <div className="absolute inset-x-0 bottom-[145px] pointer-events-none text-center">
                            <span className="block text-3xl font-black text-slate-900 tracking-tighter leading-none">{stats.students}</span>
                            <span className="text-[9px] font-black text-teal-600 uppercase tracking-[0.3em]">Total Active</span>
                        </div>

                        <div className="w-full mt-10 space-y-3">
                            {distributionData.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 bg-slate-50/50 rounded-2xl border border-white hover:border-teal-500/20 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-xs font-bold text-slate-600">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-900">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row - Performance & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Academic Momentum Chart */}
                <div className="glass-card p-10 rounded-[40px]">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Success Propensity</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Predictive Academic Health</p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                            <ArrowUpRight size={14} className="text-emerald-600" />
                            <span className="text-[11px] font-black text-emerald-600">Stable</span>
                        </div>
                    </div>

                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={taskData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" strokeOpacity={0.5} />
                                <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }} 
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                    type="monotone" 
                                    dataKey="velocity" 
                                    stroke="#14B8A6" 
                                    strokeWidth={4} 
                                    fillOpacity={1} 
                                    fill="url(#colorVelocity)" 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Audit Pulse / Records */}
                <div className="glass-card p-10 rounded-[40px]">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1">Intelligence Logs</h3>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest italic">Recent System Triggers</p>
                        </div>
                        <button className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] hover:opacity-70 transition-opacity">Full Archive</button>
                    </div>

                    <div className="space-y-4">
                        {[
                            { label: 'New Enrollment', desc: 'Arjun Das joined React AI Module', time: '12m ago', icon: <UserPlus className="text-teal-500" /> },
                            { label: 'Audit Complete', desc: 'Faculty #02 marked session as stable', time: '45m ago', icon: <CheckCircle2 className="text-indigo-500" /> },
                            { label: 'Sync Warning', desc: 'Database delta detected in logs', time: '2h ago', icon: <Activity className="text-amber-500" />, type: 'warning' },
                            { label: 'Mentor Assigned', desc: 'Binadh hired for Node.js Batch', time: '5h ago', icon: <Users className="text-blue-500" /> },
                        ].map((log, i) => (
                            <div key={i} className="flex items-center gap-5 p-4 bg-slate-50/40 hover:bg-white border border-transparent hover:border-slate-200 rounded-[24px] transition-all group cursor-pointer">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 shadow-sm transition-transform group-hover:scale-105">
                                    {log.icon}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${log.type === 'warning' ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {log.label}
                                        </span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase">{log.time}</span>
                                    </div>
                                    <p className="text-sm font-bold text-slate-900 tracking-tight leading-none">{log.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
