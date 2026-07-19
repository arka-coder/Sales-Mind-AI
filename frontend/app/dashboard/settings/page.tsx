'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Copy, Database, KeyRound, ShieldCheck, Zap } from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import { healthAPI } from '@/lib/api';

const services = [
  ['Groq AI', 'GROQ_API_KEY', 'AI chat, coaching, and insights'],
  ['ElevenLabs', 'ELEVENLABS_API_KEY', 'Voice synthesis'],
  ['OpenAI Whisper', 'OPENAI_API_KEY', 'Speech transcription'],
  ['Supabase', 'SUPABASE_URL', 'Database and realtime storage'],
  ['Resend', 'RESEND_API_KEY', 'Email delivery'],
];

const envTemplate = `GROQ_API_KEY=your_key
OPENAI_API_KEY=your_key
ELEVENLABS_API_KEY=your_key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=your_key
RESEND_API_KEY=re_xxxxxxxxxxxx`;

export default function SettingsPage() {
  const [health, setHealth] = useState<Record<string, boolean> | null>(null);
  const [checking, setChecking] = useState(false);

  const checkHealth = async () => {
    setChecking(true);
    try {
      const response = await healthAPI.check();
      setHealth(response.data.services || {});
      toast.success('System health refreshed');
    } catch {
      toast.error('Backend is not reachable');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Topbar title="Settings" subtitle="Trust, integrations, and workspace controls" />
      <main className="flex-1 overflow-y-auto py-8">
        <div className="page-container space-y-6">
          <section className="premium-panel p-6 md:p-8">
            <p className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              <ShieldCheck size={14} className="text-[var(--accent)]" />
              Enterprise Controls
            </p>
            <h1 className="text-[32px] font-semibold tracking-tight text-white md:text-[42px]">Configure the intelligence layer behind SalesMind.</h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--text-secondary)]">
              Keep model providers, voice, database, and delivery services visible without crowding the selling workflow.
            </p>
          </section>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
            <section className="premium-panel p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-tight text-white">System health</h2>
                  <p className="mt-1 text-[13px] text-[var(--text-muted)]">Verify connected backend services.</p>
                </div>
                <button onClick={checkHealth} disabled={checking} className="btn btn-primary">
                  <Zap size={15} />
                  {checking ? 'Checking' : 'Check'}
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {services.map(([name, key]) => {
                  const active = health?.[name.toLowerCase()] ?? health?.[key.toLowerCase()] ?? false;
                  return (
                    <div key={name} className="quiet-panel flex items-center justify-between p-4">
                      <span>
                        <span className="block text-[14px] font-semibold text-white">{name}</span>
                        <span className="block font-mono text-[11px] text-[var(--text-muted)]">{key}</span>
                      </span>
                      <span className={`status-pill ${active ? 'text-[var(--accent)]' : ''}`}>
                        <span className={active ? 'dot' : 'h-1.5 w-1.5 rounded-full bg-[var(--text-faint)]'} />
                        {active ? 'Active' : 'Unset'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="premium-panel p-5">
              <div className="mb-5 flex items-center gap-2">
                <KeyRound size={18} className="text-[var(--accent-amber)]" />
                <h2 className="text-[18px] font-semibold tracking-tight text-white">Required keys</h2>
              </div>
              <div className="space-y-3">
                {services.map(([name, key, description]) => (
                  <div key={key} className="quiet-panel p-4">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="text-[14px] font-semibold text-white">{name}</p>
                      <code className="rounded bg-white/[0.045] px-2 py-1 text-[11px] text-[var(--text-secondary)]">{key}</code>
                    </div>
                    <p className="text-[12px] text-[var(--text-muted)]">{description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="premium-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-[var(--accent-blue)]" />
                <h2 className="text-[18px] font-semibold tracking-tight text-white">Environment template</h2>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(envTemplate);
                  toast.success('Copied environment template');
                }}
                className="btn btn-secondary"
              >
                <Copy size={15} />
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-white/8 bg-black/25 p-4 text-[12px] leading-6 text-[var(--text-secondary)]">
              {envTemplate}
            </pre>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {['Apply Supabase schema', 'Start backend service', 'Upload knowledge base'].map((item) => (
              <div key={item} className="quiet-panel flex items-center gap-3 p-4">
                <CheckCircle2 size={17} className="text-[var(--accent)]" />
                <span className="text-[13px] font-semibold text-white">{item}</span>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
