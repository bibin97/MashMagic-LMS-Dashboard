import React from 'react';
import { LayoutDashboard, BookOpen, Star, Trophy } from 'lucide-react';
import StatCard from '../components/StatCard';

const StudentDashboard = () => {
    return (
        <div className="flex flex-col gap-10 pb-10">
            {/* Header Section */}
            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[32px] border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3 italic">Learning Center</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center md:justify-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6] animate-pulse"></div>
                        Mission control & educational progress audit
                    </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50/50 px-6 py-4 rounded-[20px] border border-slate-100/50 shadow-inner">
                    <Trophy size={18} strokeWidth={3} className="text-[#14B8A6]" />
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em] italic leading-none">Rank: Advanced Analyst</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <StatCard 
                    title="Active Courses" 
                    value={3} 
                    icon={<BookOpen size={24} />} 
                    color="bg-[#14B8A6]"
                />
                <StatCard 
                    title="Missions Completed" 
                    value={15} 
                    icon={<Trophy size={24} />} 
                    trend="+4"
                    color="bg-[#6366F1]"
                />
                <StatCard 
                    title="Current Velocity" 
                    value="Gold" 
                    icon={<Star size={24} />} 
                    color="bg-[#F59E0B]"
                />
            </div>

            <div className="bg-slate-900 p-12 rounded-[40px] relative overflow-hidden group shadow-2xl shadow-slate-900/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#14B8A6]/20 rounded-full -mr-48 -mt-48 blur-[100px] transition-all duration-1000 group-hover:scale-150"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="text-center lg:text-left">
                        <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none mb-4">Mission Intelligence</h2>
                        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Your personalized trajectory is optimized and active.</p>
                    </div>
                    <button className="bg-gradient-to-br from-[#0F766E] to-[#14B8A6] text-white px-10 py-5 rounded-[20px] font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-xl hover:shadow-[#14B8A6]/40 hover:-translate-y-1 transition-all">
                        Launch Mission Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
