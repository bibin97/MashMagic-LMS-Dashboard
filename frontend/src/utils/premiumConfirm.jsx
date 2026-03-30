import toast from 'react-hot-toast';
import { AlertCircle, ShieldAlert } from 'lucide-react';

/**
 * Premium Confirmation Toast
 * @param {Function} callback - Function to execute on confirm
 * @param {Object} options - { name, title, message, type }
 */
export const premiumConfirm = (callback, { name = '', title = '', message = '', type = 'danger' } = {}) => {
  const isDanger = type === 'danger';
  const Icon = isDanger ? AlertCircle : ShieldAlert;
  
  // Custom theme colors matching MashMagic Premium Branding
  const colorClass = isDanger ? 'bg-rose-600 shadow-rose-100 hover:bg-rose-700' : 'bg-slate-900 shadow-slate-100 hover:bg-[#f8ba2b]';
  const iconBg = isDanger ? 'bg-rose-50' : 'bg-[#008080]/10';
  const iconColor = isDanger ? 'text-rose-500' : 'text-[#008080]';

  toast.custom((t) => (
    <div
      className={`${
        t.visible ? 'animate-enter' : 'animate-leave'
      } max-w-sm w-full bg-white shadow-2xl rounded-[2.5rem] pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border border-slate-50 italic`}
    >
      <div className="flex-1 p-8">
        <div className="flex items-start gap-4">
          <div className={`p-4 ${iconBg} rounded-[1.5rem] shadow-sm`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-black text-slate-900 uppercase tracking-tighter italic">
              {title || (isDanger ? 'Critical Action' : 'Confirm Action')}
            </p>
            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
              {message || `Are you sure you want to proceed with this action for ${name}?`}
            </p>
          </div>
        </div>
        
        <div className="mt-8 flex gap-4 justify-end items-center">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 px-2 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              callback();
            }}
            className={`px-8 py-3.5 ${colorClass} text-white text-[9px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95`}
          >
            {isDanger ? 'Confirm Delete' : 'Confirm Action'}
          </button>
        </div>
      </div>
    </div>
  ), { duration: Infinity, position: 'top-center' });
};
