import React, { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { User, Role } from "../types";
import { User as UserIcon, Shield, Search, Info, Plus } from "lucide-react";
import { toast } from "sonner";

interface UserManagementProps {
  currentUser: User | null;
}

export const UserManagement: React.FC<UserManagementProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  
  // New user form state
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<Role>("agent");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "director") return;

    const unsub = onSnapshot(
      collection(db, "users"),
      (snapshot) => {
        const u = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as User[];
        setUsers(u.sort((a, b) => a.name.localeCompare(b.name)));
      },
      (error) => {
        console.error("Error fetching users:", error);
      }
    );
    return () => unsub();
  }, [currentUser]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast.success(`Role updated successfully`);
    } catch (e) {
      console.error("Error updating role:", e);
      toast.error("Failed to update role");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
      toast.error("Please fill out name and email");
      return;
    }

    try {
      // In a real implementation this would ideally go through Firebase Auth first
      // But adding user to the 'users' collection is what was requested:
      const id = crypto.randomUUID(); 
      await setDoc(doc(db, "users", id), {
        id,
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        // Using dummy password/auth flow since auth creation wasn't fully requested via admin api, 
        // just "creates a new document in the users collection".
        createdAt: new Date().toISOString()
      });
      toast.success("User created successfully");
      setNewUserName("");
      setNewUserEmail("");
      setNewUserRole("agent");
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("Failed to create user");
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();
    return (
      (u.name || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s)
    );
  });

  if (!currentUser || currentUser.role !== "director") {
    return <div className="p-8 text-center text-slate-300">Access Denied</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in text-left">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-100 font-display flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-400" />
            User Management
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Manage roles and access for all users in the system.
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-6">
        <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-indigo-400" />
          Add New User
        </h3>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Name</label>
            <input 
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
              placeholder="Full Name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email/Username</label>
            <input 
              type="text"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
              placeholder="Email address"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role</label>
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as Role)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500"
            >
              <option value="agent">Agent</option>
              <option value="sme">Subject Matter Expert (sme)</option>
              <option value="qa">QA Analyst</option>
              <option value="tl">Team Leader (tl)</option>
              <option value="director">Director</option>
            </select>
          </div>
          <button 
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Create User
          </button>
        </form>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/5 bg-[#1e1e1e]/40 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 max-w-sm w-full">
             <Search className="w-4 h-4 text-slate-400" />
             <input 
               type="text"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               placeholder="Search users..."
               className="w-full bg-transparent border-none outline-none text-slate-200 placeholder:text-slate-500"
             />
          </div>
          <div className="text-slate-400 font-mono text-xs">
            {filteredUsers.length} Users
          </div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
              <Info className="w-6 h-6" />
              <p>No users found matching "{search}"</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-white/5">
                    <UserIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200">
                      {u.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {u.email}
                    </p>
                  </div>
                </div>

                <div className="w-full md:w-auto">
                  <select
                    value={u.role || "agent"}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                    className="w-full md:w-48 bg-slate-950 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-200 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="agent">Agent</option>
                    <option value="sme">Subject Matter Expert (sme)</option>
                    <option value="qa">QA Analyst</option>
                    <option value="tl">Team Leader (tl)</option>
                    <option value="director">Director</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
