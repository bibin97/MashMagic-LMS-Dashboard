import React from 'react';
import { 
  Users, 
  GraduationCap, 
  Activity, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const SSCDashboard = () => {
  const stats = [
    { label: 'Active Students', value: '0', icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Mentors Syncing', value: '0', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Success Rate', value: '0%', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Reviews', value: '0', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-b-indigo-600">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">SSC Intelligence Dashboard</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Student Success Coordination • Academic Department</p>
        </div>
        <div className="flex gap-3">
          <div className="px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            Term: Q2 2026
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center ${stat.color} mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
            <Activity size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase">System Initialized</h3>
          <p className="text-[10px] font-bold text-slate-500 max-w-xs mt-3 uppercase tracking-widest leading-relaxed">
            SSC Panel is now active. Please coordinate with the administrator to populate student success metrics.
          </p>
        </div>

        <div className="bg-slate-900 p-10 rounded-[2.5rem] shadow-xl text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight">SSC Workflow Status</h3>
          </div>
          
          <div className="space-y-6">
            {[
              { task: 'Database Mapping', status: 'In Progress', color: 'text-indigo-400' },
              { task: 'Mentor Assignment Tracking', status: 'Pending', color: 'text-slate-500' },
              { task: 'Academic Progress Sync', status: 'Pending', color: 'text-slate-500' },
              { task: 'Success Reporting Module', status: 'Pending', color: 'text-slate-500' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                <span className="text-[11px] font-black uppercase tracking-widest">{item.task}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SSCDashboard;
