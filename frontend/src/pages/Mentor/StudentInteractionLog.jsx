                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
   );
 }

 // Interaction Form Screen
 return (
   <div className="max-w-4xl mx-auto space-y-10 p-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
     <button
       onClick={() => { setSelectedStudent(null); setSubmitted(false); }}
       className="flex items-center gap-2 text-slate-600 hover:text-[#008080] font-black text-[10px] uppercase tracking-widest transition-colors mb-4"
     >
       <ArrowLeft size={16} /> Return to Dashboard
     </button>

     <header className={`border p-10 rounded-[3rem] shadow-2xl relative overflow-hidden transition-all ${sessionType === 'CANCELLED' ? 'bg-slate-900 border-slate-800' : sessionType === 'DEEP' ? 'bg-rose-950 border-rose-900' : sessionType === 'MEDIUM' ? 'bg-amber-950 border-amber-900' : sessionType === 'QUICK' ? 'bg-blue-950 border-blue-900' : 'bg-[#008080] border-slate-800'}`}>
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full -mr-40 -mt-40 opacity-10 ${sessionType === 'CANCELLED' ? 'bg-slate-500' : sessionType === 'DEEP' ? 'bg-rose-500' : sessionType === 'MEDIUM' ? 'bg-amber-500' : sessionType === 'QUICK' ? 'bg-blue-500' : 'bg-[#008080]'}`}></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl ${sessionType === 'CANCELLED' ? 'bg-slate-500' : sessionType === 'DEEP' ? 'bg-rose-500' : sessionType === 'MEDIUM' ? 'bg-amber-500' : sessionType === 'QUICK' ? 'bg-blue-500' : 'bg-[#008080]'}`}>
              {sessionType === 'CANCELLED' ? <XCircle size={24} /> : getSessionIcon(sessionType)}
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight leading-none uppercase mb-2">{selectedStudent.name}</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                {sessionType} SESSION • {new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <p className="text-[10px] font-bold text-white uppercase tracking-widest">
              Completed {assignedStudents.filter(s => s.status === 'COMPLETED').length} / {assignedStudents.length} Sessions Today
            </p>
          </div>
        </div>
     </header>

     {!submitted ? (
       <form onSubmit={handleSubmit} className="bg-white p-6 md:p-12 rounded-[3.5rem] shadow-2xl border border-slate-50 space-y-12 relative">
         
         {sessionType !== 'CANCELLED' && (
           <div className="absolute top-8 right-8 z-20">
             <button
               type="button"
               onClick={() => setSessionType('CANCELLED')}
               className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-rose-100"
             >
               <XCircle size={14} /> Cancel Session
             </button>
           </div>
         )}

         {sessionType === 'CANCELLED' && (
           <div className="space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-4">
                <div className="flex items-center gap-3">
                  <XCircle className="text-slate-500" size={24} />
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Cancel Interaction</h3>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  You are about to cancel this interaction. This will clear it from your pending list, but you MUST provide a reason.
                </p>
                
                <div className="space-y-2 mt-6">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block">Cancellation Reason (Mandatory)</label>
                  <textarea 
                    name="cancel_reason" 
                    rows="3" 
                    required 
                    value={formData.cancel_reason || ''} 
                    onChange={handleChange} 
                    className="w-full p-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-4 focus:ring-slate-900/10 transition-all placeholder:text-slate-300" 
                    placeholder="Why was this session cancelled? (e.g., Student unreachable, Number busy...)"
                  ></textarea>
                </div>
              </div>
           </div>
         )}
         <InteractionFormUI sessionType={sessionType} formData={formData} setFormData={setFormData} />

         {/* File Upload Section */}
         {sessionType !== 'CANCELLED' && sessionType !== 'TUITION' && (
            <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#008080]/10 flex items-center justify-center">
                  <Upload size={16} className="text-[#008080]" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Attach Files</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Upload any screenshots, documents, or proofs</p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <input 
                  type="file" 
                  multiple 
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  className="block w-full text-xs font-bold text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-[#008080] file:text-white hover:file:bg-[#006666] file:cursor-pointer file:transition-colors bg-white border border-slate-200 rounded-xl"
                />
                {files.length > 0 && (
                  <p className="text-[10px] font-black text-[#008080] uppercase tracking-widest ml-2 flex items-center gap-1">
                    <CheckCircle2 size={12} /> {files.length} file(s) selected
                  </p>
                )}
              </div>
            </div>
         )}

         <div className="pt-8">
           <button
             type="submit"
             disabled={loading}
             className={`w-full p-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-4 active:scale-[0.98] ${sessionType === 'CANCELLED' ? 'bg-slate-800 text-white shadow-slate-200 hover:-translate-y-1' : sessionType === 'DEEP' ? 'bg-rose-600 text-white shadow-rose-200 hover:-translate-y-1' : sessionType === 'MEDIUM' ? 'bg-amber-500 text-white shadow-amber-200 hover:-translate-y-1' : sessionType === 'QUICK' ? 'bg-blue-600 text-white shadow-blue-200 hover:-translate-y-1' : 'bg-[#008080] text-white hover:-translate-y-1'}`}
           >
             {loading ? 'Saving...' : sessionType === 'CANCELLED' ? 'Save Cancelled Interaction' : 'Save Interaction'}
             {!loading && (sessionType === 'CANCELLED' ? <XCircle size={24} /> : <CheckCircle2 size={24} />)}
           </button>
         </div>

       </form>
     ) : (
       <div className="space-y-8 animate-in fade-in zoom-in duration-300">
         <div className="bg-emerald-50 border border-emerald-100 p-12 rounded-[4rem] text-center shadow-xl">
           <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-200">
             <CheckCircle2 size={40} strokeWidth={3} />
           </div>
           <h2 className="text-3xl font-black text-emerald-900 mb-2 uppercase tracking-tight">Interaction Saved!</h2>
           <p className="text-emerald-600 font-bold text-xs uppercase tracking-widest mb-10">The student's interaction log has been updated successfully.</p>
           <button
             onClick={() => { setSelectedStudent(null); setSubmitted(false); }}
             className="px-12 py-5 bg-emerald-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] hover:bg-emerald-700 hover:shadow-xl transition-all active:scale-95"
           >
             Continue Today's Plan
           </button>
         </div>
       </div>
     )}
   </div>
 );
};

export default StudentInteractionLog;
