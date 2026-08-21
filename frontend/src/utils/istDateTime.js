const pad = (n) => String(n).padStart(2, '0');

const parseParts = (value) => {
  if (!value) return null;
  const s = String(value).trim();
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})?/);
  if (iso) {
    return {
      year: iso[1],
      month: iso[2],
      day: iso[3],
      hour: parseInt(iso[4], 10),
      minute: iso[5],
      hasZone: Boolean(iso[8])
    };
  }
  const dateOnly = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dateOnly) {
    return {
      year: dateOnly[1],
      month: dateOnly[2],
      day: dateOnly[3],
      hour: 0,
      minute: '00',
      hasZone: false,
      dateOnly: true
    };
  }
  return null;
};

export const formatLogTime = (value) => {
  const parts = parseParts(value);
  if (parts?.hasZone) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    }
  }
  if (parts) {
    if (parts.dateOnly) return '';
    let hour = parts.hour;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${pad(hour)}:${parts.minute} ${ampm}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
};

export const formatLogDateKey = (value) => {
  const parts = parseParts(value);
  if (parts && !parts.hasZone) {
    const d = new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00+05:30`);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
    return `${weekday}, ${parts.day}/${parts.month}/${parts.year}`;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unknown date';
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
  const dateStr = d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
  return `${weekday}, ${dateStr}`;
};

export const logTimestamp = (value) => {
  const parts = parseParts(value);
  if (parts && !parts.hasZone) {
    return Date.parse(`${parts.year}-${parts.month}-${parts.day}T${pad(parts.hour)}:${parts.minute}:00+05:30`);
  }
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? 0 : t;
};

export const getLogNotesPreview = (log) => {
  let report = log?.report_data;
  if (typeof report === 'string') {
    try { report = JSON.parse(report); } catch { report = {}; }
  }
  report = report || {};
  const text = [
    log?.mentor_notes,
    log?.notes,
    log?.remarks,
    report.interaction_details,
    report.quick_notes,
    report.quick_guidance,
    report.mentor_guidance,
    report.action_plan,
    report.next_task,
    report.main_problem
  ].find((v) => typeof v === 'string' && v.trim() && !['QUICK', 'MEDIUM', 'DEEP'].includes(v.trim()));
  return text ? text.trim() : '';
};
