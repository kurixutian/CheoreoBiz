import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onGoogleLogin?: () => Promise<{ success: boolean; error?: string }>;
  onPasswordReset?: (email: string) => Promise<{ success: boolean; error?: string }>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLogin,
  onGoogleLogin,
  onPasswordReset,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    try {
      const res = await onLogin(email.trim(), password);
      if (!res.success) {
        setErrorMessage(res.error || 'Authentication failed. Verify your email and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = async () => {
    if (!onGoogleLogin) return;
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    try {
      const res = await onGoogleLogin();
      if (!res.success) {
        setErrorMessage(res.error || 'Google sign-in could not be completed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetClick = async () => {
    if (!onPasswordReset) return;
    const targetEmail = email.trim();
    if (!targetEmail) {
      setErrorMessage('Please enter your email address above to receive a password reset link.');
      return;
    }
    setErrorMessage(null);
    setInfoMessage(null);
    setIsResetting(true);
    try {
      const res = await onPasswordReset(targetEmail);
      if (res.success) {
        setInfoMessage(`Password reset email sent to ${targetEmail}. Check your inbox to set or reset your password.`);
      } else {
        setErrorMessage(res.error || 'Failed to send password reset email.');
      }
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div
      id="auth-screen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#F7F7F5] dark:bg-darkbg p-4 overflow-y-auto"
    >
      <div className="bg-white dark:bg-darkcard p-8 sm:p-10 rounded-2xl border border-[#E2E4E9] dark:border-darkborder shadow-sleek max-w-md w-full animate-slide-up space-y-6 relative overflow-hidden my-auto">
        <div className="text-center space-y-2.5">
          <img
            src="./icon-192.png"
            alt="CheoreoBiz"
            className="w-14 h-14 rounded-2xl object-cover mx-auto ring-1 ring-slate-200 dark:ring-white/10 shadow-sm"
          />
          <h1 className="text-2xl font-bold tracking-[-0.025em] text-slate-900 dark:text-white">
            CheoreoBiz
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Retail POS, Stock Ledger &amp; Accounts Payable
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 relative">
            <label
              htmlFor="auth-email"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 group-focus-within:text-brand-600 transition-colors" />
              <input
                type="email"
                id="auth-email"
                name="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                className="w-full bg-white dark:bg-darkinput border border-slate-300 dark:border-darkborder rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 outline-none transition-colors placeholder:text-slate-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              {onPasswordReset && (
                <button
                  type="button"
                  id="reset-password-btn"
                  onClick={handleResetClick}
                  disabled={isResetting || isLoading}
                  className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium disabled:opacity-50"
                >
                  {isResetting ? 'Sending...' : 'Reset password'}
                </button>
              )}
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500 group-focus-within:text-brand-600 transition-colors" />
              <input
                type="password"
                id="auth-password"
                name="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-white dark:bg-darkinput border border-slate-300 dark:border-darkborder rounded-lg py-2.5 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-brand-500/30 focus:border-brand-600 outline-none transition-colors placeholder:text-slate-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || isResetting}
            className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-900 text-sm font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2 disabled:opacity-60"
          >
            <span>{isLoading ? 'Signing in...' : 'Sign in with Email'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {onGoogleLogin && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 dark:border-darkborder w-full" />
              <span className="bg-white dark:bg-darkcard px-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                or
              </span>
              <div className="border-t border-slate-200 dark:border-darkborder w-full" />
            </div>

            <button
              type="button"
              id="google-login-btn"
              disabled={isLoading || isResetting}
              onClick={handleGoogleClick}
              className="w-full bg-white dark:bg-darksurface hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-darkborder text-sm font-semibold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2.5 disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </>
        )}

        {infoMessage && (
          <div
            id="auth-info"
            role="status"
            className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs font-medium p-3.5 rounded-lg flex items-start gap-2"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div
            id="auth-error"
            role="alert"
            className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-medium p-3.5 rounded-lg flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
