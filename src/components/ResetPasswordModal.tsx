import React from 'react';
import { X, Key } from 'lucide-react';

export const ResetPasswordModal = ({
  isOpen,
  onClose,
  newPasswordInput,
  setNewPasswordInput,
  handleResetUserPassword
}: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white/[0.04] border border-white/8 p-6 rounded-xl w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-sm font-bold text-blue-400 mb-6 flex items-center gap-2">
          <Key className="w-5 h-5" />
          Change Password
        </h3>

        <form onSubmit={handleResetUserPassword} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              required
              value={newPasswordInput}
              onChange={(e) => setNewPasswordInput(e.target.value)}
              placeholder="Enter new password..."
              className="w-full pl-3 pr-3 py-2.5 bg-white/[0.03] border border-white/8 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all font-sans"
            />
          </div>

          <div className="pt-4">
             <button
               type="submit"
               className="w-full px-6 py-2.5 bg-transparent border border-white/12 text-white hover:brightness-110 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
             >
               Confirm Change
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};
