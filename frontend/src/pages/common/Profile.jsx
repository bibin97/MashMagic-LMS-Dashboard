import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Mail, Shield, Smartphone, Lock, AlertCircle, Activity, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ProfileConsole = () => {
	const { user, updateUser } = useAuth();
	const [uploading, setUploading] = useState(false);
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
	const [updatingPassword, setUpdatingPassword] = useState(false);
	const fileInputRef = useRef(null);
	const location = useLocation();

	useEffect(() => {
		if (location.hash === '#security') {
			setShowPasswordModal(true);
			// Optional: Clear hash after opening to avoid re-opening on reload if not desired
			// window.history.replaceState(null, '', window.location.pathname);
		}
	}, [location]);

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		if (passwordData.new !== passwordData.confirm) return toast.error("New passwords do not match");
		if (passwordData.new.length < 6) return toast.error("Password must be at least 6 characters");
		
		try {
			setUpdatingPassword(true);
			const res = await api.put('/auth/change-password', {
				currentPassword: passwordData.current,
				newPassword: passwordData.new
			});
			if (res.data.success) {
				toast.success("Security credentials updated!");
				setShowPasswordModal(false);
				setPasswordData({ current: '', new: '', confirm: '' });
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "Protocol update failed");
		} finally {
			setUpdatingPassword(false);
		}
	};

	const DetailBlock = ({ icon: Icon, label, value, color = "text-slate-900" }) => (
		<div className="bg-slate-50/50 p-6 rounded-[24px] border border-slate-100 group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500">
			<div className="flex items-center gap-4">
				<div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#008080] shadow-sm group-hover:scale-110 transition-transform">
					<Icon size={20} />
				</div>
				<div>
					<p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">{label}</p>
					<p className={`text-sm font-black ${color} tracking-tight uppercase`}>{value || 'NOT DEFINED'}</p>
				</div>
			</div>
		</div>
	);

	const handleImageClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = async (e) => {
		const file = e.target.files[0];
		if (!file) return;

		// Validation
		if (file.size > 2 * 1024 * 1024) {
			return toast.error("Image size must be less than 2MB");
		}

		if (!file.type.startsWith('image/')) {
			return toast.error("Please upload an image file");
		}

		try {
			setUploading(true);
			const formData = new FormData();
			formData.append('file', file);

			// 1. Upload to server
			const uploadRes = await api.post('/upload', formData, {
				headers: { 'Content-Type': 'multipart/form-data' }
			});

			if (uploadRes.data.success) {
				const imageUrl = uploadRes.data.url;

				// 2. Update user profile
				await api.put('/auth/update-profile-pic', { profile_pic: imageUrl });

				// 3. Update local state
				updateUser({ profile_pic: imageUrl });
				toast.success("Profile picture updated!");
			}
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Failed to upload image");
		} finally {
			setUploading(false);
		}
	};

	return (
		<div className="p-4 md:p-12 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-10 duration-1000">
			{/* Header Area */}
			<div className="flex flex-col md:flex-row justify-between items-center gap-10 mb-16 bg-white p-10 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
				<div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full -mr-32 -mt-32 opacity-50"></div>
				
				<div className="flex items-center gap-8 relative z-10 w-full md:w-auto">
					<div className="relative group cursor-pointer" onClick={handleImageClick}>
						<div className="w-32 h-32 bg-slate-900 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl group-hover:rotate-3 transition-all duration-500 flex items-center justify-center text-white relative">
							{user?.profile_pic ? (
								<img 
									src={user.profile_pic} 
									alt="Profile" 
									className={`w-full h-full object-cover transition-opacity duration-300 ${uploading ? 'opacity-30' : 'opacity-100'}`} 
								/>
							) : (
								<User size={48} className={`opacity-80 transition-opacity ${uploading ? 'opacity-10' : 'opacity-100'}`} />
							)}
							
							{/* Overlay */}
							<div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
								<Camera size={24} className="text-white" />
							</div>

							{uploading && (
								<div className="absolute inset-0 flex items-center justify-center">
									<Loader2 size={32} className="text-[#008080] animate-spin" />
								</div>
							)}
						</div>
						
						<div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#008080] rounded-2xl border-4 border-white flex items-center justify-center text-white shadow-lg shadow-[#008080]/30 z-20 group-hover:scale-110 transition-transform">
							<Camera size={16} />
						</div>

						{/* Hidden Input field */}
						<input 
							type="file" 
							className="hidden" 
							ref={fileInputRef} 
							onChange={handleFileChange}
							accept="image/*"
						/>
					</div>
					
					<div className="flex-1">
						<div className="flex flex-col">
							<h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase ">{user?.name}</h1>
							<div className="flex flex-wrap items-center gap-3 mt-3">
								<span className="px-4 py-1.5 bg-[#008080]/10 text-[#008080] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#008080]/20">
									{user?.role?.replace('_', ' ')}
								</span>
								<div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
									<span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest italic">Live Session Active</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="flex gap-4 relative z-10 shrink-0">
					<div className="bg-slate-50 px-8 py-5 rounded-[32px] border border-slate-100 text-center flex flex-col items-center justify-center">
						<p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Status Verification</p>
						<div className="flex items-center gap-2">
							<CheckCircle2 size={14} className="text-emerald-500" />
							<p className="text-xs font-black text-emerald-600 uppercase tracking-tighter">Identity Authenticated</p>
						</div>
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
				{/* Core Identity Panel */}
				<div className="lg:col-span-2 space-y-8">
					<div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-2xl shadow-slate-200/30">
						<h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-10 flex items-center gap-4">
							<div className="w-10 h-10 bg-[#008080]/10 rounded-xl flex items-center justify-center text-[#008080]">
								<User size={20} />
							</div>
							Consolidated Identity Profile
						</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<DetailBlock icon={User} label="User Designation" value={user?.name} />
							<DetailBlock icon={Mail} label="Access Channel" value={user?.email} />
							<DetailBlock icon={Smartphone} label="Mobile Authority" value={user?.phone_number} />
							<DetailBlock icon={Shield} label="Security Clearance" value={user?.role?.toUpperCase()} color="text-[#008080]" />
						</div>
					</div>

					{/* System Information */}
					<div className="bg-slate-900 p-10 rounded-[48px] shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
						<div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mb-24 -mr-24 blur-3xl group-hover:bg-[#008080]/10 transition-colors duration-1000"></div>
						<h3 className="text-xl font-black text-white uppercase tracking-tight mb-10 flex items-center gap-4">
							<div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
								<Lock size={20} />
							</div>
							Infrastructure Security
						</h3>
						<div className="flex items-start gap-6 bg-white/5 p-8 rounded-[32px] border border-white/10 relative z-10">
							<div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-[#008080] shrink-0">
								<AlertCircle size={24} />
							</div>
							<div>
								<h4 className="text-lg font-black text-white uppercase mb-2">Protocol Monitoring Active</h4>
								<p className="text-slate-400 text-[10px] font-bold leading-relaxed uppercase tracking-tight">
									This console is protected by multi-layer encryption. Any unauthorized modification attempts are logged. Profile metadata updates require system level authentication.
								</p>
							</div>
						</div>
					</div>
				</div>

				{/* Sidebar Stats/Info */}
				<div className="space-y-8">
					<div className="bg-[#008080] p-10 rounded-[48px] shadow-2xl shadow-[#008080]/30 text-white relative overflow-hidden">
						<div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mt-16 blur-2xl"></div>
						<h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 opacity-70">Infrastructure Health</h4>
						<div className="space-y-6 relative z-10">
							<div className="flex justify-between items-end border-b border-white/10 pb-4">
								<div>
									<p className="text-[10px] font-black uppercase opacity-60">System Tier</p>
									<p className="text-lg font-black uppercase">{user?.role?.split('_')[0] || 'Standard'}</p>
								</div>
								<Shield size={24} className="opacity-40" />
							</div>
							<div className="flex justify-between items-end border-b border-white/10 pb-4">
								<div>
									<p className="text-[10px] font-black uppercase opacity-60">Access Auth</p>
									<p className="text-lg font-black uppercase">Verified</p>
								</div>
								<Lock size={24} className="opacity-40" />
							</div>
						</div>
						<div className="mt-10 p-4 bg-white/10 rounded-[28px] border border-white/10 text-center relative z-10">
							<p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Node Latency: Optimal (18ms)</p>
						</div>
					</div>

					<div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-xl shadow-slate-200/50">
						<div className="flex items-center justify-between mb-6 px-2">
							<h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Recent Activity</h4>
							<Activity size={14} className="text-slate-300" />
						</div>
						<div className="space-y-4">
							{[1, 2, 3].map(i => (
								<div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-white hover:border-[#008080]/30 transition-all cursor-pointer group">
									<div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-600 group-hover:text-[#008080] transition-colors shadow-sm">
										<Activity size={18} />
									</div>
									<div>
										<p className="text-[10px] font-black text-slate-900 uppercase tracking-tight">{i === 1 ? 'System Handshake' : 'Encrypted Access'}</p>
										<p className="text-[9px] font-bold text-slate-600 uppercase">{new Date().toLocaleDateString()} • Node #{i}04</p>
									</div>
								</div>
							))}
						</div>
					</div>

					{/* Security Actions */}
					<div className="bg-rose-50 p-8 rounded-[40px] border border-rose-100/50">
						<h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2">
							<Lock size={12} /> Account Security
						</h4>
						<button 
							onClick={() => setShowPasswordModal(true)}
							className="w-full py-4 bg-white text-rose-600 border border-rose-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
						>
							Modify Access Key
						</button>
					</div>
				</div>
			</div>

			{/* Password Change Modal */}
			{showPasswordModal && (
				<div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
					<div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
						<div className="flex justify-between items-center mb-8">
							<h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Security Update</h3>
							<button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
								<Activity size={20} className="rotate-45" />
							</button>
						</div>

						<form onSubmit={handlePasswordChange} className="space-y-5">
							<div className="space-y-2">
								<label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Current Access Key</label>
								<input 
									type="password" 
									required
									value={passwordData.current}
									onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
									className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-[#008080]/10 outline-none transition-all"
									placeholder="••••••••"
								/>
							</div>
							<div className="space-y-2">
								<label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">New Access Key</label>
								<input 
									type="password" 
									required
									value={passwordData.new}
									onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
									className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-[#008080]/10 outline-none transition-all"
									placeholder="••••••••"
								/>
							</div>
							<div className="space-y-2">
								<label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Confirm New Key</label>
								<input 
									type="password" 
									required
									value={passwordData.confirm}
									onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
									className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-[#008080]/10 outline-none transition-all"
									placeholder="••••••••"
								/>
							</div>

							<button 
								type="submit" 
								disabled={updatingPassword}
								className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#008080] transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 mt-4"
							>
								{updatingPassword ? 'Synchronizing Security Data...' : 'Confirm Protocol Update'}
							</button>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default ProfileConsole;
