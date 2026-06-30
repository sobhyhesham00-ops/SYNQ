import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  UserMinus,
  RefreshCw,
  Search,
  AlertCircle,
  Shield,
  UserPlus,
  ChevronDown,
  CheckCircle2,
  Clock,
  Activity,
  Users,
  XCircle,
  Eye,
  EyeOff,
  Zap,
  Terminal,
  ServerCrash,
} from 'lucide-react';
import { doc, collection } from 'firebase/firestore';
import { db, wrappedSetDoc as setDoc, wrappedDeleteDoc as deleteDoc, wrappedAddDoc as addDoc } from '../firebase';
import { toast } from 'sonner';
import { getUsernameFromFullName, getAgentTL, normalizeAgentLob } from '../utils';
import { INITIAL_AGENTS, TEAM_LEADERS, AGENT_LOBS } from '../types';

interface UserProfile {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  lob?: string;
  lobTeam?: string;
  teamLeader?: string;
  lastLoginAt?: string;
}

interface AuditLogEntry {
  id: string;
  action: string;
  targetUser: string;
  performedBy: string;
  timestamp: string;
}

interface SuperAdminControlProps {
  currentUser: any;
  registeredUsers: UserProfile[];
  credentials: Record<string, string>;
  lockedAccounts: string[];
  failedAttempts: Record<string, number>;
  onResetAllData: () => void;
  onCloseAllCases?: () => void;
  TRIGGER_CURRENT_APP_VERSION: number;
  deletedUsers?: string[];
  onDeleteSyntheticUser?: (name: string) => Promise<void>;
  isSuperAdmin: boolean;
  auditLog: AuditLogEntry[];
  mustChangePassword: Record<string, boolean>;
}

