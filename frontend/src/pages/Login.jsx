import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
    ShieldCheck, 
    Lock, 
    User, 
    ChevronRight, 
    Eye, 
    EyeOff,
    Briefcase,
    Building2,
    Users
} from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dept, setDept] = useState('');
    const [role, setRole] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Map sub-roles for better selection
    const subRoles = {
        'admin': ['Super Admin', 'Sub Admin'],
        'academic': ['Academic Head'],
        'mentor': ['Mentor Head', 'Mentor'],
        'faculty': ['Faculty Head', 'Faculty']
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password || !dept || !role) {
            toast.error('Please fill in all security protocols');
            return;
        }

        setLoading(true);
        try {
            const finalRole = role.toLowerCase().replace(' ', '');
            const response = await api.post('/auth/login', { email, password, role: finalRole });
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('role', finalRole);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                toast.success(`Access Granted: ${role} Session Initiated`);
                
                // Route based on role
                if (finalRole === 'superadmin' || finalRole === 'subadmin') navigate('/admin/dashboard');
                else if (finalRole === 'academichead') navigate('/academic-head/dashboard');
                else if (finalRole === 'mentorhead') navigate('/mentor-head/dashboard');
                else if (finalRole === 'mentor') navigate('/mentor/dashboard');
                else if (finalRole === 'facultyhead') navigate('/faculty-head/dashboard');
                else if (finalRole === 'faculty') navigate('/faculty/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication Failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-[#020617]">
            {/* Enterprise Background Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0d9488]/15 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#1e1b4b]/40 blur-[150px] rounded-full" />
            
            {/* Main Vault Container */}
            <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 bg-white/[0.02] backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
                
                {/* Visual Branding Section */}
                <div className="hidden lg:flex flex-col justify-between p-16 bg-gradient-to-br from-[#0d9488]/10 to-transparent border-r border-white/5 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-12">
                            <div className="w-10 h-10 bg-[#0d9488] rounded-xl flex items-center justify-center shadow-lg shadow-[#0d9488]/30">
                                <ShieldCheck className="text-white" size={24} />
                            </div>
                            <span className="text-2xl font-black text-white tracking-tighter uppercase italic">MashMagic <span className="text-[#0d9488]">Hub</span></span>
                        </div>

                        <h1 className="text-5xl font-black text-white leading-[1.1] mb-6 tracking-tight">
                            The Secure Gateway to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0d9488] to-[#2dd4bf]">Learning Excellence.</span>
                        </h1>
                        <p className="text-slate-400 text-lg leading-relaxed max-w-sm font-medium">
                            Enterprise-grade management system designed for institutional growth and academic precision.
                        </p>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
                            <div className="flex -space-x-3">
                                {[1,2,3,4].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-slate-800" />
                                ))}
                            </div>
                            <p className="text-sm text-slate-300 font-bold tracking-tight">
                                <span className="text-white font-black">500+</span> Professionals Online
                            </p>
                        </div>
                    </div>
                </div>

                {/* Login Form Section */}
                <div className="p-8 sm:p-16 lg:p-20 flex flex-col justify-center">
                    <div className="mb-10 lg:hidden text-center">
                         <span className="text-xl font-black text-white tracking-tighter uppercase italic">MashMagic <span className="text-[#0d9488]">Hub</span></span>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-[#0d9488] mb-2 tracking-tight uppercase">Vault Access</h2>
                        <p className="text-[#927d49] text-[10px] font-bold uppercase tracking-[0.2em]">Authorized Personnel Only</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        {/* Role & Dept Selectors */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[#927d49] text-[9px] font-bold uppercase tracking-widest pl-1">Department</label>
                                <div className="relative">
                                    <select 
                                        value={dept}
                                        onChange={(e) => { setDept(e.target.value); setRole(''); }}
                                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3.5 text-xs text-white outline-none focus:border-[#0d9488]/50 focus:bg-white/[0.05] transition-all appearance-none font-medium"
                                    >
                                        <option value="" className="bg-[#020617]">Select Dept</option>
                                        <option value="admin" className="bg-[#020617]">Admin Dept</option>
                                        <option value="academic" className="bg-[#020617]">Academic Dept</option>
                                        <option value="mentor" className="bg-[#020617]">Mentor Dept</option>
                                        <option value="faculty" className="bg-[#020617]">Faculty Dept</option>
                                    </select>
                                    <Building2 className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[#927d49] text-[9px] font-bold uppercase tracking-widest pl-1">System Role</label>
                                <div className="relative">
                                    <select 
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        disabled={!dept}
                                        className="w-full bg-white/[0.03] border border-white/5 disabled:opacity-50 rounded-2xl px-4 py-3.5 text-xs text-white outline-none focus:border-[#0d9488]/50 focus:bg-white/[0.05] transition-all appearance-none font-medium"
                                    >
                                        <option value="" className="bg-[#020617]">Select Role</option>
                                        {dept && subRoles[dept].map(r => (
                                            <option key={r} value={r} className="bg-[#020617]">{r}</option>
                                        ))}
                                    </select>
                                    <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                                </div>
                            </div>
                        </div>

                        {/* Credential ID */}
                        <div className="space-y-2">
                            <label className="text-[#927d49] text-[9px] font-bold uppercase tracking-widest pl-1">Credential ID</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#0d9488] transition-colors">
                                    <User size={18} />
                                </div>
                                <input 
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your system ID"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-[#0d9488]/50 focus:bg-white/[0.05] transition-all font-medium"
                                />
                            </div>
                        </div>

                        {/* Security Key */}
                        <div className="space-y-2">
                            <label className="text-[#927d49] text-[9px] font-bold uppercase tracking-widest pl-1">Security Key</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#0d9488] transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl pl-12 pr-12 py-4 text-sm text-white placeholder:text-slate-600 outline-none focus:border-[#0d9488]/50 focus:bg-white/[0.05] transition-all font-medium"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input type="checkbox" className="hidden" />
                                <div className="w-4 h-4 rounded border border-white/10 bg-white/5 flex items-center justify-center group-hover:border-[#0d9488]/50 transition-all">
                                    <div className="w-2 h-2 rounded-sm bg-[#0d9488] scale-0 transition-transform group-hover:scale-100" />
                                </div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stay Authenticated</span>
                            </label>
                            <button type="button" className="text-[10px] text-[#0d9488] font-black uppercase tracking-widest hover:text-[#2dd4bf] transition-colors">Recover Keys?</button>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full group relative flex items-center justify-center gap-3 bg-[#0d9488] hover:bg-[#115e59] text-white py-4 rounded-full font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#0d9488]/20 transition-all active:scale-[0.98] disabled:opacity-70"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Initiate Protocol</span>
                                    <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                            {/* subtle glow effect */}
                            <div className="absolute inset-x-0 bottom-[-20%] h-1/2 bg-[#0d9488]/30 blur-[20px] rounded-full scale-0 group-hover:scale-100 transition-transform opacity-50" />
                        </button>
                    </form>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                         <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <ShieldCheck key={i} size={14} className="text-[#0d9488]/40" />
                            ))}
                         </div>
                         <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.3em] text-center">
                            Secured by MashMagic Enterprise Encryption
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
