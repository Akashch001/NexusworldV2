import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Shield, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';

interface AdminChangePasswordProps {
  onSuccess?: () => void;
}

export const AdminChangePassword: React.FC<AdminChangePasswordProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/admin/login';
        return;
      }
      setCheckingAuth(false);
    };
    checkSession();
  }, []);

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password) {
      setErrorMessage('Password cannot be empty.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Update password in Supabase Auth
      const { error: updateAuthError } = await supabase.auth.updateUser({
        password
      });

      if (updateAuthError) {
        setErrorMessage(updateAuthError.message);
        setIsLoading(false);
        return;
      }

      // 2. Clear password_change_required flag via secure server-side admin-api
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ action: 'complete_password_change' })
        });
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          window.location.href = '/admin';
        }
      }, 1500);
    } catch {
      setErrorMessage('A network error occurred while updating your password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#050507] text-[#F4F4F6] overflow-hidden flex items-center justify-center p-4 sm:p-6 select-none font-sans">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" aria-hidden="true" />
      
      <div className="relative z-10 w-full max-w-md bg-[#0A0A0E]/90 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 sm:p-9 shadow-2xl shadow-black/90">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-12 h-12 rounded-xl bg-[#101015] border border-white/[0.12] flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(37,99,235,0.4)]">
            <Lock className="w-5 h-5 text-[#3B82F6]" />
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
          </div>

          <div className="inline-block px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono uppercase tracking-widest font-semibold mb-2">
            SECURITY UPDATE
          </div>

          <h1 className="font-display font-bold text-lg tracking-wider text-white uppercase">
            Create Permanent Password
          </h1>

          <p className="text-xs text-zinc-400 mt-2 max-w-sm leading-relaxed">
            For your security, you need to create a new password before continuing to the NexusWorld Admin Panel.
          </p>
        </div>

        {/* Notifications */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400 leading-relaxed animate-in fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {success ? (
          <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3 animate-in fade-in">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              PASSWORD UPDATED SUCCESSFULLY
            </div>
            <p className="text-xs text-zinc-400">
              Access credentials verified. Entering NexusWorld Admin Panel...
            </p>
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin mx-auto mt-2" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="new-password"
                className="block text-[11px] font-mono text-zinc-400 tracking-wider uppercase mb-1.5"
              >
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="w-full bg-[#050507] border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <div className="mt-2.5 space-y-1.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-zinc-500">Security Grade:</span>
                  <span className={score >= 4 ? 'text-emerald-400' : score >= 2 ? 'text-amber-400' : 'text-zinc-400'}>
                    ● {score >= 4 ? 'Strong' : score >= 2 ? 'Moderate' : 'Weak'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1 text-[9px] font-mono uppercase tracking-wider">
                  <span className={password.length >= 8 ? 'text-emerald-400' : 'text-zinc-600'}>✓ 8+ chars</span>
                  <span className={/[A-Z]/.test(password) ? 'text-emerald-400' : 'text-zinc-600'}>✓ Uppercase</span>
                  <span className={/[a-z]/.test(password) ? 'text-emerald-400' : 'text-zinc-600'}>✓ Lowercase</span>
                  <span className={/[0-9]/.test(password) ? 'text-emerald-400' : 'text-zinc-600'}>✓ Number</span>
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="block text-[11px] font-mono text-zinc-400 tracking-wider uppercase mb-1.5"
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={isLoading}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="w-full bg-[#050507] border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
              className="w-full mt-3 py-3 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-mono font-medium tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>UPDATING CREDENTIALS...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>UPDATE PASSWORD</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full mt-2 py-2 text-center text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign out and return to login</span>
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-zinc-600">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-[#2563EB]" />
            <span>ENCLAVE: ACTIVE</span>
          </span>
          <span className="tracking-wider">SECURITY CLEARANCE // LEVEL 5</span>
        </div>

      </div>
    </div>
  );
};
export default AdminChangePassword;
