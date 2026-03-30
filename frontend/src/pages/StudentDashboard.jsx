import React from 'react';
import { LayoutDashboard, BookOpen, Star, Trophy } from 'lucide-react';
import StatCard from '../components/StatCard';

const StudentDashboard = () => {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-900">Student Learning Center</h2>
                <p className="text-slate-500 text-sm font-medium">Track your progress and complete missions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Courses Joined" value={3} icon={<BookOpen size={24} />} />
                <StatCard title="Missions Done" value={15} icon={<Trophy size={24} />} trend={2} />
                <StatCard title="Skill Level" value="Advanced" icon={<Star size={24} />} />
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="text-lg font-bold text-slate-800 mb-4">My Dashboard</h4>
                <p className="text-slate-500">Welcome to your personalized learning dashboard.</p>
            </div>
        </div>
    );
};

export default StudentDashboard;
