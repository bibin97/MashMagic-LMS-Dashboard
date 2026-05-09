import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Activity,
  UserCheck,
  Calendar,
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

const SSCLayout = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: '/ssc/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { path: '/ssc/students', icon: <GraduationCap size={18} />, label: 'Student Tracking' },
    { path: '/ssc/mentors', icon: <Users size={18} />, label: 'Mentor Coordination' },
    { path: '/ssc/interactions', icon: <MessageSquare size={18} />, label: 'Success Logs' },
    { path: '/ssc/schedules', icon: <Calendar size={18} />, label: 'Academic Flow' },
    { path: '/ssc/approvals', icon: <ShieldCheck size={18} />, label: 'Performance Audit' },
  ];

  return (
    <div className="flex min-h-screen relative overflow-hidden" 
      style={{ background: 'linear-gradient(180deg, #F8FAFC, #EEF2F7)' }}>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[990] md:hidden cursor-pointer transition-all duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
        navItems={navItems}
        title="Success Coordinator"
      />
      
      <div className={`flex-1 flex flex-col min-w-0 w-full h-screen overflow-y-auto transition-all duration-300 ${isCollapsed ? 'md:ml-[88px]' : 'md:ml-72'}`}>
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="p-4 md:p-10 overflow-x-hidden w-full max-w-full">
          <div className="w-full h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SSCLayout;
