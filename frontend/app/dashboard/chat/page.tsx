'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AudioLines,
  Bot,
  Brain,
  ChevronRight,
  Mic,
  MicOff,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Volume2,
  VolumeX,
  Zap,
  Target,
  MessageSquare,
} from 'lucide-react';
import Topbar from '@/components/layout/Topbar';
import { chatAPI, voiceAPI } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SentimentType = 'positive' | 'negative' | 'neutral';

type AIMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sentiment?: SentimentType;
  intent?: string;
  coaching_tip?: string;
  detected_objection?: string;
  objection_strategy?: string;
  buying_score?: number;
  latency_ms?: number;
};

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<SentimentType, { color: string; label: string }> = {
  positive: { color: 'var(--accent)', label: 'Positive' },
  negative: { color: 'var(--accent-red)', label: 'Negative' },
  neutral:  { color: 'var(--text-muted)', label: 'Neutral' },
};

const QUICK_PROMPTS = [
  'Analyze Acme Corp deal',
  'Generate follow-up email',
  'Practice objection handling',
  'Predict revenue this quarter',
  'Score my pipeline',
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [userName, setUserName] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [voiceOutput, setVoiceOutput] = useState(false);
  const [micError, setMicError] = useState('');
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAiMsgRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Smart scroll:
  // - When loading starts (user sent), scroll to bottom to show typing indicator
  // - When AI message arrives, scroll to the TOP of that message so user can read it
  useEffect(() => {
    if (loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (last.role === 'user') {
      // Scroll to bottom to see typing indicator below user message
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (last.id !== 'welcome') {
      // Scroll AI message into view from the top so user reads from start
      setTimeout(() => {
        lastAiMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }, [messages]);

  // Load conversation history on mount + fetch user name for personalization
  useEffect(() => {
    // Fetch user name
    getCurrentUser().then((user) => {
      const name = user?.full_name
        ? user.full_name.split(' ')[0]
        : user?.email?.split('@')[0] ?? '';
      setUserName(name);

      // Set personalized welcome message
      const greeting = getTimeGreeting();
      const nameStr = name ? `, ${name}` : '';
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `${greeting}${nameStr}! I'm Nexus, your AI sales copilot. Ask me about a deal, lead, follow-up, objection, or forecast. I can analyze your pipeline, coach you in real time, or help craft the perfect pitch.`,
      }]);
    });

    chatAPI.getConversations(20)
      .then(res => setConversations(res.data.conversations || []))
      .catch(() => {});
  }, []);

  // Auto-resize textarea
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 112)}px`;
  }, []);

  // ─── Voice output (ElevenLabs TTS) ──────────────────────────────────────────

  const playTTS = useCallback(async (text: string) => {
    try {
      const res = await voiceAPI.synthesize(text);
      const blob = new Blob([res.data as ArrayBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch {
      // TTS failed silently
    }
  }, []);

  // ─── Send message ────────────────────────────────────────────────────────────

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setInput('');
    setError('');
    resizeTextarea();

    const userMsg: AIMessage = { id: `u-${Date.now()}`, role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage({
        message: text,
        conversation_id: currentConversationId ?? undefined,
        stream: false,
      });

      const d = res.data;

      if (!currentConversationId && d.conversation_id) {
        setCurrentConversationId(d.conversation_id);
        // Refresh sidebar
        chatAPI.getConversations(20)
          .then(r => setConversations(r.data.conversations || []))
          .catch(() => {});
      }

      const aiMsg: AIMessage = {
        id: d.message_id ?? `a-${Date.now()}`,
        role: 'assistant',
        content: d.message,
        sentiment: d.sentiment as SentimentType,
        intent: d.intent,
        coaching_tip: d.coaching_tip,
        detected_objection: d.detected_objection,
        objection_strategy: d.objection_strategy,
        buying_score: d.buying_score,
        latency_ms: d.latency_ms,
      };

      setMessages(prev => [...prev, aiMsg]);

      // Auto-play TTS if voice output is on
      if (voiceOutput && d.message) {
        playTTS(d.message);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Nexus encountered an error. Check that the backend is running.';
      setError(errorMsg);
      setMessages(prev => prev.filter(m => m.id !== userMsg.id));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }, [input, loading, currentConversationId, voiceOutput, resizeTextarea, playTTS]);

  // ─── New thread ──────────────────────────────────────────────────────────────

  const newThread = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: 'Starting a new conversation. What would you like to work on?',
    }]);
    setCurrentConversationId(null);
    setError('');
  };

  // ─── Voice input (Mic → Whisper STT) ────────────────────────────────────────

  const toggleRecording = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    setMicError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size < 1000) return; // Too short
        try {
          const res = await voiceAPI.transcribe(blob);
          const transcript: string = res.data.transcript;
          if (transcript) {
            setInput(prev => (prev ? prev + ' ' + transcript : transcript));
            textareaRef.current?.focus();
          }
        } catch {
          setMicError('Transcription failed — check OpenAI key.');
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      setMicError('Microphone access denied.');
    }
  };

  // ─── Load conversation ───────────────────────────────────────────────────────

  const loadConversation = async (conv: Conversation) => {
    setCurrentConversationId(conv.id);
    setMessages([{ id: 'loading', role: 'assistant', content: 'Loading conversation...' }]);
    try {
      const res = await chatAPI.getMessages(conv.id);
      const msgs: AIMessage[] = (res.data.messages || []).map((m: { id: string; role: 'user' | 'assistant'; content: string }) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }));
      setMessages(msgs.length ? msgs : [{ id: 'empty', role: 'assistant', content: 'No messages in this conversation yet.' }]);
    } catch {
      setMessages([{ id: 'err', role: 'assistant', content: 'Failed to load conversation.' }]);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Topbar title="Nexus AI" subtitle="Intelligence across your entire pipeline" />

      <main className="flex-1 overflow-hidden">
        <div className="grid h-full lg:grid-cols-[272px_1fr]">

          {/* ── Sidebar ── */}
          <aside className="hidden border-r border-white/8 p-4 lg:flex lg:flex-col gap-3">
            <button onClick={newThread} className="btn btn-primary w-full gap-2">
              <Plus size={15} /> New Thread
            </button>

            {/* Voice output toggle */}
            <button
              onClick={() => setVoiceOutput(v => !v)}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px] transition-colors ${
                voiceOutput
                  ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-white/8 bg-white/[0.025] text-[var(--text-muted)] hover:text-white'
              }`}
            >
              {voiceOutput ? <Volume2 size={15} /> : <VolumeX size={15} />}
              <span className="flex-1 text-left">Voice responses</span>
              <span className={`text-[11px] font-semibold ${voiceOutput ? 'text-[var(--accent)]' : 'text-[var(--text-faint)]'}`}>
                {voiceOutput ? 'ON' : 'OFF'}
              </span>
            </button>

            <p className="mt-1 px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">
              Recent threads
            </p>

            <div className="flex-1 overflow-y-auto space-y-0.5">
              {conversations.length === 0 && (
                <p className="px-2 py-4 text-center text-[12px] text-[var(--text-faint)]">
                  No conversations yet
                </p>
              )}
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => loadConversation(conv)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] transition-colors ${
                    conv.id === currentConversationId
                      ? 'bg-white/[0.055] text-white'
                      : 'text-[var(--text-muted)] hover:bg-white/[0.035] hover:text-white'
                  }`}
                >
                  <span className="truncate flex-1 pr-2">{conv.title || 'Untitled'}</span>
                  <ChevronRight size={13} className="shrink-0 opacity-50" />
                </button>
              ))}
            </div>
          </aside>

          {/* ── Chat area ── */}
          <section className="relative flex min-w-0 flex-col min-h-0 overflow-hidden">
            {/* Messages */}
            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-8 md:px-8">
              <div className="mx-auto max-w-3xl space-y-6">

                {/* Hero state — shown only with welcome message */}
                {messages.length === 1 && messages[0].id === 'welcome' && (
                  <div className="text-center mb-4">
                    <div className="mx-auto mb-5 relative w-16 h-16">
                      <div className="absolute inset-0 rounded-2xl blur-xl bg-[var(--accent)] opacity-20 animate-pulse" />
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5">
                        <Sparkles size={26} className="text-white" />
                      </div>
                    </div>
                    <h1 className="text-[30px] font-semibold tracking-tight text-white md:text-[38px]">
                      Nexus understands your sales motion.
                    </h1>
                    <p className="mx-auto mt-3 max-w-lg text-[15px] leading-7 text-[var(--text-secondary)]">
                      Search, reason, generate, coach, and execute from one calm command surface.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {QUICK_PROMPTS.map((p) => (
                        <button key={p} onClick={() => send(p)} className="btn btn-secondary">
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <AnimatePresence initial={false}>
                  {messages.map((msg, idx) => {
                    const isLastAi = msg.role === 'assistant' && idx === messages.length - 1 && msg.id !== 'welcome';
                    return (
                    <motion.div
                      key={msg.id}
                      ref={isLastAi ? lastAiMsgRef : undefined}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.22 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="w-full max-w-[92%]">
                          {/* AI message header */}
                          <div className="mb-2 flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#08090b]">
                              <Bot size={13} />
                            </span>
                            <span className="text-[12px] font-semibold text-[var(--text-muted)]">Nexus</span>
                            {msg.latency_ms && (
                              <span className="text-[11px] text-[var(--text-faint)]">{msg.latency_ms}ms</span>
                            )}
                            {msg.sentiment && SENTIMENT_CONFIG[msg.sentiment] && (
                              <span
                                className="ml-auto text-[11px] font-semibold"
                                style={{ color: SENTIMENT_CONFIG[msg.sentiment].color }}
                              >
                                {SENTIMENT_CONFIG[msg.sentiment].label}
                              </span>
                            )}
                          </div>

                          {/* Main response */}
                          <div className="premium-panel p-4">
                            <p className="text-[14px] leading-7 text-[var(--text-secondary)] whitespace-pre-wrap">
                              {msg.content}
                            </p>

                            {/* Metrics row */}
                            {(msg.intent || msg.buying_score !== undefined) && (
                              <div className="mt-4 flex flex-wrap gap-2 border-t border-white/8 pt-3">
                                {msg.intent && msg.intent !== 'general_inquiry' && (
                                  <span className="status-pill gap-1.5">
                                    <Target size={11} />
                                    {msg.intent.replace(/_/g, ' ')}
                                  </span>
                                )}
                                {msg.buying_score !== undefined && msg.buying_score > 0 && (
                                  <span className="status-pill gap-1.5 border-[var(--accent)]/30 text-[var(--accent)]">
                                    <TrendingUp size={11} />
                                    Buying score {Math.round(msg.buying_score * 100)}%
                                  </span>
                                )}
                                {msg.detected_objection && (
                                  <span className="status-pill gap-1.5 border-[var(--accent-amber)]/30 text-[var(--accent-amber)]">
                                    <AlertTriangle size={11} />
                                    {msg.detected_objection}
                                  </span>
                                )}
                                {/* Speak this response button */}
                                <button
                                  onClick={() => playTTS(msg.content)}
                                  className="ml-auto icon-button h-7 w-7 border-0 bg-transparent"
                                  title="Play response as speech"
                                >
                                  <Volume2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Coaching tip */}
                          {msg.coaching_tip && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.15 }}
                              className="mt-2 flex items-start gap-2.5 rounded-lg border border-[var(--accent-blue)]/20 bg-[var(--accent-blue)]/5 px-3 py-2.5"
                            >
                              <Brain size={14} className="mt-0.5 shrink-0 text-[var(--accent-blue)]" />
                              <p className="text-[12px] leading-5 text-[var(--accent-blue)]">
                                <span className="font-semibold">Coaching: </span>
                                {msg.coaching_tip}
                              </p>
                            </motion.div>
                          )}

                          {/* Objection strategy */}
                          {msg.objection_strategy && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="mt-2 flex items-start gap-2.5 rounded-lg border border-[var(--accent-amber)]/20 bg-[var(--accent-amber)]/5 px-3 py-2.5"
                            >
                              <Zap size={14} className="mt-0.5 shrink-0 text-[var(--accent-amber)]" />
                              <p className="text-[12px] leading-5 text-[var(--accent-amber)]">
                                <span className="font-semibold">Counter: </span>
                                {msg.objection_strategy}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      ) : (
                        <div className="max-w-[78%] rounded-xl border border-white/10 bg-white px-4 py-3 text-[14px] leading-7 text-[#08090b]">
                          {msg.content}
                        </div>
                      )}
                    </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Typing / loading indicator */}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#08090b]">
                        <Bot size={13} />
                      </span>
                      <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.span
                            key={i}
                            className="h-2 w-2 rounded-full bg-[var(--accent)]"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                      <span className="text-[12px] text-[var(--text-faint)]">
                        Nexus is reasoning…
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div ref={bottomRef} />
              </div>
            </div>

            {/* ── Error banner ── */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/8 px-4 py-2.5 text-[13px] text-[var(--accent-red)]"
                >
                  <AlertTriangle size={14} />
                  <span className="flex-1">{error}</span>
                  <button onClick={() => setError('')} className="text-[var(--text-faint)] hover:text-white">✕</button>
                </motion.div>
              )}
              {micError && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-[var(--accent-amber)]/30 bg-[var(--accent-amber)]/8 px-4 py-2.5 text-[13px] text-[var(--accent-amber)]"
                >
                  <MicOff size={14} />
                  <span className="flex-1">{micError}</span>
                  <button onClick={() => setMicError('')} className="text-[var(--text-faint)] hover:text-white">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Input bar ── */}
            <div className="border-t border-white/8 bg-[rgba(8,9,11,0.82)] p-4 backdrop-blur-xl">
              <div className="mx-auto max-w-3xl">
                <div className="input-shell flex items-end gap-2 p-2">
                  <button className="icon-button shrink-0 border-0 bg-transparent" aria-label="Attach file">
                    <Paperclip size={17} />
                  </button>
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => { setInput(e.target.value); resizeTextarea(); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                    }}
                    placeholder="Ask Nexus anything about your pipeline, leads, or deals…"
                    rows={1}
                    className="max-h-28 min-h-10 flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[14px] text-white outline-none placeholder:text-[var(--text-faint)]"
                  />

                  {/* Mic button — STT */}
                  <button
                    onClick={toggleRecording}
                    className={`icon-button shrink-0 transition-all ${
                      recording
                        ? 'border-[var(--accent-red)]/50 bg-[var(--accent-red)]/15 text-[var(--accent-red)]'
                        : ''
                    }`}
                    aria-label={recording ? 'Stop recording' : 'Start voice input'}
                    title={recording ? 'Stop (send to Nexus)' : 'Voice input via Whisper'}
                  >
                    {recording ? (
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      >
                        <MicOff size={17} />
                      </motion.span>
                    ) : (
                      <Mic size={17} />
                    )}
                  </button>

                  {/* Voice output toggle */}
                  <button
                    onClick={() => setVoiceOutput(v => !v)}
                    className={`icon-button shrink-0 ${
                      voiceOutput ? 'border-[var(--accent)]/40 bg-[var(--accent)]/10 text-[var(--accent)]' : ''
                    }`}
                    aria-label="Toggle voice response"
                    title={voiceOutput ? 'Voice output ON' : 'Voice output OFF'}
                  >
                    {voiceOutput ? <AudioLines size={17} /> : <MessageSquare size={17} />}
                  </button>

                  <button
                    onClick={() => send()}
                    disabled={!input.trim() || loading}
                    className="btn btn-primary shrink-0 px-3"
                    aria-label="Send message"
                  >
                    <Send size={16} />
                  </button>
                </div>

                <p className="mt-2 text-center text-[11px] text-[var(--text-faint)]">
                  Powered by Groq LLaMA 3.3 70B · RAG knowledge base · Real-time sentiment
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
