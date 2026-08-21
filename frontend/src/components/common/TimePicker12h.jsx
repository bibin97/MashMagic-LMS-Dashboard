import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

const parse24h = (value) => {
  if (!value) return { hour: '', minute: '00', ampm: 'AM' };
  const [hStr, mStr = '00'] = String(value).split(':');
  let hour = parseInt(hStr, 10);
  if (Number.isNaN(hour)) return { hour: '', minute: '00', ampm: 'AM' };
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12;
  return {
    hour: String(hour).padStart(2, '0'),
    minute: String(mStr).padStart(2, '0').slice(0, 2),
    ampm
  };
};

const to24h = (hour, minute, ampm) => {
  if (!hour) return '';
  let h = parseInt(hour, 10);
  if (Number.isNaN(h)) return '';
  if (ampm === 'AM') h = h === 12 ? 0 : h;
  else h = h === 12 ? 12 : h + 12;
  return `${String(h).padStart(2, '0')}:${String(minute || '00').padStart(2, '0')}`;
};

const TimePicker12h = ({
  value,
  onChange,
  required = false,
  disabled = false,
  className = ''
}) => {
  const parsed = useMemo(() => parse24h(value), [value]);

  const emit = (next) => {
    const merged = { ...parsed, ...next };
    onChange(to24h(merged.hour, merged.minute, merged.ampm));
  };

  const selectCls = 'h-full bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer disabled:cursor-not-allowed';

  return (
    <div className={`flex items-center gap-1.5 w-full p-2.5 pl-9 bg-slate-50 border border-slate-200 rounded-lg relative ${className}`}>
      <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <select
        required={required}
        disabled={disabled}
        value={parsed.hour}
        onChange={(e) => emit({ hour: e.target.value })}
        className={`${selectCls} min-w-[3.25rem]`}
        aria-label="Hour"
      >
        <option value="" disabled>HH</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <span className="text-xs font-black text-slate-400">:</span>
      <select
        required={required && !!parsed.hour}
        disabled={disabled}
        value={parsed.minute}
        onChange={(e) => emit({ minute: e.target.value, hour: parsed.hour || '12' })}
        className={`${selectCls} min-w-[3.25rem]`}
        aria-label="Minute"
      >
        {MINUTES.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>
      <div className="ml-auto flex rounded-md overflow-hidden border border-slate-200">
        {['AM', 'PM'].map((period) => (
          <button
            key={period}
            type="button"
            disabled={disabled}
            onClick={() => emit({ ampm: period, hour: parsed.hour || '12' })}
            className={`px-2 py-1 text-[10px] font-black tracking-widest ${parsed.ampm === period ? 'bg-[#008080] text-white' : 'bg-white text-slate-500 hover:bg-slate-100'}`}
          >
            {period}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimePicker12h;
