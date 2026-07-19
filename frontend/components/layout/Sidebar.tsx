'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  ChevronLeft,
  ChevronRight,
  Command,
  LogOut,
  MessageSquare,
  Search,
  Send,
  Settings,
  Users,
  X,
} from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { getCurrentUser, signOut, type AuthUser } from '@/lib/auth';

// ── Nav items ──────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/dashboard',           icon: BarChart3,     label: 'Dashboard',    description: 'Overview & AI brief' },
  { href: '/dashboard/leads',     icon: Users,         label: 'Leads',        description: 'Manage your pipeline' },
  { href: '/dashboard/chat',      icon: MessageSquare, label: 'Nexus AI',     description: 'AI sales copilot' },
  { href: '/dashboard/coach',     icon: Brain,         label: 'Sales Coach',  description: 'Real-time coaching' },
  { href: '/dashboard/followup',  icon: Send,          label: 'Follow-ups',   description: 'Automated emails' },
  { href: '/dashboard/settings',  icon: Settings,      label: 'Settings',     description: 'Account & workspace' },
];

// ── Command palette items ─────────────────────────────────────────────────────
const COMMAND_ITEMS = [
  ...NAV_ITEMS.map((n) => ({ ...n, category: 'Navigate', action: 'navigate' as const })),
  { href: '/dashboard/chat',     icon: MessageSquare, label: 'Ask Nexus AI',          description: 'Start a new conversation',  category: 'Actions', action: 'navigate' as const },
  { href: '/dashboard/followup', icon: Send,          label: 'Generate follow-up',    description: 'Create an email draft',      category: 'Actions', action: 'navigate' as const },
  { href: '/dashboard/leads',    icon: Users,         label: 'Add a new lead',        description: 'Create a lead manually',     category: 'Actions', action: 'navigate' as const },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname  = usePathname();
  const router    = useRouter();

  const [user,        setUser]        = useState<AuthUser | null>(null);
  const [collapsed,   setCollapsed]   = useState(false);
  const [cmdOpen,     setCmdOpen]     = useState(false);
  const [cmdQuery,    setCmdQuery]    = useState('');
  const [cmdIdx,      setCmdIdx]      = useState(0);
  const [signingOut,  setSigningOut]  = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load user
  useEffect(() => { getCurrentUser().then(setUser); }, []);

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
      if (e.key === 'Escape') setCmdOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when palette opens
  useEffect(() => {
    if (cmdOpen) {
      setCmdQuery('');
      setCmdIdx(0);
      setTimeout(() => inputRef.current?.focus(), 40);
    }
  }, [cmdOpen]);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.replace('/login');
    } catch {
      toast.error('Sign out failed');
      setSigningOut(false);
    }
  };

  // User display
  const displayName  = user?.full_name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const initials     = displayName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  // Filtered command items
  const filtered = COMMAND_ITEMS.filter((item) =>
    !cmdQuery ||
    item.label.toLowerCase().includes(cmdQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(cmdQuery.toLowerCase())
  );

  // Keyboard navigation inside palette
  const handleCmdKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCmdIdx((i) => Math.min(i + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setCmdIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && filtered[cmdIdx]) {
      router.push(filtered[cmdIdx].href);
      setCmdOpen(false);
    }
  };

  // Sidebar width — numeric px value lets Framer animate it smoothly
  const EXPANDED_W = 224; // matches --sidebar-w
  const COLLAPSED_W = 68;
  const sidebarW = collapsed ? COLLAPSED_W : EXPANDED_W;

  return (
    <>
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: sidebarW }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, mass: 0.8 }}
        className="hidden h-screen flex-shrink-0 p-3 md:flex overflow-hidden"
        style={{ minWidth: sidebarW }}
      >
        <div className="premium-panel flex h-full w-full flex-col overflow-hidden rounded-[14px] bg-[rgba(12,14,18,0.86)]">

          {/* ── Header ── */}
          <AnimatePresence mode="wait" initial={false}>
            {collapsed ? (
              /* Collapsed: logo centered, full width */
              <motion.div
                key="collapsed-header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col items-center pt-3 pb-1 gap-1"
              >
                <Link href="/dashboard" className="flex items-center justify-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden bg-[#0a0a0a] border border-white/10">
                    <Image src="/logo of salesmind.png" alt="SalesMind AI" width={36} height={36} className="object-contain" />
                  </span>
                </Link>
                {/* Expand button just below logo */}
                <button
                  onClick={() => setCollapsed(false)}
                  className="icon-button h-6 w-6 mt-0.5"
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                >
                  <ChevronRight size={12} />
                </button>
              </motion.div>
            ) : (
              /* Expanded: logo + text on left, collapse button on right */
              <motion.div
                key="expanded-header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex h-14 items-center justify-between px-3"
              >
                <Link href="/dashboard" className="flex min-w-0 items-center gap-3 overflow-hidden">
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg overflow-hidden bg-[#0a0a0a] border border-white/10">
                    <Image src="/logo of salesmind.png" alt="SalesMind AI" width={36} height={36} className="object-contain" />
                  </span>
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.18, delay: 0.06 }}
                    className="min-w-0"
                  >
                    <span className="block truncate text-[15px] font-semibold tracking-tight text-white">SalesMind</span>
                    <span className="block truncate text-[11px] font-medium text-[var(--text-muted)]">Revenue OS</span>
                  </motion.span>
                </Link>
                <button
                  onClick={() => setCollapsed(true)}
                  className="icon-button h-7 w-7 flex-shrink-0"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <ChevronLeft size={13} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Command centre button */}
          <div className="px-2 mb-1">
            {collapsed ? (
              /* Collapsed: matches nav icon style — transparent, centred, subtle hover */
              <button
                onClick={() => setCmdOpen(true)}
                title="Command centre (Ctrl+K)"
                className="flex h-10 w-full items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-white/[0.045] hover:text-[var(--text-primary)]"
              >
                <Command size={17} strokeWidth={1.8} />
              </button>
            ) : (
              /* Expanded: full card with label + kbd shortcut */
              <button
                onClick={() => setCmdOpen(true)}
                className="flex w-full items-center gap-2 rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2 text-[12px] text-[var(--text-muted)] hover:border-white/14 hover:bg-white/[0.04] hover:text-[var(--text-primary)] transition-all"
              >
                <Command size={13} />
                <span className="flex-1 text-left truncate">Command centre</span>
                <kbd className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]">K</kbd>
              </button>
            )}

          </div>

          {/* Nav */}
          <nav className="flex-1 px-2 py-1">
            <ul className="space-y-0.5">
              {NAV_ITEMS.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <motion.li
                    key={item.href}
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`group relative flex h-10 items-center rounded-lg px-2 text-[13px] font-medium transition-colors ${
                        collapsed ? 'justify-center' : 'gap-3'
                      } ${
                        active
                          ? 'text-white'
                          : 'text-[var(--text-muted)] hover:bg-white/[0.045] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-lg border border-white/10 bg-white/[0.055]"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      {active && !collapsed && <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-[var(--accent)]" />}
                      <item.icon className="relative z-10 flex-shrink-0" size={17} strokeWidth={active ? 2.2 : 1.8} />
                      <AnimatePresence initial={false}>
                        {!collapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -6 }}
                            transition={{ duration: 0.15, delay: 0.05 }}
                            className="relative z-10 truncate"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </nav>

          {/* User footer */}
          <div className="border-t border-white/8 p-2">
            <div className="rounded-xl border border-white/8 bg-white/[0.025] p-2.5">
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-blue)] text-[12px] font-bold text-[#08090b] cursor-pointer"
                  title={collapsed ? `${displayName} — Click to sign out` : undefined}
                  onClick={collapsed ? handleLogout : undefined}
                >
                  {initials || 'SM'}
                </div>
                {!collapsed && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-white">{displayName}</p>
                    <p className="truncate text-[11px] text-[var(--text-muted)]">{displayEmail || 'Enterprise workspace'}</p>
                  </div>
                )}
                {!collapsed && (
                  <button
                    onClick={handleLogout}
                    disabled={signingOut}
                    title={signingOut ? 'Signing out' : 'Sign out'}
                    aria-label={signingOut ? 'Signing out' : 'Sign out'}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.025] text-[var(--text-faint)] transition-all hover:border-red-400/30 hover:bg-red-500/[0.08] hover:text-red-300 disabled:opacity-50"
                  >
                    <LogOut size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* ── Command Palette ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {cmdOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setCmdOpen(false)}
            />

            {/* Palette modal */}
            <motion.div
              key="palette"
              initial={{ opacity: 0, scale: 0.96, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -12 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-1/2 top-[15%] z-50 w-full max-w-[540px] -translate-x-1/2 rounded-2xl border border-white/10 bg-[rgba(13,15,20,0.98)] shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5">
                <Search size={16} className="flex-shrink-0 text-[var(--text-muted)]" />
                <input
                  ref={inputRef}
                  type="text"
                  value={cmdQuery}
                  onChange={(e) => { setCmdQuery(e.target.value); setCmdIdx(0); }}
                  onKeyDown={handleCmdKey}
                  placeholder="Search pages, actions…"
                  className="flex-1 bg-transparent text-[14px] text-white placeholder:text-[var(--text-faint)] outline-none"
                />
                <button onClick={() => setCmdOpen(false)} className="text-[var(--text-muted)] hover:text-white transition-colors">
                  <X size={15} />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[380px] overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="py-10 text-center text-[13px] text-[var(--text-muted)]">No results for &ldquo;{cmdQuery}&rdquo;</p>
                ) : (
                  (() => {
                    const categories = [...new Set(filtered.map((i) => i.category))];
                    let globalIdx = -1;
                    return categories.map((cat) => (
                      <div key={cat} className="mb-2">
                        <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-faint)]">{cat}</p>
                        {filtered
                          .filter((i) => i.category === cat)
                          .map((item) => {
                            globalIdx++;
                            const idx = globalIdx;
                            const isHighlighted = idx === cmdIdx;
                            return (
                              <button
                                key={`${item.href}-${item.label}`}
                                onClick={() => { router.push(item.href); setCmdOpen(false); }}
                                onMouseEnter={() => setCmdIdx(idx)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                                  isHighlighted ? 'bg-white/[0.07] text-white' : 'text-[var(--text-secondary)] hover:bg-white/[0.04]'
                                }`}
                              >
                                <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${
                                  isHighlighted ? 'border-white/14 bg-white/[0.07] text-white' : 'border-white/8 bg-white/[0.03] text-[var(--text-muted)]'
                                }`}>
                                  <item.icon size={15} />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-[13px] font-medium leading-tight">{item.label}</span>
                                  <span className="block text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">{item.description}</span>
                                </span>
                                {isHighlighted && (
                                  <kbd className="ml-auto flex-shrink-0 rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-[var(--text-faint)]">↵</kbd>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    ));
                  })()
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-white/8 px-4 py-2.5">
                {[
                  ['↑↓', 'Navigate'],
                  ['↵', 'Open'],
                  ['Esc', 'Close'],
                ].map(([key, label]) => (
                  <span key={key} className="flex items-center gap-1.5 text-[11px] text-[var(--text-faint)]">
                    <kbd className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px]">{key}</kbd>
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
