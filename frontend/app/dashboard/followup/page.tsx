'use client';

import { useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Mail,
  MessageCircle,
  PenLine,
  Send,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import Topbar from '@/components/layout/Topbar';

const channels = [
  { id: 'email', label: 'Email', detail: 'Inbox-ready follow-up', icon: Mail },
  { id: 'linkedin', label: 'LinkedIn', detail: 'Short social touch', icon: MessageCircle },
  { id: 'summary', label: 'Meeting recap', detail: 'Concise recap note', icon: FileText },
];

const templates = ['Post-demo', 'Pricing objection', 'No response', 'Champion enablement'];
const tones = ['Executive', 'Warm', 'Direct'];

export default function FollowupPage() {
  const [channel, setChannel] = useState('email');
  const [template, setTemplate] = useState('Post-demo');
  const [tone, setTone] = useState('Executive');
  const [context, setContext] = useState('Spoke with Emily at StartupXYZ. They want proof that SalesMind can improve conversion without adding CRM overhead.');
  const [draft, setDraft] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generate = () => {
    setGenerating(true);
    window.setTimeout(() => {
      setDraft(`Subject: Next steps for StartupXYZ\n\nHi Emily,\n\nThanks again for walking me through how your team is managing pipeline quality today. The biggest opportunity I heard was reducing manual lead review while keeping reps focused on the accounts most likely to convert.\n\nBased on that, I put together a short plan showing how SalesMind can help your team prioritize high-intent prospects, generate follow-ups faster, and coach reps around objections without adding CRM overhead.\n\nWould Thursday morning work for a 20-minute review with your RevOps lead?\n\nBest,\nAlex`);
      setGenerating(false);
    }, 850);
  };

  const copyDraft = async () => {
    if (!draft) return;
    await navigator.clipboard?.writeText(draft);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[var(--bg-base)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-85"
        style={{
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.025), transparent 260px), linear-gradient(115deg, rgba(50,213,131,0.055), transparent 30%, rgba(106,167,255,0.045), transparent 62%)',
        }}
      />
      <Topbar title="Follow-ups" subtitle="Draft · Approve · Send" />
      <main className="relative flex-1 overflow-y-auto py-6">
        <div className="page-container space-y-6">
          <section className="premium-panel relative overflow-hidden p-6 md:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-80"
              style={{
                background:
                  'linear-gradient(135deg, rgba(50,213,131,0.12), transparent 32%), linear-gradient(230deg, rgba(106,167,255,0.09), transparent 34%), radial-gradient(circle at 78% 22%, rgba(255,255,255,0.075), transparent 20%)',
              }}
            />
            <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(50,213,131,0.24)] bg-[rgba(50,213,131,0.08)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  <Sparkles size={13} />
                  AI Drafting Studio
                </p>
                <h1 className="max-w-3xl text-[34px] font-semibold leading-[1.02] tracking-tight text-white md:text-[52px]">
                  Turn call context into follow-ups that move deals.
                </h1>
                <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
                  Compose, polish, approve, and send a buyer-specific message from one focused workflow.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[430px]">
                {[
                  { icon: Clock, label: 'Due today', value: '12' },
                  { icon: Target, label: 'Reply lift', value: '+28%' },
                  { icon: BadgeCheck, label: 'Ready', value: draft ? '1' : '0' },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/[0.09] bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
                    <stat.icon size={15} className="mb-3 text-[var(--accent)]" />
                    <p className="text-[20px] font-semibold text-white">{stat.value}</p>
                    <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid min-h-[650px] gap-6 xl:grid-cols-[380px_1fr_320px]">
            <aside className="premium-panel relative overflow-hidden p-5">
              <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">Message inputs</p>
                  <h2 className="mt-2 text-[20px] font-semibold tracking-tight text-white">Compose brief</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] text-[var(--accent)]">
                  <PenLine size={17} />
                </span>
              </div>
              <div className="mt-5 space-y-5">
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Channel</p>
                  <div className="grid gap-2">
                    {channels.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setChannel(item.id)}
                        className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all ${
                          channel === item.id
                            ? 'border-[rgba(50,213,131,0.42)] bg-[rgba(50,213,131,0.07)] shadow-[inset_0_1px_0_rgba(255,255,255,0.055)]'
                            : 'border-white/[0.075] bg-white/[0.025] hover:border-white/[0.15] hover:bg-white/[0.04]'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-[var(--accent-blue)]">
                            <item.icon size={16} />
                          </span>
                          <span>
                            <span className="block text-[13px] font-semibold text-white">{item.label}</span>
                            <span className="mt-0.5 block text-[11px] text-[var(--text-muted)]">{item.detail}</span>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Template</p>
                  <div className="flex flex-wrap gap-2">
                    {templates.map((item) => (
                      <button key={item} onClick={() => setTemplate(item)} className={`rounded-xl border px-3 py-2 text-[12px] font-semibold transition-all ${template === item ? 'border-white bg-white text-[#08090b]' : 'border-white/[0.08] bg-white/[0.035] text-[var(--text-muted)] hover:border-white/[0.16] hover:text-white'}`}>
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Tone</p>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/[0.075] bg-black/20 p-1.5">
                    {tones.map((item) => (
                      <button
                        key={item}
                        onClick={() => setTone(item)}
                        className={`rounded-xl px-2.5 py-2 text-[11.5px] font-semibold transition-all ${
                          tone === item ? 'bg-white text-[#08090b]' : 'text-[var(--text-muted)] hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">Context</p>
                  <textarea
                    value={context}
                    onChange={(event) => setContext(event.target.value)}
                    className="min-h-48 w-full resize-none rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4 text-[13px] font-medium leading-6 text-white outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] placeholder:text-[var(--text-faint)] focus:border-[rgba(50,213,131,0.34)]"
                  />
                </div>
                <button
                  onClick={generate}
                  disabled={generating || !context.trim()}
                  className="group flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[14px] font-semibold text-[#08090b] shadow-[0_18px_44px_rgba(255,255,255,0.1)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_54px_rgba(255,255,255,0.15)] disabled:translate-y-0 disabled:opacity-40"
                >
                  <Sparkles size={15} />
                  {generating ? 'Generating...' : 'Generate Draft'}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </aside>

            <section className="premium-panel relative flex flex-col overflow-hidden shadow-[0_28px_90px_rgba(0,0,0,0.24)]">
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    'linear-gradient(140deg, rgba(255,255,255,0.028), transparent 36%), linear-gradient(320deg, rgba(50,213,131,0.04), transparent 28%)',
                }}
              />
              <div className="relative flex items-center justify-between border-b border-white/[0.075] bg-white/[0.018] px-5 py-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">Draft preview</p>
                  <h2 className="mt-1 text-[16px] font-semibold text-white">{template} follow-up</h2>
                  <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">{channel} · {tone} tone</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyDraft} className="icon-button" disabled={!draft} aria-label="Copy draft"><Copy size={16} /></button>
                  <button className="btn btn-secondary" disabled={!draft}><Send size={15} /> Send</button>
                </div>
              </div>
              <div className="relative flex-1 p-6">
                {draft ? (
                  <div className="h-full rounded-3xl border border-white/[0.09] bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      className="h-full min-h-[470px] w-full resize-none border-0 bg-transparent text-[15px] font-medium leading-8 text-white outline-none placeholder:text-[var(--text-faint)]"
                    />
                  </div>
                ) : (
                  <div className="flex h-full min-h-[470px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.11] bg-black/15 text-center">
                    <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.04] text-[var(--accent)]">
                      <Sparkles size={24} />
                    </span>
                    <p className="text-[17px] font-semibold text-white">Your polished follow-up will appear here.</p>
                    <p className="mt-2 max-w-sm text-[13px] leading-6 text-[var(--text-muted)]">Add the deal context, choose a playbook, then generate a message ready for review.</p>
                  </div>
                )}
              </div>
            </section>

            <aside className="space-y-4">
              <section className="premium-panel p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">Workflow</p>
                  <h2 className="mt-2 text-[18px] font-semibold tracking-tight text-white">Send readiness</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.1] bg-white/[0.035] text-[var(--accent)]">
                  <CalendarClock size={17} />
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  ['Context captured', 'From call notes and CRM activity', true],
                  ['Draft generated', draft ? 'Version 1 ready for approval' : 'Waiting for generation', Boolean(draft)],
                  ['Approval', 'Manager review optional', false],
                  ['Send', 'Track opens and replies', false],
                ].map(([title, detail, done]) => (
                  <div key={title as string} className="flex gap-3">
                    <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border ${done ? 'border-[var(--accent)] bg-[rgba(50,213,131,0.12)] text-[var(--accent)]' : 'border-white/10 text-[var(--text-faint)]'}`}>
                      <CheckCircle2 size={14} />
                    </span>
                    <span>
                      <span className="block text-[13px] font-semibold text-white">{title}</span>
                      <span className="block text-[12px] leading-5 text-[var(--text-muted)]">{detail}</span>
                    </span>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary mt-8 w-full" disabled={!draft}>
                Approve
              </button>
              </section>

              <section className="premium-panel p-5">
                <p className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-white">
                  <Zap size={14} className="text-[var(--accent-amber)]" />
                  Quality checks
                </p>
                <div className="space-y-2">
                  {['Specific next step', 'Buyer pain included', 'Low-friction CTA'].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-xl border border-white/[0.065] bg-white/[0.025] px-3 py-2">
                      <span className="text-[12px] text-[var(--text-muted)]">{item}</span>
                      <CheckCircle2 size={14} className={draft ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'} />
                    </div>
                  ))}
                </div>
                {copied && (
                  <p className="mt-3 rounded-xl border border-[rgba(50,213,131,0.2)] bg-[rgba(50,213,131,0.07)] px-3 py-2 text-[12px] font-semibold text-[var(--accent)]">
                    Draft copied.
                  </p>
                )}
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
