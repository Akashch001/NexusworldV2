import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Shield, Lock, Mail, ArrowLeft, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { NexusAdminPanel } from '../admin/NexusAdminPanel';

const getAuthRedirectUrl = () => {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost'
  ) {
    return `${window.location.origin}/auth/recovery`;
  }
  return 'https://nexusworld.in/auth/recovery';
};

interface NeuralAccessLoginProps {
  onSuccess?: () => void;
  onExit?: () => void;
}

type AuthView = 'login' | 'forgot_password' | 'unverified';

interface AuthorizedProfile {
  id: string;
  email: string;
  display_name: string | null;
  full_name: string;
  role: string;
  is_active: boolean;
  password_change_required: boolean;
}

export const NeuralAccessLogin: React.FC<NeuralAccessLoginProps> = ({ onExit }) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [authorizedProfile, setAuthorizedProfile] = useState<AuthorizedProfile | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const liquidBlobsRef = useRef<HTMLDivElement>(null);

  const verifyUserRole = useCallback(async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, full_name, role, is_active, password_change_required')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profile) {
        await supabase.auth.signOut();
        setErrorMessage('Access to the NexusWorld Control Room is restricted.');
        setAuthorizedProfile(null);
        return false;
      }

      // 1. Check if user account is disabled
      if (profile.is_active === false) {
        await supabase.auth.signOut();
        setErrorMessage('This account has been disabled. Please contact an administrator.');
        setAuthorizedProfile(null);
        return false;
      }

      // 2. Check administrative role clearance
      const normalizedRole = (profile.role || '').toLowerCase();
      if (!['owner', 'super_admin', 'admin', 'agent'].includes(normalizedRole)) {
        await supabase.auth.signOut();
        setErrorMessage('Access to the NexusWorld Control Room is restricted to authorized personnel.');
        setAuthorizedProfile(null);
        return false;
      }

      // 3. Check if first login / forced password change is required
      if (profile.password_change_required) {
        window.location.href = '/admin/change-password';
        return false;
      }

      const verifiedProfile: AuthorizedProfile = {
        id: profile.id,
        email: profile.email || '',
        display_name: profile.display_name,
        full_name: profile.full_name || profile.display_name || 'Administrator',
        role: profile.role,
        is_active: profile.is_active !== false,
        password_change_required: false
      };

      setAuthorizedProfile(verifiedProfile);
      setErrorMessage(null);

      if (window.location.pathname === '/admin/login') {
        window.location.href = '/admin';
      }

      return true;
    } catch {
      await supabase.auth.signOut();
      setErrorMessage('Access verification failed. Please try again.');
      setAuthorizedProfile(null);
      return false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted) {
          await verifyUserRole(session.user.id);
        }
      } catch {
        // Fallback gracefully
      } finally {
        if (isMounted) setCheckingSession(false);
      }
    }
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        await verifyUserRole(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setAuthorizedProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [verifyUserRole]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      mousePos.current.x = (e.clientX / innerWidth - 0.5) * 2;
      mousePos.current.y = (e.clientY / innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const animate = () => {
      currentPos.current.x += (mousePos.current.x - currentPos.current.x) * 0.05;
      currentPos.current.y += (mousePos.current.y - currentPos.current.y) * 0.05;

      if (liquidBlobsRef.current) {
        const xOffset = currentPos.current.x * 25;
        const yOffset = currentPos.current.y * 25;
        liquidBlobsRef.current.style.transform = `translate3d(${xOffset}px, ${yOffset}px, 0)`;
      }
      rafId.current = requestAnimationFrame(animate);
    };

    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Please provide both email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        const errLower = error.message.toLowerCase();
        if (errLower.includes('email not confirmed') || errLower.includes('unverified') || errLower.includes('not verified')) {
          setView('unverified');
          setErrorMessage('Email verification required. Please verify your email to access the Control Room.');
          return;
        }

        setErrorMessage('Invalid email or password.');
        return;
      }

      if (data.user) {
        const isAuthorized = await verifyUserRole(data.user.id);
        if (isAuthorized) {
          setSuccessMessage('Access granted. Entering NexusWorld Control Room...');
        }
      }
    } catch {
      setErrorMessage('A network error occurred during authentication. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address to receive reset instructions.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: getAuthRedirectUrl(),
      });

      if (error) {
        setErrorMessage('Unable to process recovery request. Please verify the email address.');
        return;
      }

      setSuccessMessage('Password recovery link dispatched. Please check your inbox.');
    } catch {
      setErrorMessage('A network issue prevented password reset. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please provide an email address.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: cleanEmail,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setSuccessMessage('Verification email has been re-sent. Please check your inbox.');
    } catch {
      setErrorMessage('Network error resending verification. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#050507] text-[#F4F4F6] flex flex-col items-center justify-center space-y-3 font-sans">
        <Loader2 className="w-8 h-8 text-[#2563EB] animate-spin" />
        <span className="text-xs font-mono text-zinc-500 tracking-wider">VERIFYING NEURAL CREDENTIALS...</span>
      </div>
    );
  }

  if (authorizedProfile) {
    return <NexusAdminPanel user={authorizedProfile} onExit={onExit} />;
  }

  return (
    <div
      ref={containerRef}
      className="relative min-h-[100dvh] w-full bg-[#050507] text-[#F4F4F6] overflow-hidden flex items-center justify-center p-4 sm:p-6 select-none font-sans"
    >
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="mercury-gooey">
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11"
              result="gooey"
            />
            <feComposite in="SourceGraphic" in2="gooey" operator="atop" />
          </filter>
        </defs>
      </svg>

      <div
        ref={liquidBlobsRef}
        className="absolute inset-0 pointer-events-none overflow-hidden will-change-transform"
        style={{ filter: 'url(#mercury-gooey)' }}
        aria-hidden="true"
      >
        <div className="absolute top-[28%] left-[46%] -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[460px] sm:h-[460px] rounded-full bg-gradient-to-tr from-[#090b10] via-[#2d3748] to-[#94a3b8] opacity-75 blur-md animate-pulse-slow" />
        <div className="absolute top-[48%] left-[62%] -translate-x-1/2 -translate-y-1/2 w-[240px] h-[240px] sm:w-[320px] sm:h-[320px] rounded-full bg-gradient-to-br from-[#1e293b] via-[#475569] to-[#cbd5e1] opacity-65 blur-lg" />
        <div className="absolute top-[38%] left-[32%] -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] sm:w-[300px] sm:h-[300px] rounded-full bg-gradient-to-bl from-[#0f172a] via-[#334155] to-[#64748b] opacity-60 blur-lg" />
        <div className="absolute top-[34%] left-[48%] -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] rounded-full bg-[#2563EB] opacity-25 blur-2xl" />
      </div>

      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" aria-hidden="true" />

      {onExit && (
        <button
          onClick={onExit}
          className="absolute top-6 left-6 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-zinc-400 hover:text-white text-xs font-mono transition-all duration-200"
          aria-label="Return to NexusWorld"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>NEXUSWORLD</span>
        </button>
      )}

      <div className="relative z-10 w-full max-w-md bg-[#0A0A0E]/85 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 sm:p-9 shadow-2xl shadow-black/80">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative w-10 h-10 rounded-xl bg-[#101015] border border-white/[0.12] flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
            <span className="font-display font-bold text-white text-base tracking-wider">N</span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#2563EB] shadow-[0_0_8px_#2563EB]" />
          </div>

          <span className="font-display font-bold text-sm tracking-widest text-white uppercase">
            NEXUSWORLD
          </span>
          <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mt-1">
            PRIVATE CONTROL ROOM
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

            {successMessage && (
              <div
                role="status"
                aria-live="polite"
                className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-400 leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {view === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="admin-email"
                    className="block text-[11px] font-mono text-zinc-400 tracking-wider uppercase mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="admin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      disabled={isLoading}
                      placeholder="founder@nexusworld.in"
                      className="w-full bg-[#050507] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all font-mono"
                    />
                    <Mail className="absolute right-3 top-2.5 w-4 h-4 text-zinc-600 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="admin-password"
                      className="block text-[11px] font-mono text-zinc-400 tracking-wider uppercase"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot_password');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[10px] font-mono text-zinc-500 hover:text-[#3B82F6] transition-colors focus:outline-none"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      disabled={isLoading}
                      placeholder="••••••••••••"
                      className="w-full bg-[#050507] border border-white/10 rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 relative group overflow-hidden py-3 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-mono font-medium tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>AUTHENTICATING...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>ENTER CONTROL ROOM</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {view === 'forgot_password' && (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="text-center pb-1">
                  <span className="text-xs font-mono text-zinc-300">Credentials Recovery</span>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Enter your authorized administrative email to receive recovery instructions.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-[11px] font-mono text-zinc-400 tracking-wider uppercase mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={isLoading}
                    placeholder="founder@nexusworld.in"
                    className="w-full bg-[#050507] border border-white/10 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB] transition-all font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] disabled:opacity-50 text-white text-xs font-mono font-medium tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>TRANSMITTING...</span>
                    </>
                  ) : (
                    <span>SEND RECOVERY LINK</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full text-center text-xs font-mono text-zinc-500 hover:text-white transition-colors pt-2"
                >
                  Return to login
                </button>
              </form>
            )}

            {view === 'unverified' && (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                  <div className="font-mono font-medium">EMAIL CONFIRMATION REQUIRED</div>
                  <p className="text-[11px] text-zinc-400">
                    Your email address must be verified prior to accessing administrative systems.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-white text-xs font-mono tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>DISPATCHING...</span>
                    </>
                  ) : (
                    <span>RESEND VERIFICATION EMAIL</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="w-full text-center text-xs font-mono text-zinc-500 hover:text-white transition-colors"
                >
                  Return to login
                </button>
              </div>
            )}


          </div>

        <div className="mt-8 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-zinc-600">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-[#2563EB]" />
            <span>ENCLAVE: ACTIVE</span>
          </span>
          <span className="tracking-wider">SECURE ACCESS // NEXUSWORLD INTELLIGENCE</span>
        </div>
      </div>
    </div>
  );
};
export default NeuralAccessLogin;
