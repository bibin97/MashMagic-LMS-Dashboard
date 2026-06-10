import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { IndianRupee, Clock, Plus, Trash2, Edit2, AlertTriangle, Users, Briefcase, Calculator, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const FeesManagement = () => {
  const [activeTab, setActiveTab] = useState('student'); // 'student' or 'staff'
  const [entities, setEntities] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    total_fee: '',
    total_hours: '',
    installments: []
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all entities (students or staff)
      const entitiesRes = await api.get(activeTab === 'student' ? '/admin/students' : '/admin/staff');
      const entitiesData = activeTab === 'student' ? entitiesRes.data.students : entitiesRes.data.data;
      setEntities(entitiesData || []);

      // 2. Fetch fee structures for the active tab
      const feesRes = await api.get(`/admin/fees/${activeTab}`);
      setFeeStructures(feesRes.data.data || []);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const openFeeModal = (entity) => {
    setSelectedEntity(entity);
    const existingFee = feeStructures.find(f => f.entity_id === entity.id);
    if (existingFee) {
      setFormData({
        total_fee: existingFee.total_fee,
        total_hours: existingFee.total_hours,
        installments: existingFee.installments.map(i => ({
          ...i,
          installment_date: i.installment_date ? i.installment_date.split('T')[0] : ''
        }))
      });
    } else {
      setFormData({
        total_fee: '',
        total_hours: '',
        installments: []
      });
    }
    setIsModalOpen(true);
  };

  const addInstallment = () => {
    setFormData(prev => ({
      ...prev,
      installments: [...prev.installments, { installment_date: '', installment_amount: '' }]
    }));
  };

  const updateInstallment = (index, field, value) => {
    const updated = [...formData.installments];
    updated[index][field] = value;
    setFormData({ ...formData, installments: updated });
  };

  const removeInstallment = (index) => {
    const updated = formData.installments.filter((_, i) => i !== index);
    setFormData({ ...formData, installments: updated });
  };

  const saveFeeStructure = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        entity_type: activeTab,
        entity_id: selectedEntity.id,
        total_fee: parseFloat(formData.total_fee) || 0,
        total_hours: parseFloat(formData.total_hours) || 0,
        installments: formData.installments.filter(i => i.installment_amount && i.installment_date)
      };

      await api.post('/admin/fees', payload);
      toast.success('Fee structure updated successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to save fee structure');
    }
  };

  const getBlinkStatus = (fee) => {
    if (!fee || fee.paid_hours === 0) return null;
    const ratio = fee.consumed_hours / fee.paid_hours;
    if (ratio >= 0.9) return 'critical'; // 90%
    if (ratio >= 0.7) return 'warning';  // 70%
    return 'good';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">Fee Management</h1>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
            Manage tuition fees and installments
          </p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('student')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'student' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users size={16} /> Students
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'staff' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase size={16} /> Staff
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="p-4 pl-6">Name / Details</th>
                  <th className="p-4">Total Fee</th>
                  <th className="p-4">Total Hours</th>
                  <th className="p-4">Paid Details</th>
                  <th className="p-4">Status / Alert</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entities.map(entity => {
                  const fee = feeStructures.find(f => f.entity_id === entity.id);
                  const blinkStatus = getBlinkStatus(fee);
                  
                  return (
                    <tr key={entity.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 pl-6">
                        <p className="text-sm font-black text-slate-900">{entity.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{entity.email}</p>
                      </td>
                      <td className="p-4">
                        {fee ? (
                          <div className="flex items-center gap-1 font-bold text-slate-700">
                            <IndianRupee size={14}/> {fee.total_fee}
                          </div>
                        ) : <span className="text-xs text-slate-400">Not set</span>}
                      </td>
                      <td className="p-4">
                        {fee ? (
                          <div className="flex items-center gap-1 font-bold text-slate-700">
                            <Clock size={14}/> {fee.total_hours} hrs
                          </div>
                        ) : <span className="text-xs text-slate-400">Not set</span>}
                      </td>
                      <td className="p-4">
                        {fee ? (
                          <div className="space-y-1">
                            <p className="text-xs font-black text-emerald-600 flex items-center gap-1">
                              Paid: <IndianRupee size={12}/>{fee.total_paid_amount}
                            </p>
                            <p className="text-[10px] font-bold text-slate-500">
                              Paid Hrs: {parseFloat(fee.paid_hours).toFixed(2)}
                            </p>
                            {activeTab === 'student' && (
                              <p className="text-[10px] font-bold text-indigo-500">
                                Consumed Hrs: {parseFloat(fee.consumed_hours).toFixed(2)}
                              </p>
                            )}
                          </div>
                        ) : <span className="text-xs text-slate-400">-</span>}
                      </td>
                      <td className="p-4">
                        {activeTab === 'student' && fee && fee.paid_hours > 0 ? (
                          blinkStatus === 'critical' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-black uppercase animate-pulse">
                              <AlertTriangle size={12}/> 90% Consumed
                            </span>
                          ) : blinkStatus === 'warning' ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase animate-pulse">
                              <AlertTriangle size={12}/> 70% Consumed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                              Healthy
                            </span>
                          )
                        ) : <span className="text-xs text-slate-400">-</span>}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => openFeeModal(entity)}
                          className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center ml-auto hover:bg-indigo-600 hover:text-white transition-all"
                        >
                          {fee ? <Edit2 size={14}/> : <Plus size={14}/>}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {entities.length === 0 && (
                  <tr><td colSpan="6" className="p-8 text-center text-sm text-slate-500 font-bold">No {activeTab}s found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedEntity && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-black text-slate-900 uppercase">Fee Structure: {selectedEntity.name}</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{activeTab}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center bg-white rounded-full text-slate-500 hover:text-rose-500">✕</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-white">
              <form id="feeForm" onSubmit={saveFeeStructure} className="space-y-8">
                
                {/* Main Structure */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1"><IndianRupee size={12}/> Total Fee</label>
                    <input type="number" required min="0" value={formData.total_fee} onChange={(e) => setFormData({...formData, total_fee: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Total Hours</label>
                    <input type="number" required min="0" value={formData.total_hours} onChange={(e) => setFormData({...formData, total_hours: e.target.value})} className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 ring-indigo-500/10 outline-none" />
                  </div>
                  
                  {formData.total_fee && formData.total_hours && (
                    <div className="col-span-2 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-4">
                      <Calculator className="text-indigo-500"/>
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Calculated Hourly Rate</p>
                        <p className="text-lg font-black text-indigo-700">₹ {(formData.total_fee / formData.total_hours).toFixed(2)} / hr</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Installments */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Installments</h3>
                    <button type="button" onClick={addInstallment} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all">
                      <Plus size={14}/> Add Installment
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formData.installments.map((inst, index) => {
                      const hourlyRate = (formData.total_fee && formData.total_hours) ? (formData.total_fee / formData.total_hours) : 0;
                      const calculatedHours = (hourlyRate > 0 && inst.installment_amount) ? (inst.installment_amount / hourlyRate).toFixed(2) : 0;
                      
                      return (
                        <div key={index} className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl relative group">
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Paid Date</label>
                            <input type="date" required value={inst.installment_date} onChange={(e) => updateInstallment(index, 'installment_date', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Amount</label>
                            <input type="number" required min="0" value={inst.installment_amount} onChange={(e) => updateInstallment(index, 'installment_amount', e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold outline-none" placeholder="₹0" />
                          </div>
                          <div className="flex-1 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Auto Paid Hrs</label>
                            <p className="text-sm font-black text-slate-700">{calculatedHours} hrs</p>
                          </div>
                          <button type="button" onClick={() => removeInstallment(index)} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shrink-0">
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      )
                    })}
                    {formData.installments.length === 0 && (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                        <p className="text-xs font-bold text-slate-400">No installments added yet</p>
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>
            
            <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-xs font-black text-slate-500 uppercase hover:bg-slate-200 transition-all">Cancel</button>
              <button form="feeForm" type="submit" className="px-8 py-3 rounded-xl text-xs font-black text-white uppercase bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20">Save Details</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeesManagement;
