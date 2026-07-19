'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Sparkles, Zap, AlertTriangle, Info, type LucideIcon } from 'lucide-react';
import React, { ReactNode } from 'react';

/* ─────────────────────────────────────────────────────────── */
/* SparkLine — tiny inline SVG trend line                      */
/* ─────────────────────────────────────────────────────────── */
interface SparkLineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function SparkLine({ data, color = '#10b981', width = 64, height = 24 }: SparkLineProps) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  // Area fill path
  const areaPath = `M ${pad},${pad + h} ` +
    data.map((v, i) => {
      const x = pad + (i / (data.length - 1)) * w;
      const y = pad + h - ((v - min) / range) * h;
      return `L ${x},${y}`;
    }).join(' ') +
    ` L ${pad + w},${pad + h} Z`;

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const x = pad + w;
        const y = pad + h - ((last - min) / range) * h;
        return <circle cx={x} cy={y} r={2.5} fill={color} />;
      })()}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* StatCard                                                    */
/* ─────────────────────────────────────────────────────────── */
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconColor?: string;
  trend?: number;
  delay?: number;
  sparkline?: number[];
  confidence?: number;
  live?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  iconColor = '#10b981',
  trend,
  delay = 0,
  sparkline,
  confidence,
  live = false,
}: StatCardProps) {
  const isPos = trend !== undefined && trend > 0;
  const isNeg = trend !== undefined && trend < 0;
  const TrendIcon = isPos ? TrendingUp : isNeg ? TrendingDown : Minus;
  const trendColor = isPos ? '#10b981' : isNeg ? '#f43f5e' : '#71717a';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] }}
      className="card card-hover"
      style={{
        cursor: 'default',
        padding: '14px 16px 12px',
        position: 'relative',
        overflow: 'hidden',
        /* Subtle top-edge tint */
        borderTop: live ? `1px solid ${iconColor}30` : undefined,
      }}
    >
      {/* Soft top gradient */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 48,
          background: `linear-gradient(180deg, ${iconColor}09 0%, transparent 100%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Top row: title + live dot + icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <p className="t-overline">{title}</p>
          {live && (
            <span
              style={{
                width: 4, height: 4, borderRadius: '50%',
                background: '#10b981', flexShrink: 0,
                animation: 'ai-pulse 2s ease-in-out infinite',
              }}
            />
          )}
        </div>
        <div
          style={{
            width: 30, height: 30, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: `${iconColor}12`,
            border: `1px solid ${iconColor}20`,
          }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
      </div>

      {/* Metric value */}
      <div
        className="font-display"
        style={{
          fontSize: 28, fontWeight: 700,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          marginBottom: 3,
        }}
      >
        {value}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p style={{ fontSize: 11, color: '#52525b', lineHeight: 1.4, marginBottom: 10 }}>{subtitle}</p>
      )}

      {/* Bottom row: trend + sparkline */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {trend !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '2px 5px', borderRadius: 5,
                  background: `${trendColor}14`,
                }}
              >
                <TrendIcon size={9} style={{ color: trendColor }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: trendColor }}>{Math.abs(trend)}%</span>
              </div>
              <span style={{ fontSize: 10, color: '#3f3f46' }}>vs last week</span>
            </div>
          )}
          {confidence !== undefined && (
            <div className="badge badge-ai" style={{ width: 'fit-content', fontSize: 9.5 }}>
              AI {confidence}%
            </div>
          )}
        </div>

        {sparkline && sparkline.length >= 2 && (
          <SparkLine data={sparkline} color={iconColor} width={60} height={24} />
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* Card                                                        */
/* ─────────────────────────────────────────────────────────── */
interface CardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  hover?: boolean;
  glow?: boolean;
  style?: React.CSSProperties;
}

export function Card({
  children,
  className = '',
  delay = 0,
  onClick,
  hover = false,
  glow = false,
  style,
}: CardProps) {
  const baseClass = glow ? 'card-glow' : 'card';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease: [0.4, 0, 0.2, 1] }}
      className={`${baseClass} ${hover ? 'card-hover cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </motion.div>
  );
}

