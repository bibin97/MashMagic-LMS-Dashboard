import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { UserSquare2, GraduationCap } from 'lucide-react';

const Faculties = () => {
    const [faculties, setFaculties] = useState([]);
    const [filteredFaculties, setFilteredFaculties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedFaculty, setSelectedFaculty] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchFaculties();
    }, []);

    const fetchFaculties = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/faculties');
            const realFaculties = response.data.data;

            setFaculties(realFaculties);
            setFilteredFaculties(realFaculties);
            setLoading(false);
        } catch (error) {
            toast.error("Failed to fetch faculties");
            setLoading(false);
        }
    };

    const handleSearch = (query) => {
        const filtered = faculties.filter(f =>
            f.name?.toLowerCase().includes(query.toLowerCase()) ||
            f.email?.toLowerCase().includes(query.toLowerCase()) ||
            f.phone?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredFaculties(filtered);
    };

    const handleView = (faculty) => {
        setSelectedFaculty(faculty);
        setIsModalOpen(true);
    };

    const handleApprove = async (faculty) => {
        try {
            await api.put(`/admin/approve/${faculty.id}`);
            toast.success(`Faculty ${faculty.name} approved`);
            fetchFaculties();
        } catch (error) {
            toast.error("Failed to approve faculty");
        }
    };

    const handleBlock = async (faculty) => {
        if (!window.confirm(`Suspend access for faculty lead ${faculty.name}?`)) return;
        try {
            await api.put(`/admin/block/${faculty.id}`);
            toast.success(`Faculty ${faculty.name} blocked`);
            fetchFaculties();
        } catch (error) {
            toast.error("Failed to block faculty");
        }
    };

    const handleDelete = async (faculty) => {
        if (!window.confirm(`Delete faculty lead ${faculty.name} permanently?`)) return;
        try {
            await api.delete(`/admin/delete/${faculty.id}`);
            toast.success(`Faculty ${faculty.name} deleted`);
            fetchFaculties();
        } catch (error) {
            toast.error("Failed to delete faculty");
        }
    };

    const columns = [
        { header: 'Faculty Lead', accessor: 'name' },
        { header: 'Email Address', accessor: 'email' },
        { header: 'Direct Contact', accessor: 'phone' },
        { header: 'Mentors Group', accessor: 'mentorsUnder' },
        { header: 'Total Students', accessor: 'studentsUnder' },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => (
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border ${row.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                    {row.status}
                </span>
            )
        },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Faculty Administration</h2>
                <p className="text-slate-500 text-sm font-medium">Head-level management of academic resources and staff</p>
            </div>

            <DataTable
                columns={columns}
                data={filteredFaculties}
                loading={loading}
                onSearch={handleSearch}
                onView={handleView}
                onApprove={handleApprove}
                onBlock={handleBlock}
                onDelete={handleDelete}
                searchPlaceholder="Search leads by name or email..."
            />

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Academic Leadership Profile"
                size="lg"
            >
                {selectedFaculty && (
                    <div className="flex flex-col gap-10">
                        <div className="flex items-center gap-6 p-8 bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-3xl">
                            <div className="w-24 h-24 bg-amber-500 text-white rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-xl shadow-amber-100 rotate-3">
                                {selectedFaculty.name.charAt(0)}
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-2xl font-black text-slate-900">{selectedFaculty.name}</h3>
                                <p className="text-slate-500 font-semibold">{selectedFaculty.email}</p>
                                <div className="mt-3 flex gap-2">
                                    <span className="px-3 py-1 bg-amber-50 rounded-lg text-xs font-bold text-amber-700 border border-amber-100">
                                        Head Faculty
                                    </span>
                                    <span className="px-3 py-1 bg-slate-50 rounded-lg text-xs font-bold text-slate-600 border border-slate-200">
                                        Exp: 8+ Years
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-3xl flex items-center gap-5 hover:bg-blue-50 transition-colors">
                                <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-sm">
                                    <UserSquare2 size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Mentors Managed</p>
                                    <h4 className="text-2xl font-black text-blue-900">{selectedFaculty.mentorsUnder}</h4>
                                </div>
                            </div>
                            <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl flex items-center gap-5 hover:bg-indigo-50 transition-colors">
                                <div className="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm">
                                    <GraduationCap size={24} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Enrolled Students</p>
                                    <h4 className="text-2xl font-black text-indigo-900">{selectedFaculty.studentsUnder}</h4>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Assignment Roster</h5>
                            <div className="grid grid-cols-2 gap-4">
                                {[...Array(selectedFaculty.mentorsUnder)].map((_, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl hover:border-blue-300 transition-all group">
                                        <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600">Mentor {String.fromCharCode(65 + i)}</span>
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{Math.floor(Math.random() * 10) + 5} STU</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <button className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all" onClick={() => setIsModalOpen(false)}>Close</button>
                            <button className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">Resource Allocation</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Faculties;
