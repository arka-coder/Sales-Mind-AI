'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  MessageSquare,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import { getCurrentUser } from '@/lib/auth';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const kpis = [
  {
    label: 'High-intent prospects',
    value: '42',
    trend: '+12%',
    confidence: '96%',
    icon: Users,
    accent: 'var(--accent)',
    note: 'Eight are in enterprise SaaS and are most likely to convert before Friday.',
  },
  {
    label: 'Revenue opportunity',
    value: '$38.4K',
    trend: '+8%',
    confidence: '91%',
    icon: DollarSign,
    accent: 'var(--accent-blue)',
    note: 'Expansion interest is concentrated in teams already using sales automation.',
  },
  {
    label: 'Deals at risk',
    value: '3',
    trend: '-2',
    confidence: '88%',
    icon: Clock,
    accent: 'var(--accent-amber)',
    note: 'Acme and CloudSync show stalled intent after pricing and security objections.',
  },
  {
    label: 'Pipeline health',
    value: 'Excellent',
    trend: '94',
    confidence: '93%',
    icon: Target,
    accent: 'var(--accent)',
    note: 'Velocity is strong, but Nexus recommends focusing before noon.',
  },
];

const actions = [
  {
    priority: 'Critical',
    impact: '$18.5K',
    title: 'Acme Corp needs a tailored ROI proposal',
    reason: 'Pricing objection detected twice. Procurement language suggests budget exists if ROI is explicit.',
    action: 'Generate proposal',
  },
  {
    priority: 'Important',
    impact: '$12.4K',
    title: 'CloudSync has gone quiet after demo',
    reason: 'Conversion probability drops sharply after 48 hours. Their champion opened pricing three times.',
    action: 'Draft follow-up',
  },
  {
    priority: 'Opportunity',
    impact: '$7.5K',
    title: 'SaaS inbound intent is accelerating',
    reason: 'Competitive downtime is pushing new traffic into your evaluation pages.',
    action: 'Create sequence',
  },
];

const stages = [
  { label: 'Leads', count: 247, revenue: '$124K', width: '100%', health: 'Healthy' },
  { label: 'Qualified', count: 98, revenue: '$67K', width: '70%', health: 'Healthy' },
  { label: 'Negotiating', count: 52, revenue: '$41K', width: '52%', health: 'Watch' },
  { label: 'Commit', count: 45, revenue: '$38K', width: '46%', health: 'Strong' },
];

