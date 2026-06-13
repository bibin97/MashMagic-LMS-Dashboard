const fs = require('fs');

const file = 'e:\\\\my works\\\\MashMagic-LMS-Dashboard\\\\frontend\\\\src\\\\components\\\\DataTable.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Inject enhancedColumns definition
const target1 = `  const hasActions = onView || onEdit || onApprove || onBlock || onDelete || extraActions.length > 0;`;
const replacement1 = `  const hasActions = onView || onEdit || onApprove || onBlock || onDelete || extraActions.length > 0;

  const hasSerialCol = columns.some(col => col.header === '#' || col.header === 'No.' || col.header === 'Sl.No.' || col.header === 'Sl No');
  const enhancedColumns = hasSerialCol ? columns : [
    {
      header: '#',
      width: '60px',
      render: (row, { index }) => (
        <span className="text-[12px] font-black text-slate-400">{index + 1}</span>
      )
    },
    ...columns
  ];`;
code = code.replace(target1, replacement1);

// 2. Replace columns with enhancedColumns in desktop view
code = code.replace(`{columns.map((col, index) => (`, `{enhancedColumns.map((col, index) => (`);
code = code.replace(`{columns.map((_, j) => (`, `{enhancedColumns.map((_, j) => (`);
code = code.replace(`colSpan={columns.length + 1}`, `colSpan={enhancedColumns.length + 1}`);
code = code.replace(`{columns.map((col, colIndex) => (`, `{enhancedColumns.map((col, colIndex) => (`);
code = code.replace(`colSpan={columns.length + (hasActions ? 1 : 0)}`, `colSpan={enhancedColumns.length + (hasActions ? 1 : 0)}`);

// 3. For mobile view, add the index:
code = code.replace(
  `<div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{columns[0].header}</div>`,
  `<div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">#{rowIndex + 1} &bull; {columns[0].header}</div>`
);

fs.writeFileSync(file, code);
console.log("DataTable.jsx patched successfully!");
