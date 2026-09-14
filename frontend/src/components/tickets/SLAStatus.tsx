import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, ShieldAlert, CheckCircle2, Flame, Wrench, ShieldCheck, Zap } from 'lucide-react';
import { useSLA } from '../../hooks/useSLA';
import { Button } from '../ui/Button';
import { formatShortDateTime } from '../../utils/date';
import { simulateSLAExpiry } from '../../api/tickets';
import { useToast } from '../../context/ToastContext';
import { IS_DEMO_MODE } from '../../api/client';

export interface SLAStatusProps {
  ticketId: string;
  expectedResponseDate?: string;
  totalHours?: number;
  isEscalated?: boolean;
  isResolved?: boolean;
  onExpiryTriggered?: () => void;
  showDemoControl?: boolean;
}

export const SLAStatus: React.FC<SLAStatusProps> = ({
  ticketId,
  expectedResponseDate,
  totalHours = 48,
  isEscalated = false,
  isResolved = false,
  onExpiryTriggered,
  showDemoControl = true,
}) => {
  const { isExpired, formatted, percentElapsed, remainingSeconds } = useSLA(expectedResponseDate, totalHours);
  const [isSimulating, setIsSimulating] = useState(false);
  const toast = useToast();

  const handleSimulateExpiry = async () => {
    setIsSimulating(true);
    try {
      await simulateSLAExpiry(ticketId);
      toast.warning('SLA Expired Simulation Triggered', `Ticket #${ticketId} SLA forcefully lapsed.`);
      if (onExpiryTriggered) {
        onExpiryTriggered();
      }
    } catch (err: any) {
      toast.error('Simulation Failed', err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  if (isResolved) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-card text-left">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center shadow-lg shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-black text-emerald-400 uppercase tracking-wider">
              Statutory Resolution Achieved
            </h4>
            <p className="text-xs text-foreground-secondary mt-0.5">
              Case inspected and formally signed off within statutory municipal response timeline.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isWarningOverdue = isExpired || isEscalated;

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border transition-all duration-300 text-left relative overflow-hidden ${
        isWarningOverdue
          ? 'bg-[#14080D] border-rose-500/50 shadow-neon-danger ring-1 ring-rose-500/40'
          : 'bg-[#0D1422] border-border shadow-card hover:shadow-3d-hover'
      }`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left 8 Cols: Countdown Clock & Target */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl border ${
                isWarningOverdue
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-glow-danger animate-pulse'
                  : 'bg-neon-cyan/15 text-neon-cyan border-neon-cyan/40 shadow-glow-cyan'
              }`}
            >
              {isWarningOverdue ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-foreground-muted block">
                MUNICIPAL SLA WATCHDOG
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-2 mt-0.5">
                {isWarningOverdue ? (
                  <span className="text-rose-400 flex items-center gap-2">
                    <Flame className="w-6 h-6 animate-bounce" />
                    SLA THRESHOLD EXPIRED
                  </span>
                ) : (
                  <span className="font-mono text-neon-cyan drop-shadow-[0_0_12px_rgba(0,217,255,0.4)]">
                    {formatted}
                  </span>
                )}
              </h3>
            </div>
          </div>

          <p className="text-xs text-foreground-secondary leading-relaxed">
            {isWarningOverdue ? (
              <span className="text-rose-300 font-medium">
                The expected municipal resolution window has lapsed. CivicRelay's Escalation Agent has prepared formal executive notice.
              </span>
            ) : (
              <>
                Target response guaranteed by <span className="font-bold text-foreground">{formatShortDateTime(expectedResponseDate)}</span> under Municipal Citizen Service Charter §4.2.
              </>
            )}
          </p>
        </div>

        {/* Right 4 Cols: Progress Ring & Status Pill */}
        <div className="md:col-span-4 flex flex-col items-start md:items-end justify-center space-y-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
              isWarningOverdue
                ? 'bg-rose-500 text-slate-950 font-black shadow-glow-danger animate-pulse'
                : 'bg-surface-raised text-neon-mint border border-neon-mint/30 shadow-glow-mint'
            }`}
          >
            {isWarningOverdue ? 'Overdue' : 'Charter Active'}
          </span>
          <span className="text-[11px] font-mono text-foreground-muted">
            {totalHours}h Guaranteed Target Window
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6 space-y-2">
        <div className="flex justify-between text-xs text-foreground-secondary font-mono font-semibold">
          <span>Window Elapsed</span>
          <span>{isWarningOverdue ? '100% (BREACHED)' : `${percentElapsed}% elapsed`}</span>
        </div>
        <div className="w-full h-3 bg-surface-raised rounded-full overflow-hidden p-0.5 border border-border">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${isWarningOverdue ? 100 : percentElapsed}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full transition-all duration-500 ${
              isWarningOverdue
                ? 'bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600 shadow-glow-danger'
                : percentElapsed > 75
                ? 'bg-gradient-to-r from-amber-400 to-rose-400'
                : 'bg-gradient-to-r from-neon-cyan via-teal-400 to-neon-mint shadow-glow-cyan'
            }`}
          />
        </div>
      </div>

      {/* Developer Demo Control */}
      {showDemoControl && (
        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-raised/60 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 sm:px-8 rounded-b-3xl">
          <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold">
            <Wrench className="w-4 h-4 text-purple-400" />
            <span>DEVELOPER DEMO CONTROLS</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateExpiry}
            isLoading={isSimulating}
            className="text-xs border-purple-500/40 text-purple-300 hover:bg-purple-950/50 self-start sm:self-auto font-mono"
          >
            Simulate SLA Expiry
          </Button>
        </div>
      )}
    </div>
  );
};
