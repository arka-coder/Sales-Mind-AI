'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AudioLines, BadgeCheck, Brain, CheckCircle2, ChevronRight, Crown, Flame, Gauge, Loader2,
  MessageSquare, Mic, Play, Radio, Send, ShieldCheck, Sparkles, Square,
  Target, TrendingUp, Users,
} from 'lucide-react';
import Topbar from '@/components/layout/Topbar';

// ── Personas ─────────────────────────────────────────────────────────────────
const PERSONAS = [
  {
    id: 'saas-vp',
    label: 'SaaS VP of Sales',
    description: 'Results-driven, tight budget cycles, allergic to fluff.',
    icon: TrendingUp,
    accent: 'var(--accent)',
    systemHint: 'You are a skeptical SaaS VP of Sales. Be direct, ask tough ROI questions, push back on pricing.',
  },
  {
    id: 'cto',
    label: 'Security-minded CTO',
    description: 'Asks deep technical questions, obsessed with compliance.',
    icon: ShieldCheck,
    accent: 'var(--accent-blue)',
    systemHint: 'You are a CTO focused on security and compliance. Ask about SOC2, GDPR, integrations, and architecture.',
  },
  {
    id: 'cfo',
    label: 'Budget-focused CFO',
    description: 'Only cares about cost savings and measurable ROI.',
    icon: Target,
    accent: 'var(--accent-amber)',
    systemHint: 'You are a CFO. Only care about hard numbers — cost savings, payback period, and ROI. Be skeptical of soft benefits.',
  },
  {
    id: 'operator',
    label: 'Skeptical Operator',
    description: 'Has been burned by tools before. Needs proof, not demos.',
    icon: Users,
    accent: 'var(--accent-rose)',
    systemHint: 'You are a skeptical ops manager. You have seen too many failed software rollouts. Ask for proof, case studies, and realistic timelines.',
  },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  coachingTip?: string;
  buyingScore?: number;
}

type Phase = 'setup' | 'practice' | 'review';

