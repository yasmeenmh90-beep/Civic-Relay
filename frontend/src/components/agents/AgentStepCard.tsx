import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  FileCheck2,
  Radio,
  AlertOctagon,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { AgentStep, AgentType } from '../../types/agent';
import { cn } from '../../utils/formatters';

export interface AgentStepCardProps {
  step: AgentStep;
  isLast?: boolean;
}

const AGENT_ICONS: Record<AgentType, React.ReactNode> = {
  triage: <Sparkles className="w-5 h-5" />,
  research: <Search className="w-5 h-5" />,
  action: <FileCheck2 className="w-5 h-5" />,
  tracking: <Radio className="w-5 h-5" />,
  escalation: <AlertOctagon className="w-5 h-5" />,
};

export const AgentStepCard: React.FC<AgentStepCardProps> = ({ step, isLast = false }) => {
  const isCompleted = step.status === 'completed';
  const isProcessing = step.status === 'processing';
  const isPending = step.status === 'pending' || step.status === 'idle';
  const isFailed = step.status === 'failed';

  const nodeColorClass = isCompleted
    ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(52,211,153,0.5)] ring-4 ring-emerald-500/20'
    : isProcessing
    ? 'bg-surface-raised text-neon-cyan border-2 border-neon-cyan shadow-neon-cyan ring-4 ring-neon-cyan/20 animate-pulse'
    : isFailed
    ? 'bg-rose-500 text-white shadow-neon-danger ring-4 ring-rose-500/20'
    : 'bg-surface-elevated text-foreground-muted border border-border';

  const cardBorderClass = isProcessing
    ? 'border-neon-cyan/60 shadow-[0_0_25px_rgba(0,217,255,0.15)] bg-surface ring-1 ring-neon-cyan/30'
    : isCompleted
    ? 'border-border bg-surface shadow-card'
    : 'border-border/60 bg-surface-raised/40 opacity-75';

  return (
    <div className="relative flex items-start gap-4 sm:gap-6 text-left group">
      {/* Node / Indicator Column */}
      <div className="flex flex-col items-center shrink-0">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 z-10',
            nodeColorClass
          )}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-white" />
          ) : (
            AGENT_ICONS[step.type]
          )}
        </motion.div>

        {/* Vertical Connector Line */}
        {!isLast && (
          <div
            className={cn(
              'w-0.5 min-h-[4rem] sm:min-h-[4.5rem] my-1 transition-colors duration-500',
              isCompleted
                ? 'bg-gradient-to-b from-emerald-400 to-neon-cyan'
                : isProcessing
                ? 'bg-gradient-to-b from-neon-cyan to-border animate-pulse'
                : 'bg-border'
            )}
          />
        )}
      </div>

      {/* Card Content */}
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35 }}
        className={cn(
          'flex-1 rounded-3xl p-5 sm:p-6 transition-all duration-300 mb-4 border',
          cardBorderClass
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                {step.title}
                {isProcessing && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neon-cyan/15 text-cyan-800 dark:text-neon-cyan border border-neon-cyan/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-ping" />
                    Active Agent
                  </span>
                )}
                {isCompleted && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Completed
                  </span>
                )}
              </h3>
            </div>
            <p className="text-xs text-foreground-secondary mt-1">{step.subtitle}</p>
          </div>

          {step.status === 'processing' && (
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-700 dark:text-neon-cyan bg-surface-raised px-3 py-1.5 rounded-xl border border-border shrink-0 self-start">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </div>
          )}
        </div>

        {/* Structured Decision Summaries (Requirement #21 - No chain of thought) */}
        {step.details && step.details.length > 0 && (isCompleted || isProcessing) && (
          <div className="mt-4 pt-3.5 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {step.details.map((detail, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-2.5 rounded-xl bg-surface-raised border border-border transition-colors',
                  detail.highlight && 'bg-neon-cyan/5 border-neon-cyan/30 text-cyan-700 dark:text-neon-cyan font-semibold'
                )}
              >
                <div className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">
                  {detail.label}
                </div>
                <div className="text-xs text-foreground font-medium mt-0.5 truncate">
                  {detail.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {step.summary && (isCompleted || isProcessing) && (
          <p className="text-xs text-foreground-secondary mt-3 italic bg-surface-raised/60 p-2.5 rounded-xl border border-border">
            "{step.summary}"
          </p>
        )}
      </motion.div>
    </div>
  );
};
