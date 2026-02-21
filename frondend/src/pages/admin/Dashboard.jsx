import React, { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    GraduationCap,
    UserSquare2,
    BarChart3,
    TrendingUp,
    ListTodo,
    CheckCircle2
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
    Line
} from 'recharts';
import StatCard from '../../components/StatCard';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
    const [stats, setStats] = useState({
        students: 0,
        mentors: 0,
        faculties: 0,
        pendingApprovals: 0
    });
    const [mentorHeadReport, setMentorHeadReport] = useState({
        totalStudents: 0,
        checkedToday: 0,
        remaining: 0
    });
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const chartData = [
        { name: 'Mon', tasks: 12, completed: 8 },
        { name: 'Tue', tasks: 18, completed: 14 },
        { name: 'Wed', tasks: 15, completed: 12 },
        { name: 'Thu', tasks: 22, completed: 18 },
        { name: 'Fri', tasks: 30, completed: 25 },
        { name: 'Sat', tasks: 10, completed: 9 },
        { name: 'Sun', tasks: 8, completed: 7 },
    ];

    const pieData = [
        { name: 'Students', value: stats.students, color: '#3b82f6' },
        { name: 'Mentors', value: stats.mentors, color: '#10b981' },
        { name: 'Faculties', value: stats.faculties, color: '#f59e0b' },
    ];

    const performanceData = [
        { month: 'Jan', score: 65 },
        { month: 'Feb', score: 72 },
        { month: 'Mar', score: 68 },
        { month: 'Apr', score: 85 },
        { month: 'May', score: 78 },
        { month: 'Jun', score: 90 },
        { month: 'Jul', score: 88 },
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [userRes, reportRes] = await Promise.all([
                    api.get('/admin/users'),
                    api.get('/admin/mentor-head-report')
                ]);

                const users = userRes.data.data;
                const counts = users.reduce((acc, user) => {
                    if (user.role === 'user') acc.students++;
                    if (user.role === 'mentor') acc.mentors++;
                    if (user.role === 'faculty') acc.faculties++;
                    if (user.status === 'inactive') acc.pendingApprovals++;
                    return acc;
                }, { students: 0, mentors: 0, faculties: 0, pendingApprovals: 0 });

                setStats(counts);

                if (reportRes.data.success) {
                    setMentorHeadReport(reportRes.data.data);
                }

                setLoading(false);
            } catch (error) {
                toast.error("Failed to fetch dashboard statistics");
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col gap-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm animate-pulse h-32"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 h-[400px] animate-pulse"></div>
                    <div className="bg-white rounded-2xl border border-slate-100 h-[400px] animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
                <p className="text-slate-500 text-sm font-medium">Monitoring platform-wide performance and engagement</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Students"
                    value={stats.students}
                    icon={<Users size={24} />}
                    trend={12}
                />
                <StatCard
                    title="Active Mentors"
                    value={stats.mentors}
                    icon={<UserSquare2 size={24} />}
                    trend={5}
                />
                <StatCard
                    title="Faculties"
                    value={stats.faculties}
                    icon={<GraduationCap size={24} />}
                    trend={-2}
                />
                <StatCard
                    title="Pending Ops"
                    value={stats.pendingApprovals}
                    icon={<UserPlus size={24} />}
                    trend={18}
                    type="warning"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Bar Chart Card */}
                <div className="lg:col-span-2 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <BarChart3 size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">Task Performance Trend</h4>
                        </div>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 outline-none hover:border-blue-400 transition-colors">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>

                    {/* Fixed-height container for ResponsiveContainer stability */}
                    <div className="w-full h-[350px] relative">
                        {isMounted && chartData.length > 0 && (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" fontSize={11} fontWeight={600} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis fontSize={11} fontWeight={600} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            padding: '12px'
                                        }}
                                    />
                                    <Bar dataKey="tasks" fill="#e2e8f0" radius={[6, 6, 0, 0]} barSize={40} />
                                    <Bar dataKey="completed" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* Pie Chart Card */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Users size={20} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-800">User Distribution</h4>
                    </div>

                    {/* Container with min-height and flexibility */}
                    <div className="flex-1 w-full min-h-[300px] relative">
                        {isMounted && pieData.some(d => d.value > 0) && (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: '30px' }} fontSize={11} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Growth Rate</span>
                            <span className="text-base font-bold text-slate-900">+24.8%</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Score</span>
                            <span className="text-base font-bold text-slate-900">8.4/10</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mentor Head Report Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                            <ListTodo size={20} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-800">Daily Mentor Head Report</h4>
                    </div>

                    <div className="flex-1 w-full min-h-[300px] relative">
                        {isMounted && mentorHeadReport.totalStudents > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Checked Today', value: mentorHeadReport.checkedToday, color: '#10b981' },
                                            { name: 'Remaining', value: mentorHeadReport.remaining, color: '#f43f5e' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Checked Today', value: mentorHeadReport.checkedToday, color: '#10b981' },
                                            { name: 'Remaining', value: mentorHeadReport.remaining, color: '#f43f5e' }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ paddingTop: '30px' }} fontSize={11} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-sm font-bold text-slate-400">
                                No check data for today
                            </div>
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                            <span className="text-base font-bold text-slate-900">{mentorHeadReport.totalStudents}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Checked</span>
                            <span className="text-base font-bold text-emerald-600">{mentorHeadReport.checkedToday}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 text-right">
                            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">Remaining</span>
                            <span className="text-base font-bold text-rose-600">{mentorHeadReport.remaining}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Line Chart Section */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-800">Student Performance Index</h4>
                    </div>
                </div>

                <div className="w-full h-[350px] relative">
                    {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    fontSize={11}
                                    fontWeight={600}
                                    tick={{ fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    fontSize={11}
                                    fontWeight={600}
                                    tick={{ fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                    domain={[0, 100]}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                        padding: '12px'
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: '#fff' }}
                                    activeDot={{ r: 8, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
