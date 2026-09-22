import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  ShieldAlert,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import type { AdminUser } from '../warm-theme/tokens';
import { supabase } from '../../../lib/supabaseClient';

interface ManagedUserRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  password_change_required: boolean;
  created_at: string;
  last_sign_in_at?: string | null;
}

interface UsersViewProps {
  currentUser: AdminUser;
}

export const UsersView: React.FC<UsersViewProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<ManagedUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create User Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'agent' | 'admin' | 'super_admin'>('agent');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Delete User Confirmation State
  const [userToDelete, setUserToDelete] = useState<ManagedUserRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isCurrentAgent = currentUser.role?.toLowerCase() === 'agent';

  // Helper to invoke admin-api
  const callAdminApi = useCallback(async (action: string, payload: Record<string, any> = {}) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error('Authentication session not found.');

    const res = await supabase.functions.invoke('admin-api', {
      body: { action, ...payload },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.error) throw new Error(res.error.message || 'Operation failed');
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  }, []);

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await callAdminApi('list_users');
      if (data?.users) {
        setUsers(data.users);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load team users.');
    } finally {
      setIsLoading(false);
    }
  }, [callAdminApi]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Role Change
  const handleRoleChange = async (userId: string, targetRole: string) => {
    try {
      setErrorMessage(null);
      await callAdminApi('update_role', { user_id: userId, role: targetRole });
      setSuccessMessage(`User role updated to ${targetRole.toUpperCase()}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: targetRole } : u))
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update user role.');
    }
  };

  // Handle Active Status Toggle
  const handleToggleStatus = async (user: ManagedUserRecord) => {
    try {
      setErrorMessage(null);
      const nextActive = !user.is_active;
      await callAdminApi('toggle_status', { user_id: user.id, is_active: nextActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextActive } : u))
      );
      setSuccessMessage(`User ${nextActive ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update status.');
    }
  };

  // Handle Create User Submit
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setIsSubmittingCreate(true);
    setErrorMessage(null);

    try {
      await callAdminApi('create_user', {
        email: newEmail.trim(),
        full_name: newName.trim(),
        password: newPassword,
        role: newRole,
      });

      setSuccessMessage(`User ${newName} created successfully.`);
      setIsCreateModalOpen(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole('agent');
      fetchUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create user.');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Handle Delete User Confirmation
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await callAdminApi('delete_user', { user_id: userToDelete.id });
      setSuccessMessage(`User ${userToDelete.full_name} has been deleted.`);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isCurrentAgent) {
    return (
      <div className="p-8 max-w-md mx-auto my-12 text-center bg-[#FBF9F4] border border-[#D9D4CA] rounded-xl text-xs text-[#716D65]">
        <ShieldAlert className="w-8 h-8 mx-auto text-[#B56A45] mb-2" />
        <h2 className="text-sm font-semibold text-[#242321]">Access Restricted</h2>
        <p className="mt-1">
          Team user management and role assignment require Administrator privileges.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 space-y-6 antialiased text-[#242321] select-none max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9D4CA] pb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-[#242321]">
            Users & Roles
          </h1>
          <p className="text-xs text-[#716D65] mt-1">
            Manage authenticated team members, security access levels, and account statuses
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#242321] text-[#F5F1E8] text-xs font-medium hover:bg-[#383633] transition-colors self-start sm:self-auto shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>New Team Member</span>
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3 bg-[#F9ECEC] border border-[#A83B3B]/30 rounded-lg text-xs text-[#A83B3B] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 bg-[#EEF5F0] border border-[#4F8A5B]/30 rounded-lg text-xs text-[#4F8A5B] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#FBF9F4] border border-[#D9D4CA] rounded-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-[#716D65] flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading team members...</span>
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D9D4CA] bg-[#F5F1E8]/70 text-[11px] font-mono text-[#716D65] uppercase">
                  <th className="py-3 px-4 font-medium">User</th>
                  <th className="py-3 px-4 font-medium">Role Clearance</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium hidden sm:table-cell">Created</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D4CA]/60">
                {users.map((user) => {
                  const isSelf = user.id === currentUser.id;
                  const normalizedRole = user.role?.toLowerCase() || 'agent';

                  return (
                    <tr key={user.id} className="hover:bg-[#F5F1E8]/50 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#242321]">{user.full_name}</div>
                        <div className="text-[11px] text-[#716D65] font-mono mt-0.5">
                          {user.email}
                          {isSelf && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded bg-[#EEEAE1] text-[#242321] text-[10px]">
                              You
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Role Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={normalizedRole}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={isSelf}
                          className="px-2.5 py-1 rounded bg-[#F5F1E8] border border-[#D9D4CA] text-xs font-mono text-[#242321] focus:outline-none focus:border-[#242321] disabled:opacity-50"
                        >
                          <option value="agent">AGENT</option>
                          <option value="admin">ADMIN</option>
                          <option value="super_admin">SUPER_ADMIN</option>
                          <option value="owner">OWNER</option>
                        </select>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={isSelf}
                          className={`flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border transition-colors ${
                            user.is_active
                              ? 'bg-[#EEF5F0] border-[#4F8A5B]/30 text-[#4F8A5B]'
                              : 'bg-[#F9ECEC] border-[#A83B3B]/30 text-[#A83B3B]'
                          } disabled:opacity-50`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.is_active ? 'bg-[#4F8A5B]' : 'bg-[#A83B3B]'
                            }`}
                          />
                          <span>{user.is_active ? 'Active' : 'Disabled'}</span>
                        </button>
                      </td>

                      {/* Created */}
                      <td className="py-3 px-4 text-[#716D65] font-mono text-[11px] hidden sm:table-cell">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setUserToDelete(user)}
                          disabled={isSelf}
                          className="p-1.5 text-[#716D65] hover:text-[#A83B3B] hover:bg-[#F9ECEC] rounded transition-colors disabled:opacity-20"
                          title={isSelf ? 'Cannot delete own account' : 'Delete user'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-[#716D65]">
            No team members found.
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#242321]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#FBF9F4] border border-[#D9D4CA] rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9D4CA] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#242321]" />
                <h3 className="text-sm font-semibold text-[#242321]">
                  Add Team Member
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#716D65] hover:text-[#242321] text-xs font-mono"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#716D65] mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Maya Lin"
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA] text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#716D65] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@nexusworld.in"
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA] text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#716D65] mb-1">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA] text-[#242321] focus:outline-none focus:border-[#242321]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-[#716D65] mb-1">
                  Role Clearance
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#F5F1E8] border border-[#D9D4CA] text-[#242321] font-mono focus:outline-none focus:border-[#242321]"
                >
                  <option value="agent">AGENT (Chat & Live Telemetry)</option>
                  <option value="admin">ADMIN (Operational Console)</option>
                  <option value="super_admin">SUPER_ADMIN (Full Clearance)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9D4CA]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#D9D4CA] hover:bg-[#EEEAE1] text-[#716D65] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCreate}
                  className="px-4 py-1.5 rounded-lg bg-[#242321] text-[#F5F1E8] text-xs font-medium hover:bg-[#383633] transition-colors disabled:opacity-50"
                >
                  {isSubmittingCreate ? 'Creating...' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#242321]/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#FBF9F4] border border-[#D9D4CA] rounded-xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2.5 text-[#A83B3B]">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-[#242321]">Confirm Deletion</h3>
            </div>

            <p className="text-[#716D65] leading-relaxed">
              Are you sure you want to delete user{' '}
              <strong className="text-[#242321]">{userToDelete.full_name}</strong> (
              {userToDelete.email})? This action removes authentication credentials and profile authority.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D9D4CA]">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3 py-1.5 rounded-lg border border-[#D9D4CA] hover:bg-[#EEEAE1] text-[#716D65] font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3.5 py-1.5 rounded-lg bg-[#A83B3B] text-white font-medium hover:bg-[#912F2F] transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
