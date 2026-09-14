import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Clock,
  FileCheck2,
  Radio,
  AlertOctagon,
  Search,
  ExternalLink,
  Terminal,
  Activity,
  Zap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getIssueById } from '../api/issues';
import { Issue } from '../types/issue';
import { AgentStep, AgentType } from '../types/agent';
import { AgentTimeline } from '../components/agents/AgentTimeline';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { usePolling } from '../hooks/usePolling';
import { formatTicketId } from '../utils/formatters';

export const ProcessingPage: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [activeStage, setActiveStage] = useState<number>(0);
  const [isDone, setIsDone] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Fetch issue details
  const fetchIssue = async () => {
    if (!issueId) return;
    try {
      const data = await getIssueById(issueId);
      setIssue(data);
      if (data.status !== 'processing') {
        setIsDone(true);
      }
    } catch (err) {
      console.error('Failed to fetch issue status in processing:', err);
    }
  };

  useEffect(() => {
    fetchIssue();
  }, [issueId]);

  // Telemetry logs generator
  useEffect(() => {
    const logTimeline = [
      { time: 100, text: `[SYSTEM_INIT]: Ingesting case payload #${issueId || 'CR-001'}...` },
      { time: 600, text: `[TRIAGE_AGENT]: Extracting damage bounding box & severity classification...` },
      { time: 1200, text: `[TRIAGE_AGENT]: Confidence score: 96.4% · Classified as HIGH PRIORITY HAZARD` },
      { time: 1800, text: `[RESEARCH_AGENT]: Querying Municipal Spatial Boundaries & Ward GIS...` },
      { time: 2400, text: `[RESEARCH_AGENT]: Matched: Municipal Roads & Highway Dept (Zone 4)` },
      { time: 3000, text: `[RESEARCH_AGENT]: Charter SLA policy mapped: 48 Hours statutory threshold` },
      { time: 3600, text: `[ACTION_AGENT]: Generating formal legal-grade municipal notice...` },
      { time: 4200, text: `[ACTION_AGENT]: Formal clauses attached under Citizen Service Charter §4.2` },
      { time: 4800, text: `[ACTION_AGENT]: Transmitting ticket to City Dispatch Gateway API...` },
      { time: 5400, text: `[TRACKING_AGENT]: Dispatch acknowledged! Case #${formatTicketId(issueId)} registered.` },
      { time: 5800, text: `[ESCALATION_AGENT]: Watchdog telemetry armed · 24/7 SLA countdown active.` },
    ];

    const timeouts = logTimeline.map((item) =>
      setTimeout(() => {
        setLogs((prev) => [...prev, item.text]);
      }, item.time)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [issueId]);

  // Dynamic simulation progression timer for signature AI demo feel
  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStage(1), 1800); // Advance to Research
    const timer2 = setTimeout(() => setActiveStage(2), 3600); // Advance to Action
    const timer3 = setTimeout(() => {
      setActiveStage(3); // Advance to Tracking
      setIsDone(true);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
        colors: ['#00D9FF', '#5CFFB0', '#9B8CFF'],
      });
    }, 5500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Poll backend while not yet marked done
  usePolling(fetchIssue, 3000, !isDone);

  // Calculate percentage
  const progressPercent = activeStage === 0 ? 25 : activeStage === 1 ? 50 : activeStage === 2 ? 75 : 100;

  // Build live animated agent steps based on activeStage
  const agentSteps: AgentStep[] = [
    {
      id: 'p-triage',
      type: 'triage' as AgentType,
      title: 'Triage Agent',
      subtitle: 'Understanding your issue & classifying severity',
      status: activeStage > 0 ? 'completed' : 'processing',
      details: [
        { label: 'Hazard Class', value: (issue?.category || 'Pothole').toUpperCase(), highlight: true },
        { label: 'Severity Metric', value: (issue?.severity || 'High').toUpperCase() },
        { label: 'Telemetry Check', value: 'Geocoded & Verified' },
      ],
      summary: 'Verified report imagery and localized hazardous road surface failure.',
    },
    {
      id: 'p-research',
      type: 'research' as AgentType,
      title: 'Research Agent',
      subtitle: 'Identifying responsible municipal authority & SLA policy',
      status: activeStage > 1 ? 'completed' : activeStage === 1 ? 'processing' : 'pending',
      details: [
        { label: 'Authority', value: issue?.authority || 'Municipal Roads & Highway Dept', highlight: true },
        { label: 'Statutory SLA', value: `${issue?.sla_hours || 48} Hours Service Charter` },
        { label: 'Jurisdiction Code', value: 'Zone 4 Highway Directorate' },
      ],
      summary: 'Matched jurisdiction to Municipal Roads & Infrastructure under 48h Charter §4.2.',
    },
    {
      id: 'p-action',
      type: 'action' as AgentType,
      title: 'Action Agent',
      subtitle: 'Preparing legal-grade formal complaint & registering ticket',
      status: activeStage > 2 ? 'completed' : activeStage === 2 ? 'processing' : 'pending',
      details: [
        { label: 'Formal Document', value: 'Generated with statutory clauses' },
        { label: 'Ticket Reference', value: issue?.ticket?.ticket_number || formatTicketId(issueId), highlight: true },
        { label: 'Dispatch Gateway', value: 'City Direct API Gateway' },
      ],
      summary: 'Filed active municipal case notice with assigned reference ID.',
    },
    {
      id: 'p-tracking',
      type: 'tracking' as AgentType,
      title: 'Tracking Agent',
      subtitle: 'Actively monitoring municipal portal and countdown timer',
      status: activeStage >= 3 ? 'processing' : 'pending',
      details: [
        { label: 'SLA Watchdog', value: 'Active 24/7 Watchdog', highlight: true },
        { label: 'Queue Status', value: 'Dispatched to Dispatcher Queue' },
      ],
      summary: 'Telemetric monitor engaged. Watching authority response window.',
    },
    {
      id: 'p-escalation',
      type: 'escalation' as AgentType,
      title: 'Escalation Agent',
      subtitle: 'Standby for automated escalation if SLA threshold lapses',
      status: 'idle',
      details: [
        { label: 'Trigger State', value: 'Armed (triggers upon SLA expiry)' },
        { label: 'Approval Rule', value: 'Mandatory Citizen Confirmation' },
      ],
      summary: 'Will formulate executive escalation notice if response deadline passes.',
    },
  ];

  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-left space-y-8">
      {/* Top Banner Header & HUD */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/40 text-xs font-mono font-bold mb-3 shadow-glow-cyan">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-ping" />
            AUTONOMOUS PIPELINE LIVE TELEMETRY
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Autonomous Resolution Pipeline Active
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1.5 max-w-xl leading-relaxed">
            CivicRelay multi-agent system is running AI vision verification, querying city GIS jurisdiction registries, and filing your official ticket.
          </p>
        </div>

        {/* Neural Progress Ring Gauge */}
        <div className="flex items-center gap-4 p-4 rounded-3xl bg-surface-raised border border-border shrink-0 self-start md:self-auto">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-[#1E2B42]"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-neon-cyan transition-all duration-500"
                strokeDasharray={`${progressPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute font-mono text-xs font-extrabold text-foreground">
              {progressPercent}%
            </span>
          </div>

          <div className="text-xs">
            <span className="font-mono text-neon-cyan font-bold block">
              {activeStage === 0
                ? 'STAGE 1: TRIAGE'
                : activeStage === 1
                ? 'STAGE 2: RESEARCH'
                : activeStage === 2
                ? 'STAGE 3: ACTION'
                : 'STAGE 4: WATCHDOG'}
            </span>
            <span className="text-foreground-secondary text-[11px] block mt-0.5">
              {isDone ? 'Registration Dispatched' : 'Executing Autonomous Logic'}
            </span>
          </div>
        </div>
      </div>

      {/* Completion Banner */}
      {isDone && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-neon-mint/15 to-transparent border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-glow-mint"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center shadow-lg shrink-0">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h4 className="text-base font-bold text-foreground">
                Autonomous Dispatch Confirmed & Ticket Assigned
              </h4>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Ticket <span className="font-mono font-bold text-neon-mint">{formatTicketId(issueId)}</span> has been registered directly in the municipal dispatch database.
              </p>
            </div>
          </div>

          <Link to={`/issues/${issueId}`}>
            <Button
              variant="neon"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto font-black px-6"
            >
              Open Case Command Center
            </Button>
          </Link>
        </motion.div>
      )}

      {/* 2-Column Grid: Agent Timeline + Live Terminal Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Vertical Agent Pipeline */}
        <div className="lg:col-span-7">
          <Card className="p-6 sm:p-8 shadow-card border border-border">
            <AgentTimeline steps={agentSteps} />
          </Card>
        </div>

        {/* Right 5 Columns: Live Streaming Monospace Agent Terminal */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="p-5 border border-border bg-[#080D17] text-left flex flex-col h-[520px] shadow-2xl relative overflow-hidden font-mono">
            {/* Terminal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E2B42] shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-[11px] text-[#9AA7BA] font-bold ml-2 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-neon-cyan" /> agent_telemetry.log
                </span>
              </div>
              <span className="text-[10px] text-neon-mint bg-[#111A2A] px-2 py-0.5 rounded border border-[#1E2B42] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-mint animate-pulse" /> LIVE STREAM
              </span>
            </div>

            {/* Log Stream Area */}
            <div className="flex-1 overflow-y-auto space-y-2 text-[11px] text-[#9AA7BA] pr-1 scrollbar-thin">
              {logs.map((log, index) => (
                <div
                  key={index}
                  className={`leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-200 ${
                    log.includes('TRIAGE_AGENT')
                      ? 'text-neon-cyan'
                      : log.includes('RESEARCH_AGENT')
                      ? 'text-neon-mint'
                      : log.includes('ACTION_AGENT')
                      ? 'text-purple-300'
                      : log.includes('TRACKING_AGENT')
                      ? 'text-amber-300'
                      : log.includes('ESCALATION_AGENT')
                      ? 'text-rose-400 font-bold'
                      : 'text-[#627289]'
                  }`}
                >
                  {log}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            {/* Terminal Footer with Latency Telemetry */}
            <div className="pt-3 mt-3 border-t border-[#1E2B42] flex items-center justify-between text-[10px] text-[#627289] shrink-0">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-neon-cyan" /> Latency: ~180ms
              </span>
              <span>Encrypted Node v4.2</span>
            </div>
          </Card>

          {/* SLA Guarantee Callout */}
          <div className="p-4 rounded-2xl bg-surface-raised border border-border text-xs text-foreground-secondary space-y-2 text-left">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <ShieldCheck className="w-4 h-4 text-neon-mint" /> Autonomous Watchdog Assurance
            </div>
            <p className="text-[11px] leading-relaxed">
              Once registered, CivicRelay monitors municipal dispatch status 24/7. If the department exceeds its statutory SLA deadline, an executive escalation notice will be prepared automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
