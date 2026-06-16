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
import { doc } from 'firebase/firestore';
import { db, wrappedSetDoc as setDoc, wrappedDeleteDoc as deleteDoc } from '../firebase';
import { toast } from 'sonner';
import { getUsernameFromFullName } from '../utils';

interface UserProfile {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
  lob?: string;
  lobTeam?: string;
  teamLeader?: string;
}

interface SuperAdminControlProps {
  currentUser: any;
  registeredUsers: UserProfile[];
  credentials: Record<string, string>;
  lockedAccounts: string[];
  failedAttempts: Record<string, number>;
  onResetAllData: () => void;
  TRIGGER_CURRENT_APP_VERSION: number;
}

export const SuperAdminControl: React.FC<SuperAdminControlProps> = ({
  currentUser,
  registeredUsers,
  credentials,
  lockedAccounts,
  failedAttempts,
  onResetAllData,
  TRIGGER_CURRENT_APP_VERSION
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIssue, setFilterIssue] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  const isGlobalAdminUser = currentUser?.name?.toLowerCase() === "h.sobhy" ||
                            currentUser?.name?.toLowerCase() === "hesham sobhy" ||
                            currentUser?.name?.toLowerCase() === "hesso";
  
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
    if (!String(newUserName || '').trim()) {
      toast.error('Name is required!');
      return;
    }

    const docId = newUserName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: String(newUserName || '').trim(),
      role: newUserRole,
      email: String(newUserEmail || '').trim() || undefined,
      phone: String(newUserPhone || '').trim() || undefined,
      lob: String(newUserLob || '').trim() || undefined,
      lobTeam: String(newUserTeam || '').trim() || undefined,
      teamLeader: String(newUserTL || '').trim() || undefined
    };

    try {
      await setDoc(doc(db, "users", docId), newUser);
      toast.success(`Successfully registered user profile: ${newUserName}!`);
      
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
    const docId = user.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const updatedUser = {
      ...user,
      role: editRole,
      email: String(editEmail || '').trim() || undefined,
      phone: String(editPhone || '').trim() || undefined,
      lob: String(editLob || '').trim() || undefined,
      lobTeam: String(editTeam || '').trim() || undefined,
      teamLeader: String(editTL || '').trim() || undefined
    };

    try {
      await setDoc(doc(db, "users", docId), updatedUser, { merge: true });
      toast.success(`Updated profile for ${user.name}`);
      setEditingUserId(null);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update user profile.');
    }
  };

  const handleSetPassword = async (user: UserProfile) => {
    if (!isGlobalAdminUser) {
      toast.error('Only the global super admin (h.sobhy) can reset credentials.');
      return;
    }

    const defaultPassword = "Synq12345@";
    const userName = user.name || user.id;

    const usernameKey = getUsernameFromFullName(userName).toLowerCase();
    const fullNameKey = String(userName || '').trim();
    const lowerFullNameKey = fullNameKey.toLowerCase();
    const oldNormalizeKey = String(userName || '').trim().toLowerCase().replace(/\s+/g, '');

    const updatedCreds = { 
      ...credentials, 
      [usernameKey]: defaultPassword,
      [fullNameKey]: defaultPassword,
      [lowerFullNameKey]: defaultPassword,
      [oldNormalizeKey]: defaultPassword
    };

    try {
      await setDoc(doc(db, "system", "sched_credentials"), { data: updatedCreds });
      
      await setDoc(doc(db, "users", user.id), {
        password: defaultPassword,
        mustChangePassword: true
      }, { merge: true });

      // Also automatically unlock if is locked
      await handleUnlock(userName);

      toast.success(`Password for ${userName} reset to default: Synq12345@`);
      setTargetPasswordChange(null);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to set credentials.');
    }
  };

  const handleLock = async (userName: string) => {
    const usernameKey = getUsernameFromFullName(userName).toLowerCase();
    const fullNameKey = String(userName || '').trim();
    const lowerFullNameKey = fullNameKey.toLowerCase();
    const oldNormalizeKey = String(userName || '').trim().toLowerCase().replace(/\s+/g, '');

    const keysToLock = [usernameKey, fullNameKey, lowerFullNameKey, oldNormalizeKey];
    let updated = [...lockedAccounts];
    keysToLock.forEach(k => {
      if (!updated.includes(k)) {
        updated.push(k);
      }
    });

    try {
      await setDoc(doc(db, "system", "sched_locked_accounts"), { data: updated });
      toast.success(`Locked login account for "${userName}"`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to lock account');
    }
  };

  const handleUnlock = async (userName: string) => {
    const usernameKey = getUsernameFromFullName(userName).toLowerCase();
    const fullNameKey = String(userName || '').trim();
    const lowerFullNameKey = fullNameKey.toLowerCase();
    const oldNormalizeKey = String(userName || '').trim().toLowerCase().replace(/\s+/g, '');

    const keysToRemove = [usernameKey, fullNameKey, lowerFullNameKey, oldNormalizeKey];

    const updated = lockedAccounts.filter(name => !keysToRemove.includes(name));
    try {
      await setDoc(doc(db, "system", "sched_locked_accounts"), { data: updated });
      
      // Reset failed attempts as well
      const updatedAttempts = { ...failedAttempts };
      keysToRemove.forEach(k => {
        delete updatedAttempts[k];
      });
      await setDoc(doc(db, "system", "sched_failed_attempts"), { data: updatedAttempts });

      toast.success(`Unlocked and clear attempts for "${userName}"!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to unlock account');
    }
  };

  const handleClearAttempts = async (userName: string) => {
    const usernameKey = getUsernameFromFullName(userName).toLowerCase();
    const fullNameKey = String(userName || '').trim();
    const lowerFullNameKey = fullNameKey.toLowerCase();
    const oldNormalizeKey = String(userName || '').trim().toLowerCase().replace(/\s+/g, '');

    const keysToRemove = [usernameKey, fullNameKey, lowerFullNameKey, oldNormalizeKey];

    const updatedAttempts = { ...failedAttempts };
    keysToRemove.forEach(k => {
      delete updatedAttempts[k];
    });

    try {
      await setDoc(doc(db, "system", "sched_failed_attempts"), { data: updatedAttempts });
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
      const docId = cleanName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      await deleteDoc(doc(db, "users", docId));

      const usernameKey = getUsernameFromFullName(cleanName).toLowerCase();
      const fullNameKey = String(cleanName || '').trim();
      const lowerFullNameKey = fullNameKey.toLowerCase();
      const oldNormalizeKey = String(cleanName || '').trim().toLowerCase().replace(/\s+/g, '');

      const keysToRemove = [usernameKey, fullNameKey, lowerFullNameKey, oldNormalizeKey];

      // Remove from credentials
      const updatedCreds = { ...credentials };
      let hadCreds = false;
      keysToRemove.forEach(k => {
        if (updatedCreds[k]) {
          delete updatedCreds[k];
          hadCreds = true;
        }
      });
      if (hadCreds) {
        await setDoc(doc(db, "system", "sched_credentials"), { data: updatedCreds });
      }

      // Remove from locked accounts
      const updatedLocked = lockedAccounts.filter(l => !keysToRemove.includes(l));
      await setDoc(doc(db, "system", "sched_locked_accounts"), { data: updatedLocked });

      toast.success(`Fully removed user "${cleanName}"!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete user.');
    }
  };

  const handleCleanDuplicates = async () => {
    if (!isGlobalAdminUser) return;
    if (!window.confirm("Are you sure you want to clean duplicates? This will keep the most complete profile and delete others.")) return;

    try {
      const usernameGroups: Record<string, UserProfile[]> = {};
      registeredUsers.forEach(u => {
         const key = getUsernameFromFullName(u.name || u.id).toLowerCase();
         if (!usernameGroups[key]) usernameGroups[key] = [];
         usernameGroups[key].push(u);
      });

      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      let deletedCount = 0;

      for (const [key, group] of Object.entries(usernameGroups)) {
        if (group.length > 1) {
          const sorted = group.sort((a, b) => {
             if (a.role && !b.role) return -1;
             if (!a.role && b.role) return 1;
             return String(b.name || '').length - String(a.name || '').length;
          });
          for (let i = 1; i < sorted.length; i++) {
             batch.delete(doc(db, "users", sorted[i].id));
             deletedCount++;
          }
        }
      }

      if (deletedCount > 0) {
        await batch.commit();
        toast.success(`Cleaned ${deletedCount} duplicate user profiles.`);
      } else {
        toast.info("No duplicates found.");
      }
    } catch(err) {
      console.error(err);
      toast.error('Failed to clean duplicates');
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

  const uniqueUsersMap = new Map<string, UserProfile>();
  registeredUsers.forEach(u => {
    const rawUsername = getUsernameFromFullName(u.name || u.id).toLowerCase();
    const existing = uniqueUsersMap.get(rawUsername);
    if (!existing) {
       uniqueUsersMap.set(rawUsername, u);
    } else {
       // Keep the one with a role or longer name
       if ((u.role && !existing.role) || (String(u.name || '').length > String(existing.name || '').length)) {
          uniqueUsersMap.set(rawUsername, u);
       }
    }
  });

  const displayUsers = Array.from(uniqueUsersMap.values()).map(u => {
    if (u.role === "tl") {
      const teamLobs = Array.from(new Set(registeredUsers.filter(a => a.teamLeader?.toLowerCase() === (u.name || "").toLowerCase() && a.role !== "tl" && a.lob).map(a => a.lob)));
      if (teamLobs.length > 0) {
        return { ...u, lob: teamLobs.join(", ") };
      }
    }
    return u;
  });

  // Identify Issues
  const usernameCounts = registeredUsers.reduce((acc, u) => {
    const un = getUsernameFromFullName(u.name || '').toLowerCase();
    acc[un] = (acc[un] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const duplicateUsers = registeredUsers.filter(u => usernameCounts[getUsernameFromFullName(u.name || '').toLowerCase()] > 1);
  const missingLOBUsers = registeredUsers.filter(u => u.role === "agent" && (!u.lob || u.lob === "social_media"));
  const missingTLUsers = registeredUsers.filter(u => u.role === "agent" && !u.teamLeader);
  const needsPasswordChangeUsers = registeredUsers.filter(u => (u as any).mustChangePassword === true);
  const brokenNamesUsers = registeredUsers.filter(u => !u.name || u.name.trim() === '');

  // Filter registered users based on search
  const filteredUsers = displayUsers.filter(u => {
    if (filterIssue === 'duplicate') return usernameCounts[getUsernameFromFullName(u.name || '').toLowerCase()] > 1;
    if (filterIssue === 'missing_lob') return u.role === "agent" && (!u.lob || u.lob === "social_media");
    if (filterIssue === 'missing_tl') return u.role === "agent" && !u.teamLeader;
    if (filterIssue === 'needs_password') return (u as any).mustChangePassword === true;
    if (filterIssue === 'broken_name') return !u.name || u.name.trim() === '';
    return true;
  }).filter(u => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q) ||
      (u.lob || '').toLowerCase().includes(q) ||
      (u.teamLeader || '').toLowerCase().includes(q) ||
      getUsernameFromFullName(u.name).toLowerCase().includes(q)
    );
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
          
          {isGlobalAdminUser && (
            <button
              onClick={handleCleanDuplicates}
              className="px-4 py-2 text-xs font-bold transition-all rounded-xl bg-orange-500/10 hover:bg-orange-500/15 text-orange-300 border border-orange-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clean Duplicates
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Quick metrics or directory snapshot summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base font-display">System State Summary</h3>
              {filterIssue && (
                <button 
                  onClick={() => setFilterIssue(null)}
                  className="px-2 py-1 text-[10px] font-bold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-md transition-colors"
                >
                  Clear Filter
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <button onClick={() => setFilterIssue(null)} className={`p-4 border rounded-2xl flex flex-col items-center justify-center transition-all ${filterIssue === null ? 'bg-indigo-500/40 border-indigo-400/50 scale-[1.02]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                 <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Total Users</p>
                 <div className="flex items-center gap-1.5 text-2xl font-black text-slate-200">
                    <Users className="w-5 h-5 text-indigo-400" />
                    {registeredUsers.length}
                 </div>
              </button>

              <button onClick={() => setFilterIssue('duplicate')} className={`p-4 border rounded-2xl flex flex-col items-center justify-center transition-all ${filterIssue === 'duplicate' ? 'bg-rose-500/40 border-rose-400/50 scale-[1.02]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-1 mb-1">
                   <div className={`w-2 h-2 rounded-full shrink-0 ${duplicateUsers.length === 0 ? 'bg-emerald-500' : duplicateUsers.length <= 5 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Duplicate Logins</p>
                </div>
                <div className="text-2xl font-black text-slate-200">{duplicateUsers.length}</div>
              </button>

              <button onClick={() => setFilterIssue('missing_lob')} className={`p-4 border rounded-2xl flex flex-col items-center justify-center transition-all ${filterIssue === 'missing_lob' ? 'bg-amber-500/40 border-amber-400/50 scale-[1.02]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-1 mb-1">
                   <div className={`w-2 h-2 rounded-full shrink-0 ${missingLOBUsers.length === 0 ? 'bg-emerald-500' : missingLOBUsers.length <= 5 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Missing LOB</p>
                </div>
                <div className="text-2xl font-black text-slate-200">{missingLOBUsers.length}</div>
              </button>

              <button onClick={() => setFilterIssue('missing_tl')} className={`p-4 border rounded-2xl flex flex-col items-center justify-center transition-all ${filterIssue === 'missing_tl' ? 'bg-amber-500/40 border-amber-400/50 scale-[1.02]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-1 mb-1">
                   <div className={`w-2 h-2 rounded-full shrink-0 ${missingTLUsers.length === 0 ? 'bg-emerald-500' : missingTLUsers.length <= 5 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Missing TL</p>
                </div>
                <div className="text-2xl font-black text-slate-200">{missingTLUsers.length}</div>
              </button>

              <button onClick={() => setFilterIssue('broken_name')} className={`p-4 border rounded-2xl flex flex-col items-center justify-center transition-all ${filterIssue === 'broken_name' ? 'bg-rose-500/40 border-rose-400/50 scale-[1.02]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-1 mb-1">
                   <div className={`w-2 h-2 rounded-full shrink-0 ${brokenNamesUsers.length === 0 ? 'bg-emerald-500' : brokenNamesUsers.length <= 5 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none">Broken Names</p>
                </div>
                <div className="text-2xl font-black text-slate-200">{brokenNamesUsers.length}</div>
              </button>
              
              <button onClick={() => setFilterIssue('needs_password')} className={`p-4 border rounded-2xl flex flex-col items-center justify-center transition-all ${filterIssue === 'needs_password' ? 'bg-indigo-500/40 border-indigo-400/50 scale-[1.02]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                <div className="flex items-center gap-1 mb-1">
                   <div className={`w-2 h-2 rounded-full shrink-0 ${needsPasswordChangeUsers.length === 0 ? 'bg-emerald-500' : needsPasswordChangeUsers.length <= 5 ? 'bg-amber-500' : 'bg-rose-500'}`} />
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none whitespace-nowrap">Pass Change</p>
                </div>
                <div className="text-2xl font-black text-slate-200">{needsPasswordChangeUsers.length}</div>
              </button>
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

          {/* Quick manual user addition card toggle */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
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
                    <select
                      value={newUserLob}
                      onChange={(e) => setNewUserLob(e.target.value)}
                      disabled={newUserRole === "tl"}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 disabled:opacity-50"
                    >
                      <option value="">-- Choose LOB --</option>
                      <option value="chat">Chat</option>
                      <option value="call_center">Call Center</option>
                    </select>
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
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
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
                const usernameKey = getUsernameFromFullName(user.name).toLowerCase();
                const fullNameKey = String(user.name || '').trim();
                const lowerFullNameKey = fullNameKey.toLowerCase();
                const oldNormalizeKey = String(user.name || '').trim().toLowerCase().replace(/\s+/g, '');

                const isUserLocked = lockedAccounts.includes(usernameKey) || 
                                     lockedAccounts.includes(fullNameKey) || 
                                     lockedAccounts.includes(lowerFullNameKey) || 
                                     lockedAccounts.includes(oldNormalizeKey);

                const isEditing = editingUserId === user.id;

                const failureCount = failedAttempts[usernameKey] || 
                                     failedAttempts[fullNameKey] || 
                                     failedAttempts[lowerFullNameKey] || 
                                     failedAttempts[oldNormalizeKey] || 0;
                
                return (
                  <div 
                    key={user.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isUserLocked 
                        ? 'bg-rose-950/20 border-rose-500/20 shadow-lg shadow-rose-950/10' 
                        : (!user.name || user.name.trim() === '')
                        ? 'bg-rose-500/5 border-rose-500/30 hover:border-rose-500/50'
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
                            <select
                              value={editLob}
                              onChange={(e) => setEditLob(e.target.value)}
                              disabled={editRole === "tl"}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-100 disabled:opacity-50"
                            >
                              <option value="">-- None --</option>
                              <option value="chat">Chat</option>
                              <option value="call_center">Call Center</option>
                            </select>
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
                                <span className="font-bold text-slate-100 text-sm whitespace-nowrap">
                                  {!user.name || user.name.trim() === '' ? (
                                    <span className="text-rose-400 flex items-center gap-1">
                                      <AlertCircle className="w-3.5 h-3.5" />
                                      {user.id}
                                    </span>
                                  ) : (
                                    user.name
                                  )}
                                </span>
                                <span className="text-[10px] bg-cyan-950/40 text-cyan-400 px-2.5 py-0.5 rounded-lg border border-cyan-500/20 font-mono font-bold" title="App Username for Login">
                                  {getUsernameFromFullName(user.name)}
                                </span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full border font-black uppercase tracking-wider ${
                                  user.role === 'tl' 
                                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' 
                                    : 'bg-white/5 border-white/5 text-slate-400'
                                }`}>
                                  {user.role}
                                </span>
                                {isUserLocked && (
                                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-extrabold flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> LOCKED
                                  </span>
                                )}
                              </div>
                              {user.teamLeader && user.role === 'agent' && (
                                <p className="text-[10px] text-slate-500 font-medium">TL: {user.teamLeader}</p>
                              )}
                              <p className="text-[10px] text-slate-400 mt-0.5 space-x-2">
                                <span>{user.email || 'No Email'}</span>
                                {user.phone && <span className="text-emerald-400 font-mono">• {user.phone}</span>}
                                {user.lob && <span>• <span className="text-indigo-300 font-semibold">{user.lob === 'chat' ? 'Chat' : user.lob === 'call_center' ? 'Call Center' : user.lob}</span></span>}
                                {user.teamLeader && <span>• TL: <span className="text-cyan-400">{user.teamLeader}</span></span>}
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
                            {isGlobalAdminUser ? (
                              <button
                                onClick={() => handleSetPassword(user)}
                                className="flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/15 border border-rose-500/20 hover:border-rose-500/30 transition-all rounded-xl p-1 px-2.5 text-[10.5px] font-bold text-rose-300 cursor-pointer"
                              >
                                <Key className="w-3 h-3 text-rose-400" /> Reset Password
                              </button>
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
