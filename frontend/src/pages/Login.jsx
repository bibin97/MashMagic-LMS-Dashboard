import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import RegistrationForm from '../components/RegistrationForm';

const Login = () => {
    const [activeDepartment, setActiveDepartment] = useState('admin');
    const [subRole, setSubRole] = useState('admin');
    const [isRegistering, setIsRegistering] = useState(false);
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Entrance Animation Control
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleDepartmentChange = (dept) => {
        setActiveDepartment(dept);
        setIsRegistering(false);
        setFormData({ identifier: '', password: '' });
        if (dept === 'mentor_dept') setSubRole('mentor_head');
        else if (dept === 'academic_dept') setSubRole('academic_head');
        else setSubRole('admin');
    };

    const handleSubRoleChange = (role) => {
        setSubRole(role);
        setIsRegistering(false);
        setFormData({ identifier: '', password: '' });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegistrationSuccess = () => {
        setIsRegistering(false);
        toast.success("Account created successfully! Please login.");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const user = await login(formData.identifier, formData.password, activeDepartment);
            const role = user.role?.toLowerCase().trim();
            toast.success(`Welcome back, ${user.name}!`);
            
            if (role === 'super_admin' || role === 'admin') navigate('/admin/dashboard');
            else if (role === 'mentor_head') navigate('/mentor-head/dashboard');
            else if (role === 'mentor') navigate('/mentor/dashboard');
            else if (role === 'faculty') navigate('/faculty/dashboard');
            else if (role === 'academic_head') navigate('/academic-head/dashboard');
            else navigate('/admin/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "Login failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const canSignup = ['admin', 'mentor_head', 'academic_head'].includes(subRole);

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none bg-slate-950">
            {/* 1. Background & Atmosphere */}
            <div className="absolute inset-0 z-0">
                {/* Layered Radial Gradients */}
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(20,184,166,0.15)_0%,transparent_50%)]"></div>
                <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(99,102,241,0.15)_0%,transparent_50%)]"></div>
                
                {/* Abstract Depth Blobs */}
                <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                
                {/* 2% Noise Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            </div>

            <div className={`w-full max-w-[520px] relative z-10 transition-all duration-1000 ease-out flex flex-col items-center ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
                
                {/* Brand Identity */}
                <div className="text-center mb-12 flex flex-col items-center w-full px-4">
                    <div className="w-24 h-24 mb-6 relative group">
                        <div className="absolute inset-0 bg-teal-500/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 w-full h-full bg-white/10 backdrop-blur-xl rounded-[28px] p-5 border border-white/20 shadow-2xl transition-all duration-500 hover:rotate-6 hover:scale-110">
                            <img src="/mashmagic logo.jpg" alt="Logo" className="w-full h-full object-contain rounded-lg brightness-110" />
                        </div>
                    </div>
                    <h1 className="text-5xl sm:text-6xl font-black tracking-tighter italic leading-none text-[#008080]">
                        MashMagic Hub
                    </h1>
                    <p className="text-[#f8ba2b] font-bold mt-4 uppercase tracking-[0.4em] text-xs">
                        Enterprise Learning Management System
                    </p>
                </div>

                {/* 2. Glassmorphic Container (The Card) */}
                <div className="w-full bg-white/5 backdrop-blur-2xl rounded-[48px] shadow-[0_25px_80px_-12px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group flex flex-col items-center">
                    {/* Refractive Inner Glow */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                    
                    {/* Vault Access (Moved Above Tabs) */}
                    <div className="pt-10 pb-2 text-center relative z-10 w-full">
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter italic uppercase leading-tight text-[#008080]">
                            Vault Access
                        </h2>
                        <p className="text-[#f8ba2b] text-xs font-black uppercase tracking-[0.3em] mt-4 flex items-center justify-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-[#f8ba2b] shadow-[0_0_10px_rgba(248,186,43,0.6)] animate-pulse"></span>
                            Authorized Session Only
                        </p>
                    </div>

                    {/* Dept Tabs Section - Pill Sliding Animation */}
                    <div className="w-[calc(100%-3rem)] sm:w-[calc(100%-4rem)] p-1 sm:p-2 bg-slate-900/40 mt-4 mx-6 sm:mx-8 mb-6 sm:mb-8 rounded-[28px] flex gap-1 border border-white/5 relative z-10">
                        {/* Sliding Background (Green) */}
                        <div 
                            className="absolute bg-[#008080]/20 backdrop-blur-sm border border-[#008080]/30 rounded-[22px] transition-all duration-500 ease-spring"
                            style={{
                                width: 'calc(33.33% - 8px)',
                                height: 'calc(100% - 16px)',
                                left: activeDepartment === 'admin' ? '8px' : activeDepartment === 'mentor_dept' ? '33.33%' : '66.66%',
                                top: '8px'
                            }}
                        ></div>

                        {[
                            { id: 'admin', label: 'Admin Dept' },
                            { id: 'mentor_dept', label: 'Mentor Dept' },
                            { id: 'academic_dept', label: 'Academic Dept' }
                        ].map((dept) => (
                            <button
                                key={dept.id}
                                onClick={() => handleDepartmentChange(dept.id)}
                                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-[22px] relative z-10
                                    ${activeDepartment === dept.id 
                                        ? 'text-[#008080]' 
                                        : 'text-white hover:text-slate-200'}
                                `}
                            >
                                {dept.label}
                            </button>
                        ))}
                    </div>

                    <div className="px-6 sm:px-14 pb-14 pt-2 relative min-h-[460px] flex flex-col">
                        {/* Sub-role Selector */}
                        <div className="flex justify-center mb-12 w-full">
                            {(activeDepartment === 'mentor_dept' || activeDepartment === 'academic_dept') && (
                                <div className="bg-white/5 p-1 rounded-[20px] flex gap-1 border border-white/5 relative min-w-[300px]">
                                    {/* Sliding Sub-role Background (Yellow) */}
                                    <div 
                                        className="absolute bg-[#f8ba2b]/10 backdrop-blur-sm border border-[#f8ba2b]/20 rounded-[16px] transition-all duration-500 ease-spring"
                                        style={{
                                            width: 'calc(50% - 4px)',
                                            height: 'calc(100% - 8px)',
                                            left: (subRole === 'mentor_head' || subRole === 'academic_head') ? '4px' : 'calc(50% + 0px)',
                                            top: '4px'
                                        }}
                                    ></div>
                                    {(activeDepartment === 'mentor_dept' 
                                        ? [{ id: 'mentor_head', label: 'Mentor Head' }, { id: 'mentor', label: 'Mentor' }]
                                        : [{ id: 'academic_head', label: 'Academic Head' }, { id: 'faculty', label: 'Faculty' }]
                                    ).map(role => (
                                        <button
                                            key={role.id}
                                            onClick={() => handleSubRoleChange(role.id)}
                                            className={`flex-1 px-6 sm:px-8 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-wider transition-all relative z-10
                                                ${subRole === role.id ? 'text-[#f8ba2b]' : 'text-white hover:text-slate-200'}
                                            `}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {isRegistering ? (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500 flex-1">
                                <div className="mb-8 flex items-center justify-between px-2">
                                    <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">Identity Setup</h2>
                                    <button onClick={() => setIsRegistering(false)} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-slate-400 hover:text-teal-400 transition-all border border-white/5">
                                        <LogIn size={20} />
                                    </button>
                                </div>
                                <div className="w-full">
                                    <RegistrationForm preSelectedRole={subRole} onSuccess={handleRegistrationSuccess} />
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 flex-1 flex flex-col justify-center w-full">
                                <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full max-w-[380px] mx-auto pt-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Credential ID</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors">
                                                <Mail size={20} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                name="identifier"
                                                type="text"
                                                required
                                                className="w-full p-5 pl-14 bg-white/5 border border-white/5 rounded-3xl text-sm font-bold text-white outline-none focus:bg-white/10 focus:border-teal-500/40 focus:ring-8 focus:ring-teal-500/5 transition-all"
                                                placeholder={canSignup ? "node.access@mashmagic.com" : "Email or Phone"}
                                                value={formData.identifier}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Secure Passkey</label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-teal-400 transition-colors">
                                                <Lock size={20} strokeWidth={2.5} />
                                            </div>
                                            <input
                                                name="password"
                                                type="password"
                                                required
                                                className="w-full p-5 pl-14 bg-white/5 border border-white/5 rounded-3xl text-sm font-bold text-white outline-none focus:bg-white/10 focus:border-teal-500/40 focus:ring-8 focus:ring-teal-500/5 transition-all font-sans"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    {/* 4. CTA Button (Orange Shimmer Edition) */}
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full relative overflow-hidden group/btn bg-[#f8ba2b] text-black h-16 rounded-[24px] font-black text-[13px] uppercase tracking-[0.35em] transition-all hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(248,186,43,0.3)] active:scale-95 disabled:opacity-50 italic mt-4"
                                    >
                                        {/* Shimmer Effect */}
                                        <div className="absolute inset-x-[-100%] top-0 h-full bg-gradient-to-r from-transparent via-black/10 to-transparent skew-x-[-20deg] animate-shimmer"></div>
                                        
                                        <div className="relative z-10 flex items-center justify-center gap-4">
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 size={24} className="animate-spin" />
                                                    <span>Logging in...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>LOGIN</span>
                                                    <ArrowRight size={20} className="transition-transform group-hover/btn:translate-x-2" strokeWidth={3} />
                                                </>
                                            )}
                                        </div>
                                    </button>

                                    {canSignup && (
                                        <div className="mt-8 text-center">
                                            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
                                                New {subRole.replace('_', ' ')}? {' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRegistering(true)}
                                                    className="text-teal-400 hover:text-white transition-colors font-black border-b-2 border-teal-400/20 hover:border-teal-400 pb-1 ml-2"
                                                >
                                                    CREATE PROFILE
                                                </button>
                                            </p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Micro-copy Footer */}
                <div className="mt-16 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-600 mix-blend-screen opacity-50">
                        MashMagic Secured Authorization v4.2 • End-to-End Encrypted
                    </p>
                </div>
            </div>

            {/* Custom Animations Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer {
                    0% { transform: translateX(-100%) skewX(-20deg); }
                    20% { transform: translateX(200%) skewX(-20deg); }
                    100% { transform: translateX(200%) skewX(-20deg); }
                }
                .animate-shimmer {
                    animation: shimmer 5s infinite cubic-bezier(0.4, 0, 0.2, 1);
                }
                .ease-spring {
                    transition-timing-function: cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
            `}} />
        </div>
    );
};

export default Login;
