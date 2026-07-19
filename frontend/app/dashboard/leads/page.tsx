'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Building2, Flame, Mail, Phone, Plus, Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';

type Lead = {
  id: string;
  name: string;
  email: string;
  company: string;
  score: number;
  category: 'Hot' | 'Warm' | 'Cold';
  revenue: string;
  status: string;
  reason: string;
  next: string;
};

const leads: Lead[] = [
  { id: '1', name: 'Emily Rodriguez', email: 'emily@startupxyz.com', company: 'StartupXYZ', score: 91, category: 'Hot', revenue: '$18,500', status: 'Negotiating', reason: 'Viewed pricing twice and asked for rollout timeline.', next: 'Send ROI proposal' },
  { id: '2', name: 'Sarah Chen', email: 'sarah@techcorp.com', company: 'TechCorp', score: 87, category: 'Hot', revenue: '$12,400', status: 'Qualified', reason: 'Champion invited security lead to the thread.', next: 'Book technical review' },
  { id: '3', name: 'Amanda Torres', email: 'amanda@consulting.io', company: 'Consulting.io', score: 74, category: 'Warm', revenue: '$9,200', status: 'Qualified', reason: 'Strong use case, but no budget owner confirmed.', next: 'Ask budget question' },
  { id: '4', name: 'Marcus Johnson', email: 'marcus@globalfin.com', company: 'GlobalFin', score: 62, category: 'Warm', revenue: '$7,800', status: 'Contacted', reason: 'Clicked compliance resources after first call.', next: 'Share SOC2 notes' },
  { id: '5', name: 'James Whitfield', email: 'james@nexacloud.com', company: 'NexaCloud', score: 55, category: 'Warm', revenue: '$14,000', status: 'Contacted', reason: 'Needs executive alignment before next step.', next: 'Draft champion email' },
  { id: '6', name: 'Priya Kapoor', email: 'priya@fintech.io', company: 'FinTech.io', score: 44, category: 'Cold', revenue: '$6,100', status: 'New', reason: 'Inbound interest is early and undeveloped.', next: 'Run qualification' },
];

const filters = ['All', 'Hot', 'Enterprise', 'At risk'];

export default function LeadsPage() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('1');
  const [filter, setFilter] = useState('All');

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchesQuery = `${lead.name} ${lead.company} ${lead.email}`.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === 'All' || lead.category === filter || (filter === 'Enterprise' && Number(lead.revenue.replace(/\D/g, '')) > 10000) || (filter === 'At risk' && lead.status === 'Negotiating');
      return matchesQuery && matchesFilter;
    });
  }, [query, filter]);

  const selected = leads.find((lead) => lead.id === selectedId) ?? leads[0];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Topbar title="Leads" subtitle="Who deserves attention" />
      <main className="flex-1 overflow-y-auto py-8">
        <div className="page-container space-y-6">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                <Sparkles size={14} className="text-[var(--accent)]" />
                AI Lead Intelligence
              </p>
              <h1 className="text-[32px] font-semibold tracking-tight text-white md:text-[42px]">Focus the room before the room gets noisy.</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
                Nexus ranks leads by intent, urgency, revenue potential, and the next action most likely to move the deal.
              </p>
            </div>
            <button className="btn btn-primary w-fit">
              <Plus size={15} />
              Add Lead
            </button>
          </section>

          <section className="premium-panel p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="input-shell flex h-11 flex-1 items-center gap-3 px-3">
                <Search size={16} className="text-[var(--text-muted)]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search leads, companies, intent signals..."
                  className="flex-1 border-0 bg-transparent text-[14px] text-white outline-none placeholder:text-[var(--text-faint)]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {filters.map((item) => (
                  <button key={item} onClick={() => setFilter(item)} className={`btn ${filter === item ? 'btn-primary' : 'btn-secondary'}`}>
                    {item}
                  </button>
                ))}
                <button className="icon-button" aria-label="Open filters" title="Filters">
                  <SlidersHorizontal size={16} />
                </button>
              </div>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
            <section className="premium-panel overflow-hidden">
              <div className="grid grid-cols-[1.2fr_0.7fr_0.5fr_0.55fr] border-b border-white/8 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)] max-md:hidden">
                <span>Lead</span>
                <span>Signal</span>
                <span>Score</span>
                <span className="text-right">Next</span>
              </div>
              <div className="divide-y divide-white/8">
                {filtered.map((lead, index) => (
                  <motion.button
                    key={lead.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onClick={() => setSelectedId(lead.id)}
                    className={`grid w-full gap-4 px-5 py-4 text-left transition-colors md:grid-cols-[1.2fr_0.7fr_0.5fr_0.55fr] md:items-center ${
                      selectedId === lead.id ? 'bg-white/[0.055]' : 'hover:bg-white/[0.035]'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.045] text-[13px] font-semibold text-white">
                        {lead.name.split(' ').map((part) => part[0]).join('')}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold text-white">{lead.name}</span>
                        <span className="block truncate text-[12px] text-[var(--text-muted)]">{lead.company} · {lead.revenue}</span>
                      </span>
                    </span>
                    <span>
                      <span className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-secondary)]">
                        {lead.category === 'Hot' && <Flame size={12} className="text-[var(--accent)]" />}
                        {lead.category} · {lead.status}
                      </span>
                      <span className="line-clamp-1 text-[12px] text-[var(--text-muted)]">{lead.reason}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-[22px] font-semibold tracking-tight text-white">{lead.score}</span>
                      <span className="h-7 w-16 rounded-md bg-gradient-to-r from-white/5 to-[rgba(50,213,131,0.2)]" />
                    </span>
                    <span className="flex items-center justify-between gap-2 md:justify-end">
                      <span className="text-[12px] font-semibold text-[var(--text-secondary)]">{lead.next}</span>
                      <ArrowUpRight size={15} className="text-[var(--text-muted)]" />
                    </span>
                  </motion.button>
                ))}
              </div>
            </section>

            <aside className="premium-panel h-fit p-5">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Selected lead</p>
                  <h2 className="mt-2 text-[22px] font-semibold tracking-tight text-white">{selected.name}</h2>
                  <p className="mt-1 text-[13px] text-[var(--text-muted)]">{selected.company}</p>
                </div>
                <span className="status-pill text-[var(--accent)]">Score {selected.score}</span>
              </div>
              <div className="space-y-4">
                <div className="quiet-panel p-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Nexus reasoning</p>
                  <p className="text-[13px] leading-6 text-[var(--text-secondary)]">{selected.reason}</p>
                </div>
                <div className="quiet-panel p-4">
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Recommended action</p>
                  <p className="text-[15px] font-semibold text-white">{selected.next}</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button className="icon-button h-11 w-full" title="Email"><Mail size={16} /></button>
                  <button className="icon-button h-11 w-full" title="Call"><Phone size={16} /></button>
                  <button className="icon-button h-11 w-full" title="Company"><Building2 size={16} /></button>
                </div>
                <button className="btn btn-primary w-full">Execute Next Step</button>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
