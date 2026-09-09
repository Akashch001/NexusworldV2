import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Shield, Lock, AlertCircle, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';

export const AuthRecovery: React.FC = () => {
  const [view, setView] = useState<'initializing' | 'reset_password' | 'recovery_success'>('initializing');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    // Detect Supabase errors in URL
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const errorDesc = searchParams.get('error_description') || hashParams.get('error_description');

    if (errorDesc) {
      if (isMounted) {
        setErrorMessage(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        setView('reset_password');
        setErrorMessage(null);
      }
    });

    // Check if a session already exists
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && isMounted && view === 'initializing') {
        setView('reset_password');
      }
    });

    // Timeout logic in case PASSWORD_RECOVERY doesn't fire
    const timeoutId = setTimeout(() => {
      if (isMounted && view === 'initializing') {
        if (!errorDesc) {
          setErrorMessage("This password reset link is invalid or has expired. Please request a new reset link.");
        }
      }
    }, 3000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [view]);

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!password || password.length < 8) {
      setErrorMessage('Please choose a stronger password (minimum 8 characters).');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      // Clear password_change_required flag if present
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-api`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ action: 'complete_password_change' })
        }).catch(() => {});
      }

      // Sign out recovery session so user can log in with new password
      await supabase.auth.signOut();
      
      window.history.replaceState(null, '', window.location.pathname);
      setView('recovery_success');
    } catch {
      setErrorMessage('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnToLogin = () => {
    window.location.href = '/admin/login';
  };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;

  return (
    <div
      ref={containerRef}
      className="relative min-h-[100dvh] w-full bg-[#050507] text-[#F4F4F6] overflow-hidden flex items-center justify-center p-4 sm:p-6 select-none font-sans"
    >
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-md bg-[#0A0A0E]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 sm:p-9 shadow-2xl shadow-black/80">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-12 h-12 rounded-xl bg-[#101015] border border-white/[0.12] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <Lock className="w-5 h-5 text-[#3B82F6]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#2563EB] shadow-[0_0_8px_#2563EB]" />
          </div>

          <span className="font-display font-bold text-sm tracking-widest text-white uppercase">
            NEXUSWORLD
          </span>
        </div>

        <div className="space-y-5">
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2.5 text-xs text-red-400 leading-relaxed"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {view === 'initializing' && !errorMessage && (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-6 h-6 text-[#3B82F6] animate-spin" />
              <span className="text-xs font-mono text-zinc-500 tracking-wider">ESTABLISHING RECOVERY SESSION...</span>
            </div>
          )}

          {view === 'initializing' && errorMessage && (
            <button
              type="button"
              onClick={handleReturnToLogin}
              className="w-full mt-4 py-3 px-4 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-mono font-medium tracking-wider transition-all duration-200 border border-white/[0.06]"
            >
              RETURN TO LOGIN
            </button>
          )}

          {view === 'reset_password' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="text-center pb-1">
                <span className="text-xs font-mono text-white uppercase tracking-widest font-bold">
                  Reset Your Password
                </span>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Create a new password for your NexusWorld account.
                </p>
              </div>

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
                    autoComplete="new-password"
                    disabled={isLoading}
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
                
                <div className="mt-2.5 space-y-1.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="text-zinc-500">Password strength</span>
                    <span className={score >= 4 ? 'text-emerald-400' : score >= 2 ? 'text-amber-400' : 'text-zinc-400'}>
                      ● {score >= 4 ? 'Strong' : score >= 2 ? 'Fair' : 'Weak'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[9px] font-mono uppercase tracking-wider">
                    <span className={password.length >= 8 ? 'text-emerald-400' : 'text-zinc-600'}>8+ characters</span>
                    <span className={/[A-Z]/.test(password) ? 'text-emerald-400' : 'text-zinc-600'}>Uppercase</span>
                    <span className={/[a-z]/.test(password) ? 'text-emerald-400' : 'text-zinc-600'}>Lowercase</span>
                    <span className={/[0-9]/.test(password) ? 'text-emerald-400' : 'text-zinc-600'}>Number</span>
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
                    autoComplete="new-password"
                    disabled={isLoading}
                    placeholder="••••••••••••"
                    className="w-full bg-[#050507] border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !password || !confirmPassword || password !== confirmPassword}
                className="w-full mt-2 py-3 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-mono font-medium tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>PROCESSING...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>SET NEW PASSWORD</span>
                  </>
                )}
              </button>
            </form>
          )}

          {view === 'recovery_success' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center pb-1 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-bold block">
                  Password updated successfully.
                </span>
                <p className="text-[11px] text-zinc-400">
                  Your credentials have been securely updated. You may now sign in to your account.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReturnToLogin}
                className="w-full mt-2 py-3 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] active:scale-[0.99] text-white text-xs font-mono font-medium tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
              >
                <span>RETURN TO LOGIN</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-zinc-600">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-[#2563EB]" />
            <span>ENCLAVE: ACTIVE</span>
          </span>
          <span className="tracking-wider">SECURE ACCESS // RECOVERY SEQUENCE</span>
        </div>
      </div>
    </div>
  );
};
export default AuthRecovery;
