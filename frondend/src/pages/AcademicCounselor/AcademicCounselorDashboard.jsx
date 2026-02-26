import React, { useState, useEffect } from 'react';
import {
    Users,
    AlertCircle,
    MessageSquare,
    Activity,
    UserCheck,
    ChevronRight,
    Bell
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

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

const AcademicCounselorDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        stats: {
            totalStudentsAssigned: 0,
            studentsNeedingAttention: 0,
            parentUpdateRequired: 0,
            activeMentorshipCases: 0
        },
        attentionRequired: [],
        recentActivity: []
    });

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/bdm/dashboard');
            if (response.data.success) {
                setData(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            // toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading success data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-10 pb-20">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <StatCard
                    title="Total Students"
                    subtitle="Assigned to you"
                    value={data.stats.totalStudentsAssigned}
                    icon={Users}
                    color="bg-slate-900"
                />
                <StatCard
                    title="Attention Required"
                    subtitle="High risk alerts"
                    value={data.stats.studentsNeedingAttention}
                    icon={AlertCircle}
                    color="bg-rose-500"
                />
                <StatCard
                    title="Parent Updates"
                    subtitle="Pending notifications"
                    value={data.stats.parentUpdateRequired}
                    icon={MessageSquare}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Mentorship Cases"
                    subtitle="Active logs"
                    value={data.stats.activeMentorshipCases}
                    icon={Activity}
                    color="bg-indigo-500"
                />
            </div>

            {/* Attention Required Section */}
            <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Students Requiring Immediate Attention</h3>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Priority intervention list</p>
                    </div>
                    {data.attentionRequired.length > 0 && (
                        <button className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all">
                            View All Alerts
                        </button>
                    )}
                </div>

                <div className="p-4">
                    {data.attentionRequired.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-6">
                                <UserCheck size={40} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900">No high-risk students at the moment.</h4>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">All student progress looks stable across your assigned cohort.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student Name</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mentor</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Level</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Interaction</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action Required</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.attentionRequired.map((student, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-50 last:border-0">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs">
                                                        {student.studentName?.charAt(0)}
                                                    </div>
                                                    <span className="text-sm font-bold text-slate-900">{student.studentName}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-slate-600">{student.mentor || 'Unassigned'}</td>
                                            <td className="px-6 py-5">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${student.riskLevel === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'
                                                    }`}>
                                                    {student.riskLevel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-slate-600">{new Date(student.lastInteraction).toLocaleDateString()}</td>
                                            <td className="px-6 py-5 text-right">
                                                <button className="text-rose-500 hover:text-rose-600 transition-all hover:scale-110">
                                                    <ChevronRight size={20} />
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

            {/* Recent Activity Section */}
            <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
                <div className="p-10 border-b border-slate-50">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent BDM Activity</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Your latest actions and updates</p>
                </div>
                <div className="p-4">
                    {data.recentActivity.length === 0 ? (
                        <div className="py-20 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6 border-2 border-dashed border-slate-200">
                                <Activity size={32} />
                            </div>
                            <h4 className="text-lg font-bold text-slate-900">No activity logged yet.</h4>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">Your counselling logs, parent communications, and escalations will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 p-6">
                            {data.recentActivity.map((activity, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                    {/* Activity Item Layout */}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default AcademicCounselorDashboard;
