import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Search, Edit3, X, Check, FileText } from 'lucide-react';
import DataTable from '../../components/DataTable';
import { useAuth } from '../../context/AuthContext';

const EnrollmentNotes = () => {
    const { user } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editNote, setEditNote] = useState('');

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('token');
            const basePath = user?.role === 'academic_operation_executive' ? '/api/aoe' : '/api/academic-head';
            const res = await axios.get(`${basePath}/enrollment-notes`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setStudents(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching enrollment notes:', error);
            toast.error('Failed to fetch enrollment notes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSaveNote = async (studentId) => {
        try {
            const token = sessionStorage.getItem('token');
            const basePath = user?.role === 'academic_operation_executive' ? '/api/aoe' : '/api/academic-head';
            const res = await axios.put(`${basePath}/enrollment-notes/${studentId}`, {
                enrollment_note: editNote
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.success) {
                toast.success('Note updated successfully');
                setStudents(students.map(s => s.id === studentId ? { ...s, enrollment_note: editNote } : s));
                setEditingId(null);
            }
        } catch (error) {
            console.error('Error saving note:', error);
            toast.error('Failed to save note');
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditNote('');
    };

    const startEditing = (student) => {
        setEditingId(student.id);
        setEditNote(student.enrollment_note || '');
    };

    const filteredStudents = students.filter(s => 
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.course || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const columns = [
        {
            header: 'Student Name',
            accessor: 'name',
            render: (row) => (
                <div>
                    <p className="font-bold text-slate-800">{row.name}</p>
                    <p className="text-xs text-slate-500">{row.grade} • {row.course}</p>
                </div>
            )
        },
        {
            header: 'Enrollment Type',
            accessor: 'enrollment_type',
            render: (row) => (
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    row.enrollment_type?.includes('Mentorship') ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-700'
                }`}>
                    {row.enrollment_type || 'N/A'}
                </span>
            )
        },
        {
            header: 'Enrollment Note',
            accessor: 'enrollment_note',
            render: (row) => (
                editingId === row.id ? (
                    <div className="flex flex-col gap-2 min-w-[250px]">
                        <textarea
                            className="w-full p-3 bg-white border-2 border-[#008080] rounded-xl text-sm focus:outline-none"
                            rows={3}
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Enter note here..."
                        />
                        <div className="flex gap-2 justify-end">
                            <button 
                                onClick={handleCancelEdit}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <button 
                                onClick={() => handleSaveNote(row.id)}
                                className="px-4 py-2 bg-[#008080] hover:bg-teal-700 text-white font-bold text-sm rounded-lg transition-colors flex items-center gap-2"
                            >
                                <Check size={16} /> Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-start justify-between gap-4 group">
                        <div className="text-sm text-slate-600 whitespace-pre-wrap max-w-md">
                            {row.enrollment_note || <span className="text-slate-400 italic">No notes added</span>}
                        </div>
                        <button 
                            onClick={() => startEditing(row)}
                            className="p-2 text-[#008080] bg-teal-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Edit Note"
                        >
                            <Edit3 size={16} />
                        </button>
                    </div>
                )
            )
        },
        { header: 'Faculty', accessor: 'faculty_name' },
        { header: 'Mentor', accessor: 'mentor_name' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#008080]/10 text-[#008080] rounded-2xl flex items-center justify-center">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter">Enrollment Notes</h1>
                        <p className="text-slate-500 text-sm font-semibold">Manage academic path notes for students</p>
                    </div>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search students..." 
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#008080] transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-2">
                <DataTable 
                    columns={columns}
                    data={filteredStudents}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default EnrollmentNotes;