const ROLE_OPTIONS = [
  { value: 'agent', label: 'Agent', color: 'text-slate-300 bg-slate-700/40 border-slate-600/40' },
  { value: 'tl', label: 'TL', color: 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30' },
  { value: 'qa', label: 'QA', color: 'text-amber-300 bg-amber-500/20 border-amber-500/30' },
  { value: 'director', label: 'Director', color: 'text-fuchsia-300 bg-fuchsia-500/20 border-fuchsia-500/30' },
];

const getRoleBadge = (role: string) => {
  const r = ROLE_OPTIONS.find(o => o.value === role) || ROLE_OPTIONS[0];
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${r.color}`}>
      {r.label}
    </span>
  );
};

const AuditActionIcon = ({ action }: { action: string }) => {
  if (action.includes('lock')) return <Lock className="w-3 h-3 text-rose-400" />;
  if (action.includes('unlock')) return <Unlock className="w-3 h-3 text-emerald-400" />;
  if (action.includes('password')) return <Key className="w-3 h-3 text-amber-400" />;
  if (action.includes('delete')) return <UserMinus className="w-3 h-3 text-rose-400" />;
  if (action.includes('create')) return <UserPlus className="w-3 h-3 text-cyan-400" />;
  if (action.includes('edit')) return <CheckCircle2 className="w-3 h-3 text-indigo-400" />;
  return <Activity className="w-3 h-3 text-slate-400" />;
};

export const SuperAdminControl: React.FC<SuperAdminControlProps> = ({
  currentUser,
  registeredUsers,
  credentials,
  lockedAccounts,
  failedAttempts,
  onResetAllData,
  onCloseAllCases,
  TRIGGER_CURRENT_APP_VERSION,
  deletedUsers = [] as string[],
  onDeleteSyntheticUser,
  isSuperAdmin,
  auditLog,
  mustChangePassword,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('agent');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserLob, setNewUserLob] = useState('');
  const [newUserTeam, setNewUserTeam] = useState('');
  const [newUserTL, setNewUserTL] = useState('');
  const [targetPasswordChange, setTargetPasswordChange] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLob, setEditLob] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editTL, setEditTL] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const formatRelativeTime = (isoString?: string): string => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHr = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHr / 24);
      if (diffSec < 10) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      if (diffMin < 60) return `${diffMin}m ago`;
      if (diffHr < 24) return `${diffHr}h ago`;
      return `${diffDays}d ago`;
    } catch { return 'Never'; }
  };

  const logAdminAction = async (action: string, targetUser: string) => {
    try {
      await addDoc(collection(db, 'admin_audit_log'), {
        action,
        targetUser,
        performedBy: currentUser?.name || 'unknown',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[AUDIT LOG ERROR]', err);
    }
  };

  const registeredUsernames = new Set(
    registeredUsers.map(u => getUsernameFromFullName(u.name || ''))
  );

  const syntheticUsers: UserProfile[] = [...INITIAL_AGENTS, ...TEAM_LEADERS]
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .filter(name => !registeredUsernames.has(getUsernameFromFullName(name)))
    .filter(name => {
      const uname = getUsernameFromFullName(name);
      return !deletedUsers.includes(uname) && !deletedUsers.includes(name.toLowerCase());
    })
    .map(name => ({
      id: getUsernameFromFullName(name),
      name,
      role: TEAM_LEADERS.includes(name) ? 'tl' : 'agent',
      lob: TEAM_LEADERS.includes(name) ? '' : (AGENT_LOBS[name] === 'Call Center' ? 'Call Center' : 'Chat'),
    }));

  const seen = new Map<string, UserProfile>();
  [...registeredUsers, ...syntheticUsers].forEach(u => {
    const key = getUsernameFromFullName(u.name || '');
    if (!seen.has(key) || registeredUsers.includes(u)) {
      seen.set(key, u);
    }
  });
  const allUsers = Array.from(seen.values());

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) { toast.error('Super admin only.'); return; }
    const trimmedName = String(newUserName || '').trim();
    if (!trimmedName) { toast.error('Name is required!'); return; }
    const normalizedNewUsername = getUsernameFromFullName(trimmedName).toLowerCase();
    const isAlreadyRegistered = registeredUsers.some(u =>
      getUsernameFromFullName(u.name || '').toLowerCase() === normalizedNewUsername
    );
    if (isAlreadyRegistered) {
      toast.error(`User already registered: ${trimmedName}`);
      return;
    }
    const docId = getUsernameFromFullName(trimmedName);
    const newUser: UserProfile = {
      id: docId,
      name: trimmedName,
      role: newUserRole,
      email: String(newUserEmail || '').trim() || undefined,
      phone: String(newUserPhone || '').trim() || undefined,
      lob: (newUserRole === 'qa' || newUserRole === 'tl' || newUserRole === 'director')
        ? (String(newUserLob || '').trim() || undefined)
        : (normalizeAgentLob(String(newUserLob || '').trim() || undefined, newUserRole) || undefined),
      lobTeam: String(newUserTeam || '').trim() || undefined,
      teamLeader: String(newUserTL || '').trim() || undefined,
    };
    try {
      await setDoc(doc(db, 'users', docId), newUser);
      await logAdminAction('create_user', trimmedName);
      toast.success(`Profile created: ${trimmedName}`);
      setNewUserName(''); setNewUserRole('agent'); setNewUserEmail('');
      setNewUserPhone(''); setNewUserLob(''); setNewUserTeam(''); setNewUserTL('');
      setShowAddForm(false);
    } catch (err: any) {
      toast.error(`Failed to create user: ${err.message}`);
    }
  };

  const handleStartEdit = (user: UserProfile) => {
    setExpandedUserId(prev => prev === user.id ? null : user.id);
    setEditRole(user.role || 'agent');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditLob(user.lob || '');
    setEditTeam(user.lobTeam || '');
    setEditTL(user.teamLeader || '');
  };

  const handleSaveEdit = async (user: UserProfile) => {
    if (!isSuperAdmin) { toast.error('Super admin only.'); return; }
    const docId = user.id;
    const updatedUser = {
      id: docId,
      name: user.name,
      role: editRole,
      email: String(editEmail || '').trim() || undefined,
      phone: String(editPhone || '').trim() || undefined,
      lob: (editRole === 'qa' || editRole === 'tl' || editRole === 'director')
        ? (String(editLob || '').trim() || undefined)
        : (normalizeAgentLob(String(editLob || '').trim() || undefined, editRole) || undefined),
      lobTeam: String(editTeam || '').trim() || undefined,
      teamLeader: String(editTL || '').trim() || undefined,
    };
    try {
      // Use merge:false so synthetic users get fully promoted to Firestore docs
      await setDoc(doc(db, 'users', docId), updatedUser);
      await logAdminAction('edit_user', user.name);
      toast.success(`Profile updated: ${user.name}`);
      setExpandedUserId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile.');
    }
  };

  const handleSetPassword = async (userName: string) => {
    if (!isSuperAdmin) { toast.error('Super admin only.'); return; }
    if (!String(newPasswordValue || '').trim()) { toast.error('Password cannot be empty!'); return; }
    const usernameKey = getUsernameFromFullName(userName);
    const cleanPassword = String(newPasswordValue || '').trim();
    // Write under BOTH keys to cover legacy full-name credentials and new username-key credentials
    const updatedCreds = {
      ...credentials,
      [usernameKey]: cleanPassword,
      [userName]: cleanPassword,
      [userName.toLowerCase()]: cleanPassword,
    };
    try {
      const updatedMustChange = { ...(mustChangePassword || {}), [usernameKey]: true };
      await setDoc(doc(db, 'system', 'sched_credentials'), {
        data: updatedCreds,
        mustChangePassword: updatedMustChange,
      }, { merge: true });
      await logAdminAction('reset_password', userName);
      await handleUnlock(userName);
      toast.success(`Password set for ${userName}. They must change it on next login.`);
      setTargetPasswordChange(null);
      setNewPasswordValue('');
    } catch (err: any) {
      toast.error('Failed to set credentials.');
    }
  };

  const handleLock = async (userName: string) => {
    const usernameKey = getUsernameFromFullName(userName);
    const updated = Array.from(new Set([...lockedAccounts, usernameKey, userName, userName.toLowerCase()]));
    try {
      await setDoc(doc(db, 'system', 'sched_locked_accounts'), { data: updated });
      await logAdminAction('lock_account', userName);
      toast.success(`Account locked: ${userName}`);
    } catch { toast.error('Failed to lock account'); }
  };

  const handleUnlock = async (userName: string) => {
    const usernameKey = getUsernameFromFullName(userName);
    // Remove ALL possible formats this name could have been stored as
    const updated = lockedAccounts.filter(n =>
      n !== usernameKey &&
      n !== userName &&
      n !== userName.toLowerCase()
    );
    try {
      await setDoc(doc(db, 'system', 'sched_locked_accounts'), { data: updated });
      const updatedAttempts = { ...failedAttempts };
      delete updatedAttempts[usernameKey];
      delete updatedAttempts[userName];
      delete updatedAttempts[userName.toLowerCase()];
      await setDoc(doc(db, 'system', 'sched_failed_attempts'), { data: updatedAttempts });
      await logAdminAction('unlock_account', userName);
      toast.success(`Account unlocked: ${userName}`);
    } catch { toast.error('Failed to unlock account'); }
  };

  const handleClearAttempts = async (userName: string) => {
    const usernameKey = getUsernameFromFullName(userName);
    const updatedAttempts = { ...failedAttempts };
    delete updatedAttempts[usernameKey];
    delete updatedAttempts[userName];
    delete updatedAttempts[userName.toLowerCase()];
    try {
      await setDoc(doc(db, 'system', 'sched_failed_attempts'), { data: updatedAttempts });
      await logAdminAction('clear_attempts', userName);
      toast.success(`Failed attempts cleared: ${userName}`);
    } catch { toast.error('Failed to clear attempts'); }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!isSuperAdmin) { toast.error('Super admin only.'); return; }
    try {
      const isRegistered = registeredUsers.some(u => u.id === user.id);
      if (isRegistered) {
        await deleteDoc(doc(db, 'users', user.id));
      } else if (onDeleteSyntheticUser) {
        await onDeleteSyntheticUser(user.name);
      }
      await logAdminAction('delete_user', user.name);
      const usernameKey = getUsernameFromFullName(user.name);
      const updatedCreds = { ...credentials };
      delete updatedCreds[usernameKey];
      delete updatedCreds[user.name];
      delete updatedCreds[user.name.toLowerCase()];
      await setDoc(doc(db, 'system', 'sched_credentials'), { data: updatedCreds });
      const updatedLocked = lockedAccounts.filter(l => l !== usernameKey);
      await setDoc(doc(db, 'system', 'sched_locked_accounts'), { data: updatedLocked });

      // Also clean up failed attempts for the deleted user
      const updatedAttempts = { ...failedAttempts };
      delete updatedAttempts[usernameKey];
      delete updatedAttempts[user.name];
      delete updatedAttempts[user.name.toLowerCase()];
      await setDoc(doc(db, 'system', 'sched_failed_attempts'), { data: updatedAttempts });

      toast.success(`User removed: ${user.name}`);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user.');
    }
  };

  const handleRemoteReloadForce = async () => {
    try {
      // Read current Firestore version first so we always increment above whatever is live
      const { getDoc, doc: fsDoc } = await import('firebase/firestore');
      const snap = await getDoc(fsDoc(db, 'system', 'app_version')).catch(() => null);
      const currentRemoteVersion = snap?.exists() ? (snap.data().version || 0) : 0;
      const nextVer = Math.max(TRIGGER_CURRENT_APP_VERSION, currentRemoteVersion) + 1;
      await setDoc(doc(db, 'system', 'app_version'), { version: nextVer }, { merge: true });
      toast.success(`Force re-sync broadcast sent — all clients will reload (v${nextVer})`);
    } catch {
      toast.error('Failed to broadcast reload');
    }
  };

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = !searchQuery ||
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      getUsernameFromFullName(user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.lob || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const statCards = [
    { label: 'Total Users', value: allUsers.length, color: 'text-slate-200', icon: <Users className="w-4 h-4 text-slate-400" /> },
    { label: 'Agents', value: allUsers.filter(u => u.role === 'agent').length, color: 'text-cyan-300', icon: <Activity className="w-4 h-4 text-cyan-400" /> },
    { label: 'TLs / QAs', value: allUsers.filter(u => u.role === 'tl' || u.role === 'qa').length, color: 'text-indigo-300', icon: <ShieldCheck className="w-4 h-4 text-indigo-400" /> },
    { label: 'Locked', value: lockedAccounts.length, color: lockedAccounts.length > 0 ? 'text-rose-400' : 'text-slate-400', icon: <Lock className="w-4 h-4 text-rose-400" /> },
  ];

  const auditActionLabel: Record<string, string> = {
    lock_account: 'Locked account',
    unlock_account: 'Unlocked account',
    clear_attempts: 'Cleared login attempts',
    reset_password: 'Reset password',
    create_user: 'Created profile',
    edit_user: 'Updated profile',
    delete_user: 'Deleted profile',
  };

  return (
    <div className="space-y-6 text-left" id="super-admin-root">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 font-sans tracking-tight flex items-center gap-2">
              Admin Console
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 uppercase tracking-widest">h.sobhy only</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">User directory · Access control · Security · System ops</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && onCloseAllCases && (
            <button
              onClick={onCloseAllCases}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ServerCrash className="w-3.5 h-3.5" /> Close All Cases
            </button>
          )}
          <button
            onClick={handleRemoteReloadForce}
            className="px-3 py-2 text-xs font-bold rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" /> Force Re-Sync (v{TRIGGER_CURRENT_APP_VERSION})
          </button>
        </div>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-white/[0.04] border border-white/5 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">{s.icon}</div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Add user form */}
          <div className="bg-white/[0.04] border border-white/5 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                Add New User
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showAddForm ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden border-t border-white/5"
                >
                  <form onSubmit={handleCreateUser} className="p-5 space-y-3">
                    <div>
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aly Ibrahim"
                        value={newUserName}
                        onChange={e => setNewUserName(e.target.value)}
                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Role</label>
                      <div className="grid grid-cols-4 gap-1">
                        {ROLE_OPTIONS.map(r => (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => setNewUserRole(r.value)}
                            className={`py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${newUserRole === r.value ? r.color : 'bg-white/5 text-slate-500 border-transparent hover:bg-white/10'}`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Email</label>
                        <input type="email" placeholder="email@co.com" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600" />
                      </div>
                      <div>
                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">LOB</label>
                        <input type="text" placeholder="Chat / Call" value={newUserLob} onChange={e => setNewUserLob(e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">LOB Team</label>
                        <input
                          type="text"
                          placeholder="Team name"
                          value={newUserTeam}
                          onChange={e => setNewUserTeam(e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">Team Leader</label>
                        <input type="text" placeholder="TL Full Name" value={newUserTL} onChange={e => setNewUserTL(e.target.value)}
                          className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600" />
                      </div>
                    </div>
                    <button type="submit"
                      className="w-full py-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/25 text-cyan-300 font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" /> Create Profile
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Audit log */}
          <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" /> Recent Actions
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {!auditLog || auditLog.length === 0 ? (
                <p className="text-xs text-slate-600 italic text-center py-4">No actions logged yet.</p>
              ) : (
                auditLog.slice(0, 30).map(log => (
                  <div key={log.id} className="flex items-start gap-2 p-2.5 bg-transparent rounded-xl border border-white/5">
                    <div className="mt-0.5 shrink-0"><AuditActionIcon action={log.action} /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-200 font-semibold truncate">
                        {auditActionLabel[log.action] || log.action}{' '}
                        <span className="text-indigo-300">· {log.targetUser}</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatRelativeTime(log.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Security note */}
          <div className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-3 flex gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
            <p className="text-xs text-rose-200/70 leading-relaxed">
              Credential changes update the global security schema instantly. Unlocking an account also clears all failed login tallies for that user.
            </p>
          </div>
        </div>

        {/* Main user directory */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search + filter bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, username, role, email…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 placeholder:text-slate-600"
              />
            </div>
            <div className="flex gap-1">
              {[{ v: 'all', l: 'All' }, { v: 'agent', l: 'Agents' }, { v: 'tl', l: 'TLs' }, { v: 'qa', l: 'QA' }].map(f => (
                <button
                  key={f.v}
                  onClick={() => setRoleFilter(f.v)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${ roleFilter === f.v ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25' : 'bg-white/5 text-slate-500 border-transparent hover:bg-white/10 hover:text-slate-300' }`}
                >
                  {f.l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-2">
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 bg-transparent rounded-2xl border border-white/5">
                <XCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No users match your search.</p>
              </div>
            )}

            {filteredUsers.map(user => {
              const uname = getUsernameFromFullName(user.name);
              const hasPassword = !!(credentials[uname]);
              const isUserLocked = lockedAccounts.includes(uname);
              const failureCount = failedAttempts[uname] || 0;
              const isExpanded = expandedUserId === user.id;
              const isConfirmingDelete = confirmDeleteId === user.id;
              const isRegistered = registeredUsers.some(u => u.id === user.id);

              return (
                <div
                  key={user.id}
                  className={`rounded-xl border transition-all overflow-hidden ${ isUserLocked ? 'bg-rose-950/15 border-rose-500/15' : 'bg-transparent border-white/5 hover:border-white/10' }`}
                >
                  {/* Card header row */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${ user.role === 'tl' ? 'bg-indigo-500/15 text-indigo-300' : user.role === 'qa' ? 'bg-amber-500/15 text-amber-300' : user.role === 'director' ? 'bg-fuchsia-500/15 text-fuchsia-300' : 'bg-slate-700/30 text-slate-300' }`}>
                      {String(user.name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                    </div>

                    {/* Identity */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-100 text-sm">{user.name}</span>
                        <span className="font-mono text-xs text-cyan-400/70 font-bold">@{uname}</span>
                        {getRoleBadge(user.role)}
                        {!isRegistered && (
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-700/40 border border-slate-600/30 text-slate-500 font-bold uppercase tracking-wider">legacy</span>
                        )}
                        {hasPassword
                          ? <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5" /> PW</span>
                          : <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold flex items-center gap-0.5"><AlertCircle className="w-2.5 h-2.5" /> NO PW</span>
                        }
                        {isUserLocked && <span className="text-xs px-1.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> LOCKED</span>}
                        {failureCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold">{failureCount} fails</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-sans">
                        {user.lob && <span>{normalizeAgentLob(user.lob, user.role)} · </span>}
                        {user.lobTeam && <span>{user.lobTeam} · </span>}
                        {user.teamLeader && <span>TL: {user.teamLeader} · </span>}
                        <span>Last seen: {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}</span>
                      </p>
                    </div>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isUserLocked ? (
                        <button onClick={() => handleUnlock(user.name)} title="Unlock account"
                          className="p-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/15 transition-all cursor-pointer">
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button onClick={() => handleLock(user.name)} title="Lock account"
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/15 transition-all cursor-pointer">
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {failureCount > 0 && (
                        <button
                          onClick={() => handleClearAttempts(user.name)}
                          className="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 rounded-xl text-xs text-orange-400 font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                          title={`Clear ${failureCount} failed attempts`}
                        >
                          Clear ({failureCount}x)
                        </button>
                      )}

                      <button
                        onClick={() => handleStartEdit(user)}
                        title="Edit profile"
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${ isExpanded ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20' : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border-transparent' }`}
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 rounded-xl p-0.5">
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="px-2 py-1 bg-rose-500 text-white hover:bg-rose-600 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 bg-white/5 text-slate-300 hover:bg-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(user.id)}
                          className="p-1.5 rounded-xl bg-white/5 hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/15 transition-all cursor-pointer"
                          title="Remove operator profile"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable edit panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/5 bg-transparent px-4 py-4 space-y-4">
                          <div className="flex items-center justify-between pb-1 border-b border-white/5">
                            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /> Edit Operator Details
                            </span>
                            <button
                              onClick={() => handleSaveEdit(user)}
                              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>

                          {/* Role picker */}
                          <div>
                            <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1.5">Role</label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {ROLE_OPTIONS.map(r => (
                                <button
                                  key={r.value}
                                  type="button"
                                  onClick={() => setEditRole(r.value)}
                                  className={`py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${ editRole === r.value ? r.color : 'bg-white/5 text-slate-500 border-transparent hover:bg-white/10 hover:text-slate-300' }`}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Fields grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {[
                              { label: 'Email', val: editEmail, set: setEditEmail, type: 'email', ph: 'agent@co.com' },
                              { label: 'Phone', val: editPhone, set: setEditPhone, type: 'text', ph: '+971…' },
                              { label: 'LOB', val: editLob, set: setEditLob, type: 'text', ph: 'Chat / Call Center' },
                              { label: 'Team Name', val: editTeam, set: setEditTeam, type: 'text', ph: 'Team name' },
                              { label: 'Team Leader', val: editTL, set: setEditTL, type: 'text', ph: 'TL full name' },
                            ].map(f => (
                              <div key={f.label}>
                                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider block mb-1">{f.label}</label>
                                <input
                                  type={f.type}
                                  value={f.val}
                                  placeholder={f.ph}
                                  onChange={e => f.set(e.target.value)}
                                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500/50 placeholder:text-slate-600"
                                />
                              </div>
                            ))}
                          </div>

                          {/* Password reset inline */}
                          {isSuperAdmin && (
                            <div className="pt-1">
                              {targetPasswordChange === user.name ? (
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <input
                                      type={showPassword ? 'text' : 'password'}
                                      placeholder="New password"
                                      value={newPasswordValue}
                                      onChange={e => setNewPasswordValue(e.target.value)}
                                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3 py-1.5 pr-8 text-xs text-slate-100 focus:outline-none focus:border-rose-500/50"
                                    />
                                    <button type="button" onClick={() => setShowPassword(p => !p)}
                                      className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300">
                                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                  <button onClick={() => handleSetPassword(user.name)}
                                    className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer">
                                    Set PW
                                  </button>
                                  <button onClick={() => { setTargetPasswordChange(null); setNewPasswordValue(''); }}
                                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button onClick={() => setTargetPasswordChange(user.name)}
                                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-300 transition-colors cursor-pointer">
                                  <Key className="w-3 h-3" /> Set Password
                                </button>
                              )}
                            </div>
                          )}

                          {/* Action row */}
                          <div className="flex items-center justify-between pt-1 border-t border-white/5">
                            <div className="flex items-center gap-2">
                              {failureCount > 0 && (
                                <button onClick={() => handleClearAttempts(user.name)}
                                  className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/15 text-orange-400 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                  <XCircle className="w-3 h-3" /> Clear {failureCount} Fails
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {isConfirmingDelete ? (
                                <>
                                  <span className="text-xs text-rose-300 font-bold">Delete "{user.name}"?</span>
                                  <button onClick={() => handleDeleteUser(user)}
                                    className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                    Confirm
                                  </button>
                                  <button onClick={() => setConfirmDeleteId(null)}
                                    className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                isSuperAdmin && (
                                  <button onClick={() => setConfirmDeleteId(user.id)}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 border border-transparent hover:border-rose-500/15 rounded-xl text-xs font-bold transition-all cursor-pointer">
                                    <UserMinus className="w-3 h-3" /> Remove User
                                  </button>
                                )
                              )}
                              <button onClick={() => handleSaveEdit(user)}
                                className="px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer">
                                Save Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
