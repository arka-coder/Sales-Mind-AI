'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { signUp, signIn } from '@/lib/auth';
import { api } from '@/lib/api';

type Mode = 'login' | 'signup';

const FEATURES = [
  'AI-powered lead scoring & analysis',
  'Automated follow-up emails via Resend',
  'Real-time sales coaching with Nexus AI',
  'Voice-enabled conversations with prospects',
];

const INSIGHTS = [
  { text: 'Follow-ups sent within 24 hours consistently outperform delayed outreach.', category: 'Follow-up', categoryColor: 'var(--accent)', confidence: 94, readTime: '8 sec' },
  { text: 'Asking one additional discovery question often reveals the real buying motivation.', category: 'Discovery', categoryColor: 'var(--accent-blue)', confidence: 91, readTime: '9 sec' },
  { text: 'High engagement without pricing discussion usually indicates interest, not commitment.', category: 'Pipeline', categoryColor: 'var(--accent-purple)', confidence: 88, readTime: '10 sec' },
  { text: 'Decision-makers who ask implementation questions are often closer to purchasing.', category: 'Negotiation', categoryColor: 'var(--accent-amber)', confidence: 92, readTime: '9 sec' },
  { text: 'Strong qualification saves more time than aggressive selling ever will.', category: 'Lead Qualification', categoryColor: 'var(--accent)', confidence: 96, readTime: '7 sec' },
  { text: 'Personalized outreach consistently outperforms generic follow-up sequences.', category: 'Follow-up', categoryColor: 'var(--accent)', confidence: 89, readTime: '8 sec' },
  { text: 'Objections are buying signals — silence is usually the bigger risk.', category: 'Objection Handling', categoryColor: 'var(--accent-red)', confidence: 93, readTime: '7 sec' },
  { text: 'The most effective conversations focus on solving problems, not presenting features.', category: 'Discovery', categoryColor: 'var(--accent-blue)', confidence: 97, readTime: '10 sec' },
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [insightIdx, setInsightIdx] = useState(0);
  const [insightVisible, setInsightVisible] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [secAgo, setSecAgo] = useState(0);

  // Rotate insights with thinking state
  useEffect(() => {
    const id = setInterval(() => {
      setInsightVisible(false);
      setIsThinking(true);
      setTimeout(() => {
        setInsightIdx((i) => (i + 1) % INSIGHTS.length);
        setSecAgo(0);
        setIsThinking(false);
        setInsightVisible(true);
      }, 320);
    }, 12000);
    return () => clearInterval(id);
  }, []);

  // Seconds-ago counter
  useEffect(() => {
    const id = setInterval(() => setSecAgo((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    const checkSession = async () => {
      const { supabase } = await import('@/lib/auth');
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.replace('/dashboard');
    };
    checkSession();
  }, [router]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (mode === 'signup' && !fullName.trim()) errs.fullName = 'Name is required';
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email address';
    if (!password) errs.password = 'Password is required';
    else if (mode === 'signup' && password.length < 8) errs.password = 'Must be at least 8 characters';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === 'login') {
        const { data, error } = await signIn(email, password);
        if (error) throw error;
        if (data.user) {
          toast.success('Welcome back!');
          router.replace('/dashboard');
        }
      } else {
        const { data, error } = await signUp(email, password, fullName);
        if (error) throw error;
        // Send welcome email via backend (Resend) — fire and forget
        try {
          await api.post('/api/auth/welcome-email', {
            email,
            full_name: fullName,
          });
        } catch {
          // non-critical, don't block signup flow
        }
        // Always go to dashboard after signup —
        // works when email confirmation is disabled (Supabase returns a session immediately)
        toast.success('Account created! Welcome to SalesMind AI 🎉');
        router.replace('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setFieldErrors({});
    setPassword('');
  };

  return (
    <div className="min-h-screen flex overflow-hidden bg-[var(--bg-base)]">
      {/* ── Left Panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-15%] left-[-10%] w-[65%] h-[65%] rounded-full bg-[var(--accent)] opacity-[0.05] blur-[140px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[var(--accent-blue)] opacity-[0.06] blur-[130px]" />
          <div className="absolute top-[40%] right-[20%] w-[35%] h-[35%] rounded-full bg-[var(--accent-purple)] opacity-[0.04] blur-[100px]" />
        </div>
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.035] z-0"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-10 h-10 rounded-xl overflow-hidden bg-[#0a0a0a] border border-white/10 flex-shrink-0"
          >
            <Image src="/logo of salesmind.png" alt="SalesMind AI" width={40} height={40} className="object-contain" />
          </motion.div>
          <div>
            <p className="text-white font-bold text-[15px] tracking-tight">SalesMind AI</p>
            <p className="text-[var(--text-muted)] text-[11px] font-medium">Revenue OS</p>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-10 mb-16">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-[46px] font-bold tracking-tight text-white leading-[1.08]"
            >
              Close more deals<br />
              <span className="bg-gradient-to-r from-[var(--accent)] via-[var(--accent-blue)] to-[var(--accent-purple)] bg-clip-text text-transparent">
                with AI precision.
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.8 }}
              className="mt-4 text-[var(--text-secondary)] text-[17px] leading-7 max-w-md"
            >
              The intelligent copilot that analyzes leads, coaches your team, and sends perfectly-timed follow-ups automatically.
            </motion.p>
          </div>

          <div className="space-y-3">
            {FEATURES.map((feat, i) => (
              <motion.div
                key={feat}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.08, duration: 0.6 }}
                className="flex items-center gap-3"
              >
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(50,213,131,0.15)', border: '1px solid rgba(50,213,131,0.3)' }}
                >
                  <CheckCircle2 size={12} className="text-[var(--accent)]" />
                </div>
                <span className="text-[14px] text-[var(--text-secondary)]">{feat}</span>
              </motion.div>
            ))}
          </div>

          {/* ── Nexus Insight ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="group relative cursor-default overflow-hidden rounded-[22px]"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
                transition: 'border-color 250ms ease, box-shadow 250ms ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.13)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.07)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)';
              }}
            >
              {/* Barely-visible radial glow */}
              <div className="pointer-events-none absolute inset-0 rounded-[22px]"
                style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(155,140,255,0.035), transparent)' }} />

              {/* ── Header ── */}
              <div className="flex items-start justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-3">
                  {/* Nexus orbital icon */}
                  <motion.div
                    whileHover={{ rotate: 3 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px]"
                    style={{
                      background: 'rgba(155,140,255,0.1)',
                      border: '1px solid rgba(155,140,255,0.22)',
                      boxShadow: '0 0 14px rgba(155,140,255,0.12)',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="3.2" fill="var(--accent-purple)" />
                      <circle cx="9" cy="9" r="7" stroke="var(--accent-purple)" strokeOpacity="0.3" strokeWidth="1.2" strokeDasharray="2.2 1.8" />
                    </svg>
                    {/* Pulse ring */}
                    <span className="absolute inset-0 animate-ping rounded-[9px]"
                      style={{ background: 'rgba(155,140,255,0.07)', animationDuration: '3s' }} />
                  </motion.div>

                  <div>
                    <p className="text-[12.5px] font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>
                      Nexus Insight
                    </p>
                    <p className="mt-[3px] text-[10.5px] leading-none" style={{ color: 'var(--text-faint)' }}>
                      AI-generated sales intelligence
                    </p>
                  </div>
                </div>

                {/* Right — reading time */}
                <span className="mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-faint)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {INSIGHTS[insightIdx].readTime} read
                </span>
              </div>

              {/* ── Inner content area ── */}
              <div className="mx-4 mb-4 overflow-hidden rounded-[14px]"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.045)' }}>

                {/* Category + confidence row */}
                <div className="flex items-center justify-between px-4 pt-3.5 pb-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: `color-mix(in srgb, ${INSIGHTS[insightIdx].categoryColor} 12%, transparent)`,
                      color: INSIGHTS[insightIdx].categoryColor,
                      border: `1px solid color-mix(in srgb, ${INSIGHTS[insightIdx].categoryColor} 25%, transparent)`,
                      transition: 'all 300ms ease',
                    }}>
                    {INSIGHTS[insightIdx].category}
                  </span>
                  {/* AI Confidence pill */}
                  <span className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                    {INSIGHTS[insightIdx].confidence}% confidence
                  </span>
                </div>

                {/* Insight text block */}
                <div className="relative px-4 py-4">
                  {/* Left accent bar */}
                  <span className="absolute left-4 top-4 bottom-4 w-[2px] rounded-full"
                    style={{ background: `linear-gradient(180deg, ${INSIGHTS[insightIdx].categoryColor}, transparent)`, opacity: 0.5 }} />

                  {/* Thinking state */}
                  <div
                    className="min-h-[62px] pl-4"
                    style={{
                      opacity: insightVisible && !isThinking ? 1 : 0,
                      transition: 'opacity 360ms cubic-bezier(0.4,0,0.2,1)',
                    }}
                  >
                    {isThinking ? (
                      <p className="text-[12px] italic" style={{ color: 'var(--text-faint)' }}>Nexus analyzing...</p>
                    ) : (
                      <p className="text-[14.5px] font-[450] leading-[1.68] tracking-[-0.012em]" style={{ color: 'var(--text-primary)' }}>
                        {INSIGHTS[insightIdx].text}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Footer chips ── */}
              <div className="flex items-center justify-between px-4 pb-4">
                <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-faint)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zm0 2a1 1 0 100 2 1 1 0 000-2zm-1 3h2v3H7V8.5z" fill="var(--accent-purple)" />
                  </svg>
                  Sales Intelligence
                </span>
                <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-faint)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="h-1 w-1 rounded-full bg-[var(--accent)] opacity-70" />
                  Updated {secAgo < 5 ? 'just now' : `${secAgo} sec ago`}
                </span>
              </div>
            </motion.div>
          </motion.div>

        </div>

        {/* Bottom text */}
        <p className="relative z-10 text-[12px] text-[var(--text-faint)]">
          © {new Date().getFullYear()} SalesMind AI. All rights reserved.
        </p>
      </div>

      {/* ── Right Panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative">
        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-6 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-[#0a0a0a] border border-white/10 flex-shrink-0">
            <Image src="/logo of salesmind.png" alt="SalesMind AI" width={32} height={32} className="object-contain" />
          </div>
          <span className="text-white font-bold text-[14px]">SalesMind AI</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[400px]"
        >
          {/* Tab toggle */}
          <div className="flex p-1 mb-8 rounded-xl bg-white/[0.04] border border-white/8">
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className={`flex-1 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 ${
                  mode === m
                    ? 'bg-white/[0.09] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {/* Header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="mb-8"
            >
              <h2 className="text-[28px] font-bold tracking-tight text-white">
                {mode === 'login' ? 'Welcome back' : 'Get started free'}
              </h2>
              <p className="mt-1.5 text-[var(--text-secondary)] text-[14px]">
                {mode === 'login'
                  ? 'Sign in to your SalesMind AI workspace.'
                  : 'Create your account and start closing more deals.'}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="fullname"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Smith"
                        className={`input-shell w-full h-11 pl-10 pr-4 text-[14px] placeholder:text-[var(--text-faint)] ${fieldErrors.fullName ? 'border-[var(--danger)]' : ''}`}
                        autoComplete="name"
                      />
                    </div>
                    {fieldErrors.fullName && (
                      <p className="text-[12px] text-[var(--danger)]">{fieldErrors.fullName}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className={`input-shell w-full h-11 pl-10 pr-4 text-[14px] placeholder:text-[var(--text-faint)] ${fieldErrors.email ? 'border-[var(--danger)]' : ''}`}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[12px] text-[var(--danger)]">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">
                  Password
                </label>
                {mode === 'login' && (
                  <Link href="/forgot-password" className="text-[12px] text-[var(--accent)] hover:opacity-80 transition-opacity">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Minimum 8 characters' : '••••••••'}
                  className={`input-shell w-full h-11 pl-10 pr-11 text-[14px] placeholder:text-[var(--text-faint)] ${fieldErrors.password ? 'border-[var(--danger)]' : ''}`}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[12px] text-[var(--danger)]">{fieldErrors.password}</p>
              )}
            </div>

            {/* Password strength indicator */}
            {mode === 'signup' && password.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-1.5"
              >
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((level) => {
                    const strength = password.length >= 12 ? 4 : password.length >= 10 ? 3 : password.length >= 8 ? 2 : 1;
                    return (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-colors duration-300"
                        style={{
                          background: level <= strength
                            ? strength >= 3 ? 'var(--accent)' : strength >= 2 ? 'var(--accent-amber)' : 'var(--danger)'
                            : 'rgba(255,255,255,0.08)',
                        }}
                      />
                    );
                  })}
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {password.length >= 12 ? '💪 Strong' : password.length >= 10 ? '👍 Good' : password.length >= 8 ? '⚠️ Fair' : '❌ Too short'}
                </p>
              </motion.div>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.01 }}
              whileTap={{ scale: loading ? 1 : 0.99 }}
              className="btn btn-primary w-full h-12 text-[14px] font-bold mt-2 relative overflow-hidden"
              style={{
                background: loading ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--accent), #28c070)',
                color: loading ? 'var(--text-muted)' : '#08090b',
                boxShadow: loading ? 'none' : '0 0 30px rgba(50,213,131,0.25)',
              }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={16} />
                </span>
              )}
            </motion.button>

            {/* Terms */}
            {mode === 'signup' && (
              <p className="text-[11px] text-[var(--text-faint)] text-center leading-5">
                By creating an account you agree to our{' '}
                <span className="text-[var(--text-muted)] hover:text-white cursor-pointer transition-colors">Terms of Service</span>{' '}
                and{' '}
                <span className="text-[var(--text-muted)] hover:text-white cursor-pointer transition-colors">Privacy Policy</span>.
              </p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[11px] text-[var(--text-faint)] font-medium uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Switch mode */}
            <p className="text-center text-[13px] text-[var(--text-muted)]">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[var(--accent)] font-semibold hover:opacity-80 transition-opacity"
              >
                {mode === 'login' ? 'Create one free' : 'Sign in'}
              </button>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
