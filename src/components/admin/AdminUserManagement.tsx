import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, UserPlus, RefreshCw, Shield, KeyRound, 
  Trash2, UserX, UserCheck, AlertCircle, CheckCircle2, 
  X, Loader2, Mail, Lock
} from 'lucide-react';

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  password_change_required: boolean;
  created_at: string;
  last_sign_in_at?: string;
}

interface AdminUserManagementProps {
  currentUserRole: string;
  currentUserId: string;
}

export const AdminUserManagement: React.FC<AdminUserManagementProps> = ({ 
  currentUserRole,
  currentUserId 
}) => {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addRole, setAddRole] = useState<'admin' | 'editor' | 'viewer' | 'owner'>('viewer');

  // Role edit modal
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('viewer');

  // Delete confirm modal
  const [deletingUser, setDeletingUser] = useState<ManagedUser | null>(null);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'list_users' })
      });

      const result = await res.json();
      if (result.success && Array.isArray(result.users)) {
        setUsers(result.users);
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to load users' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error fetching users.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail || !addPassword) return;

    setActionLoading('create');
    setNotification(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'create_user',
          email: addEmail,
          password: addPassword,
          full_name: addFullName,
          role: addRole
        })
      });

      const result = await res.json();
      if (result.success) {
        setNotification({ type: 'success', message: `User ${addEmail} created successfully.` });
        setIsAddModalOpen(false);
        setAddEmail('');
        setAddPassword('');
        setAddFullName('');
        setAddRole('viewer');
        fetchUsers();
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to create user' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Failed to create user due to a network error.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateRole = async () => {
    if (!editingUser) return;
    setActionLoading(`role-${editingUser.id}`);
    setNotification(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'update_role',
          user_id: editingUser.id,
          role: selectedRole
        })
      });

      const result = await res.json();
      if (result.success) {
        setNotification({ type: 'success', message: `Role updated for ${editingUser.email}.` });
        setEditingUser(null);
        fetchUsers();
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to update role' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error updating role.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async (user: ManagedUser) => {
    setActionLoading(`status-${user.id}`);
    setNotification(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'toggle_status',
          user_id: user.id,
          is_active: !user.is_active
        })
      });

      const result = await res.json();
      if (result.success) {
        setNotification({ 
          type: 'success', 
          message: `User ${user.email} is now ${!user.is_active ? 'Active' : 'Disabled'}.` 
        });
        fetchUsers();
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to update user status' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error updating status.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async (user: ManagedUser) => {
    setActionLoading(`reset-${user.id}`);
    setNotification(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const redirectUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? `${window.location.origin}/auth/recovery`
        : 'https://nexusworld.in/auth/recovery';

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'reset_password',
          email: user.email,
          redirect_to: redirectUrl
        })
      });

      const result = await res.json();
      if (result.success) {
        setNotification({ type: 'success', message: `Password reset email dispatched to ${user.email}.` });
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to initiate password reset' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error sending password reset.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setActionLoading(`delete-${deletingUser.id}`);
    setNotification(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          action: 'delete_user',
          user_id: deletingUser.id
        })
      });

      const result = await res.json();
      if (result.success) {
        setNotification({ type: 'success', message: `User ${deletingUser.email} has been deleted.` });
        setDeletingUser(null);
        fetchUsers();
      } else {
        setNotification({ type: 'error', message: result.error || 'Failed to delete user' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Network error deleting user.' });
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/15 border-purple-500/30 text-purple-300';
      case 'admin':
        return 'bg-blue-500/15 border-blue-500/30 text-blue-300';
      case 'editor':
        return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300';
      default:
        return 'bg-zinc-500/15 border-zinc-500/30 text-zinc-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h2 className="text-base font-mono font-bold text-white tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-[#3B82F6]" />
            <span>NEXUSWORLD USERS & ACCESS CONTROL</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Manage administrative personnel, access privileges, security credentials, and platform accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-all border border-white/[0.06]"
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="py-2 px-3.5 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] active:scale-[0.99] text-white text-xs font-mono font-medium tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <UserPlus className="w-4 h-4" />
            <span>ADD USER</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          role="alert"
          className={`p-3.5 rounded-xl border flex items-start gap-2.5 text-xs leading-relaxed animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          )}
          <span className="flex-1">{notification.message}</span>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#0A0A0E] border border-white/[0.08] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02] text-zinc-400 text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin mx-auto mb-2" />
                    <span>SYNCHRONIZING USER ENCLAVE...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No users registered in system.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isCurrent = user.id === currentUserId;
                  const isOwner = user.role === 'owner';
                  const canModify = currentUserRole === 'owner' || (!isOwner && !isCurrent);

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name */}
                      <td className="py-3 px-4 text-white font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-300 text-[11px] font-bold">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{user.full_name}</div>
                            {isCurrent && (
                              <span className="text-[9px] text-[#3B82F6] uppercase font-bold tracking-wider">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3 px-4 text-zinc-300">
                        {user.email}
                      </td>

                      {/* Role */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-red-400 text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <span>Disabled</span>
                          </span>
                        )}
                        {user.password_change_required && (
                          <div className="text-[9px] text-amber-400 mt-0.5 tracking-tight">
                            • Forced Password Reset
                          </div>
                        )}
                      </td>

                      {/* Created */}
                      <td className="py-3 px-4 text-zinc-500 text-[11px]">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          {/* Change Role */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setSelectedRole(user.role);
                            }}
                            disabled={!canModify || actionLoading === `role-${user.id}`}
                            className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all"
                            title="Change User Role"
                          >
                            <Shield className="w-3.5 h-3.5" />
                          </button>

                          {/* Reset Password */}
                          <button
                            type="button"
                            onClick={() => handleResetPassword(user)}
                            disabled={actionLoading === `reset-${user.id}`}
                            className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-amber-400 disabled:opacity-30 disabled:pointer-events-none transition-all"
                            title="Send Password Recovery Email"
                          >
                            {actionLoading === `reset-${user.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <KeyRound className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Disable / Enable User */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(user)}
                              disabled={!canModify || actionLoading === `status-${user.id}`}
                              className={`p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all ${
                                user.is_active ? 'text-zinc-400 hover:text-amber-400' : 'text-amber-400 hover:text-emerald-400'
                              }`}
                              title={user.is_active ? "Disable Account" : "Enable Account"}
                            >
                              {user.is_active ? (
                                <UserX className="w-3.5 h-3.5" />
                              ) : (
                                <UserCheck className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {/* Delete User */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => setDeletingUser(user)}
                              disabled={!canModify || actionLoading === `delete-${user.id}`}
                              className="p-1.5 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none transition-all"
                              title="Delete User"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md bg-[#0D0D12] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#3B82F6]" />
                <span>PROVISION NEW USER</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 font-mono">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="w-full bg-[#050507] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">EMAIL ADDRESS</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="user@nexusworld.in"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full bg-[#050507] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">INITIAL TEMPORARY PASSWORD</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    minLength={8}
                    placeholder="Temporary password (forced reset on first login)"
                    value={addPassword}
                    onChange={(e) => setAddPassword(e.target.value)}
                    className="w-full bg-[#050507] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  User will be forced to change this password on their first login.
                </p>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">ACCESS ROLE</label>
                <select
                  value={addRole}
                  onChange={(e: any) => setAddRole(e.target.value)}
                  className="w-full bg-[#050507] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="editor">Editor (Content manager)</option>
                  <option value="admin">Admin (Administrative clearance)</option>
                  {currentUserRole === 'owner' && (
                    <option value="owner">Owner (Full system control)</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="py-2 px-4 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-bold tracking-wider transition-all flex items-center gap-2"
                >
                  {actionLoading === 'create' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>CREATE USER</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CHANGE ROLE */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#0D0D12] border border-white/[0.12] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#3B82F6]" />
                <span>CHANGE ACCESS ROLE</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 font-mono">
              <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-xs">
                <div className="text-zinc-400 text-[10px]">TARGET USER</div>
                <div className="text-white font-medium mt-0.5">{editingUser.full_name}</div>
                <div className="text-zinc-500 text-[11px]">{editingUser.email}</div>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">SELECT ROLE</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full bg-[#050507] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                  {currentUserRole === 'owner' && (
                    <option value="owner">Owner</option>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="py-2 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  disabled={actionLoading === `role-${editingUser.id}`}
                  className="py-2 px-4 rounded-lg bg-[#2563EB] hover:bg-[#3B82F6] text-white text-xs font-bold tracking-wider transition-all flex items-center gap-2"
                >
                  {actionLoading === `role-${editingUser.id}` ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>SAVE ROLE</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRMATION */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-sm bg-[#0D0D12] border border-red-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-sm font-mono font-bold text-white">CONFIRM DELETION</h3>
                <p className="text-xs text-zinc-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 font-mono">
              Permanently delete user account for: <br />
              <strong className="text-white">{deletingUser.email}</strong>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="py-2 px-3.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs font-mono transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={actionLoading === `delete-${deletingUser.id}`}
                className="py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold tracking-wider transition-all flex items-center gap-2"
              >
                {actionLoading === `delete-${deletingUser.id}` ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>DELETE USER</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminUserManagement;