/** @deprecated Use Card instead */
export function GlassCard({ children, className = '', delay = 0, onClick, hover = false }: CardProps) {
  return <Card className={className} delay={delay} onClick={onClick} hover={hover}>{children}</Card>;
}

/* ─────────────────────────────────────────────────────────── */
/* AIInsightCard                                               */
/* ─────────────────────────────────────────────────────────── */
type Priority = 'high' | 'medium' | 'low' | 'info';

interface AIInsightCardProps {
  priority: Priority;
  title: string;
  description: string;
  confidence: number;
  impact: string;
  category: string;
  action: string;
  delay?: number;
  featured?: boolean;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; emoji: string; badge: string; iconColor: string }> = {
  high:   { label: 'High Priority',   emoji: '🔥', badge: 'badge-priority-high',   iconColor: '#f43f5e' },
  medium: { label: 'Medium Priority', emoji: '⚡', badge: 'badge-priority-medium', iconColor: '#f59e0b' },
  low:    { label: 'Low Priority',    emoji: '💡', badge: 'badge-priority-low',    iconColor: '#6366f1' },
  info:   { label: 'Insight',         emoji: '✦',  badge: 'badge-success',         iconColor: '#10b981' },
};

export function AIInsightCard({
  priority,
  title,
  description,
  confidence,
  impact,
  category,
  action,
  delay = 0,
  featured = false,
}: AIInsightCardProps) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <motion.div
      initial={{ opacity: 0, y: featured ? 8 : 0, x: featured ? 0 : -6 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      transition={{ duration: featured ? 0.4 : 0.3, delay, ease: [0.4, 0, 0.2, 1] }}
      className={`insight-card priority-${priority}`}
      style={featured ? {
        /* Featured card: stronger presence */
        background: 'linear-gradient(135deg, #131318 0%, #111115 100%)',
        borderColor: priority === 'high' ? 'rgba(244,63,94,0.22)' : 'rgba(99,102,241,0.22)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        padding: '16px 18px',
      } : {
        padding: '13px 15px',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: featured ? 10 : 7, gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: featured ? 14 : 12 }}>{cfg.emoji}</span>
          <span className={`badge ${cfg.badge}`} style={featured ? { fontSize: 10.5 } : { fontSize: 10 }}>{cfg.label}</span>
          <span className="badge badge-default" style={{ fontSize: 9.5 }}>{category}</span>
        </div>
        <span className="badge badge-ai" style={{ fontSize: 9.5 }}>AI {confidence}%</span>
      </div>

      {/* Title */}
      <p className="font-display tracking-tight" style={{
        fontSize: featured ? 14.5 : 13.5,
        fontWeight: featured ? 700 : 600,
        color: '#ffffff',
        marginBottom: featured ? 6 : 4,
        lineHeight: 1.4,
      }}>
        {title}
      </p>

      {/* Description */}
      <p style={{
        fontSize: featured ? 12 : 11.5,
        color: featured ? '#71717a' : '#5a5a66',
        lineHeight: 1.6,
        marginBottom: featured ? 12 : 9,
      }}>
        {description}
      </p>

      {/* Impact + Action row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <TrendingUp size={10} color="#34d399" />
          <span style={{ fontSize: 10.5, color: '#34d399', fontWeight: 700 }}>{impact}</span>
        </div>
        <button
          className="btn btn-xs"
          style={{
            fontSize: featured ? 11.5 : 10.5,
            color: '#818cf8',
            borderColor: 'rgba(99,102,241,0.28)',
            background: 'rgba(99,102,241,0.10)',
            padding: featured ? '4px 10px' : '3px 8px',
            fontWeight: 600,
          }}
        >
          {action}
        </button>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* ActivityFeedItem                                             */
/* ─────────────────────────────────────────────────────────── */
type ActivityType = 'lead' | 'followup' | 'sentiment' | 'score' | 'conversion';

interface ActivityFeedItemProps {
  type: ActivityType;
  text: string;
  time: string;
  delay?: number;
}

const ACTIVITY_CONFIG: Record<ActivityType, { color: string; bg: string; Icon: LucideIcon }> = {
  lead:       { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  Icon: Zap },
  followup:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  Icon: Sparkles },
  sentiment:  { color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   Icon: AlertTriangle },
  score:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  Icon: TrendingUp },
  conversion: { color: '#a855f7', bg: 'rgba(168,85,247,0.12)',  Icon: Info },
};

export function ActivityFeedItem({ type, text, time, delay = 0 }: ActivityFeedItemProps) {
  const cfg = ACTIVITY_CONFIG[type];
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, delay, ease: [0.4, 0, 0.2, 1] }}
      className="activity-item"
      style={{
        borderLeft: `2px solid ${cfg.color}25`,
        paddingLeft: 10,
        marginLeft: 2,
        borderRadius: 0,
      }}
    >
      <div className="activity-icon-wrap" style={{ background: cfg.bg, borderRadius: 6 }}>
        <cfg.Icon size={11} color={cfg.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11.5, color: '#c4c4cc', lineHeight: 1.45, marginBottom: 1 }}>{text}</p>
        <p style={{ fontSize: 10, color: '#3f3f46', letterSpacing: '0.01em' }}>{time}</p>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* LeadBadge                                                   */
