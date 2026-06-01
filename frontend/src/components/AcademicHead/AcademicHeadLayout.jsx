import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import Navbar from '../Navbar';
import { Target, Presentation, FileText, TrendingUp, UserMinus, AlertTriangle } from 'lucide-react';

const AcademicHeadLayout = () => {
 const location = useLocation();
 const [isSidebarOpen, setIsSidebarOpen] = useState(false);
 const [isCollapsed, setIsCollapsed] = useState(false);

 const navItems = [
  { path: '/academic-head/academic-quality', icon: <Target size={18} />, label: 'Academic Quality' },
  { path: '/academic-head/parent-meetings', icon: <Presentation size={18} />, label: 'Parents Meeting' },
  { path: '/academic-head/exam-scores', icon: <FileText size={18} />, label: 'Exam Scores' },
  { path: '/academic-head/growth-monitor', icon: <TrendingUp size={18} />, label: 'Growth Monitor' },
  { path: '/academic-head/faculty-replacement', icon: <UserMinus size={18} />, label: 'Faculty Replacement' },
  { path: '/academic-head/escalations', icon: <AlertTriangle size={18} />, label: 'Escalations' }
 ];

 return (
 <div className="flex min-h-screen relative overflow-hidden" 
 style={{ background: 'linear-gradient(180deg, #F8FAFC, #EEF2F7)' }}>
 {/* Mobile Overlay */}
 {isSidebarOpen && (
 <div 
 className="fixed inset-0 bg-[#008080]/40 backdrop-blur-md z-[990] md:hidden cursor-pointer transition-all duration-500"
 onClick={() => setIsSidebarOpen(false)}
 />
 )}
 
 <Sidebar 
 isOpen={isSidebarOpen} 
 setIsOpen={setIsSidebarOpen} 
 isCollapsed={isCollapsed} 
 setIsCollapsed={setIsCollapsed} 
 navItems={navItems}
 title="Academic Head"
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

export default AcademicHeadLayout;
