import React, { useState, useEffect } from 'react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { premiumConfirm } from '../../utils/premiumConfirm';
import { Eye, Edit2, Ban, Trash2, Filter, Download, UserPlus, Search, UserSquare2, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Faculties = () => {
 const { user } = useAuth();
 const isSuperAdmin = user?.role === 'super_admin';
 const [faculties, setFaculties] = useState([]);
 const [filteredFaculties, setFilteredFaculties] = useState([]);
 const [loading, setLoading] = useState(true);
 const [sortBy, setSortBy] = useState('newest');
 const [selectedFaculty, setSelectedFaculty] = useState(null);
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [detailLoading, setDetailLoading] = useState(false);
 const [facultyDetail, setFacultyDetail] = useState(null);
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 const [editFormData, setEditFormData] = useState({
 name: '',
 email: '',
 phone_number: '',
 status: '',
 role: 'faculty'
 });

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

 const sortedFaculties = [...filteredFaculties].sort((a, b) => {
    if (sortBy === 'newest') return b.id - a.id;
    if (sortBy === 'oldest') return a.id - b.id;
    return 0;
  });

 const handleExport = () => {
    const headers = ['Faculty Lead', 'Email', 'Phone', 'Mentors Group', 'Total Students', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredFaculties.map(f => [
        `"${f.name}"`,
        `"${f.email}"`,
        `"${f.phone || ''}"`,
        f.mentorsUnder,
        f.studentsUnder,
        `"${f.status}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `faculties_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = async (faculty) => {
    setSelectedFaculty(faculty);
    setIsModalOpen(true);
    setDetailLoading(true);
    setFacultyDetail(null);
    try {
      const response = await api.get(`/admin/faculties/${faculty.id}/details`);
      setFacultyDetail(response.data.data);
    } catch (error) {
      toast.error("Failed to fetch faculty details");
    } finally {
      setDetailLoading(false);
    }
  };

 const handleEdit = (faculty) => {
 setSelectedFaculty(faculty);
 setEditFormData({
 name: faculty.name,
 email: faculty.email,
 phone_number: faculty.phone || '',
 status: faculty.status,
 role: 'faculty'
 });
 setIsEditModalOpen(true);
 };

 const handleUpdate = async (e) => {
 e.preventDefault();
 try {
 await api.put(`/admin/users/${selectedFaculty.id}`, editFormData);
 toast.success("Faculty updated successfully");
 setIsEditModalOpen(false);
 fetchFaculties();
 } catch (error) {
 toast.error(error.response?.data?.message || "Failed to update faculty");
 }
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
 premiumConfirm(async () => {
 try {
 await api.put(`/admin/block/${faculty.id}`);
 toast.success(`${faculty.name} blocked successfully`);
 fetchFaculties();
 } catch (error) {
 toast.error("Failed to block faculty");
 }
 }, { 
 name: faculty.name, 
 title: 'Block Faculty', 
 message: `Suspending faculty ${faculty.name} will disable their access to students and logs.`,
 type: 'standard'
 });
 };

 const handleDelete = async (faculty) => {
 premiumConfirm(async () => {
 try {
 await api.delete(`/admin/delete/${faculty.id}`);
 toast.success(`Faculty ${faculty.name} deleted`);
 fetchFaculties();
 } catch (error) {
 toast.error("Failed to delete faculty");
 }
 }, { 
 name: faculty.name, 
 title: 'Permanent Deletion', 
 message: `Are you sure you want to permanently delete faculty member ${faculty.name}? This action will remove all their data from the database forever and cannot be undone.`,
 type: 'danger'
 });
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
 {row.status === 'active' ? 'Active' : row.status === 'inactive' ? 'Backup' : row.status === 'pending' ? 'Left' : row.status}
 </span>
 )
 },
 ];

 return (
 <div className="flex flex-col gap-10">
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
    <div className="flex flex-col">
      <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-3 ">Faculty Administration</h2>
      <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Manage and monitor all tuition faculties</p>
    </div>
    
    <div className="flex items-center gap-4 bg-white/70 backdrop-blur-md px-6 py-4 rounded-[20px] border border-white/60 shadow-sm group">
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sort By</span>
      <div className="w-px h-6 bg-slate-200"></div>
      <select 
        value={sortBy} 
        onChange={(e) => setSortBy(e.target.value)}
        className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-800 outline-none focus:ring-0 cursor-pointer"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>
    </div>
  </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-2">
    <div className="bg-white/70 backdrop-blur-md p-8 rounded-[35px] border border-white/60 shadow-sm flex flex-col gap-2 group transition-all hover:bg-white hover:shadow-md">
      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-[#008080] transition-colors">Total Faculty</span>
      <div className="flex items-end gap-3 font-black text-slate-900 tracking-tighter">
        <span className="text-4xl leading-none">{faculties.length}</span>
        <span className="text-[10px] text-slate-600 mb-1 uppercase tracking-widest">Database Total</span>
      </div>
    </div>
    
    <div className="bg-white/70 backdrop-blur-md p-8 rounded-[35px] border border-white/60 shadow-sm flex flex-col gap-2 group transition-all hover:bg-white hover:shadow-md">
      <span className="text-[10px] font-black text-[#10B981] uppercase tracking-widest">Active Faculties</span>
      <div className="flex items-end gap-3 font-black text-slate-900 tracking-tighter">
        <span className="text-4xl leading-none">{faculties.filter(f => f.status === 'active').length}</span>
        <div className="flex items-center gap-1.5 mb-1 bg-[#10B981]/10 px-2 py-0.5 rounded-full">
           <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></div>
           <span className="text-[10px] text-[#10B981] uppercase tracking-widest">Live</span>
        </div>
      </div>
    </div>
  </div>

  <DataTable
 columns={columns}
 data={sortedFaculties}
 loading={loading}
 onSearch={handleSearch}
 onExport={handleExport}
 onView={handleView}
 searchPlaceholder="Search leads by name or email..."
 />

 {/* Edit Faculty Modal */}
 <Modal
 isOpen={isEditModalOpen}
 onClose={() => setIsEditModalOpen(false)}
 title="Edit Faculty Details"
 size="md"
 >
 <form onSubmit={handleUpdate} className="flex flex-col gap-5">
 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-1">Full Name</label>
 <input
 type="text"
 className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080]/5 transition-all"
 value={editFormData.name}
 onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
 required
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-1">Email Address</label>
 <input
 type="email"
 className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all"
 value={editFormData.email}
 onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
 required
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-1">Phone Number</label>
 <input
 type="text"
 className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080] transition-all"
 value={editFormData.phone_number}
 onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest pl-1">Account Status</label>
 <select
 className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-[#008080]/10 transition-all"
 value={editFormData.status}
 onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
 >
  <option value="active">Active</option>
  <option value="inactive">Backup</option>
  <option value="pending">Left</option>
 </select>
 </div>
 <div className="flex justify-end gap-3 mt-8">
 <button type="button" className="px-8 py-3.5 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-600 hover:bg-slate-50 transition-all" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
 <button type="submit" className="px-10 py-3.5 rounded-2xl bg-gradient-to-br from-[#006666] to-[#008080] text-white text-[10px] font-black uppercase tracking-[0.2em] hover:shadow-lg hover:shadow-[#008080]/30 hover:-translate-y-1 transition-all shadow-md shadow-[#008080]/20">Save Changes</button>
 </div>
 </form>
 </Modal>

  <Modal
  isOpen={isModalOpen}
  onClose={() => { setIsModalOpen(false); setFacultyDetail(null); }}
  title="Faculty Profile"
  size="lg"
  >
  {selectedFaculty && (
  <div className="flex flex-col gap-8">
  <div className="flex items-center gap-8 p-8 bg-[#008080]/5 rounded-[32px] border border-[#008080]/10 shadow-[0_10px_30px_rgba(20,184,166,0.05)]">
  <div className="w-24 h-24 bg-gradient-to-br from-[#006666] to-[#008080] text-white rounded-[28px] flex items-center justify-center text-4xl font-black shadow-xl shadow-[#008080]/20">
  {selectedFaculty.name.charAt(0)}
  </div>
  <div className="flex flex-col gap-2">
  <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none ">{selectedFaculty.name}</h3>
  <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">{selectedFaculty.email}</p>
  <div className="mt-3 flex gap-2">
  <span className="px-4 py-1.5 bg-[#F59E0B]/10 rounded-xl text-[9px] font-bold text-[#F59E0B] border border-[#F59E0B]/20 uppercase tracking-[0.15em]">
  Tuition Faculty
  </span>
  <span className={`px-4 py-1.5 rounded-xl text-[9px] font-bold border uppercase tracking-[0.15em] ${
    selectedFaculty.status === 'active' 
      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
      : selectedFaculty.status === 'inactive'
      ? 'bg-amber-50 text-amber-600 border-amber-100'
      : 'bg-rose-50 text-rose-600 border-rose-100'
  }`}>
  Status: {selectedFaculty.status === 'active' ? 'Active' : selectedFaculty.status === 'inactive' ? 'Backup' : 'Left'}
  </span>
  </div>
  </div>
  </div>

  <div className="bg-white border border-slate-100 rounded-[32px] p-8 space-y-6 shadow-sm">
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Registration Details</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</span>
        <span className="text-sm font-bold text-slate-800">{selectedFaculty.name}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</span>
        <span className="text-sm font-bold text-slate-800">{selectedFaculty.email || 'N/A'}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Direct Contact / Phone</span>
        <span className="text-sm font-bold text-slate-800">{selectedFaculty.phone || 'N/A'}</span>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registered Subject</span>
        <span className="text-sm font-bold text-slate-800">{selectedFaculty.subject || 'N/A'}</span>
      </div>
    </div>
  </div>

  {detailLoading ? (
    <div className="flex flex-col items-center justify-center py-10 gap-3">
      <div className="w-8 h-8 border-4 border-[#008080] border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fetching assignment roster...</p>
    </div>
  ) : facultyDetail ? (
    <div className="space-y-6">
      <div className="p-8 bg-white border border-slate-100 rounded-[32px] flex items-center gap-6 hover:border-[#F59E0B]/20 hover:shadow-lg transition-all group overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#F59E0B]/5 rounded-bl-[48px] -mr-8 -mt-8 group-hover:scale-125 transition-transform duration-500"></div>
        <div className="p-4 bg-[#F59E0B]/5 text-[#F59E0B] rounded-[20px] shadow-sm relative z-10 border border-[#F59E0B]/10">
          <GraduationCap size={24} />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] leading-none mb-2">Enrolled Students</p>
          <h4 className="text-3xl font-black text-slate-800 tracking-tighter leading-none">{facultyDetail.students?.length || 0}</h4>
        </div>
      </div>

      <div className="space-y-4">
        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Student & Subject Roster</h5>
        {facultyDetail.students && facultyDetail.students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facultyDetail.students.map((student, idx) => (
              <div key={idx} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex flex-col gap-3 shadow-inner hover:border-[#008080]/30 hover:bg-white transition-all">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{student.student_name}</span>
                  <span className="px-2.5 py-1 bg-[#008080]/10 text-[#008080] border border-[#008080]/20 rounded-lg text-[8px] font-black uppercase tracking-widest">
                    {student.grade || 'Grade N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Subject Taught</span>
                    <span className="text-xs font-bold text-slate-700 uppercase">{student.subject || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Course Group</span>
                    <span className="text-xs font-bold text-slate-700 uppercase">{student.course || 'N/A'}</span>
                  </div>
                </div>
                {student.day_of_week && (
                  <div className="flex items-center gap-2 mt-1 text-[9px] font-bold text-slate-500 bg-white p-2 rounded-xl border border-slate-100">
                    <span className="text-[#008080] uppercase tracking-wider">{student.day_of_week}</span>
                    <span className="text-slate-300">|</span>
                    <span>{student.start_time} - {student.end_time}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 border border-slate-100 rounded-[2rem]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active students assigned to this faculty</p>
          </div>
        )}
      </div>
    </div>
  ) : null}

  <div className="flex justify-end gap-3 pt-6 border-t border-slate-100/50">
  <button className="px-8 py-4 rounded-[20px] border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-slate-600 hover:bg-slate-50 transition-all font-sans" onClick={() => { setIsModalOpen(false); setFacultyDetail(null); }}>Close</button>
  </div>
  </div>
  )}
  </Modal>
 </div>
 );
};

export default Faculties;
