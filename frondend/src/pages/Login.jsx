import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Loader2, ShieldCheck, ChevronRight, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import RegistrationForm from '../components/RegistrationForm';

const Login = () => {
    // Top-level tabs: 'admin', 'mentor_dept', 'academic_dept'
    const [activeDepartment, setActiveDepartment] = useState('admin');

    // Sub-roles within departments
    const [subRole, setSubRole] = useState('admin');

    // Registration toggle
    const [isRegistering, setIsRegistering] = useState(false);

    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    // Default sub-roles when switching departments
    const handleDepartmentChange = (dept) => {
        setActiveDepartment(dept);
        setIsRegistering(false);
        setFormData({ identifier: '', password: '' });

        // Set default sub-role based on department
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
            const user = await login(formData.identifier, formData.password);
            const role = user.role?.toLowerCase().trim();

            toast.success(`Welcome back, ${user.name}!`);

            // Explicit redirection based on role
            if (role === 'super_admin' || role === 'admin') {
                navigate('/admin/dashboard');
            } else if (role === 'mentor_head') {
                navigate('/mentor-head/dashboard');
            } else if (role === 'mentor') {
                navigate('/mentor/dashboard');
            } else if (role === 'faculty') {
                navigate('/faculty/dashboard');
            } else if (role === 'academic_head') {
                navigate('/academic-head/dashboard'); // Future route
            } else if (role === 'academic_counselor') {
                navigate('/academic-counselor/dashboard'); // Future route
            } else if (role === 'student' || role === 'user') {
                navigate('/student/dashboard');
            } else {
                navigate('/admin/dashboard');
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Login failed.";
            toast.error(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper to determine if current subRole allows signup
    const canSignup = ['admin', 'mentor_head', 'academic_head'].includes(subRole);

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
            <div className="w-full max-w-2xl transition-all duration-500">
                {/* Logo / Brand */}
                <div className="text-center mb-10 flex flex-col items-center">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-200 rotate-6 transition-transform hover:rotate-0">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">MashMagic Hub</h1>
                    <p className="text-slate-500 font-bold mt-2 uppercase tracking-[0.3em] text-xs">Unified Personnel Gateway</p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 relative overflow-hidden">

                    {/* Level 1: Department Tabs */}
                    <div className="flex border-b border-slate-100 bg-slate-50/50">
                        {[
                            { id: 'admin', label: 'Admin Panel' },
                            { id: 'mentor_dept', label: 'Mentor Dept' },
                            { id: 'academic_dept', label: 'Academic Dept' }
                        ].map((dept) => (
                            <button
                                key={dept.id}
                                onClick={() => handleDepartmentChange(dept.id)}
                                className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all relative
                                    ${activeDepartment === dept.id ? 'text-indigo-600 bg-white shadow-sm z-10' : 'text-slate-400 hover:text-slate-600'}
                                `}
                            >
                                {dept.label}
                                {activeDepartment === dept.id && (
                                    <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="p-10 md:p-14 relative z-10 min-h-[500px]">

                        {/* Level 2: Sub-Role Switcher (Only for Mentor/Academic Depts) */}
                        {activeDepartment === 'mentor_dept' && (
                            <div className="flex justify-center mb-8">
                                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                                    {[
                                        { id: 'mentor_head', label: 'Mentor Head' },
                                        { id: 'mentor', label: 'Mentor' }
                                    ].map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => handleSubRoleChange(role.id)}
                                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                                                ${subRole === role.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}
                                            `}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeDepartment === 'academic_dept' && (
                            <div className="flex justify-center mb-8">
                                <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                                    {[
                                        { id: 'academic_head', label: 'Academic Head' },
                                        { id: 'faculty', label: 'Faculty' },
                                        { id: 'academic_counselor', label: 'Counselor' }
                                    ].map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => handleSubRoleChange(role.id)}
                                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all
                                                ${subRole === role.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}
                                            `}
                                        >
                                            {role.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Content Area */}
                        {isRegistering ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize">New {subRole.replace('_', ' ')}</h2>
                                    <button
                                        onClick={() => setIsRegistering(false)}
                                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <LogIn size={20} />
                                    </button>
                                </div>
                                <RegistrationForm
                                    preSelectedRole={subRole}
                                    onSuccess={handleRegistrationSuccess}
                                />
                                <div className="mt-6 text-center">
                                    <button
                                        onClick={() => setIsRegistering(false)}
                                        className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="mb-8 text-center">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight capitalize">
                                        {subRole.replace('_', ' ')} Access
                                    </h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                                        Identify Verified Credential
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-sm mx-auto">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            {canSignup ? 'Email Address' : 'Email or Phone Number'}
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                name="identifier"
                                                type="text"
                                                required
                                                className="w-full p-4 pl-14 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-sans"
                                                placeholder={canSignup ? "Head Access Email" : "Registered Phone / Email"}
                                                value={formData.identifier}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center ml-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Passcode</label>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                name="password"
                                                type="password"
                                                required
                                                className="w-full p-4 pl-14 bg-slate-50 border-none rounded-2xl text-sm font-bold outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-sans"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-200 flex items-center justify-center gap-3 group mt-2 active:scale-[0.98] disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={20} className="animate-spin" />
                                        ) : (
                                            <>
                                                <span>Authorize</span>
                                                <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </button>

                                    {/* Signup Option for Heads Only */}
                                    {canSignup && (
                                        <div className="mt-4 text-center">
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                New {subRole.replace('_', ' ')}? {' '}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRegistering(true)}
                                                    className="text-indigo-600 hover:text-indigo-800 transition-colors font-black underline underline-offset-4"
                                                >
                                                    Create {subRole === 'admin' ? 'Account' : 'Head Profile'}
                                                </button>
                                            </p>
                                        </div>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-12 text-center text-slate-400">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                        MashMagic Secured Authorization v3.0
                    </p>
                </div>
            </div>
        </div>
    );
};
export default Login;