/* ─────────────────────────────────────────────────────────── */
interface LeadBadgeProps {
  category: 'hot' | 'warm' | 'cold';
  size?: 'sm' | 'md';
}

export function LeadBadge({ category, size = 'md' }: LeadBadgeProps) {
  const cfg = {
    hot:  { label: 'Hot',  cls: 'badge-hot'  },
    warm: { label: 'Warm', cls: 'badge-warm' },
    cold: { label: 'Cold', cls: 'badge-cold' },
  }[category];

  return (
    <span
      className={`badge ${cfg.cls}`}
      style={size === 'sm' ? { fontSize: '10px', padding: '1px 6px' } : {}}
    >
      {cfg.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* SentimentBadge                                              */
/* ─────────────────────────────────────────────────────────── */
interface SentimentBadgeProps {
  sentiment: string;
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const cfg: Record<string, { cls: string; label: string }> = {
    positive: { cls: 'badge-success', label: 'Positive' },
    negative: { cls: 'badge-hot',     label: 'Negative' },
    neutral:  { cls: 'badge-default', label: 'Neutral'  },
  };
  const c = cfg[sentiment] || cfg.neutral;
  return <span className={`badge ${c.cls}`}>{c.label}</span>;
}

/* ─────────────────────────────────────────────────────────── */
/* ScoreRing                                                   */
/* ─────────────────────────────────────────────────────────── */
interface ScoreRingProps {
  score: number;
  size?: number;
}

export function ScoreRing({ score, size = 52 }: ScoreRingProps) {
  const color = score >= 70 ? '#f43f5e' : score >= 40 ? '#f59e0b' : '#6366f1';
  return (
    <div
      className="flex items-center justify-center rounded-full font-bold text-white flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${score * 3.6}deg, #27272a 0deg)`,
        fontSize: size < 48 ? 11 : 13,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full"
        style={{ width: size - 8, height: size - 8, background: '#09090b' }}
      >
        {score}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* TypingIndicator                                             */
/* ─────────────────────────────────────────────────────────── */
export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 px-4 py-3 rounded-2xl w-fit"
      style={{ background: '#18181b', border: '1px solid #27272a' }}
    >
      <div className="typing-dot" />
      <div className="typing-dot" />
      <div className="typing-dot" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* LoadingSpinner                                              */
/* ─────────────────────────────────────────────────────────── */
export function LoadingSpinner({ size = 18 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className="rounded-full border-2 border-transparent"
        style={{
          width: size,
          height: size,
          borderTopColor: '#6366f1',
          borderRightColor: 'rgba(99,102,241,0.2)',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* EmptyState                                                  */
/* ─────────────────────────────────────────────────────────── */
export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: '#18181b', border: '1px solid #27272a' }}
      >
        <span className="text-zinc-400">{icon}</span>
      </div>
      <h3 className="text-[14px] font-semibold text-zinc-200 mb-1">{title}</h3>
      <p className="text-[13px] text-zinc-500 max-w-xs leading-relaxed">{description}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* StatusDot                                                   */
/* ─────────────────────────────────────────────────────────── */
export function StatusDot({ active = true }: { active?: boolean }) {
  return (
    <span
      className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
      style={{ background: active ? '#10b981' : '#3f3f46' }}
    />
  );
}
