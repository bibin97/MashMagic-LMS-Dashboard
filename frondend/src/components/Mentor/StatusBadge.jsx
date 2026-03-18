import React from 'react';

const StatusBadge = ({ status }) => {
    const styles = {
        Scheduled: 'bg-[#f8ba2b] text-slate-900 border-[#f8ba2b]',
        Completed: 'bg-green-100 text-green-700 border-green-200',
        Cancelled: 'bg-red-100 text-red-700 border-red-200',
        Postponed: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };

    return (
        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
            {status}
        </span>
    );
};

export default StatusBadge;
