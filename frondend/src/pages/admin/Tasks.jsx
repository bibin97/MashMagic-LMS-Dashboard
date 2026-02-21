import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Plus, Calendar, Clock, AlertTriangle } from 'lucide-react';

const Tasks = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [mentors, setMentors] = useState([]);
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
            const response = await api.get('/tasks');
            setTasks(response.data.data);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to load tasks");
            setLoading(false);
        }
    };

    const fetchMentors = async () => {
        try {
            const response = await api.get('/admin/users');
            const mentorUsers = response.data.data.filter(u => u.role === 'mentor');
            setMentors(mentorUsers);
        } catch (error) {
            console.error("Failed to fetch mentors for assignment");
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

    const handleDelete = async (task) => {
        if (!window.confirm("Delete this task?")) return;
        try {
            await api.delete(`/tasks/${task.id}`);
            toast.success("Task removed");
            fetchTasks();
        } catch (error) {
            toast.error("Failed to delete task");
        }
    };

    const columns = [
        {
            header: 'Task Objective', accessor: 'title', render: (row) => (
                <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{row.title}</span>
                    <span className="text-xs text-slate-400 font-medium truncate max-w-[200px]">{row.description}</span>
                </div>
            )
        },
        {
            header: 'Assigned Mentor', accessor: 'mentor_name', render: (row) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 uppercase">
                        {row.mentor_name?.charAt(0) || 'U'}
                    </div>
                    <span className="text-slate-600 font-semibold">{row.mentor_name || 'Unassigned'}</span>
                </div>
            )
        },
        {
            header: 'Deadline', accessor: 'deadline', render: (row) => (
                <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                    <Calendar size={14} className="text-slate-300" />
                    {new Date(row.deadline).toLocaleDateString()}
                </div>
            )
        },
        {
            header: 'Priority', accessor: 'priority', render: (row) => (
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${row.priority === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                    row.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                    {row.priority}
                </span>
            )
        },
        {
            header: 'Phase', accessor: 'status', render: (row) => (
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${row.status === 'Completed' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${row.status === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {row.status}
                    </span>
                </div>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-end">
                <div className="flex flex-col gap-1">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Directives</h2>
                    <p className="text-slate-500 text-sm font-medium">Coordinate and track educational tasks for the mentor network</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 hover:-translate-y-0.5"
                >
                    <Plus size={20} />
                    <span>Issue New Directive</span>
                </button>
            </div>

            <DataTable
                columns={columns}
                data={tasks}
                loading={loading}
                onDelete={handleDelete}
                searchPlaceholder="Filter directives by title..."
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create New System Directive"
                size="md"
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Directive Title</label>
                        <input
                            type="text"
                            required
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-semibold"
                            placeholder="e.g., Q1 Performance Review"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Description</label>
                        <textarea
                            rows="4"
                            required
                            className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-semibold resize-none"
                            placeholder="Provide specific instructions for the mentor..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Operational Mentor</label>
                            <select
                                required
                                className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-semibold appearance-none"
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
                                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-semibold"
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
                        className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 mt-2 flex items-center justify-center gap-2 group"
                    >
                        <span>Authorize and Issue Directive</span>
                        <AlertTriangle size={18} className="transition-transform group-hover:scale-110" />
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Tasks;
