import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { ListTodo, CheckCircle, Clock, AlertCircle, Plus, Calendar, AlertTriangle, User } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';

const MentorHeadTasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mentors, setMentors] = useState([]);
    const [filterMentor, setFilterMentor] = useState('');
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        mentor_id: '',
        deadline: '',
        priority: 'Medium'
    });

    useEffect(() => {
        fetchTasks();
        fetchMentors();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tasks');
            setTasks(res.data.data);
        } catch (error) {
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    const fetchMentors = async () => {
        try {
            const res = await api.get('/mentor-head/mentors-all');
            if (res.data.success) {
                setMentors(res.data.data);
            }
        } catch (error) {
            console.error("Failed to fetch mentors for task assignment", error);
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

    const handleDelete = async (taskId) => {
        if (!window.confirm("PERMANENT ACTION: Delete this assigned task?")) return;
        try {
            await api.delete(`/tasks/${taskId}`);
            toast.success("Task removed");
            fetchTasks();
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', formData);
            toast.success("Task assigned successfully");
            setIsModalOpen(false);
            setFormData({ title: '', description: '', mentor_id: '', deadline: '', priority: 'Medium' });
            fetchTasks();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create task");
        }
    };

    const getStatusStyles = (status, deadline) => {
        if (status === 'Completed') return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', icon: <CheckCircle size={16} /> };

        const isOverdue = new Date(deadline) < new Date() && status !== 'Completed';
        if (isOverdue) return { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: <AlertCircle size={16} /> };

        return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: <Clock size={16} /> };
    };

    // Filter tasks by selected mentor
    const filteredTasks = filterMentor ? tasks.filter(t => t.mentor_name === filterMentor) : tasks;

    // Get unique mentor names for filter dropdown
    const availableMentors = [...new Set(tasks.map(t => t.mentor_name).filter(Boolean))];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 rotate-3">
                        <ListTodo size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Assigned Protocols</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Operational directiives and tasks for Mentors</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {availableMentors.length > 0 && (
                        <select
                            className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100"
                            value={filterMentor}
                            onChange={(e) => setFilterMentor(e.target.value)}
                        >
                            <option value="">All Mentors</option>
                            {availableMentors.map((name, i) => (
                                <option key={i} value={name}>{name}</option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 hover:-translate-y-0.5"
                    >
                        <Plus size={16} />
                        Assign Task
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="text-center p-20 text-slate-400 font-bold animate-pulse">Synchronizing Workforce Tasks...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {filteredTasks.map((task) => {
                        const style = getStatusStyles(task.status, task.deadline);
                        return (
                            <div key={task.id} className={`p-8 rounded-[2.5rem] border ${style.border} ${style.bg} transition-all duration-500 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1`}>
                                <div className="flex flex-col gap-6 relative z-10 h-full justify-between">
                                    <div className="space-y-6">
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

                                        <div className="bg-white/60 p-4 rounded-3xl border border-white space-y-3">
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">M</span>
                                                    To: {task.mentor_name || 'System'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-bold text-slate-600">
                                                <span className="flex items-center gap-2">
                                                    <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] text-indigo-500">A</span>
                                                    By: {task.assigner_name || 'Admin'} <span className="opacity-50 font-normal">({task.assigner_role?.replace('_', ' ') || 'admin'})</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-200/30">
                                        <div className="flex flex-col">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Deadline Threshold</p>
                                            <p className="text-xs font-bold text-slate-900">{new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDelete(task.id)}
                                                className="bg-white text-rose-500 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-rose-50 transition-all border border-rose-100"
                                            >
                                                Delete
                                            </button>
                                            {task.status !== 'Completed' && (
                                                <button
                                                    onClick={() => handleComplete(task.id)}
                                                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-slate-900 transition-all transform active:scale-95"
                                                >
                                                    Resolve Task
                                                </button>
                                            )}
                                        </div>

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
                    {filteredTasks.length === 0 && (
                        <div className="col-span-full py-20 bg-white rounded-[4.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle size={32} className="text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Matrix Clear. No active tasks found.</p>
                        </div>
                    )}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New Task"
                size="md"
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Task Title</label>
                        <input
                            type="text"
                            required
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-semibold"
                            placeholder="e.g., Weekly Student Review"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Description</label>
                        <textarea
                            rows="4"
                            required
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-semibold resize-none"
                            placeholder="Provide specific instructions for the mentor..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assign User</label>
                            <select
                                required
                                className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-semibold appearance-none"
                                value={formData.mentor_id}
                                onChange={(e) => setFormData({ ...formData, mentor_id: e.target.value })}
                            >
                                <option value="">Select Target Mentor</option>
                                {mentors.map(m => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fulfillment Deadline</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 transition-all font-semibold"
                                    value={formData.deadline}
                                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority Categorization</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['Low', 'Medium', 'High'].map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`
                                        p-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all
                                        ${formData.priority === p
                                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200'
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}
                                    `}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black text-sm hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100 mt-2 flex items-center justify-center gap-2 group"
                    >
                        <span>Authorize and Issue Task</span>
                        <AlertTriangle size={18} className="transition-transform group-hover:scale-110" />
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default MentorHeadTasks;
