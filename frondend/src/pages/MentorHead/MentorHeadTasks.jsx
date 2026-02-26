import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ListTodo, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MentorHeadTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks');
            setTasks(res.data.data);
        } catch (error) {
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (taskId) => {
        try {
            await api.put(`/tasks/${taskId}/status`, { status: 'Completed' });
            toast.success("Task completed!");
            fetchTasks();
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const getStatusStyles = (status, deadline) => {
        if (status === 'Completed') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: <CheckCircle size={16} /> };

        const isOverdue = new Date(deadline) < new Date() && status !== 'Completed';
        if (isOverdue) return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: <AlertCircle size={16} /> };

        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: <Clock size={16} /> };
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 rotate-3">
                        <ListTodo size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Assigned Protocols</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Operational Directives and tasks from management</p>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="text-center p-20 text-slate-400 font-bold animate-pulse">Synchronizing Workforce Tasks...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tasks.map((task) => {
                        const style = getStatusStyles(task.status, task.deadline);
                        return (
                            <div key={task.id} className={`p-8 rounded-[2.5rem] border ${style.border} ${style.bg} transition-all duration-500 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1`}>
                                <div className="flex flex-col gap-6 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${style.border} bg-white shadow-sm shadow-slate-200/50`}>
                                            {style.icon} {task.status === 'Completed' ? 'System Completed' : (new Date(task.deadline) < new Date() ? 'Overdue Deadline' : 'Action Pending')}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${task.priority === 'High' ? 'text-rose-500' : 'text-slate-400'}`}>
                                            {task.priority || 'Standard'} Priority
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-2 tracking-tight">{task.title}</h3>
                                        <p className="text-sm text-slate-600 font-bold leading-relaxed opacity-80">{task.description}</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-200/30">
                                        <div className="flex flex-col">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Deadline Threshold</p>
                                            <p className="text-xs font-bold text-slate-900">{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>

                                        {task.status !== 'Completed' && (
                                            <button
                                                onClick={() => handleComplete(task.id)}
                                                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all transform active:scale-95"
                                            >
                                                Resolve Task
                                            </button>
                                        )}
                                        {task.status === 'Completed' && (
                                            <div className="text-[10px] font-black text-emerald-600 uppercase italic flex items-center gap-2">
                                                <CheckCircle size={14} />
                                                Requirement Fulfilled
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {tasks.length === 0 && (
                        <div className="col-span-full py-20 bg-white rounded-[4.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} className="text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Matrix Clear. No active tasks found.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MentorHeadTasks;