export default function Dashboard() {
  const [firstName, setFirstName] = useState('');
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user?.full_name) {
        setFirstName(user.full_name.split(' ')[0]);
      } else if (user?.email) {
        setFirstName(user.email.split('@')[0]);
      }
    });
    // Update greeting if user stays on page past the hour boundary
    const interval = setInterval(() => setGreeting(getGreeting()), 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Topbar title="Dashboard" subtitle="What deserves attention today" />
      <main className="flex-1 overflow-y-auto overflow-x-hidden py-8 md:py-10">
        <div className="page-container space-y-8">
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-panel overflow-hidden p-6 md:p-8"
          >
            <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
              <div>
                <div className="mb-6 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  <Sparkles size={15} className="text-[var(--accent)]" />
                  Nexus Daily Brief
                </div>
                <h1 className="max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-tight text-white md:text-[50px]">
                  {greeting}{firstName ? `, ${firstName}` : ''}. I analyzed today&apos;s pipeline.
                </h1>
                <div className="mt-7 max-w-3xl space-y-4 text-[17px] leading-8 text-[var(--text-secondary)]">
                  <p>
                    <span className="font-semibold text-white">42 high-intent prospects</span> need attention. Potential revenue opportunity is{' '}
                    <span className="font-semibold text-white">$38,400</span>.
                  </p>
                  <p>
                    Three deals are at risk. Overall pipeline health is{' '}
                    <span className="font-semibold text-[var(--accent)]">excellent</span>. Prioritize enterprise SaaS opportunities before noon.
                  </p>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/dashboard/leads" className="btn btn-primary">
                    Start Working <ArrowRight size={15} />
                  </Link>
                  <Link href="/dashboard/chat" className="btn btn-secondary">
                    Ask Nexus <MessageSquare size={15} />
                  </Link>
                  <Link href="/dashboard/followup" className="btn btn-ghost">
                    Generate Follow-ups <Send size={15} />
                  </Link>
                </div>
              </div>

              <div className="grid content-start gap-3">
                {[
                  ['Pipeline health', 'Excellent', 'var(--accent)'],
                  ['Revenue at risk', '$24.9K', 'var(--accent-amber)'],
                  ['Best next segment', 'Enterprise SaaS', 'var(--accent-blue)'],
                  ['AI confidence', '93%', 'var(--accent)'],
                ].map(([label, value, color]) => (
                  <div key={label} className="quiet-panel flex items-center justify-between px-4 py-3">
                    <span className="text-[13px] text-[var(--text-muted)]">{label}</span>
                    <span className="text-[13px] font-semibold text-white" style={{ color }}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {kpis.map((kpi, index) => (
              <motion.article
                key={kpi.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="premium-panel p-5"
              >
                <div className="mb-7 flex items-start justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035]" style={{ color: kpi.accent }}>
                    <kpi.icon size={17} />
                  </div>
                  <span className="status-pill">
                    <TrendingUp size={12} />
                    {kpi.trend}
                  </span>
                </div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{kpi.label}</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="text-[31px] font-semibold tracking-tight text-white">{kpi.value}</p>
                  <div className="mini-chart" />
                </div>
                <p className="mt-5 min-h-[58px] text-[13px] leading-6 text-[var(--text-secondary)]">{kpi.note}</p>
                <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
                  <span className="text-[12px] text-[var(--text-faint)]">AI confidence</span>
                  <span className="text-[12px] font-semibold text-white">{kpi.confidence}</span>
                </div>
              </motion.article>
            ))}
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="premium-panel p-5 md:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-tight text-white">AI Action Center</h2>
                  <p className="mt-1 text-[13px] text-[var(--text-muted)]">Recommendations ranked by impact and urgency.</p>
                </div>
                <Sparkles size={18} className="text-[var(--accent)]" />
              </div>
              <div className="space-y-3">
                {actions.map((item) => (
                  <article key={item.title} className="quiet-panel p-4 transition-colors hover:border-white/14">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="status-pill border-white/10 bg-white/[0.04]">{item.priority}</span>
                      <span className="status-pill border-white/10 bg-white/[0.04] text-[var(--accent)]">{item.impact} impact</span>
                    </div>
                    <h3 className="mt-4 text-[15px] font-semibold text-white">{item.title}</h3>
                    <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[var(--text-secondary)]">{item.reason}</p>
                    <div className="mt-4 flex items-center justify-between gap-4">
                      <span className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                        <CheckCircle2 size={14} className="text-[var(--accent)]" />
                        Ready for one-click execution
                      </span>
                      <button className="btn btn-secondary">{item.action}</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="premium-panel p-5 md:p-6">
              <div className="mb-6 flex items-center gap-2">
                <BarChart3 size={18} className="text-[var(--accent-blue)]" />
                <h2 className="text-[18px] font-semibold tracking-tight text-white">Predictive Pipeline</h2>
              </div>
              <div className="space-y-5">
                {stages.map((stage, index) => (
                  <div key={stage.label}>
                    <div className="mb-2 flex items-center justify-between text-[12px]">
                      <span className="font-semibold text-white">{stage.label}</span>
                      <span className="text-[var(--text-muted)]">{stage.count} leads · {stage.revenue}</span>
                    </div>
                    <div className="h-9 overflow-hidden rounded-lg border border-white/8 bg-white/[0.025]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: stage.width }}
                        transition={{ duration: 0.8, delay: index * 0.08, ease: 'easeOut' }}
                        className="flex h-full items-center justify-end rounded-r-lg bg-gradient-to-r from-white/5 to-white/14 pr-3"
                      >
                        <span className="text-[11px] font-semibold text-white">{stage.health}</span>
                      </motion.div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-white/8 bg-black/20 p-4">
                <p className="text-[13px] leading-6 text-[var(--text-secondary)]">
                  Nexus predicts the strongest lift from moving qualified SaaS buyers into proposal review before the afternoon follow-up window.
                </p>
              </div>
            </section>
          </div>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              { icon: FileText, label: 'Brief proposal packet', meta: 'For Acme pricing objection' },
              { icon: MessageSquare, label: 'Open Nexus thread', meta: 'Ask for a segment analysis' },
              { icon: Send, label: 'Review 12 follow-ups', meta: 'Queued and awaiting approval' },
            ].map((item) => (
              <button key={item.label} className="quiet-panel flex items-center gap-4 p-4 text-left transition-colors hover:border-white/14">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.045] text-[var(--accent-blue)]">
                  <item.icon size={17} />
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-white">{item.label}</span>
                  <span className="block text-[12px] text-[var(--text-muted)]">{item.meta}</span>
                </span>
              </button>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
