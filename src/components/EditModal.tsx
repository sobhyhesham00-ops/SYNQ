import React from 'react';
import { X, Save } from 'lucide-react';
const CLINICS = ['Dermadent VIP', 'Dermadent', 'One Touch Mo3tred', 'One Touch Merkhnya', 'WellTouch', 'New Edge', 'DermaDent', 'One Touch 1 AlMu\'tarid', 'One Touch 2 Markhaniya'];

export const EditModal = ({
  editingItem,
  setEditingItem,
  handleEditSave
}: any) => {
  if (!editingItem) return null;
  const { type, data } = editingItem;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditingItem({
      ...editingItem,
      data: {
        ...data,
        [e.target.name]: e.target.value,
      }
    });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingItem({
      ...editingItem,
      data: {
        ...data,
        [e.target.name]: e.target.checked,
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setEditingItem(null)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-emerald-400 mb-6 flex items-center gap-2">
          <Save className="w-5 h-5" />
          Edit Request
        </h3>

        <form onSubmit={handleEditSave} className="space-y-4">
          
          {/* Clinic Name (Shared across most) */}
          {(type === 'inquiry' || type === 'tt_request' || type === 'tt_complaint' || type === 'client_comm' || type === 'case') && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Clinic Name</label>
              <select
                name="clinicName"
                value={data.clinicName || ""}
                onChange={handleChange}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans cursor-pointer"
              >
                 <option value="">Select a Clinic</option>
                 {CLINICS.map((clinic: string) => (
                    <option key={clinic} value={clinic}>
                      {clinic}
                    </option>
                 ))}
              </select>
            </div>
          )}

          {/* Patient Details */}
          {(type === 'tt_request' || type === 'tt_complaint') && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Patient Name</label>
                <input
                  type="text"
                  name="patientName"
                  value={data.patientName || ""}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">File Number</label>
                <input
                   type="text"
                   name="fileNumber"
                   value={data.fileNumber || ""}
                   onChange={handleChange}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={data.phoneNumber || ""}
                  onChange={handleChange}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                />
              </div>
            </>
          )}

          {type === 'tt_request' && (
             <div>
               <label className="block text-xs font-bold text-slate-300 mb-1">Amount</label>
               <input
                 type="text"
                 name="priceWithoutTax"
                 value={data.priceWithoutTax || ""}
                 onChange={handleChange}
                 className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
               />
             </div>
          )}
          
          {type === 'tt_complaint' && (
             <div>
               <label className="block text-xs font-bold text-slate-300 mb-1">Complaint Details</label>
               <textarea
                 name="complaintDetails"
                 value={data.complaintDetails || ""}
                 onChange={handleChange}
                 rows={3}
                 className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
               />
             </div>
          )}

          {type === 'inquiry' && (
             <>
               <div>
                 <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                 <input
                   type="text"
                   name="phoneNumber"
                   value={data.phoneNumber || ''}
                   onChange={handleChange}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-300 mb-1">Inquiry Text</label>
                 <textarea
                   name="text"
                   value={data.text || ""}
                   onChange={handleChange}
                   rows={4}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                 />
               </div>
             </>
          )}

          {type === 'client_comm' && (
             <>
               <div>
                 <label className="block text-xs font-bold text-slate-300 mb-1">Patient Name</label>
                 <input
                   type="text"
                   name="patientName"
                   value={data.patientName || ''}
                   onChange={handleChange}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                 <input
                   type="text"
                   name="phoneNumber"
                   value={data.phoneNumber || ""}
                   onChange={handleChange}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-300 mb-1">Notes</label>
                 <textarea
                   name="notes"
                   value={data.notes || ""}
                   onChange={handleChange}
                   rows={3}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                 />
               </div>
             </>
          )}

          {type === 'case' && (
             <>
               <div>
                 <label className="block text-xs font-bold text-slate-300 mb-1">Patient Name</label>
                 <input
                   type="text"
                   name="patientName"
                   value={data.patientName || ""}
                   onChange={handleChange}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number</label>
                 <input
                   type="text"
                   name="phoneNumber"
                   value={data.phoneNumber || ""}
                   onChange={handleChange}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                 />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-300 mb-1">Notes</label>
                 <textarea
                   name="notes"
                   value={data.notes || ""}
                   onChange={handleChange}
                   rows={3}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                 />
               </div>
             </>
          )}

          {type === 'scheduling_request' && (
             <>
               <div className="mb-4">
                 <span className="inline-block px-3 py-1 bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-700">
                   {data.type === 'swap' ? 'Shift Swap' : 'Annual Leave'}
                 </span>
               </div>
               
               {data.type === 'swap' && (
                 <>
                   <div>
                     <label className="block text-xs font-bold text-slate-300 mb-1">Shift Date</label>
                     <input
                       type="date"
                       name="date"
                       value={data.date || ""}
                       onChange={handleChange}
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans [color-scheme:dark]"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-300 mb-1">Your Shift</label>
                     <input
                       type="text"
                       name="shift"
                       value={data.shift || ""}
                       onChange={handleChange}
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-300 mb-1">Swap With Agent</label>
                     <input
                       type="text"
                       name="swapWithAgent"
                       value={data.swapWithAgent || ""}
                       onChange={handleChange}
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-300 mb-1">Swap With Shift</label>
                     <input
                       type="text"
                       name="swapWithShift"
                       value={data.swapWithShift || ""}
                       onChange={handleChange}
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                     />
                   </div>
                 </>
               )}

               {data.type === 'annual' && (
                 <>
                   <div>
                     <label className="block text-xs font-bold text-slate-300 mb-1">Start Date</label>
                     <input
                       type="date"
                       name="startDate"
                       value={data.startDate || ""}
                       onChange={handleChange}
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans [color-scheme:dark]"
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-300 mb-1">End Date</label>
                     <input
                       type="date"
                       name="endDate"
                       value={data.endDate || ""}
                       onChange={handleChange}
                       className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans [color-scheme:dark]"
                     />
                   </div>
                 </>
               )}

               <div>
                 <label className="block text-xs font-bold text-slate-300 mb-1">Notes</label>
                 <textarea
                   name="notes"
                   value={data.notes || ""}
                   onChange={handleChange}
                   rows={3}
                   className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-all font-sans"
                 />
               </div>
             </>
          )}

          <div className="pt-4 flex justify-end gap-3">
             <button
               type="button"
               onClick={() => setEditingItem(null)}
               className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-sm font-semibold text-slate-300 transition-all cursor-pointer"
             >
               Cancel
             </button>
             <button
               type="submit"
               className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:brightness-110 text-slate-900 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer"
             >
               Save Changes
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
