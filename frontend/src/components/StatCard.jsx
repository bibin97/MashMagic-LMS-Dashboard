import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ title, value, icon, trend, type = 'default' }) => {
    const isPositive = trend > 0;
    
    return (
        <div className="glass-card p-8 rounded-[32px] group relative overflow-hidden flex flex-col justify-between h-full">
            {/* Ambient Background Glow */}
            <div className={`absolute -right-6 -top-6 w-32 h-32 blur-3xl opacity-10 transition-opacity duration-700 group-hover:opacity-20 ${
                type === 'warning' ? 'bg-amber-500' : 'bg-teal-500'
            }`}></div>
            
            <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-800 border border-slate-100 shadow-sm shadow-slate-200/50 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    {icon}
                </div>
                
                {trend && (
                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black tracking-wider uppercase transition-all duration-500 ${
                        isPositive 
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10' 
                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/10'
                    }`}>
                        {isPositive ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>

            <div className="relative z-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 leading-none">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-4xl font-black text-slate-950 tracking-tighter leading-none">{value}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Unit/Total</span>
                </div>
            </div>

            {/* Bottom Progress Indicator (Visual Polish) */}
            <div className="mt-6 h-1 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out delay-300 ${
                        type === 'warning' ? 'bg-amber-500' : 'bg-teal-500'
                    }`}
                    style={{ width: isPositive ? '70%' : '40%' }}
                ></div>
            </div>
        </div>
    );
};

export default StatCard;
