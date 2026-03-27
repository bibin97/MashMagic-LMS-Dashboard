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
    const [examData, setExamData] = useState([]);
    const [mentorDistribution, setMentorDistribution] = useState([]);
    const [taskPerformance, setTaskPerformance] = useState([]);
    const [taskFilter, setTaskFilter] = useState('last7');
    const [loading, setLoading] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 600);
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
        { name: 'Students', value: stats.students, color: '#008080' },
        { name: 'Mentors', value: stats.mentors, color: '#f8ba2b' },
        { name: 'Faculties', value: stats.faculties, color: '#006666' },
    ];

    const performanceData = [
        { month: 'Jan', score: 0 },
        { month: 'Feb', score: 0 },
        { month: 'Mar', score: 0 },
        { month: 'Apr', score: 0 },
        { month: 'May', score: 0 },
        { month: 'Jun', score: 0 },
        { month: 'Jul', score: 0 },
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [userRes, studentRes, reportRes, examRes, distRes, taskRes] = await Promise.all([
                    api.get('/admin/users'),
                    api.get('/admin/students'),
                    api.get('/admin/mentor-head-report'),
                    api.get('/admin/exam-analytics'),
                    api.get('/admin/mentor-distribution'),
                    api.get(`/admin/task-analytics?range=${taskFilter}`)
                ]);

                const users = userRes.data.data || [];
                const students = studentRes.data.data || [];

                const counts = users.reduce((acc, user) => {
                    if (user.role === 'mentor') acc.mentors++;
                    if (user.role === 'faculty') acc.faculties++;
                    if (user.status === 'inactive') acc.pendingApprovals++;
                    return acc;
                }, { students: students.length, mentors: 0, faculties: 0, pendingApprovals: 0 });

                // Also count pending students
                const pendingStudents = students.filter(s => s.status === 'inactive' || !s.isApproved).length;
                counts.pendingApprovals += pendingStudents;

                setStats(counts);

                if (reportRes.data.success) {
                    const reports = reportRes.data.data;
                    if (Array.isArray(reports)) {
                        const totalStudents = reports.length > 0 ? Number(reports[0].totalStudents) : 0;
                        const checkedToday = reports.reduce((sum, curr) => sum + Number(curr.checkedToday || 0), 0);
                        setMentorHeadReport({
                            totalStudents: totalStudents,
                            checkedToday: checkedToday,
                            remaining: totalStudents - checkedToday
                        });
                    } else {
                        setMentorHeadReport(reportRes.data.data);
                    }
                }

                if (examRes.data.success) {
                    setExamData(examRes.data.data.map(item => ({
                        ...item,
                        percentage: Number(item.percentage || 0)
                    })));
                }

                if (distRes.data.success) {
                    const colors = ['#008080', '#f8ba2b', '#006666', '#e5a91f', '#004d4d', '#cca014'];
                    const mappedDist = distRes.data.data.map((item, idx) => ({
                        name: item.mentor_name,
                        value: Number(item.student_count || 0),
                        color: colors[idx % colors.length]
                    }));
                    setMentorDistribution(mappedDist);
                }

                if (taskRes.data.success) {
                    setTaskPerformance(taskRes.data.data);
                }

                setLoading(false);
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                toast.error("Failed to fetch dashboard statistics");
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Separate effect for task analytics to handle filter changes
    useEffect(() => {
        const fetchTaskAnalytics = async () => {
            try {
                const res = await api.get(`/admin/task-analytics?range=${taskFilter}`);
                if (res.data.success) {
                    setTaskPerformance(res.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch task analytics", error);
            }
        };
        if (isMounted) fetchTaskAnalytics();
    }, [taskFilter, isMounted]);

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
            <div className="flex flex-col mb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">System Overview</h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Monitoring platform-wide performance and engagement</p>
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
            <div className="flex flex-col gap-6">
                {/* Bar Chart Card */}
                <div className="w-full bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10 w-full">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-[#008080]/10 text-[#008080] rounded-xl">
                                <BarChart3 size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">Task Performance Trend</h4>
                        </div>
                        <select
                            value={taskFilter}
                            onChange={(e) => setTaskFilter(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 outline-none hover:border-[#f8ba2b] transition-colors"
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="last3">Last 3 Days</option>
                            <option value="last7">Last 7 Days</option>
                            <option value="last14">Last 14 Days</option>
                            <option value="last30">Last 30 Days</option>
                        </select>
                    </div>

                    {/* Main Chart Container - Scrollable for long ranges */}
                    <div
                        className="w-full h-[350px] overflow-x-auto overflow-y-hidden"
                        style={{
                            scrollbarWidth: 'none', /* Firefox */
                            msOverflowStyle: 'none' /* IE/Edge */
                        }}
                    >
                        {/* Webkit scrollbar hide */}
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            div::-webkit-scrollbar {
                                display: none;
                            }
                        `}} />

                        <div style={{
                            width: taskPerformance.length > 7 ? `${taskPerformance.length * 100}px` : '100%',
                            height: '100%',
                            minWidth: '100%'
                        }}>
                            {isMounted && (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <BarChart
                                        data={taskPerformance.length > 0 ? taskPerformance : [{ name: 'Today', tasks: 0, completed: 0 }]}
                                        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="name"
                                            fontSize={12}
                                            fontWeight={800}
                                            tick={{ fill: '#64748b' }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={12}
                                            interval={0} // Show every label for better readability since we can scroll
                                        />
                                        <YAxis fontSize={12} fontWeight={800} tick={{ fill: '#94a3b8' }} axisLine={false} tickLine={false} width={30} />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: '1px solid #e2e8f0',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                padding: '12px',
                                                fontSize: '13px',
                                                fontWeight: 'bold',
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)'
                                            }}
                                            cursor={{ fill: '#f8fafc' }}
                                        />
                                        <Legend
                                            verticalAlign="top"
                                            align="right"
                                            iconSize={10}
                                            wrapperStyle={{ top: -10, right: 0 }}
                                            formatter={(value) => (
                                                <span className="text-slate-600 font-bold text-[11px] uppercase tracking-widest ml-2">{value}</span>
                                            )}
                                        />
                                        <Bar
                                            name="Tasks"
                                            dataKey="tasks"
                                            fill="#008080"
                                            radius={[4, 4, 0, 0]}
                                            barSize={45}
                                            minPointSize={taskPerformance.length > 30 ? 2 : 5}
                                        />
                                        <Bar
                                            name="Task Completed"
                                            dataKey="completed"
                                            fill="#f8ba2b"
                                            radius={[4, 4, 0, 0]}
                                            barSize={45}
                                            minPointSize={taskPerformance.length > 30 ? 2 : 5}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Pie Chart Card */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="p-2.5 bg-[#008080]/10 text-[#008080] rounded-xl">
                                <Users size={20} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-800">Mentor Distribution</h4>
                        </div>

                        {/* Container with min-height and flexibility */}
                        <div className="flex-1 w-full min-h-[300px] relative">
                            {isMounted && mentorDistribution.length > 0 && (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <PieChart>
                                        <Pie
                                            data={mentorDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {mentorDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    return (
                                                        <div className="bg-white p-3 rounded-lg shadow-xl border border-slate-100 font-bold text-xs">
                                                            <p className="text-slate-500 mb-1">{payload[0].name}</p>
                                                            <p className="text-[#008080]">{payload[0].value} Students</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            iconType="circle"
                                            wrapperStyle={{ paddingTop: '30px' }}
                                            fontSize={10}
                                            formatter={(value, entry) => (
                                                <span className="text-slate-600 font-bold text-[10px]">{value}</span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Top Mentor</span>
                                <span className="text-base font-bold text-slate-900 truncate">
                                    {mentorDistribution[0]?.name || 'N/A'}
                                </span>
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Avg Loading</span>
                                <span className="text-base font-bold text-slate-900">
                                    {mentorDistribution.length > 0
                                        ? Math.round(mentorDistribution.reduce((acc, d) => acc + d.value, 0) / mentorDistribution.length)
                                        : 0} / mentor
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Mentor Head Report Section */}
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10 w-full">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                                    <ListTodo size={20} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-800 italic uppercase">Daily Mentor Head Report</h4>
                            </div>
                        </div>

                        <div className="flex-1 w-full min-h-[300px] relative">
                            {isMounted && mentorHeadReport.totalStudents > 0 ? (
                                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Checked Today', value: mentorHeadReport.checkedToday, color: '#008080' },
                                                { name: 'Remaining', value: mentorHeadReport.remaining, color: '#f8ba2b' }
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={80}
                                            outerRadius={110}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {[
                                                { name: 'Checked Today', value: mentorHeadReport.checkedToday, color: '#008080' },
                                                { name: 'Remaining', value: mentorHeadReport.remaining, color: '#f8ba2b' }
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
            </div>

            {/* Performance Line Chart Section */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-6 sm:mb-10 w-full">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                            <TrendingUp size={20} />
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 italic uppercase">Academic Performance Analytics</h4>
                    </div>
                </div>

                <div className="w-full h-[350px] relative">
                    {isMounted && (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <LineChart data={examData.length > 0 ? examData : performanceData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey={examData.length > 0 ? "subject" : "month"}
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
                                    name="Success %"
                                    type="monotone"
                                    dataKey={examData.length > 0 ? "percentage" : "score"}
                                    stroke="#008080"
                                    strokeWidth={4}
                                    dot={{ fill: '#008080', r: 6, strokeWidth: 2, stroke: '#fff' }}
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
