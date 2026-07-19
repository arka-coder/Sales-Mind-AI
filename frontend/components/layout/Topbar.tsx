'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  Bot,
  Brain,
  Command,
  FileText,
  Mail,
  Mic,
  Search,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  Zap,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface TopbarProps {
  title: string;
  subtitle?: string;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const PLACEHOLDERS = [
  'Ask Nexus anything...',
  'Analyze Acme Corp...',
  'Generate a proposal...',
  'Find high-intent leads...',
  "Summarize today's activity...",
  'Predict revenue this month...',
  'Draft a follow-up for TechCorp...',
  'Who are my hottest leads right now?',
];

const COMMANDS = [
  { section: 'Suggested', label: 'Analyze Lead',         description: 'Find risk, intent, and next best action', icon: Users      },
  { section: 'Suggested', label: 'Generate Follow-up',   description: 'Draft a contextual message for a lead',   icon: Mail       },
  { section: 'Suggested', label: 'Create Proposal',      description: 'Build an ROI-led proposal packet',        icon: FileText   },
  { section: 'Suggested', label: 'Practice Sales Pitch', description: 'Start a roleplay with an AI prospect',    icon: Mic        },
  { section: 'Suggested', label: 'Predict Revenue',      description: 'Forecast pipeline and at-risk value',     icon: TrendingUp },
  { section: 'Recent',    label: 'Find Hot Leads',       description: 'Show high-intent prospects ready today',  icon: Zap        },
  { section: 'Recent',    label: 'Coach Session',        description: 'Open AI roleplay practice',               icon: Brain      },
  { section: 'Search',    label: 'Search Conversations', description: 'Find deal threads and Nexus answers',     icon: Search     },
  { section: 'Search',    label: 'Search Companies',     description: 'Look up accounts, contacts, and intent',  icon: Bot        },
];

// Activity dot colours use design-system tokens via inline CSS var()
const ACTIVITY = [
  { label: 'Lead scored',            detail: 'Emily Rodriguez → 91 intent score',    time: '2m',  dotVar: 'var(--accent)'        },
  { label: 'Proposal generated',     detail: 'Acme Corp ROI packet ready to send',   time: '8m',  dotVar: 'var(--accent-blue)' },
  { label: 'Buying signal detected', detail: 'TechCorp asked about security review', time: '14m', dotVar: 'var(--accent-amber)'  },
  { label: 'Follow-up created',      detail: 'CloudSync 3-step sequence queued',     time: '24m', dotVar: 'var(--accent)' },
  { label: 'Meeting summarized',     detail: 'StartupXYZ discovery notes indexed',   time: '1h',  dotVar: 'var(--accent)'        },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Topbar({ title, subtitle }: TopbarProps) {
  const [paletteOpen,  setPaletteOpen]  = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [query,        setQuery]        = useState('');
  const [now,          setNow]          = useState(new Date());
  const [phIdx,        setPhIdx]        = useState(0);
  const [phVisible,    setPhVisible]    = useState(true);
  const activityRef = useRef<HTMLDivElement>(null);

  // ── Clock ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });

  // ── Rotating placeholder ───────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setPhVisible(false);
      setTimeout(() => { setPhIdx((i) => (i + 1) % PLACEHOLDERS.length); setPhVisible(true); }, 300);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  // ── Global keyboard shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(true); setActivityOpen(false); }
      if (e.key === 'Escape') { setPaletteOpen(false); setActivityOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Click-outside for activity panel ──────────────────────────────────────
  useEffect(() => {
    if (!activityOpen) return;
    const handler = (e: MouseEvent) => { if (activityRef.current && !activityRef.current.contains(e.target as Node)) setActivityOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [activityOpen]);

  // ── Filtered + grouped commands ────────────────────────────────────────────
  const filtered = useMemo(() => {
    const t = query.trim().toLowerCase();
    return t ? COMMANDS.filter((c) => `${c.label} ${c.description} ${c.section}`.toLowerCase().includes(t)) : COMMANDS;
  }, [query]);

  const grouped = useMemo(() =>
    filtered.reduce<Record<string, typeof COMMANDS>>((acc, item) => {
      acc[item.section] = acc[item.section] ? [...acc[item.section], item] : [item];
      return acc;
    }, {}),
  [filtered]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ────────────────────── Header ────────────────────── */}
      <header
        className="sticky top-0 z-30 flex h-[64px] items-center overflow-visible border-b border-white/[0.08] px-4 backdrop-blur-2xl sm:px-6"
        style={{
          background:
            'linear-gradient(180deg, rgba(18,21,27,0.94), rgba(10,12,15,0.88))',
          boxShadow: '0 1px 0 rgba(255,255,255,0.035) inset, 0 18px 44px rgba(0,0,0,0.24)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), rgba(50,213,131,0.22), transparent)',
          }}
        />
        <div
          className="pointer-events-none absolute left-[18%] top-0 h-full w-[36%] opacity-70 blur-2xl"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(50,213,131,0.08), rgba(106,167,255,0.06), transparent)',
          }}
        />

        <div className="relative flex w-full items-center gap-3 sm:gap-4">

          {/* LEFT ─ Brand + Page ───────────────────────────── */}
          <div className="flex min-w-0 flex-[1.1] items-center gap-3">
            <div className="hidden flex-shrink-0 items-center gap-2 sm:flex">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.1] text-[var(--accent)]"
                style={{
                  background:
                    'linear-gradient(145deg, rgba(50,213,131,0.16), rgba(106,167,255,0.08))',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 24px rgba(50,213,131,0.08)',
                }}
              >
                <Sparkles size={13} strokeWidth={2.2} />
              </span>
              <span className="text-[14px] font-semibold tracking-[-0.01em] text-white">
                SalesMind
              </span>
            </div>

            <div className="hidden h-7 w-px sm:block bg-gradient-to-b from-transparent via-white/[0.12] to-transparent" />

            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold leading-none tracking-[-0.01em] text-[var(--text-primary)]">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 truncate text-[11.5px] font-medium leading-none text-[var(--text-muted)]">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* CENTER ─ Command bar ──────────────────────────── */}
          <div className="flex flex-1 justify-center">
            <motion.button
              type="button"
              onClick={() => { setPaletteOpen(true); setActivityOpen(false); }}
              aria-label="Open Nexus command palette"
              whileHover={{ scale: 1.008 }}
              whileTap={{ scale: 0.996 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="group relative flex h-10 w-full max-w-[592px] items-center gap-3 overflow-hidden rounded-[14px] px-3.5 text-left
                         border border-white/[0.1] bg-white/[0.045]
                         hover:border-white/[0.18] hover:bg-white/[0.065]
                         transition-all duration-200"
              style={{
                boxShadow:
                  '0 14px 34px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.07)',
              }}
            >
              <span
                className="pointer-events-none absolute inset-x-8 top-0 h-px opacity-80"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)' }}
              />
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-black/20 text-[var(--text-muted)] transition-colors group-hover:text-[var(--text-primary)]">
                <Search size={13} strokeWidth={2} />
              </span>

              {/* Rotating placeholder */}
              <span className="relative flex-1 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={phIdx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: phVisible ? 1 : 0, y: phVisible ? 0 : -6 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="block truncate text-[13px] font-medium text-[var(--text-muted)]"
                  >
                    {PLACEHOLDERS[phIdx]}
                  </motion.span>
                </AnimatePresence>
              </span>

              {/* Keyboard shortcut */}
              <span className="hidden flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold sm:flex
                               bg-black/30 text-[var(--text-faint)] border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <Command size={9.5} strokeWidth={2} />
                K
              </span>
            </motion.button>
          </div>

          {/* RIGHT ─ Activity + Clock ──────────────────────── */}
          <div className="relative flex flex-[1.1] items-center justify-end gap-3" ref={activityRef}>

            {/* AI Activity button */}
            <motion.button
              type="button"
              onClick={() => { setActivityOpen((v) => !v); setPaletteOpen(false); }}
              aria-label="AI Activity"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200"
              style={{
                background: activityOpen
                  ? 'linear-gradient(145deg, rgba(50,213,131,0.16), rgba(106,167,255,0.08))'
                  : 'linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))',
                border: activityOpen ? '1px solid rgba(50,213,131,0.32)' : '1px solid rgba(255,255,255,0.1)',
                color: activityOpen ? 'var(--accent)' : 'var(--text-muted)',
                boxShadow: activityOpen
                  ? '0 12px 30px rgba(50,213,131,0.12), inset 0 1px 0 rgba(255,255,255,0.08)'
                  : 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <Zap size={14} strokeWidth={2} />
              {/* Live pulse */}
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-[#101318] bg-[var(--accent)] shadow-[0_0_14px_rgba(50,213,131,0.9)]" />
            </motion.button>

            {/* Separator */}
            <div className="hidden h-7 w-px sm:block bg-gradient-to-b from-transparent via-white/[0.12] to-transparent" />

            {/* Clock */}
            <div
              className="hidden min-w-[132px] flex-col items-end rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-2 leading-none shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] sm:flex"
            >
              <span className="text-[13px] font-semibold tabular-nums tracking-tight text-[var(--text-primary)]">
                {timeStr}
              </span>
              <span className="mt-1 text-[10.5px] font-medium text-[var(--text-muted)]">
                {dateStr}
              </span>
            </div>

            {/* ── AI Activity dropdown ──────────────────────── */}
            <AnimatePresence>
              {activityOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-[calc(100%+10px)] z-50 w-[340px] overflow-hidden rounded-2xl
                             bg-[var(--bg-surface)] border border-[var(--border)]"
                  style={{ boxShadow: 'var(--shadow-soft)' }}
                >
                  {/* Panel header */}
                  <div className="px-4 pt-4 pb-3 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">AI Activity</p>
                        <p className="mt-0.5 text-[11.5px] text-[var(--text-muted)]">Live intelligence log</p>
                      </div>
                      <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em]
                                       bg-[rgba(50,213,131,0.08)] text-[var(--accent)] border border-[rgba(50,213,131,0.2)]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
                        Live
                      </span>
                    </div>
                  </div>

                  {/* Activity items */}
                  <div className="py-1.5">
                    {ACTIVITY.map((item, i) => (
                      <motion.button
                        key={item.label}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.2 }}
                        className="flex w-full items-start gap-3 px-4 py-3 text-left
                                   hover:bg-[var(--bg-elevated)] transition-colors duration-150"
                      >
                        <span className="mt-[5px] h-1.5 w-1.5 flex-shrink-0 rounded-full"
                          style={{ background: item.dotVar }} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12.5px] font-medium text-[var(--text-primary)]">{item.label}</span>
                          <span className="mt-0.5 block truncate text-[11.5px] text-[var(--text-muted)]">{item.detail}</span>
                        </span>
                        <span className="flex-shrink-0 text-[11px] text-[var(--text-faint)]">{item.time}</span>
                      </motion.button>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="px-4 py-2.5 text-center border-t border-[var(--border)]">
                    <button className="text-[11.5px] font-medium text-[var(--accent)] hover:opacity-80 transition-opacity">
                      View full activity log →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </header>

      {/* ────────────────── Command palette overlay ─────────────────── */}
      <AnimatePresence>
        {paletteOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            onMouseDown={() => setPaletteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full max-w-[660px] overflow-hidden rounded-2xl
                         bg-[var(--bg-surface)] border border-[var(--border-strong)]"
              style={{ boxShadow: '0 32px 80px rgba(0,0,0,0.6)', outline: 'none' }}
            >
              {/* Search row */}
              <div className="flex h-[60px] items-center gap-3 px-4">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask Nexus..."
                  className="h-full min-w-0 flex-1 border-0 bg-transparent text-[17px] font-medium tracking-tight
                             text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)]"
                  style={{ caretColor: 'var(--accent)' }}
                />
                <span className="hidden rounded-lg px-2 py-1 text-[11px] sm:block
                                 bg-[var(--bg-muted)] text-[var(--text-faint)] border border-[var(--border)]">
                  Esc
                </span>
              </div>

              {/* Results */}
              <div className="max-h-[min(560px,calc(100vh-160px))] overflow-y-auto p-2">
                {Object.entries(grouped).map(([section, items]) => (
                  <div key={section} className="py-1.5">
                    <p className="px-3 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">
                      {section}
                    </p>
                    <div className="space-y-0.5">
                      {items.map((item) => (
                        <button
                          key={`${section}-${item.label}`}
                          onClick={() => setPaletteOpen(false)}
                          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left
                                     hover:bg-[var(--bg-elevated)] transition-colors duration-150"
                        >
                          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg
                                           bg-[var(--bg-muted)] text-[var(--text-secondary)]
                                           group-hover:text-[var(--text-primary)] transition-colors duration-150">
                            <item.icon size={15} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13.5px] font-medium text-[var(--text-primary)]">{item.label}</span>
                            <span className="block truncate text-[12px] text-[var(--text-muted)]">{item.description}</span>
                          </span>
                          <ArrowUpRight size={13} className="text-[var(--text-faint)] opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {filtered.length === 0 && (
                  <div className="px-4 py-12 text-center">
                    <UserRound size={20} className="mx-auto mb-3 text-[var(--text-faint)]" />
                    <p className="text-[13.5px] font-medium text-[var(--text-primary)]">No results found</p>
                    <p className="mt-1 text-[12px] text-[var(--text-muted)]">
                      Try: lead, proposal, revenue, follow-up, coach
                    </p>
                  </div>
                )}
              </div>

              {/* Footer keyboard hints */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border)]">
                {[['↑↓', 'navigate'], ['↵', 'select'], ['esc', 'dismiss']].map(([key, label]) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <kbd className="rounded px-1.5 py-0.5 text-[10px] font-medium
                                    bg-[var(--bg-muted)] text-[var(--text-secondary)] border border-[var(--border)]">
                      {key}
                    </kbd>
                    <span className="text-[11px] text-[var(--text-faint)]">{label}</span>
                  </span>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
