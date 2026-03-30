import React, { useState } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Eye, CheckCircle, Ban, Trash2, Pencil } from 'lucide-react';
import StudentListFilterDropdown from './StudentListFilterDropdown';

const DataTable = ({
    columns,
    data,
    loading,
    onSearch,
    onFilter,
    onExport,
    onView,
    onApprove,
    onBlock,
    onDelete,
    onEdit,
    searchPlaceholder = "Search...",
    filterValue,
    onFilterChange,
}) => {
    const useFilterDropdown = filterValue !== undefined && onFilterChange;
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-6 border-b border-slate-100 gap-4 w-full">
                <div className="relative w-full sm:w-80 group">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#008080] transition-colors" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:bg-white focus:ring-2 focus:ring-[#008080] focus:border-[#008080] transition-all shadow-sm"
                    />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {useFilterDropdown ? (
                        <StudentListFilterDropdown
                            value={filterValue}
                            onChange={onFilterChange}
                            className="flex-1 sm:flex-none w-full sm:w-auto"
                        />
                    ) : (
                        <button
                            onClick={onFilter}
                            className="w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <Filter size={18} className="text-slate-400" />
                            <span>Filter</span>
                        </button>
                    )}
                    <button
                        onClick={onExport}
                        className="w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-[#008080] border border-[#008080] rounded-xl text-sm font-semibold text-white hover:bg-[#008080] transition-all shadow-sm active:scale-95"
                    >
                        <span>Export</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50">
                        <tr>
                            {columns.map((col, index) => (
                                <th key={index} className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100" style={{ width: col.width }}>
                                    {col.header}
                                </th>
                            ))}
                            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 w-40 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    {columns.map((_, j) => (
                                        <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    ))}
                                    <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-full"></div></td>
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length + 1} className="px-6 py-20 text-center text-slate-400 font-medium">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                                            <Search size={24} />
                                        </div>
                                        <span>No records found</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr key={rowIndex} className="group hover:bg-slate-50/80 transition-colors">
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center items-center gap-1">
                                            <button
                                                className="p-1.5 text-slate-400 hover:text-[#008080] hover:bg-[#008080]/10 rounded-lg transition-all"
                                                onClick={() => onView && onView(row)}
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            {onEdit && (
                                                <button
                                                    className="p-1.5 text-slate-400 hover:text-[#008080] hover:bg-[#008080]/10 rounded-lg transition-all"
                                                    onClick={() => onEdit(row)}
                                                    title="Edit Details"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                            )}

                                            {onApprove && row.status !== 'active' && (
                                                <button
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                    onClick={() => onApprove(row)}
                                                    title="Approve User"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}

                                            {onBlock && row.status !== 'blocked' && (
                                                <button
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                                    onClick={() => onBlock(row)}
                                                    title="Block User"
                                                >
                                                    <Ban size={16} />
                                                </button>
                                            )}

                                            {onDelete && (
                                                <button
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    onClick={() => onDelete(row)}
                                                    title="Delete User"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/30 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400">Total {data.length} records</span>
                <div className="flex gap-1.5">
                    <button className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40" disabled>
                        <ChevronLeft size={16} />
                    </button>
                    <button className="px-3 py-1 rounded-lg bg-[#008080] text-white text-xs font-bold shadow-sm shadow-[#008080]/30">1</button>
                    <button className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all">
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataTable;
