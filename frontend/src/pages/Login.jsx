import React, { useState, useEffect } from 'react'; // Verified Login Component
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
    Users,
    Check
} from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [dept, setDept] = useState('');
    const [role, setRole] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [regData, setRegData] = useState({
        fullName: '',
        phone: '',
        place: ''
    });
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
            const finalRole = role.toLowerCase().replace(' ', '_');
            const response = await api.post('/auth/login', { email, password, role: finalRole.replace('_', '') });
            
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('role', finalRole);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                toast.success(`Access Granted: ${role} Session Initiated`);
                
                if (finalRole === 'super_admin' || finalRole === 'sub_admin') navigate('/admin/dashboard');
                else if (finalRole === 'academic_head') navigate('/academic-head/dashboard');
                else if (finalRole === 'mentor_head') navigate('/mentor-head/dashboard');
                else if (finalRole === 'mentor') navigate('/mentor/dashboard');
                else if (finalRole === 'faculty_head') navigate('/faculty-head/dashboard');
                else if (finalRole === 'faculty') navigate('/faculty/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Authentication Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (!regData.fullName || !email || !password || !regData.phone || !regData.place) {
            toast.error('All authentication parameters are required');
            return;
        }

        setLoading(true);
        toast.loading('Initiating Identity Creation...');
        
        try {
            const finalRole = role.toLowerCase().replace(' ', '_');
            const response = await api.post('/auth/register', {
                name: regData.fullName,
                email: email,
                password: password,
                phone_number: regData.phone,
                place: regData.place,
                role: finalRole
            });

            if (response.data.success) {
                toast.dismiss();
                toast.success(response.data.message || 'Identity Created. Awaiting Activation.');
                setIsRegistering(false);
                // Clear fields
                setRegData({ fullName: '', phone: '', place: '' });
                setPassword('');
                setEmail('');
            }
        } catch (error) {
            toast.dismiss();
            toast.error(error.response?.data?.message || 'Identity Creation Failed');
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

                {/* Login/Signup Form Section */}
                <div className="p-8 sm:p-16 lg:p-20 flex flex-col justify-center min-h-[700px]">
                    {/* Department Tabs */}
                    <div className="flex justify-between gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
                        {['admin', 'mentor', 'academic'].map((d) => (
                            <button
                                key={d}
                                onClick={() => { setDept(d); setRole(''); }}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300 border ${
                                    dept === d 
                                    ? 'bg-[#0d9488] text-white border-[#0d9488] shadow-lg shadow-[#0d9488]/20' 
                                    : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                                }`}
                            >
                                {d} Dept
                            </button>
                        ))}
                    </div>

                    <div className="mb-10 lg:hidden text-center">
                         <span className="text-xl font-black text-white tracking-tighter uppercase italic">MashMagic <span className="text-[#0d9488]">Hub</span></span>
                    </div>

                    {!isRegistering ? (
                        <>
                            <div className="mb-10">
                                <h2 className="text-3xl font-black text-[#0d9488] mb-2 tracking-tight uppercase">Vault Access</h2>
                                <p className="text-[#f8ba2b] text-[10px] font-bold uppercase tracking-[0.2em]">Authorized Personnel Only</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-6">
                                {/* Role Selector Inline */}
                                <div className="space-y-3">
                                    <label className="text-white text-[9px] font-bold uppercase tracking-widest pl-1">System Role</label>
                                    <div className="flex flex-wrap gap-2">
                                        {dept && subRoles[dept].map(r => (
                                            <button
                                                key={r}
                                                type="button"
                                                onClick={() => setRole(r)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-bold transition-all duration-300 border ${
                                                    role === r 
                                                    ? 'bg-[#0d9488]/20 text-[#0d9488] border-[#0d9488]' 
                                                    : 'bg-white/5 text-slate-500 border-white/5'
                                                }`}
                                            >
                                                {r}
                                            </button>
                                        ))}
                                    </div>
                                    {/* Detect if Super Admin registration is possible */}
                                    {(role === 'Super Admin' || role === 'Academic Head' || role === 'Mentor Head') && (
                                        <button 
                                            type="button"
                                            onClick={() => setIsRegistering(true)}
                                            className="text-[10px] text-[#0d9488] font-bold underline underline-offset-4 pl-1"
                                        >
                                            Need a new account? Setup Identity
                                        </button>
                                    )}
                                </div>

                                {/* Credential ID */}
                                <div className="space-y-2">
                                    <label className="text-white text-[9px] font-bold uppercase tracking-widest pl-1">Credential ID</label>
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
                                    <label className="text-white text-[9px] font-bold uppercase tracking-widest pl-1">Security Key</label>
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

                                <div className="flex items-center justify-between mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                id="rememberMe"
                                                className="peer hidden"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                            />
                                            <div className="w-5 h-5 border-2 border-teal-500/30 rounded-md bg-white/5 peer-checked:bg-teal-500 peer-checked:border-teal-500 transition-all duration-300"></div>
                                            <Check className="absolute w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform duration-300 left-[3px]" />
                                        </div>
                                        <span className="text-sm font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                                            Remember Me
                                        </span>
                                    </label>
                                    <button
                                        type="button"
                                        className="text-sm font-bold text-[#f8ba2b] hover:text-yellow-400 transition-colors tracking-wide uppercase"
                                    >
                                        Recover Key?
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full mt-8 py-4 bg-[#f8ba2b] hover:bg-[#eab308] text-black font-black rounded-2xl transition-all duration-300 transform active:scale-[0.98] shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-3 group relative overflow-hidden"
                                >
                                    <span className="relative uppercase tracking-[0.2em]">{loading ? 'Verifying...' : 'Login'}</span>
                                    {!loading && <ShieldCheck className="relative w-5 h-5 group-hover:rotate-12 transition-transform" />}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Identity Setup Form (Signup) */
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-4xl font-black text-white tracking-widest uppercase italic">Identity Setup</h2>
                                <button 
                                    onClick={() => setIsRegistering(false)}
                                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                                >
                                    <ChevronRight className="rotate-180" size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleRegister} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-white text-[9px] font-bold uppercase tracking-widest pl-1">Full Name</label>
                                    <div className="relative">
                                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input 
                                            type="text"
                                            placeholder="Name"
                                            className="w-full bg-white text-black rounded-xl pl-12 pr-6 py-3.5 text-sm font-bold outline-none border-none shadow-inner"
                                            value={regData.fullName}
                                            onChange={(e) => setRegData({...regData, fullName: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-[9px] font-bold uppercase tracking-widest pl-1">Email Address</label>
                                    <div className="relative">
                                        <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input 
                                            type="email"
                                            placeholder={`${role} Email`}
                                            className="w-full bg-white text-black rounded-xl pl-12 pr-6 py-3.5 text-sm font-bold outline-none border-none shadow-inner"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-white text-[9px] font-bold uppercase tracking-widest pl-1">Phone Number</label>
                                        <div className="relative">
                                            <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input 
                                                type="tel"
                                                placeholder="Phone"
                                                className="w-full bg-white text-black rounded-xl pl-12 pr-6 py-3.5 text-sm font-bold outline-none border-none shadow-inner"
                                                value={regData.phone}
                                                onChange={(e) => setRegData({...regData, phone: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white text-[9px] font-bold uppercase tracking-widest pl-1">Place</label>
                                        <div className="relative">
                                            <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input 
                                                type="text"
                                                placeholder="Place"
                                                className="w-full bg-white text-black rounded-xl pl-12 pr-6 py-3.5 text-sm font-bold outline-none border-none shadow-inner"
                                                value={regData.place}
                                                onChange={(e) => setRegData({...regData, place: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-[9px] font-bold uppercase tracking-widest pl-1">Password</label>
                                    <div className="relative">
                                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input 
                                            type="password"
                                            placeholder="******"
                                            className="w-full bg-white text-black rounded-xl pl-12 pr-6 py-3.5 text-sm font-bold outline-none border-none shadow-inner"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-6 py-4 bg-[#0d9488] hover:bg-[#0f766e] text-white font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                                >
                                    <span>Register as {role}</span>
                                    <ShieldCheck size={18} />
                                </button>
                            </form>
                        </div>
                    )}

                    <div className="mt-10 pt-8 border-t border-white/5 text-center">
                        <p className="text-teal-100/50 text-[10px] font-bold uppercase tracking-widest mb-4">Request Administrative Access</p>
                        <div className="flex flex-wrap justify-center gap-3">
                            {['Super Admin', 'Academic Head', 'Mentor Head'].map((r) => (
                            <button
                                key={r}
                                onClick={() => {
                                    setIsRegistering(true);
                                    setRole(r);
                                    // Match dept automatically
                                    if (r === 'Super Admin') setDept('admin');
                                    else if (r === 'Academic Head') setDept('academic');
                                    else if (r === 'Mentor Head') setDept('mentor');
                                }}
                                className={`px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[9px] font-bold transition-all duration-300 uppercase tracking-tighter ${
                                    role === r ? 'text-[#0d9488] border-[#0d9488]/30 bg-[#0d9488]/5' : 'text-teal-100/60 hover:text-teal-400'
                                }`}
                            >
                                {r}
                            </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
                         <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                                <ShieldCheck key={i} size={14} className="text-[#0d9488]/40" />
                            ))}
                         </div>
                         <p className="text-[9px] text-[#f8ba2b] font-bold uppercase tracking-[0.3em] text-center">
                            Secured by MashMagic Enterprise Encryption
                         </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
