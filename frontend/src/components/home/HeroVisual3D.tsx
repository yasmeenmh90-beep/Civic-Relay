import React, { useState } from 'react';
import {
  FileText,
  Search,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Building2,
  Shield,
  Activity,
} from 'lucide-react';
import { DepthCard } from '../ui/DepthCard';
import { cn } from '../../utils/formatters';

interface AgentStage {
  id: string;
  name: string;
  role: string;
  icon: React.ReactNode;
  color: 'cyan' | 'mint' | 'purple' | 'amber' | 'rose' | 'emerald';
  status: 'COMPLETED' | 'ACTIVE' | 'PENDING';
  detail: string;
}

const STAGES: AgentStage[] = [
  {
    id: 'report',
    name: 'Report',
    role: 'Citizen Input',
    icon: <FileText className="w-4 h-4" />,
    color: 'cyan',
    status: 'COMPLETED',
    detail: 'Citizen submitted high-resolution photo & geo-coordinates at 5th & Elm Ave.',
  },
  {
    id: 'understand',
    name: 'Triage Agent',
    role: 'Hazard Classification',
    icon: <Cpu className="w-4 h-4" />,
    color: 'cyan',
    status: 'COMPLETED',
    detail: 'AI Vision classified critical Water Main Rupture with 99.2% confidence score.',
  },
  {
    id: 'research',
    name: 'Research Agent',
    role: 'Jurisdiction & SLA',
    icon: <Search className="w-4 h-4" />,
    color: 'mint',
    status: 'COMPLETED',
    detail: 'Identified Dept. of Public Works. Extracted statutory 24-hour response charter §4.2.',
  },
  {
    id: 'act',
    name: 'Action Agent',
    role: 'Official Dispatch',
    icon: <Zap className="w-4 h-4" />,
    color: 'purple',
    status: 'ACTIVE',
    detail: 'Autonomous generation of legal complaint notice; dispatched ticket #CIV-8092.',
  },
  {
    id: 'track',
    name: 'Tracking Agent',
    role: 'SLA Watchdog',
    icon: <Clock className="w-4 h-4" />,
    color: 'amber',
    status: 'PENDING',
    detail: '24/7 continuous telemetry polling. SLA deadline: 18h remaining.',
  },
  {
    id: 'escalate',
    name: 'Escalation Agent',
    role: 'Executive Relay',
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'rose',
    status: 'PENDING',
    detail: 'Staged hierarchical escalation to City Commissioner if breach is detected.',
  },
  {
    id: 'resolve',
    name: 'Resolution',
    role: 'Verified Close',
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: 'emerald',
    status: 'PENDING',
    detail: 'Audit trail signed with municipal verification timestamp & public notification.',
  },
];

export const HeroVisual3D: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<AgentStage>(STAGES[3]);

  return (
    <div className="relative w-full max-w-5xl mx-auto pt-4 pb-10">
      {/* Background glow halo */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-neon-cyan/10 via-neon-purple/10 to-neon-mint/10 rounded-3xl blur-2xl pointer-events-none" />

      {/* Pipeline Navigation Nodes (REPORT → UNDERSTAND → RESEARCH → ACT → TRACK → ESCALATE → RESOLVE) */}
      <div className="mb-6 overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-[720px] px-4 py-3 rounded-2xl bg-surface/80 border border-border/80 backdrop-blur-md shadow-subtle">
          {STAGES.map((stage, idx) => {
            const isSelected = selectedStage.id === stage.id;
            const isCompleted = stage.status === 'COMPLETED';
            const isActive = stage.status === 'ACTIVE';

            return (
              <React.Fragment key={stage.id}>
                <button
                  type="button"
                  onClick={() => setSelectedStage(stage)}
                  className={cn(
                    'group relative flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer',
                    isSelected
                      ? 'bg-foreground/5 dark:bg-white/10 scale-105'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm',
                      isCompleted && 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30',
                      isActive && 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 shadow-glow-cyan animate-pulse',
                      !isCompleted && !isActive && 'bg-slate-100 dark:bg-slate-800 text-foreground-muted border border-border'
                    )}
                  >
                    {stage.icon}
                  </div>
                  <div className="text-center">
                    <span
                      className={cn(
                        'block text-[11px] font-bold tracking-tight',
                        isSelected ? 'text-foreground' : 'text-foreground-secondary'
                      )}
                    >
                      {stage.name}
                    </span>
                    <span className="block text-[9px] text-foreground-muted font-mono uppercase tracking-wider">
                      {stage.status}
                    </span>
                  </div>
                </button>

                {idx < STAGES.length - 1 && (
                  <div className="flex-1 h-[2px] mx-1 bg-gradient-to-r from-border to-border-subtle relative overflow-hidden">
                    {idx < 3 && (
                      <div className="absolute inset-0 bg-neon-cyan/60 animate-pulse" />
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Floating 3D Simulated Incident Card */}
      <DepthCard
        glowColor="cyan"
        tiltIntensity={8}
        glass
        className="p-6 sm:p-8 text-left border border-neon-cyan/30 shadow-2xl relative"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/80">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wider bg-neon-cyan/15 text-cyan-700 dark:text-neon-cyan border border-neon-cyan/30">
                LIVE TELEMETRY INCIDENT
              </span>
              <span className="text-xs text-foreground-muted font-mono">#CIV-2026-8092</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Autonomous Engine Active
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Ruptured High-Pressure Water Main & Street Flooding
            </h3>
            <p className="text-xs sm:text-sm text-foreground-secondary mt-0.5">
              Intersection of 5th Ave & Market St, Sector 4 · Reported 34 minutes ago
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <div className="text-right">
              <span className="text-[10px] text-foreground-muted uppercase font-bold tracking-wider block">
                Statutory SLA Window
              </span>
              <span className="text-lg font-black font-mono text-neon-cyan">
                17h : 26m : 11s
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan shadow-sm">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Dynamic Highlight for Selected Pipeline Stage */}
        <div className="mt-6 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-border/70 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-neon-cyan/15 text-cyan-600 dark:text-neon-cyan border border-neon-cyan/30">
            {selectedStage.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                Stage: {selectedStage.name} ({selectedStage.role})
              </h4>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-foreground/10 text-foreground">
                STATE: {selectedStage.status}
              </span>
            </div>
            <p className="text-xs text-foreground-secondary mt-1 leading-relaxed">
              {selectedStage.detail}
            </p>
          </div>
        </div>

        {/* Real-time telemetry grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-surface-raised border border-border/60">
            <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider flex items-center gap-1">
              <Building2 className="w-3 h-3 text-neon-mint" /> Authority
            </span>
            <span className="text-xs font-bold text-foreground mt-1 block truncate">
              Water & Sanitation Dept.
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-raised border border-border/60">
            <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider flex items-center gap-1">
              <Shield className="w-3 h-3 text-purple-400" /> Citizen Privacy
            </span>
            <span className="text-xs font-bold text-foreground mt-1 block truncate">
              PII Masked & Encrypted
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-raised border border-border/60">
            <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3 text-neon-cyan" /> Urgency
            </span>
            <span className="text-xs font-bold text-rose-500 dark:text-rose-400 mt-1 block truncate">
              P1 High Priority Hazard
            </span>
          </div>

          <div className="p-3 rounded-xl bg-surface-raised border border-border/60">
            <span className="text-[10px] font-medium text-foreground-muted uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Citizen Action
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 block truncate">
              Zero Forms Required
            </span>
          </div>
        </div>
      </DepthCard>
    </div>
  );
};