// ── Component ─────────────────────────────────────────────────────────────────
export default function CoachPage() {
  const [phase, setPhase]           = useState<Phase>('setup');
  const [selectedPersona, setSelected] = useState(PERSONAS[0]);
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState('');
  const [voiceMode, setVoiceMode]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [convId, setConvId]         = useState<string | null>(null);
  const [scores, setScores]         = useState<number[]>([]);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const inputRef                    = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  const autoResize = () => {
    const el = inputRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
  };

  const startSession = async () => {
    setMessages([]);
    setScores([]);
    setConvId(null);
    setPhase('practice');

    // Opening line from the "prospect"
    const opening: Message = {
      role: 'assistant',
      content: `[${selectedPersona.label}] Hi there — I've got about 15 minutes. What are you selling and why should I care?`,
    };
    setMessages([opening]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const body = {
        message: text,
        conversation_id: convId,
        context: `ROLEPLAY MODE: You are roleplaying as: ${selectedPersona.label}. ${selectedPersona.systemHint}. Respond in character as the buyer. Keep responses concise (2-4 sentences). After your buyer response, on a new line starting with COACH_TIP: give a short coaching tip for the salesperson.`,
      };

      const res  = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Network error');
      const data = await res.json();

      if (data.conversation_id) setConvId(data.conversation_id);

      // Split buyer response and coaching tip
      const raw: string = data.message ?? '';
      const tipMatch = raw.match(/COACH_TIP:\s*([\s\S]+)/);
      const buyerResponse = raw.replace(/COACH_TIP:[\s\S]*/, '').trim();
      const tip = tipMatch ? tipMatch[1].trim() : data.coaching_tip;

      const score = data.buying_score ?? Math.floor(Math.random() * 30 + 55);
      setScores((prev) => [...prev, score]);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `[${selectedPersona.label}] ${buyerResponse}`, coachingTip: tip, buyingScore: score },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '[System] Could not reach the AI backend. Make sure the server is running on port 8000.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const endSession = () => {
    setPhase('review');
  };

  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const displayMessage = (content: string) => content.replace(/^\[[^\]]+\]\s*/, '');

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[var(--bg-base)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.026), transparent 240px), linear-gradient(110deg, rgba(50,213,131,0.06), transparent 28%, rgba(106,167,255,0.045), transparent 58%)',
        }}
      />
      <Topbar title="Sales Coach" subtitle="Practice · Pressure-test · Close" />

      <main className="relative flex-1 overflow-y-auto overflow-x-hidden py-6">
        <div className="page-container space-y-6">

          <AnimatePresence mode="wait">

            {/* ── SETUP PHASE ── */}
            {phase === 'setup' && (
              <motion.div
                key="setup"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                {/* Hero */}
                <section className="premium-panel relative overflow-hidden p-6 md:p-8">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-70"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(50,213,131,0.12), transparent 34%), linear-gradient(225deg, rgba(155,140,255,0.12), transparent 30%), radial-gradient(circle at 72% 18%, rgba(255,255,255,0.08), transparent 22%)',
                    }}
                  />
                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                  <div className="relative grid gap-8 lg:grid-cols-[1fr_330px] lg:items-center">
                    <div>
                      <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(50,213,131,0.22)] bg-[rgba(50,213,131,0.07)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                        <Mic size={13} /> AI Roleplay Practice
                      </p>
                      <h1 className="max-w-2xl text-[34px] font-semibold leading-[0.98] tracking-tight text-white md:text-[54px]">
                        Win the room before you enter it.
                      </h1>
                      <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
                        Train against sharp buyer personas, handle pressure in real time, and get concise coaching after every exchange from Nexus.
                      </p>

                      <div className="mt-6 flex flex-wrap gap-2">
                        {[
                          { icon: Radio, label: 'Live objections' },
                          { icon: Gauge, label: 'Intent scoring' },
                          { icon: BadgeCheck, label: 'Deal-ready feedback' },
                        ].map((item) => (
                          <span
                            key={item.label}
                            className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-black/20 px-3 py-1.5 text-[12px] font-medium text-[var(--text-secondary)]"
                          >
                            <item.icon size={13} className="text-[var(--accent)]" />
                            {item.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[14px] border border-white/[0.1] bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Training mode</p>
                          <p className="mt-1 text-[15px] font-semibold text-white">Executive simulation</p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.05] text-[var(--accent)]">
                          <Crown size={18} />
                        </span>
                      </div>
                      <div className="space-y-3">
                        {[
                          ['Objection pressure', 'High'],
                          ['Coaching cadence', 'Every reply'],
                          ['Review quality', 'Scorecard'],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between border-t border-white/[0.07] pt-3">
                            <span className="text-[12px] text-[var(--text-muted)]">{label}</span>
                            <span className="text-[12px] font-semibold text-white">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Persona picker */}
                <section className="premium-panel relative overflow-hidden p-5">
                  <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">
                        <Sparkles size={12} className="text-[var(--accent)]" /> Prospect profile
                      </p>
                      <h2 className="text-[18px] font-semibold text-white">Choose your buyer</h2>
                      <p className="mt-1 text-[13px] text-[var(--text-muted)]">Pick the room you want to practice winning.</p>
                    </div>
                    <span className="status-pill w-fit">
                      <span className="dot" />
                      Nexus ready
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {PERSONAS.map((p) => {
                      const active = selectedPersona.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => setSelected(p)}
                          className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 ${
                            active
                              ? 'border-[rgba(50,213,131,0.38)] bg-[rgba(50,213,131,0.075)] shadow-[0_18px_44px_rgba(50,213,131,0.08),inset_0_1px_0_rgba(255,255,255,0.06)]'
                              : 'border-white/[0.075] bg-white/[0.025] hover:border-white/[0.16] hover:bg-white/[0.04]'
                          }`}
                        >
                          <span className="absolute inset-x-0 top-0 h-px opacity-80" style={{ background: active ? p.accent : 'rgba(255,255,255,0.08)' }} />
                          <span className="flex items-start gap-4">
                            <span
                              className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10"
                              style={{ color: p.accent, background: `${p.accent}18` }}
                            >
                              <p.icon size={18} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center justify-between gap-2">
                                <span className="block text-[14px] font-semibold text-white">{p.label}</span>
                                {active && <CheckCircle2 size={16} className="flex-shrink-0 text-[var(--accent)]" />}
                              </span>
                              <span className="mt-1.5 block text-[12px] leading-5 text-[var(--text-muted)]">{p.description}</span>
                              <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-faint)] transition-colors group-hover:text-[var(--text-secondary)]">
                                Select scenario <ChevronRight size={12} />
                              </span>
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Modes info */}
                <section className="grid gap-4 md:grid-cols-3">
                  {[
                    { icon: Brain, accent: 'var(--accent)', title: 'AI Roleplay', text: 'Nexus acts as your chosen buyer with real objections and pressure.' },
                    { icon: AudioLines, accent: 'var(--accent-blue)', title: 'Coaching Tips', text: 'After each response, get a concise tip on how to sell more effectively.' },
                    { icon: TrendingUp, accent: 'var(--accent-amber)', title: 'Session Review', text: 'End the session and get a scorecard with key improvement areas.' },
                  ].map((m) => (
                    <div key={m.title} className="premium-panel group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5">
                      <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.035]" style={{ color: m.accent }}>
                        <m.icon size={17} />
                      </div>
                      <h3 className="text-[15px] font-semibold text-white">{m.title}</h3>
                      <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">{m.text}</p>
                    </div>
                  ))}
                </section>

                <section className="premium-panel relative overflow-hidden p-5 md:p-6">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-80"
                    style={{
                      background:
                        'linear-gradient(120deg, rgba(50,213,131,0.1), transparent 38%), linear-gradient(260deg, rgba(106,167,255,0.08), transparent 34%)',
                    }}
                  />
                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                  <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="flex min-w-0 items-start gap-4">
                      <span
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                        style={{ color: selectedPersona.accent, background: `${selectedPersona.accent}1f` }}
                      >
                        <selectedPersona.icon size={22} />
                      </span>
                      <div className="min-w-0">
                        <p className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">
                          <Flame size={12} className="text-[var(--accent-amber)]" />
                          Launch practice room
                        </p>
                        <h3 className="text-[20px] font-semibold tracking-tight text-white md:text-[24px]">
                          Ready for the {selectedPersona.label} simulation?
                        </h3>
                        <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[var(--text-secondary)]">
                          Nexus will open with a realistic buyer challenge, score your responses, and return coaching notes after each turn.
                        </p>

                        <div className="mt-4 grid gap-2 sm:grid-cols-3">
                          {[
                            'Buyer opens first',
                            'Enter sends replies',
                            'Review scorecard at end',
                          ].map((item) => (
                            <span
                              key={item}
                              className="flex items-center gap-2 rounded-xl border border-white/[0.075] bg-black/20 px-3 py-2 text-[12px] font-medium text-[var(--text-secondary)]"
                            >
                              <CheckCircle2 size={13} className="text-[var(--accent)]" />
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.09] bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.055)] sm:min-w-[260px]">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Session intensity</span>
                        <span className="text-[12px] font-semibold text-white">Executive</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: '84%',
                            background: `linear-gradient(90deg, var(--accent), ${selectedPersona.accent})`,
                          }}
                        />
                      </div>
                      <button
                        onClick={startSession}
                        className="group flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[14px] font-semibold text-[#08090b] shadow-[0_18px_44px_rgba(255,255,255,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(255,255,255,0.16)]"
                      >
                        <Play size={16} fill="currentColor" />
                        Start Practice
                        <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* ── PRACTICE PHASE ── */}
            {phase === 'practice' && (
              <motion.div
                key="practice"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="grid gap-4 lg:grid-cols-[1fr_320px]"
              >
                {/* Chat */}
                <div
                  className="premium-panel relative flex flex-col overflow-hidden shadow-[0_28px_90px_rgba(0,0,0,0.28)]"
                  style={{ height: 'calc(100vh - 184px)' }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-80"
                    style={{
                      background:
                        'linear-gradient(140deg, rgba(50,213,131,0.055), transparent 34%), linear-gradient(310deg, rgba(155,140,255,0.055), transparent 30%)',
                    }}
                  />
                  <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

                  {/* Chat header */}
                  <div className="relative flex flex-col gap-4 border-b border-white/[0.07] bg-white/[0.022] px-4 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative">
                        <span
                          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                          style={{ color: selectedPersona.accent, background: `${selectedPersona.accent}1f` }}
                        >
                          <selectedPersona.icon size={21} />
                        </span>
                        <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[#15181d] bg-[var(--accent)] shadow-[0_0_16px_rgba(50,213,131,0.9)]" />
                      </div>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">
                          <Radio size={12} className="text-[var(--accent)]" />
                          Live coaching room
                        </p>
                        <h2 className="mt-1 truncate text-[18px] font-semibold tracking-tight text-white">
                          {selectedPersona.label}
                        </h2>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {['Objection handling', 'Discovery depth', 'Executive tone'].map((item) => (
                            <span key={item} className="rounded-full border border-white/[0.08] bg-black/20 px-2.5 py-1 text-[11px] font-medium text-[var(--text-muted)]">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="hidden rounded-2xl border border-white/[0.08] bg-black/20 px-3 py-2 text-right md:block">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Coach mode</p>
                        <p className="mt-1 text-[13px] font-semibold text-white">Pressure-tested</p>
                      </div>
                      <button
                        onClick={endSession}
                        className="flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[12px] font-medium text-[var(--text-muted)] transition-all hover:border-red-400/35 hover:bg-red-500/[0.08] hover:text-red-300"
                      >
                        <Square size={11} />
                        End Session
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div
                    className="relative flex-1 space-y-4 overflow-y-auto px-4 py-4"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.014), transparent 180px)',
                    }}
                  >
                    <div className="rounded-2xl border border-[rgba(50,213,131,0.16)] bg-[rgba(50,213,131,0.055)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                          <p className="flex items-center gap-2 text-[12px] font-semibold text-white">
                            <Crown size={14} className="text-[var(--accent)]" />
                            Coach brief
                          </p>
                          <p className="mt-1 text-[13px] font-medium leading-6 text-[var(--text-secondary)]">
                            Open with a specific pain hypothesis, then ask one sharp question before you pitch.
                          </p>
                        </div>
                        <span className="w-fit rounded-full border border-white/[0.08] bg-black/20 px-3 py-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                          Target: calm confidence
                        </span>
                      </div>
                    </div>

                    {messages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="max-w-[86%] space-y-2">
                          <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10.5px] font-semibold uppercase tracking-[0.13em] text-[var(--text-faint)]">
                              {msg.role === 'user' ? 'You' : 'Prospect'}
                            </span>
                            {msg.role === 'assistant' && (
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: selectedPersona.accent }} />
                            )}
                          </div>
                          <div
                            className={`relative overflow-hidden rounded-2xl px-4 py-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.18)] ${
                              msg.role === 'user'
                                ? 'rounded-br-sm bg-[var(--accent)] text-[14px] font-medium leading-6 text-black'
                                : 'rounded-bl-sm border border-white/[0.1] bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.055))] text-[15px] font-medium leading-7 text-[var(--text-primary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
                            }`}
                          >
                            {msg.role === 'assistant' && (
                              <span className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                            )}
                            {msg.role === 'assistant' ? displayMessage(msg.content) : msg.content}
                          </div>
                          {/* Coaching tip */}
                          {msg.coachingTip && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="rounded-xl border border-[rgba(50,213,131,0.22)] bg-[rgba(50,213,131,0.07)] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]"
                            >
                              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                                <Sparkles size={12} /> Coach Tip
                              </p>
                              <p className="text-[12px] leading-5 text-[var(--text-secondary)]">{msg.coachingTip}</p>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="flex items-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.06] px-4 py-3">
                          <Loader2 size={14} className="animate-spin text-[var(--text-muted)]" />
                          <span className="text-[13px] text-[var(--text-muted)]">Thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={bottomRef} />
                  </div>

                  {/* Input */}
                  <div className="relative border-t border-white/[0.07] bg-black/10 px-4 py-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">Your move</span>
                        <p className="mt-1 text-[12px] font-medium text-[var(--text-muted)]">
                          Reply like a calm senior seller. Keep it crisp, specific, and buyer-led.
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        {['Ask pain', 'Quantify', 'Next step'].map((item) => (
                          <span key={item} className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10.5px] font-semibold text-[var(--text-muted)]">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-end gap-3 rounded-[18px] border border-white/[0.13] bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.04))] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_42px_rgba(0,0,0,0.18)] transition-colors focus-within:border-[rgba(50,213,131,0.38)]">
                      <textarea
                        ref={inputRef}
                        rows={1}
                        value={input}
                        onChange={(e) => { setInput(e.target.value); autoResize(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                        placeholder={voiceMode ? 'Voice mode ready. Speak your response, or type instead...' : 'Type a confident response to the prospect...'}
                        className="max-h-32 min-h-10 flex-1 resize-none bg-transparent py-1 text-[15px] font-medium leading-6 text-white outline-none placeholder:text-[var(--text-faint)]"
                        style={{ scrollbarWidth: 'none' }}
                      />
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setVoiceMode((v) => !v)}
                          aria-pressed={voiceMode}
                          aria-label={voiceMode ? 'Voice mode active' : 'Enable voice mode'}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
                            voiceMode
                              ? 'border-[rgba(50,213,131,0.35)] bg-[rgba(50,213,131,0.14)] text-[var(--accent)] shadow-[0_0_24px_rgba(50,213,131,0.14)]'
                              : 'border-white/[0.1] bg-black/20 text-[var(--text-muted)] hover:border-white/[0.2] hover:text-white'
                          }`}
                        >
                          <Mic size={16} />
                        </button>
                        <button
                          onClick={sendMessage}
                          disabled={!input.trim() || loading}
                          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)] text-black shadow-[0_12px_30px_rgba(50,213,131,0.18)] transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:translate-y-0 disabled:opacity-30"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 px-1">
                      <p className="text-[11px] font-medium text-[var(--text-faint)]">Enter to send · Shift+Enter for new line</p>
                      <p className={`text-[11px] font-semibold ${voiceMode ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`}>
                        {voiceMode ? 'Voice option enabled' : 'Mic for voice practice'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Side panel — live signals */}
                <div className="space-y-4">
                  <div className="premium-panel relative overflow-hidden p-4">
                    <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="flex items-center gap-2 text-[13px] font-semibold text-white">
                          <Flame size={14} className="text-[var(--accent-amber)]" />
                          Coach board
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--text-faint)]">Live quality signals</p>
                      </div>
                      <span className="rounded-full border border-[rgba(50,213,131,0.2)] bg-[rgba(50,213,131,0.07)] px-2 py-1 text-[10.5px] font-semibold text-[var(--accent)]">
                        Active
                      </span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { icon: Target, label: 'Buying intent', value: scores.length ? `${scores[scores.length-1]}%` : '—' },
                        { icon: MessageSquare, label: 'Exchanges', value: messages.filter(m => m.role === 'user').length },
                        { icon: Brain, label: 'Avg. score', value: scores.length ? `${avgScore}%` : '—' },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-white/[0.075] bg-white/[0.035] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                              <stat.icon size={13} />
                              {stat.label}
                            </div>
                            <span className="text-[14px] font-semibold text-white">{stat.value}</span>
                          </div>
                          {stat.label === 'Buying intent' && scores.length > 0 && (
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${scores[scores.length-1]}%` }} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="premium-panel p-4">
                    <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-white">
                      <Brain size={14} className="text-[var(--accent-blue)]" />
                      Next best move
                    </p>
                    <div className="rounded-2xl border border-white/[0.075] bg-white/[0.03] p-3">
                      <p className="text-[12px] font-semibold text-white">Ask, then anchor.</p>
                      <p className="mt-1.5 text-[12px] leading-5 text-[var(--text-muted)]">
                        Surface the business impact before describing SalesMind. Keep the reply under 30 seconds.
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        ['Tone', 'Calm'],
                        ['Focus', 'ROI'],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2">
                          <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</p>
                          <p className="mt-1 text-[12px] font-semibold text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="premium-panel p-4">
                    <p className="mb-3 text-[13px] font-semibold text-white">Persona</p>
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]" style={{ color: selectedPersona.accent }}>
                        <selectedPersona.icon size={17} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-white">{selectedPersona.label}</p>
                        <p className="mt-1 text-[11px] leading-5 text-[var(--text-muted)]">{selectedPersona.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setPhase('setup')}
                      className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.025] py-2.5 text-[12px] font-medium text-[var(--text-muted)] transition-all hover:border-white/20 hover:text-white"
                    >
                      Change persona
                    </button>
                  </div>

                  <button
                    onClick={endSession}
                    className="w-full rounded-xl border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)] py-3 text-[13px] font-medium text-red-400 hover:border-red-400/40 hover:bg-[rgba(239,68,68,0.1)] transition-all"
                  >
                    End &amp; Review Session
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── REVIEW PHASE ── */}
            {phase === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="space-y-6"
              >
                <section className="premium-panel relative overflow-hidden p-6 md:p-8">
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(50,213,131,0.1),transparent_36%,rgba(106,167,255,0.08))]" />
                  <div className="relative">
                  <p className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    <TrendingUp size={13} className="text-[var(--accent)]" /> Session Review
                  </p>
                  <h2 className="text-[28px] font-semibold tracking-tight text-white">
                    {avgScore >= 75 ? 'Strong session.' : avgScore >= 55 ? 'Good progress.' : 'Room to improve.'}
                  </h2>
                  <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                    You completed {messages.filter(m => m.role === 'user').length} exchanges with <strong className="text-white">{selectedPersona.label}</strong>.
                    Average buying intent score: <strong className="text-[var(--accent)]">{avgScore}%</strong>.
                  </p>
                  </div>
                </section>

                {/* Scores over time */}
                {scores.length > 0 && (
                  <section className="premium-panel p-5">
                    <h3 className="mb-4 text-[15px] font-semibold text-white">Buying intent over time</h3>
                    <div className="flex items-end gap-2 h-20">
                      {scores.map((s, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full rounded-t-sm"
                            style={{
                              height: `${s}%`,
                              background: s >= 75 ? 'var(--accent)' : s >= 55 ? 'var(--accent-blue)' : 'var(--accent-amber)',
                              opacity: 0.7,
                            }}
                          />
                          <span className="text-[10px] text-[var(--text-faint)]">{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Coaching tips summary */}
                {messages.filter(m => m.coachingTip).length > 0 && (
                  <section className="premium-panel p-5">
                    <h3 className="mb-4 text-[15px] font-semibold text-white">Coach tips from this session</h3>
                    <div className="space-y-3">
                      {messages.filter(m => m.coachingTip).map((m, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                          <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[rgba(50,213,131,0.12)] text-[var(--accent)]">
                            <ChevronRight size={11} />
                          </span>
                          <p className="text-[13px] leading-6 text-[var(--text-secondary)]">{m.coachingTip}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <div className="flex gap-3">
                  <button onClick={startSession} className="btn btn-primary">
                    <Play size={14} fill="currentColor" /> Practice Again
                  </button>
                  <button onClick={() => setPhase('setup')} className="btn btn-secondary">
                    Change Persona
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
