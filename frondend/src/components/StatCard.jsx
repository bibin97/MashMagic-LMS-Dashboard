import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ title, value, icon, trend, type = 'default' }) => {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-slate-500 tracking-tight uppercase">{title}</p>
                    <h3 className="text-3xl font-bold text-slate-900 tabular-nums">{value}</h3>
                    {trend && (
                        <div className={`flex items-center gap-1.5 text-xs font-semibold mt-2 px-2 py-0.5 rounded-full w-fit ${trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            <span>{trend > 0 ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend)}%</span>
                            <span className="text-slate-400 font-normal ml-0.5">vs last month</span>
                        </div>
                    )}
                </div>
                <div className="w-12 h-12 bg-[#008080]/10 rounded-xl flex items-center justify-center text-[#008080] group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            </div>
        </div>
    );
};

export default StatCard;
