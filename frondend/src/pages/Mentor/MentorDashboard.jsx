import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, CalendarClock, ListTodo, CheckCircle2 } from 'lucide-react';
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

const MentorDashboard = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalSessions: 0,
        pendingTasks: 0,
        completedTasks: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await api.get('/mentor/dashboard');
            setStats(res.data.data);
        } catch (error) {
            toast.error("Failed to load dashboard statistics");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Initializing Dashboard Data...</div>;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard
                title="Assigned Students"
                value={stats.totalStudents}
                icon={Users}
                color="bg-blue-600"
            />
            <StatCard
                title="Scheduled Sessions"
                value={stats.totalSessions}
                icon={CalendarClock}
                color="bg-purple-600"
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
    );
};

export default MentorDashboard;
