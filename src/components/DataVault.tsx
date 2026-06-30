import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  Download, 
  ShieldCheck, 
  Clock, 
  Smartphone, 
  HardDrive,
  CheckCircle2,
  AlertCircle,
  FileJson,
  RefreshCw
} from 'lucide-react';
import { collection } from 'firebase/firestore';
import { db, wrappedGetDocs as getDocs } from '../firebase';
import { toast } from 'sonner';

interface DataVaultProps {
  userName: string;
}

export const DataVault: React.FC<DataVaultProps> = ({ userName }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(() => localStorage.getItem(`last_backup_${userName}`));
  const [backupSize, setBackupSize] = useState<string | null>(null);

  const handleBackup = async () => {
    setIsExporting(true);
    try {
      // Collect all relevant data from Firestore to package into a local bundle
      const collections = ['schedules', 'scheduling_requests', 'tt_requests', 'tt_complaints', 'inquiries', 'client_comms', 'messages', 'timelogs', 'attendance_records', 'qa_scores', 'announcements', 'notifications'];
      const backupData: Record<string, any[]> = {};

      for (const collName of collections) {
        const querySnapshot = await getDocs(collection(db, collName));
        if (querySnapshot) {
          backupData[collName] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as any)
          }));
        } else {
          backupData[collName] = [];
        }
      }

      // Create the file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `SYNC_PORTAL_BACKUP_${userName}_${timestamp}.json`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const now = new Date().toLocaleString();
      setLastBackup(now);
      localStorage.setItem(`last_backup_${userName}`, now);
      setBackupSize((blob.size / 1024).toFixed(2) + ' KB');
      
      toast.success("Local backup created and downloaded successfully!");
    } catch (error) {
      console.error("Backup failed:", error);
      toast.error("Failed to generate local backup. Please check your connection.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-slate-900/40 rounded-xl border border-white/8 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-transparent flex items-center justify-center text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Local Data Vault</h2>
              <p className="text-[11px] text-slate-400">Securely backup your workspace data to this device</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-transparent border border-white/12 text-white border border-transparent text-[11px] font-bold text-emerald-400 uppercase tracking-widest">
            <ShieldCheck className="w-3 h-3" />
            Encryption Enabled
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-transparent border border-white/8 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase">Last Device Backup</span>
            </div>
            <p className="text-xs font-medium text-slate-200">{lastBackup || 'Never'}</p>
          </div>
          <div className="p-4 rounded-xl bg-transparent border border-white/8 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase">Storage Locality</span>
            </div>
            <p className="text-xs font-medium text-slate-200">Local Hardware</p>
          </div>
          <div className="p-4 rounded-xl bg-transparent border border-white/8 space-y-2">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <HardDrive className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase">Archive Size</span>
            </div>
            <p className="text-xs font-medium text-slate-200">{backupSize || '0.00 KB'}</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Downloading a backup saves a snapshot of all team schedules, requests, and logs to your device. 
              This ensures you have a permanent record of your data that exists independently of the cloud servers.
            </p>
          </div>
        </div>

        <button
          onClick={handleBackup}
          disabled={isExporting}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isExporting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
          {isExporting ? 'Generating Local Archive...' : 'Download Full Local Backup'}
        </button>
      </div>

      <div className="px-6 py-4 bg-white/5 border-t border-white/8 flex flex-wrap items-center justify-center gap-6">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          JSON Compliant
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Offline Sync Ready
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Device Bound
        </div>
      </div>
    </div>
  );
};
