import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ListTodo, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const MyTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/mentor/tasks');
            setTasks(res.data.data);
        } catch (error) {
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async (taskId) => {
        try {
            await api.put(`/mentor/tasks/${taskId}/complete`);
            toast.success("Task completed!");
            fetchTasks();
        } catch (error) {
            toast.error("Action failed");
        }
    };

    const getStatusStyles = (status, dueDate) => {
        if (status === 'Completed') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: <CheckCircle size={16} /> };

        const isOverdue = new Date(dueDate) < new Date() && status !== 'Completed';
        if (isOverdue) return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: <AlertCircle size={16} /> };

        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: <Clock size={16} /> };
    };

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                        <ListTodo size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-900">Task Protocol</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational Directives & Action Items</p>
                    </div>
                </div>
            </header>

            {loading ? (
                <div className="text-center p-20 text-slate-400 font-bold animate-pulse">Synchronizing Agent Tasks...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {tasks.map((task) => {
                        const style = getStatusStyles(task.status, task.due_date);
                        return (
                            <div key={task.id} className={`p-8 rounded-[2.5rem] border ${style.border} ${style.bg} transition-all duration-500 relative overflow-hidden group`}>
                                <div className="flex flex-col gap-6">
                                    <div className="flex justify-between items-start">
                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border ${style.border} bg-white shadow-sm shadow-slate-200/50`}>
                                            {style.icon} {task.status === 'Completed' ? 'System Completed' : (new Date(task.due_date) < new Date() ? 'Overdue Deadline' : 'Action Pending')}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            {task.priority || 'Standard'} Priority
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 mb-2">{task.title}</h3>
                                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{task.description}</p>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-white/50">
                                        <div className="flex flex-col">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Deadline</p>
                                            <p className="text-xs font-bold text-slate-700">{new Date(task.due_date).toLocaleDateString()}</p>
                                        </div>

                                        {task.status !== 'Completed' && (
                                            <button
                                                onClick={() => handleComplete(task.id)}
                                                className="bg-white text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-emerald-600 hover:text-white transition-all transform active:scale-95 border border-slate-100"
                                            >
                                                Mark Resolve
                                            </button>
                                        )}
                                        {task.status === 'Completed' && (
                                            <div className="text-[10px] font-black text-emerald-600 uppercase italic">
                                                Verified: {new Date(task.completed_at).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {tasks.length === 0 && (
                        <div className="col-span-full py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center">
                            <CheckCircle size={40} className="text-emerald-100 mb-4" />
                            <p className="text-slate-400 font-bold">Protocol Clear. No active tasks detected.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyTasks;
