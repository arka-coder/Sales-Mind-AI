'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '@/lib/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)]">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--accent)] opacity-[0.05] blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--accent-blue)] opacity-[0.05] blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl overflow-hidden bg-[#0a0a0a] border border-white/10 flex-shrink-0">
            <Image src="/logo of salesmind.png" alt="SalesMind AI" width={36} height={36} className="object-contain" />
          </div>
          <span className="text-white font-bold text-[15px]">SalesMind AI</span>
        </div>

        {!sent ? (
          <>
            <h1 className="text-[28px] font-bold text-white tracking-tight mb-2">Reset password</h1>
            <p className="text-[var(--text-secondary)] text-[14px] mb-8 leading-6">
              Enter your email and we&apos;ll send you a secure link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Email address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    className="input-shell w-full h-11 pl-10 pr-4 text-[14px] placeholder:text-[var(--text-faint)]"
                    autoFocus
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.99 }}
                className="btn w-full h-12 text-[14px] font-bold"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), #28c070)',
                  color: '#08090b',
                  boxShadow: '0 0 30px rgba(50,213,131,0.2)',
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Sending link…
                  </span>
                ) : (
                  'Send Reset Link'
                )}
              </motion.button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(50,213,131,0.12)', border: '1px solid rgba(50,213,131,0.3)' }}
            >
              <CheckCircle2 size={32} className="text-[var(--accent)]" />
            </div>
            <h2 className="text-[24px] font-bold text-white mb-3">Check your inbox</h2>
            <p className="text-[var(--text-secondary)] text-[14px] leading-6 mb-8">
              We sent a password reset link to <strong className="text-white">{email}</strong>.
              Check your spam folder if you don&apos;t see it.
            </p>
          </motion.div>
        )}

        <Link
          href="/login"
          className="flex items-center gap-2 text-[13px] text-[var(--text-muted)] hover:text-white transition-colors mt-8"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </motion.div>
    </div>
  );
}
