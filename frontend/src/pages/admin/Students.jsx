import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { premiumConfirm } from '../../utils/premiumConfirm';
import { Eye, Edit2, Ban, Trash2, Filter, Download, Search, UserPlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sortStudentsByOption } from '../../components/StudentListFilterDropdown';

const Students = () => {
 const navigate = useNavigate();
 const { user } = useAuth();
 const isSuperAdmin = user?.role === 'super_admin';
 const [students, setStudents] = useState([]);
 const [filteredStudents, setFilteredStudents] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'oldest'

 const [selectedStudent, setSelectedStudent] = useState(null);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [editFormData, setEditFormData] = useState({
 name: '',
 email: '',
 phone_number: '',
 grade: '',
 subject: '',
 timetable: '',
 nextInstallment: '',
 status: '',
 course_completed: 0
 });
 const [dailyHours, setDailyHours] = useState([]);

 useEffect(() => {
 fetchStudents();
 }, [searchTerm, sortBy]);

 const fetchStudents = async () => {
 try {
 setLoading(true);
 const response = await api.get(`/admin/students?search=${searchTerm}&sortBy=${sortBy}`);
 const realStudents = response.data.data;

 setStudents(realStudents);
 setFilteredStudents(realStudents);
 setLoading(false);
 } catch (error) {
 toast.error("Failed to fetch students");
 setLoading(false);
 }
 };

 const handleSearch = (query) => {
 setSearchTerm(query);
 };

 const handleExport = () => {
    const headers = ['Reg #', 'Name', 'Email', 'Grade', 'Mentor', 'Faculty', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredStudents.map(s => [
        `"${s.registration_number || ''}"`,
        `"${s.name}"`,
        `"${s.email}"`,
        `"${s.grade}"`,
        `"${s.mentor || ''}"`,
        `"${s.faculty || ''}"`,
        `"${s.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `students_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

 const handleView = (student) => {
  navigate(`/admin/students/${student.id}`);
 };

 const handleEdit = (student) => {
 setSelectedStudent(student);
 setEditFormData({
 name: student.name,
 email: student.email || '',
 phone_number: student.phone_number || '',
 grade: student.grade,
 subject: student.subject,
 timetable: student.timetable,
 nextInstallment: student.nextInstallment ? student.nextInstallment.split('T')[0] : '',
 status: student.status,
 course_completed: student.course_completed || 0
 });
 setIsEditModalOpen(true);
 };

 const handleEditSubmit = async (e) => {
 e.preventDefault();
 try {
 const res = await api.put(`/admin/students/${selectedStudent.id}`, editFormData);
 if (res.data.success) {
 toast.success("Student updated successfully");
 setIsEditModalOpen(false);
 fetchStudents();
 }
 } catch (error) {
 toast.error(error.response?.data?.message || "Failed to update student");
 }
 };

 const handleApprove = async (student) => {
 try {
 await api.put(`/admin/approve/${student.id}`, { role: 'student' });
 toast.success(`${student.name} approved successfully`);
 fetchStudents(); // Refresh list
 } catch (error) {
 toast.error("Failed to approve student");
 }
 };

 const handleBlock = async (student) => {
 premiumConfirm(async () => {
 try {
 await api.put(`/admin/block/${student.id}`, { role: 'student' });
 toast.success(`${student.name} blocked successfully`);
 fetchStudents();
 } catch (error) {
 toast.error("Failed to block student");
 }
 }, { 
 name: student.name, 
 title: 'Block Access', 
 message: `Suspending ${student.name} will restrict their dashboard access. Continue?`,
 type: 'standard'
 });
 };

 const handleDelete = async (student) => {
 premiumConfirm(async () => {
 try {
 await api.delete(`/admin/delete/${student.id}?role=student`);
 toast.success(`${student.name} deleted successfully`);
 fetchStudents();
 } catch (error) {
 toast.error("Failed to delete student");
 }
 }, { 
 name: student.name, 
 title: 'Permanent Deletion', 
 message: `Are you sure you want to permanently delete student ${student.name}? This action will remove all their data from the database forever and cannot be undone.`,
 type: 'danger'
 });
 };

  const columns = [
    {
      header: 'Student Identification',
      accessor: 'name',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-800 tracking-tight">{row.name}</span>
            <div className="flex gap-1">
              {row.badge === 'Gold' && <span title="Mentorship Plan" className="cursor-help text-xs">🥇</span>}
              {row.badge === 'Silver' && <span title="Tuition Plan" className="cursor-help text-xs">🥈</span>}
              {row.badge === 'Diamond' && <span title="Mentorship & Tuition Plan" className="cursor-help text-xs">💎</span>}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
              {row.registration_number || '---'}
            </span>
            <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{row.email}</span>
          </div>
          {row.course_completed === 1 && (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase tracking-tighter whitespace-nowrap">
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                Course Completed
              </span>
            </div>
          )}
        </div>
      )
    },
    { 
      header: 'Academics', 
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-black text-slate-700">{row.grade}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate max-w-[120px]">{row.subject || '---'}</span>
        </div>
      )
    },
    { 
      header: 'Mentorship Node', 
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] font-black text-slate-700 truncate max-w-[120px]">{row.mentor || 'Not Assigned'}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide truncate max-w-[120px]">{row.faculty || 'No Faculty'}</span>
        </div>
      )
    },
    {
      header: 'Network Status',
      width: '120px',
      render: (row) => (
        <span className={`inline-flex items-center justify-center min-w-[80px] px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.15em] shadow-sm border transition-all ${row.status === 'active' 
          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
          : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'}`}>
          {row.status === 'active' ? 'Active' : row.status === 'inactive' ? 'Backup' : row.status === 'pending' ? 'Left' : row.status}
        </span>
      )
    },
  ];

  return (
    <div className="flex flex-col gap-10 pb-10">
      <div className="bg-white/70 backdrop-blur-xl p-12 rounded-[40px] border border-white/60 shadow-[0_10px_30px_rgba(0,0,0,0.04)] flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="text-center md:text-left">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3 ">Student Enrollment</h2>
          <p className="text-slate-600 text-[11px] font-black uppercase tracking-[0.25em] flex items-center justify-center md:justify-start gap-3 mt-1">
            <span className="w-2 h-2 rounded-full bg-[#008080] animate-pulse shadow-[0_0_10px_rgba(20,184,166,0.5)]"></span>
            Cross-functional Academic Database Nexus
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-5">
          <div className="flex items-center gap-4 bg-slate-50/50 px-8 py-5 rounded-[24px] border border-slate-100/50 shadow-inner group">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] leading-none whitespace-nowrap">Sort Engine</span>
            <div className="w-px h-10 bg-slate-200"></div>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent border-none text-xs font-black uppercase tracking-[0.1em] text-slate-800 outline-none focus:ring-0 cursor-pointer "
            >
              <option value="newest">Latest Optimized</option>
              <option value="oldest">Legacy Priority</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-2">
        <div className="bg-white/70 backdrop-blur-md p-8 rounded-[35px] border border-white/60 shadow-sm flex flex-col gap-2 group transition-all hover:bg-white hover:shadow-md">
          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-[#008080] transition-colors">Total Enrollment</span>
          <div className="flex items-end gap-3 font-black text-slate-900 tracking-tighter">
            <span className="text-4xl leading-none">{students.length}</span>
            <span className="text-[10px] text-slate-600 mb-1 uppercase tracking-widest">Active Members</span>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-md p-8 rounded-[35px] border border-white/60 shadow-sm flex flex-col gap-2 group transition-all hover:bg-white hover:shadow-md">
          <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Active Pulse</span>
          <div className="flex items-end gap-3 font-black text-slate-900 tracking-tighter">
            <span className="text-4xl leading-none">{students.filter(s => s.status === 'active').length}</span>
            <div className="flex items-center gap-1.5 mb-1 bg-[#10B981]/10 px-2 py-0.5 rounded-full">
               <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></div>
               <span className="text-[10px] text-[#10B981] uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={useMemo(() => sortStudentsByOption(filteredStudents, sortBy), [filteredStudents, sortBy])}
        loading={loading}
        onSearch={handleSearch}
        onExport={handleExport}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onApprove={handleApprove}
        onBlock={handleBlock}
        searchPlaceholder="Search by name, email or reg #"
      />

 {/* Edit Student Modal */}
 <Modal
 isOpen={isEditModalOpen}
 onClose={() => setIsEditModalOpen(false)}
 title="Reconfigure Student Artifact"
 size="lg"
 >
 <form onSubmit={handleEditSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
 <div className="flex flex-col gap-2">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Full Name</label>
 <input
 type="text"
 className="p-5 bg-slate-50/50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-[#008080]/5 focus:border-[#008080]/20 transition-all"
 value={editFormData.name}
 onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
 required
 />
 </div>
 <div className="flex flex-col gap-2">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Email</label>
 <input
 type="email"
 className="p-5 bg-slate-50/50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-[#008080]/5 focus:border-[#008080]/20 transition-all"
 value={editFormData.email}
 onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
 />
 </div>
 <div className="flex flex-col gap-2">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Phone Number</label>
 <input
 type="text"
 className="p-5 bg-slate-50/50 border border-slate-100 rounded-[20px] text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-[#008080]/5 focus:border-[#008080]/20 transition-all"
 value={editFormData.phone_number}
 onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
 />
 </div>
 <div className="flex flex-col gap-2">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Grade</label>
 <input
 type="text"
 className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all"
 value={editFormData.grade}
 onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
 required
 />
 </div>
 <div className="flex flex-col gap-2">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Subject</label>
 <input
 type="text"
 className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all"
 value={editFormData.subject}
 onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
 required
 />
 </div>
 <div className="flex flex-col gap-2">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Next Installment</label>
 <input
 type="date"
 className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all"
 value={editFormData.nextInstallment}
 onChange={(e) => setEditFormData({ ...editFormData, nextInstallment: e.target.value })}
 />
 </div>
 <div className="flex flex-col gap-2">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Course Status</label>
 <button
 type="button"
 onClick={() => setEditFormData({ ...editFormData, course_completed: editFormData.course_completed === 1 ? 0 : 1 })}
 className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 flex items-center justify-center gap-3 ${editFormData.course_completed === 1 ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
 >
 {editFormData.course_completed === 1 ? (
 <><CheckCircle size={14} /> Completed</>
 ) : (
 <><Clock size={14} /> In Progress</>
 )}
 </button>
 </div>
 <div className="col-span-2 flex flex-col gap-2">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Status</label>
 <select
 className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all"
 value={editFormData.status}
 onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
 >
  <option value="active">Active</option>
  <option value="inactive">Backup</option>
  <option value="pending">Left</option>
  <option value="rejected">Rejected</option>
 </select>
 </div>
 <div className="col-span-2 flex flex-col gap-2">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-2">Timetable Summary</label>
 <textarea
 className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all min-h-[100px]"
 value={editFormData.timetable}
 onChange={(e) => setEditFormData({ ...editFormData, timetable: e.target.value })}
 />
 </div>
 <div className="col-span-2 flex justify-end gap-3 pt-8 pb-4">
 <button type="button" className="px-8 py-4 rounded-[18px] border border-slate-100 text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-600 hover:bg-slate-50 transition-all font-sans" onClick={() => setIsEditModalOpen(false)}>Abort Change</button>
 <button type="submit" className="px-10 py-4 rounded-[18px] bg-gradient-to-br from-[#006666] to-[#008080] text-white text-[11px] font-black uppercase tracking-[0.2em] hover:shadow-lg hover:shadow-[#008080]/30 hover:-translate-y-1 transition-all shadow-md shadow-[#008080]/20 font-sans">Commit Data Refresh</button>
 </div>
 </form>
 </Modal>


 </div>
 );
};

const InfoGroup = ({ label, value, highlight }) => (
 <div className="flex flex-col gap-2 p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 hover:border-[#008080]/30 hover:bg-white hover:shadow-[0_10px_20px_rgba(0,0,0,0.03)] transition-all group overflow-hidden relative">
 <div className={`absolute top-0 right-0 w-12 h-12 bg-[#008080]/5 rounded-bl-[24px] transition-all duration-500 scale-0 group-hover:scale-100`}></div>
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] group-hover:text-[#008080] transition-colors">{label}</label>
 <p className={`text-sm font-bold leading-relaxed ${highlight ? 'text-[#008080]' : 'text-slate-800'}`}>{value || '---'}</p>
 </div>
);

export default Students;
