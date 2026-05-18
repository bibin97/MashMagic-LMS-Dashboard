import React, { useState, useEffect, useMemo } from 'react';
import {
	Users, Search, Filter, Edit2, Trash2, X, Save,
	GraduationCap, BookOpen, Clock, Activity, Calendar, Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import StudentListFilterDropdown, { sortStudentsByOption } from '../../components/StudentListFilterDropdown';
import { premiumConfirm } from '../../utils/premiumConfirm';

const StudentsList = ({ role = 'academic_head' }) => {
	const [students, setStudents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState('');
	const [filterCourse, setFilterCourse] = useState('all');
	const [sortBy, setSortBy] = useState('join_newest');
	const [mentors, setMentors] = useState([]);
	const [faculties, setFaculties] = useState([]);
	const [filterMentor, setFilterMentor] = useState('all');
	const [filterFaculty, setFilterFaculty] = useState('all');

	// Base API path based on role
	const apiPath = role === 'mentor_head' ? '/mentor-head' : '/academic-head';
	const navigate = useNavigate();

	const coursesList = ["Mission X", "Classmate", "Crash 45", "Bright Bridge", "Magic Revision"];

	useEffect(() => {
		fetchDropdownData();
	}, []);

	useEffect(() => {
		fetchStudents();
	}, [role, searchTerm, sortBy, filterCourse, filterMentor, filterFaculty]);

	const fetchDropdownData = async () => {
		try {
			const res = await api.get(`${apiPath}/dropdowns`);
			if (res.data.success) {
				setMentors(res.data.data.mentors || []);
				setFaculties(res.data.data.faculties || []);
			}
		} catch (error) { console.error("Dropdown fetch error:", error); }
	};

	const fetchStudents = async () => {
		try {
			const mentorParam = filterMentor !== 'all' ? `&mentor_id=${filterMentor}` : '';
			const facultyParam = filterFaculty !== 'all' ? `&faculty_id=${filterFaculty}` : '';
			const res = await api.get(`${apiPath}/students-all?search=${searchTerm}&sortBy=${sortBy}&course=${filterCourse}${mentorParam}${facultyParam}`);
			if (res.data.success) {
				setStudents(res.data.data);
			}
		} catch (error) {
			toast.error("Failed to load students directory");
		} finally {
			setLoading(false);
		}
	};

	const handleEdit = (student) => {
		navigate(`${apiPath}/edit-student/${student.id}`);
	};

	const handleView = (student) => {
		navigate(`${apiPath}/students/${student.id}`);
	};

	const handleDelete = async (studentParam) => {
		const id = typeof studentParam === 'object' ? studentParam.id : studentParam;
		const name = typeof studentParam === 'object' ? studentParam.name : 'this student';

		premiumConfirm(async () => {
			try {
				const res = await api.delete(`${apiPath}/students/${id}`);
				if (res.data.success) {
					toast.success("Student record deleted");
					fetchStudents();
				}
			} catch (error) {
				toast.error(error.response?.data?.message || "Delete failed");
			}
		}, {
			name: name,
			title: 'Delete Student Record',
			message: `Are you sure you want to permanently delete student ${name}? This action will remove all their data from the database forever and cannot be undone.`,
			type: 'danger'
		});
	};

	const filteredStudents = useMemo(() => {
		const filtered = students.filter(s => {
			const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(s.registration_number && s.registration_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
				s.grade.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesCourse = filterCourse === 'all' || s.course === filterCourse;
			return matchesSearch && matchesCourse;
		});
		return sortStudentsByOption(filtered, sortBy);
	}, [students, searchTerm, filterCourse, sortBy]);

	if (loading) return <div className="p-20 text-center font-black text-slate-600 animate-pulse">SYNCING STUDENT RECORDS...</div>;

	return (
		<div className="space-y-8 animate-in fade-in duration-700">
			{/* Header */}
			<div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
				<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
					<div className="max-w-md">
						<h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Student Directory</h2>
						<p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
							<GraduationCap size={14} className="text-[#008080]" />
							Comprehensive database of all enrolled students across all courses and mentors
						</p>
					</div>

					<div className="relative group w-full lg:w-96">
						<Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-[#008080] transition-colors" size={18} />
						<input
							type="text"
							placeholder="SEARCH BY NAME OR REG #..."
							className="pl-14 pr-8 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold uppercase tracking-[0.1em] focus:ring-4 ring-[#008080]/10 w-full shadow-sm transition-all outline-none focus:bg-white"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
				</div>

				{/* Filters Row */}
				<div className="flex flex-wrap items-center gap-4 pt-6 border-t border-slate-50">
					<div className="flex items-center gap-2 bg-slate-100/50 px-4 py-2 rounded-xl">
						<Activity size={12} className="text-[#008080]" />
						<span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Quick Filters:</span>
					</div>

					<select
						value={filterCourse}
						onChange={(e) => setFilterCourse(e.target.value)}
						className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-4 ring-[#008080]/10 transition-all cursor-pointer shadow-sm hover:bg-white"
					>
						<option value="all">All Courses</option>
						{coursesList.map(c => <option key={c} value={c}>{c}</option>)}
					</select>

					<div className="relative">
						<select 
							value={filterMentor}
							onChange={(e) => setFilterMentor(e.target.value)}
							className="h-14 pl-6 pr-12 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 ring-[#008080]/10 focus:border-[#008080] transition-all appearance-none cursor-pointer min-w-[160px] shadow-sm hover:bg-white"
						>
							<option value="all">All Mentors</option>
							{mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
						</select>
						<Users size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
					</div>

					<div className="relative">
						<select 
							value={filterFaculty}
							onChange={(e) => setFilterFaculty(e.target.value)}
							className="h-14 pl-6 pr-12 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 ring-[#008080]/10 focus:border-[#008080] transition-all appearance-none cursor-pointer min-w-[160px] shadow-sm hover:bg-white"
						>
							<option value="all">All Faculties</option>
							{faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
						</select>
						<Activity size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
					</div>

					<div className="lg:ml-auto">
						<StudentListFilterDropdown value={sortBy} onChange={setSortBy} />
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-2 group transition-all hover:shadow-xl hover:shadow-[#008080]/5 hover:-translate-y-1">
					<span className="text-[10px] font-black text-slate-600 uppercase tracking-widest group-hover:text-[#008080] transition-colors">Enrolled Scholars</span>
					<div className="flex items-end gap-3 font-black text-slate-900 tracking-tighter">
						<span className="text-4xl leading-none">{students.length}</span>
						<span className="text-[10px] text-slate-600 mb-1 uppercase tracking-widest">Total Population</span>
					</div>
				</div>

				<div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col gap-2 group transition-all hover:shadow-xl hover:shadow-[#008080]/5 hover:-translate-y-1">
					<span className="text-[10px] font-black text-[#008080] uppercase tracking-widest">Active Pulse</span>
					<div className="flex items-end gap-3 font-black text-slate-900 tracking-tighter">
						<span className="text-4xl leading-none">{students.filter(s => (s.status === 'active' || s.isActive === 1)).length}</span>
						<div className="flex items-center gap-1.5 mb-1 bg-[#008080]/10 px-2 py-0.5 rounded-full">
							<div className="w-1.5 h-1.5 rounded-full bg-[#008080] animate-pulse"></div>
							<span className="text-[10px] text-[#008080] uppercase tracking-widest">Live</span>
						</div>
					</div>
				</div>
			</div>

			{/* Table */}
			<div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/20 overflow-hidden">
				<div className="overflow-x-auto">
					<table className="w-full text-left">
						<thead>
							<tr className="bg-slate-50/50 border-b border-slate-100">
								<th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Student Information</th>
								<th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Course & Grade</th>
								<th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest">Mentor & Faculty</th>
								<th className="px-8 py-6 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-50">
							{filteredStudents.length > 0 ? filteredStudents.map((student) => (
								<tr key={student.id} className="hover:bg-[#008080]/10/20 transition-all group">
									<td className="px-8 py-6">
										<div className="flex items-center gap-4">
											<div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-600 font-black shadow-inner group-hover:from-[#008080] group-hover:to-[#008080] group-hover:text-white transition-all transform group-hover:scale-110">
												{student.name.charAt(0)}
											</div>
											<div>
												<div className="flex items-center gap-2">
													<div className="text-sm font-black text-slate-900 group-hover:text-[#008080] transition-colors uppercase flex-shrink-0">{student.name}</div>

													{/* Student Badge System */}
													{student.badge === 'Gold' && <span title="Mentorship Plan" className="text-lg cursor-help">🥇</span>}
													{student.badge === 'Silver' && <span title="Tuition Plan" className="text-lg cursor-help">🥈</span>}
													{student.badge === 'Diamond' && <span title="Mentorship & Tuition Plan" className="text-lg cursor-help">💎</span>}

													{student.course_completed === 1 && (
														<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-black uppercase tracking-widest whitespace-nowrap">
															<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
															Course Completed
														</span>
													)}
												</div>
												<div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">
													Joined {new Date(student.created_at).toLocaleDateString()}
													{student.registration_number && <span className="ml-2 pl-2 border-l border-slate-200">Reg: <span className="text-slate-900 font-black">{student.registration_number}</span></span>}
												</div>
											</div>
										</div>
									</td>
									<td className="px-8 py-6">
										<div className="flex flex-col">
											<span className="text-xs font-black text-slate-700 uppercase tracking-widest">{student.course}</span>
											<span className="text-[10px] font-bold text-[#008080] uppercase mt-0.5">{student.grade}</span>
										</div>
									</td>
									<td className="px-8 py-6">
										<div className="space-y-2">
											<div className="flex items-center gap-2">
												<div className="w-1.5 h-1.5 rounded-full bg-[#008080]"></div>
												<span className="text-[10px] font-black text-slate-700 uppercase">Mentor: {student.mentor_name || 'N/A'}</span>
											</div>
											<div className="flex items-center gap-2">
												<div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div>
												{student.faculty_name ? (
													<button 
														type="button" 
														onClick={(e) => { 
															e.stopPropagation(); 
															toast((t) => (
																<div className="flex flex-col gap-2 p-1 min-w-[220px]">
																	<p className="text-[10px] font-black text-[#008080] uppercase tracking-widest border-b pb-1">Assigned Faculties</p>
																	<div className="flex flex-col gap-1.5 text-xs font-bold text-slate-700 max-h-[250px] overflow-y-auto pr-1">
																		{student.faculty_name.split(',').map((f, i) => (
																			<div key={i} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 shadow-sm">
																				<span className="w-2 h-2 rounded-full bg-[#008080] shrink-0"></span>
																				<span className="font-black text-slate-800">{f.trim()}</span>
																			</div>
																		))}
																	</div>
																</div>
															), { duration: 4000 }); 
														}}
														className="text-[10px] font-black text-[#008080] hover:text-[#006666] underline uppercase tracking-widest cursor-pointer text-left block"
													>
														View Faculties ({student.faculty_name.split(',').length})
													</button>
												) : (
													<span className="text-[10px] font-black text-slate-700 uppercase">Faculty: N/A</span>
												)}
											</div>
										</div>
									</td>
									<td className="px-8 py-6 text-right">
										<div className="flex items-center justify-end gap-2">
											<button
												onClick={() => handleView(student)}
												className="p-2.5 bg-white border-2 border-slate-200 rounded-xl text-slate-400 hover:border-[#008080] hover:text-[#008080] transition-all shadow-sm"
												title="View Details"
											>
												<Eye size={16} />
											</button>
											{role === 'academic_head' && (
												<>
													<button
														onClick={() => handleEdit(student)}
														className="p-2.5 bg-white border-2 border-[#008080]/40 rounded-xl text-[#008080] hover:bg-[#008080] hover:text-white transition-all shadow-sm group/edit"
														title="Edit Student"
													>
														<Edit2 size={16} />
													</button>
													<button
														onClick={() => handleDelete(student)}
														className="p-2.5 bg-white border-2 border-rose-200 rounded-xl text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
														title="Delete Student"
													>
														<Trash2 size={16} />
													</button>
												</>
											)}
										</div>
									</td>
								</tr>
							)) : (
								<tr>
									<td colSpan="4" className="px-8 py-20 text-center">
										<p className="text-slate-600 font-black text-[10px] uppercase tracking-[0.3em]">No students found</p>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default StudentsList;
