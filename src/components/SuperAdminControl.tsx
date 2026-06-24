import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  Lock, 
  Unlock, 
  Key, 
  Trash2, 
  UserMinus, 
  RefreshCw, 
  Search, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Award,
  Shield,
  UserPlus
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
}

export const SuperAdminControl: React.FC<SuperAdminControlProps> = ({
  currentUser,
  registeredUsers,
  credentials,
  lockedAccounts,
  failedAttempts,
  onResetAllData,
  onCloseAllCases,
  TRIGGER_CURRENT_APP_VERSION,
  deletedUsers = [],
  onDeleteSyntheticUser,
  isSuperAdmin,
  auditLog
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

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
    } catch (err) {
      return 'Never';
    }
  };

  const logAdminAction = async (action: string, targetUser: string) => {
    try {
      await addDoc(collection(db, "admin_audit_log"), {
        action,
        targetUser,
        performedBy: currentUser?.name || "unknown",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("[AUDIT LOG ERROR]", err);
    }
  };

  const registeredUsernames = new Set(
    registeredUsers.map(u => getUsernameFromFullName(u.name || ''))
  );

  const syntheticUsers: UserProfile[] = [...INITIAL_AGENTS, ...TEAM_LEADERS]
    .filter((name, i, arr) => arr.indexOf(name) === i) // dedupe within the static list itself
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
  
  // States for new user
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState('agent');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserLob, setNewUserLob] = useState('');
  const [newUserTeam, setNewUserTeam] = useState('');
  const [newUserTL, setNewUserTL] = useState('');
  
  // Custom password override states
  const [targetPasswordChange, setTargetPasswordChange] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState('');

  // Editing individual user states
  const [editRole, setEditRole] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLob, setEditLob] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [editTL, setEditTL] = useState('');

  const normalizeUsername = (name: string) => {
    return String(name || '').trim().toLowerCase().replace(/\s+/g, '');
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = String(newUserName || '').trim();
    if (!trimmedName) {
      toast.error('Name is required!');
      return;
    }

    const normalizedNewUsername = getUsernameFromFullName(trimmedName).toLowerCase();

    // Check if user is already physically registered in Firestore database
    const isAlreadyRegistered = registeredUsers.some(u => {
      const uName = u.name || '';
      return getUsernameFromFullName(uName).toLowerCase() === normalizedNewUsername;
    });

    if (isAlreadyRegistered) {
      toast.error(`A registered user with this name already exists: ${trimmedName}. Please edit their existing profile.`);
      return;
    }

    const docId = getUsernameFromFullName(trimmedName);
    const newUser: UserProfile = {
      id: docId,
      name: trimmedName,
      role: newUserRole,
      email: String(newUserEmail || '').trim() || undefined,
      phone: String(newUserPhone || '').trim() || undefined,
      lob: normalizeAgentLob(String(newUserLob || '').trim() || undefined, newUserRole) || undefined,
      lobTeam: String(newUserTeam || '').trim() || undefined,
      teamLeader: String(newUserTL || '').trim() || undefined
    };

    try {
      await setDoc(doc(db, "users", docId), newUser);
      await logAdminAction("create_user", trimmedName);
      toast.success(`Successfully registered user profile: ${trimmedName}!`);
      
      // Reset form
      setNewUserName('');
      setNewUserRole('agent');
      setNewUserEmail('');
      setNewUserPhone('');
      setNewUserLob('');
      setNewUserTeam('');
      setNewUserTL('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to register user: ${err.message}`);
    }
  };

  const handleStartEdit = (user: UserProfile) => {
    setEditingUserId(user.id);
    setEditRole(user.role || 'agent');
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
    setEditLob(user.lob || '');
    setEditTeam(user.lobTeam || '');
    setEditTL(user.teamLeader || '');
  };

  const handleSaveEdit = async (user: UserProfile) => {
    const docId = user.id;
    const updatedUser = {
      ...user,
      role: editRole,
      email: String(editEmail || '').trim() || undefined,
      phone: String(editPhone || '').trim() || undefined,
      lob: normalizeAgentLob(String(editLob || '').trim() || undefined, editRole) || undefined,
      lobTeam: String(editTeam || '').trim() || undefined,
      teamLeader: String(editTL || '').trim() || undefined
    };

    try {
      await setDoc(doc(db, "users", docId), updatedUser, { merge: true });
      await logAdminAction("edit_user", user.name);
      toast.success(`Updated profile for ${user.name}`);
      setEditingUserId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update user profile.');
    }
  };

  const handleSetPassword = async (userName: string) => {
    if (!isSuperAdmin) {
      toast.error('Only the global super admin (h.sobhy) can reset credentials.');
      return;
    }
    if (!String(newPasswordValue || '').trim()) {
      toast.error('Password cannot be empty!');
      return;
    }

    const usernameKey = getUsernameFromFullName(userName);
    const cleanPassword = String(newPasswordValue || '').trim();

    const updatedCreds = { 
      ...credentials, 
      [usernameKey]: cleanPassword
    };

    try {
      await setDoc(doc(db, "system", "sched_credentials"), { 
        data: updatedCreds,
        mustChangePassword: { [usernameKey]: true }
      }, { merge: true });
      
      await logAdminAction("reset_password", userName);

      // Also automatically unlock if is locked
      await handleUnlock(userName);

      toast.success(`Successfully set password for ${userName}!`);
      setTargetPasswordChange(null);
      setNewPasswordValue('');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to set credentials.');
    }
  };

  const handleLock = async (userName: string) => {
    const usernameKey = getUsernameFromFullName(userName);

    let updated = [...lockedAccounts];
    if (!updated.includes(usernameKey)) {
      updated.push(usernameKey);
    }

    try {
      await setDoc(doc(db, "system", "sched_locked_accounts"), { data: updated });
      await logAdminAction("lock_account", userName);
      toast.success(`Locked login account for "${userName}"`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to lock account');
    }
  };

  const handleUnlock = async (userName: string) => {
    const usernameKey = getUsernameFromFullName(userName);

    const updated = lockedAccounts.filter(name => name !== usernameKey);
    try {
      await setDoc(doc(db, "system", "sched_locked_accounts"), { data: updated });
      
      // Reset failed attempts as well
      const updatedAttempts = { ...failedAttempts };
      delete updatedAttempts[usernameKey];

      await setDoc(doc(db, "system", "sched_failed_attempts"), { data: updatedAttempts });

      await logAdminAction("unlock_account", userName);

      toast.success(`Unlocked and clear attempts for "${userName}"!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to unlock account');
    }
  };

  const handleClearAttempts = async (userName: string) => {
    const usernameKey = getUsernameFromFullName(userName);

    const updatedAttempts = { ...failedAttempts };
    delete updatedAttempts[usernameKey];

    try {
      await setDoc(doc(db, "system", "sched_failed_attempts"), { data: updatedAttempts });
      await logAdminAction("clear_attempts", userName);
      toast.success(`Failed attempts counters reset for "${userName}"`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to reset attempts counters');
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    const cleanName = user.name;
    if (!window.confirm(`Are you absolutely sure you want to delete "${cleanName}"'s profile? This will not remove their historical rosters but they will lose access instantly.`)) {
      return;
    }

    try {
      const docId = user.id;
      const isRegistered = registeredUsers.some(u => u.id === user.id);
      if (isRegistered) {
        await deleteDoc(doc(db, "users", docId));
      } else if (onDeleteSyntheticUser) {
        await onDeleteSyntheticUser(cleanName);
      }

      await logAdminAction("delete_user", cleanName);

      const usernameKey = getUsernameFromFullName(cleanName);

      // Remove from credentials
      const updatedCreds = { ...credentials };
      if (updatedCreds[usernameKey]) {
        delete updatedCreds[usernameKey];
        await setDoc(doc(db, "system", "sched_credentials"), { data: updatedCreds });
      }

      // Remove from locked accounts
      const updatedLocked = lockedAccounts.filter(l => l !== usernameKey);
      await setDoc(doc(db, "system", "sched_locked_accounts"), { data: updatedLocked });

      toast.success(`Fully removed user "${cleanName}"!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user.');
    }
  };

  const handleRemoteReloadForce = async () => {
    try {
      const nextVer = TRIGGER_CURRENT_APP_VERSION + 1;
      await setDoc(doc(db, "system", "app_version"), { version: nextVer }, { merge: true });
      toast.success(`System reload broadcast successfully! (Target Version ${nextVer})`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to propagate reload broadcast');
    }
  };

  // Filter users based on search
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = !searchQuery || 
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      getUsernameFromFullName(user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.role || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.lob || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 text-left" id="super-admin-root">
      {/* Tab Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-rose-400 font-display flex items-center gap-3">
            <Shield className="w-8 h-8 text-rose-500" />
            Super Admin Control Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Oversee user directory accounts, locking statuses, custom logins, and system version syncing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRemoteReloadForce}
            className="px-4 py-2 text-xs font-bold transition-all rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-amber-300 border border-amber-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Force Re-Sync App (v{TRIGGER_CURRENT_APP_VERSION})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Quick metrics or directory snapshot summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-100 text-base font-display">System State Summary</h3>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-black/20 border border-white/5 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Agents</p>
                <p className="text-2xl font-black text-slate-200 mt-1">{allUsers.filter(u => u.role !== 'tl').length}</p>
              </div>

              <div className="p-4 bg-black/20 border border-white/5 rounded-2xl">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Leaders/TLs</p>
                <p className="text-2xl font-black text-indigo-400 mt-1">{allUsers.filter(u => u.role === 'tl').length}</p>
              </div>

              <div className="p-4 bg-black/20 border border-rose-500/20 rounded-2xl">
                <p className="text-xs text-rose-300 font-bold uppercase tracking-wider">Locked Accounts</p>
                <p className="text-2xl font-black text-rose-400 mt-1">{lockedAccounts.length}</p>
              </div>

              <div className="p-4 bg-black/20 border border-orange-500/20 rounded-2xl">
                <p className="text-xs text-orange-300 font-bold uppercase tracking-wider">Locked Attempts</p>
                <p className="text-2xl font-black text-orange-400 mt-1">
                  {Object.values(failedAttempts).filter(v => v > 0).length}
                </p>
              </div>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Security Advisory
              </h4>
              <p className="text-[10px] text-rose-200/80 leading-relaxed font-sans font-medium">
                Changing credentials directly updates the global security schema. Account unlock keys instantly purge invalid password attempt tallies for that user.
              </p>
            </div>
          </div>

          {/* Recent Admin Activity Log Card */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
            <h3 className="font-bold text-slate-100 text-sm font-display uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-400" />
              Recent Admin Activity
            </h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {!auditLog || auditLog.length === 0 ? (
                <p className="text-xs text-slate-500 italic text-center py-4 font-sans font-medium">No recent activity logged.</p>
              ) : (
                auditLog.map((log) => {
                  let displayAction = log.action;
                  if (log.action === "lock_account") displayAction = "locked account";
                  else if (log.action === "unlock_account") displayAction = "unlocked account";
                  else if (log.action === "clear_attempts") displayAction = "cleared attempts";
                  else if (log.action === "reset_password") displayAction = "reset password";
                  else if (log.action === "create_user") displayAction = "created profile";
                  else if (log.action === "edit_user") displayAction = "updated profile";
                  else if (log.action === "delete_user") displayAction = "deleted profile";

                  return (
                    <div key={log.id} className="text-xs text-slate-300 bg-black/20 p-3 rounded-xl border border-white/5 space-y-1 font-sans font-medium">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{log.performedBy}</span>
                        <span className="text-[10px] text-slate-400">{formatRelativeTime(log.timestamp)}</span>
                      </div>
                      <div className="text-slate-400">
                        {displayAction} for <span className="text-indigo-300">{log.targetUser}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Close All Cases Card (h.sobhy exclusive) */}
          {isSuperAdmin && onCloseAllCases && (
            <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-500/20 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-rose-400 text-sm font-display uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                SLA & CRM Batch Actions
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
                Instantly close all open CRM/SLA tickets across all databases, including Tabby, Tamara, Complaints, General Inquiries, and Client Comm logs. Only visible to creator/CTO (**h.sobhy**).
              </p>
              <button
                type="button"
                onClick={onCloseAllCases}
                className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-500 hover:scale-[1.01] active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/10 hover:shadow-rose-600/20"
              >
                <ShieldCheck className="w-4 h-4" />
                Close All Open Cases & SLAs
              </button>
            </div>
          )}

          {/* Quick manual user addition card toggle */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-sm font-display uppercase tracking-wider">Add User Profile</h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-2.5 py-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-lg transition-all"
              >
                {showAddForm ? 'Hide' : 'Show'}
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleCreateUser} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Full User Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aly Ibrahim"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                    >
                      <option value="agent">CSR (Agent)</option>
                      <option value="tl">Team Leader</option>
                      <option value="qa">QA Analyst</option>
                      <option value="director">Director</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LOB / Channel</label>
                    <input
                      type="text"
                      placeholder="e.g. Chat, Social Media"
                      value={newUserLob}
                      onChange={(e) => setNewUserLob(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Corporate Email</label>
                  <input
                    type="email"
                    placeholder="agent@company.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">LOB Team</label>
                    <input
                      type="text"
                      placeholder="Team name"
                      value={newUserTeam}
                      onChange={(e) => setNewUserTeam(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Team Leader</label>
                    <input
                      type="text"
                      placeholder="TL Full Name"
                      value={newUserTL}
                      onChange={(e) => setNewUserTL(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-1"
                >
                  <UserPlus className="w-4 h-4" /> Create Profile
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Columns: Users controls and actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-bold text-slate-100 text-lg font-display">User accounts directory</h3>
              
              <div className="relative w-full sm:w-64">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Filter by name, role, LOB..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {filteredUsers.map((user) => {
                const uname = getUsernameFromFullName(user.name);
                const hasPassword = !!(credentials[uname]);
                const isUserLocked = lockedAccounts.includes(uname);
                const failureCount = failedAttempts[uname] || 0;

                const isEditing = editingUserId === user.id;
                
                return (
                  <div 
                    key={user.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isUserLocked 
                        ? 'bg-rose-950/20 border-rose-500/20 shadow-lg shadow-rose-950/10' 
                        : 'bg-black/20 border-white/5 hover:border-white/10'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <p className="font-black text-slate-100 text-sm">Editing Profile for "{user.name}"</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSaveEdit(user)}
                              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-white text-[11px] font-extrabold rounded-lg transition-all"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-extrabold border border-white/10 rounded-lg transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Role</label>
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200"
                            >
                              <option value="agent">CSR (Agent)</option>
                              <option value="tl">Team Leader</option>
                              <option value="qa">QA Analyst</option>
                              <option value="director">Director</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Email</label>
                            <input
                              type="email"
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Phone</label>
                            <input
                              type="text"
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">LOB / Channel</label>
                            <input
                              type="text"
                              value={editLob}
                              onChange={(e) => setEditLob(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Team Name</label>
                            <input
                              type="text"
                              value={editTeam}
                              onChange={(e) => setEditTeam(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Team Leader</label>
                            <input
                              type="text"
                              value={editTL}
                              onChange={(e) => setEditTL(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Upper row: Avatar & details & toggle switches */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div className="flex items-start gap-3 text-left">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                              user.role === 'tl' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700/20 text-slate-300'
                            }`}>
                              {String(user.name || '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-100 text-sm whitespace-nowrap">{user.name}</span>
                                <span className="font-mono text-xs text-cyan-300">{getUsernameFromFullName(user.name)}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${
                                  user.role === 'tl' 
                                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' 
                                    : 'bg-white/5 border-white/5 text-slate-400'
                                }`}>
                                  {user.role}
                                </span>
                                {hasPassword ? (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold flex items-center gap-0.5">
                                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> PW SET
                                  </span>
                                ) : (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-extrabold flex items-center gap-0.5" title="No custom password set. Defining on first login is allowed.">
                                    <AlertCircle className="w-2.5 h-2.5 text-amber-500" /> NO PW
                                  </span>
                                )}
                                {isUserLocked && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> LOCKED
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 font-sans mt-0.5 animate-none font-medium flex items-center gap-1.5">
                                <span>Direct Manager:</span>
                                <span className="text-xs text-slate-300">{user.teamLeader || '—'}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-0.5 space-x-2 flex flex-wrap items-center gap-y-1">
                                <span className="text-rose-400 font-mono font-bold bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded mr-1">
                                  App Username: {getUsernameFromFullName(user.name)}
                                </span>
                                <span className="text-indigo-400 font-mono font-bold bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded mr-1">
                                  Direct Manager: {user.role === 'tl' ? '—' : (user.teamLeader || '—')}
                                </span>
                                <span>{user.email || 'No Email'}</span>
                                {user.phone && <span className="text-emerald-400 font-mono">• {user.phone}</span>}
                                {normalizeAgentLob(user.lob, user.role) && <span>• <span className="text-indigo-300 font-semibold">{normalizeAgentLob(user.lob, user.role)}</span></span>}
                                <span className="text-gray-400 font-mono font-bold bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                                  Last seen: {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : 'Never'}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Quick Actions switch lock state */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {isUserLocked ? (
                              <button
                                onClick={() => handleUnlock(user.name)}
                                className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Unlock className="w-3 h-3" /> Unlock Account
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLock(user.name)}
                                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/10 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <Lock className="w-3 h-3 text-rose-400" /> Lock Account
                              </button>
                            )}

                            {failureCount > 0 && (
                              <button
                                onClick={() => handleClearAttempts(user.name)}
                                className="px-2 py-1.5 bg-orange-500/10 hover:bg-orange-500/15 border border-orange-500/20 rounded-xl text-[9px] text-orange-400 font-bold transition-all flex items-center gap-0.5"
                                title={`Clear ${failureCount} failed passcode attempts`}
                              >
                                Clear {failureCount}x Red Attempts
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Lower row: Inline password reset or profile action button triggers */}
                        <div className="flex items-center justify-between border-t border-white/5 pt-2.5 text-xs text-slate-400">
                          <div className="flex items-center gap-3">
                            {isSuperAdmin ? (
                              targetPasswordChange === user.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="Enter New Password"
                                    value={newPasswordValue}
                                    onChange={(e) => setNewPasswordValue(e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded-xl p-1 px-2.5 text-slate-200 text-[11px] focus:outline-none focus:border-rose-500 w-36"
                                  />
                                  <button
                                    onClick={() => handleSetPassword(user.name)}
                                    className="p-1 px-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer"
                                  >
                                    Reset Password
                                  </button>
                                  <button
                                    onClick={() => { setTargetPasswordChange(null); setNewPasswordValue(''); }}
                                    className="p-1 text-slate-400 hover:text-slate-200 text-[10px] font-medium cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setTargetPasswordChange(user.id)}
                                  className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/30 transition-all rounded-xl p-1 px-2.5 text-[10.5px] font-bold text-rose-300 cursor-pointer"
                                >
                                  <Key className="w-3 h-3 text-rose-400" /> Reset Password
                                </button>
                              )
                            ) : (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 font-medium font-sans">
                                <Lock className="w-2.5 h-2.5 text-slate-600" /> Password reset restricted to Global Admin
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStartEdit(user)}
                              className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors"
                              title="Edit complete profile data"
                            >
                              <span className="text-[10px] font-bold">Edit Profile</span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-1.5 hover:bg-rose-500/20 text-rose-400 hover:text-rose-100 rounded-lg transition-colors"
                              title="Remove user profile entirely"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredUsers.length === 0 && (
                <div className="text-center p-8 bg-black/10 rounded-2xl border border-white/5 text-slate-500 font-sans font-medium text-xs">
                  No matching user accounts found. Add users or import files to populate.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
