import React, { useState } from 'react';
import { Logo } from '../Logo';
import { X, Mail, Lock, CheckCircle2, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (email: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please fill out all required fields.');
      return;
    }

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!acceptTerms) {
        setError('You must accept the terms of service.');
        return;
      }
    }

    onSuccess(email);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0A1A]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#141428] border border-[#2A2A4A] rounded-2xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0055FF]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-[#A0A0B8] hover:text-white hover:bg-[#0A0A1A] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-6">
          <Logo size={48} className="mb-3" />
          <h2 className="text-xl font-bold text-white mb-1">
            {mode === 'login' ? 'Welcome Back to Policy-0' : 'Create Your Policy-0 Account'}
          </h2>
          <p className="text-xs text-[#A0A0B8]">
            {mode === 'login'
              ? 'Enter your credentials to access your robot policies and sim clusters.'
              : 'Join 500+ robotics engineers building embodied AI policies.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-[#FF3355]/10 border border-[#FF3355]/30 text-xs text-[#FF3355]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#A0A0B8] uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#A0A0B8] absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="engineer@robotics-lab.com"
                required
                className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0055FF]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#A0A0B8] uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#A0A0B8] absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0055FF]"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#A0A0B8] uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A0A0B8] absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full bg-[#0A0A1A] border border-[#2A2A4A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0055FF]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="terms-check"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="w-4 h-4 accent-[#0055FF] rounded cursor-pointer"
                />
                <label htmlFor="terms-check" className="text-xs text-[#A0A0B8] cursor-pointer">
                  I accept Policy-0 Terms of Service and Privacy Policy
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0055FF] hover:bg-[#0044DD] text-white font-bold text-xs shadow-lg shadow-[#0055FF]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{mode === 'login' ? 'Log In to Studio' : 'Create Free Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#A0A0B8] border-t border-[#2A2A4A] pt-4">
          {mode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setMode('signup')} className="text-[#0055FF] font-semibold hover:underline cursor-pointer">
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setMode('login')} className="text-[#0055FF] font-semibold hover:underline cursor-pointer">
                Log In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
