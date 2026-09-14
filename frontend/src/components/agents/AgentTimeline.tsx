import React from 'react';
import { motion } from 'framer-motion';
import { AgentStep } from '../../types/agent';
import { AgentStepCard } from './AgentStepCard';
import { Card } from '../ui/Card';
import { Sparkles, Cpu } from 'lucide-react';

export interface AgentTimelineProps {
  steps: AgentStep[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({
  steps,
  title = 'Autonomous Agent Pipeline',
  subtitle = 'Multi-agent system managing civic triage, jurisdiction mapping, and formal routing',
  className,
}) => {
  return (
    <div className={className}>
      {(title || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-8 text-left">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-neon-cyan/15 text-cyan-700 border border-neon-cyan/30">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>
            </div>
            {subtitle && <p className="text-xs text-foreground-secondary mt-1">{subtitle}</p>}
          </div>

          <div className="flex items-center gap-2 text-xs text-foreground-muted bg-white/80 border border-border px-3 py-1.5 rounded-xl shadow-xs self-start">
            <Sparkles className="w-3.5 h-3.5 text-neon-cyan" />
            <span>Autonomous Execution</span>
          </div>
        </div>
      )}

      <div className="space-y-0 relative">
        {steps.map((step, index) => (
          <AgentStepCard
            key={step.id || step.type || index}
            step={step}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </div>
  );
};
