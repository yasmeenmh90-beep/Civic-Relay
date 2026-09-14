import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  Clock,
  Cpu,
  FileCheck2,
  AlertOctagon,
  CheckCircle2,
  Search,
  Activity,
  Layers,
  BarChart2,
  Terminal,
  Play,
  Flame,
  Radio,
  Building2,
  RefreshCw,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DepthCard } from '../components/ui/DepthCard';
import { Card } from '../components/ui/Card';
import { HeroVisual3D } from '../components/home/HeroVisual3D';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeAgentTab, setActiveAgentTab] = useState<'triage' | 'research' | 'action' | 'tracking' | 'escalation'>('triage');
  const [simulatingSandbox, setSimulatingSandbox] = useState(false);
  const [sandboxStep, setSandboxStep] = useState(0);

  // Live sandbox demo trigger
  const runSandboxDemo = () => {
    setSimulatingSandbox(true);
    setSandboxStep(1); // Triage
    setTimeout(() => setSandboxStep(2), 1200); // Research
    setTimeout(() => setSandboxStep(3), 2400); // Action
    setTimeout(() => setSandboxStep(4), 3600); // Tracking
    setTimeout(() => {
      setSimulatingSandbox(false);
      setSandboxStep(0);
      navigate('/processing/iss-901');
    }, 4800);
  };

  const agentDetails = {
    triage: {
      title: 'Triage Agent',
      subtitle: 'Neural Damage Analysis & Spatial Ingestion',
      badge: 'Vision & NLP Engine',
      latency: '~120ms',
      input: 'Citizen photo evidence + GPS coordinate payload',
      output: 'Classified: Structural Pothole · Severity: High · Geolocation Verified',
      codeSnippet: `TRIAGE_PIPELINE: {\n  hazard_type: "asphalt_structural_failure",\n  risk_factor: 0.94,\n  bounding_box: [37.7749, -122.4194],\n  priority_class: "URGENT"\n}`,
    },
    research: {
      title: 'Research Agent',
      subtitle: 'Municipal Boundary GIS & Charter Matching',
      badge: 'Jurisdiction Resolver',
      latency: '~240ms',
      input: 'Triage classification + City Ward GIS Layer',
      output: 'Authority: Municipal Roads & Highway Dept · Statutory SLA: 48h',
      codeSnippet: `JURISDICTION_RESOLVER: {\n  authority: "Municipal Roads & Highway Dept",\n  charter_statute: "Service Charter §4.2",\n  statutory_sla_hours: 48,\n  division_code: "ZONE_4_HWY"\n}`,
    },
    action: {
      title: 'Action Agent',
      subtitle: 'Legal Complaint Generation & API Dispatch',
      badge: 'Document & Dispatch',
      latency: '~380ms',
      input: 'Matched authority rules + citizen report context',
      output: 'Formal Legal Notice Generated · Municipal Ticket CIV-1048 Registered',
      codeSnippet: `ACTION_GATEWAY: {\n  ticket_id: "CIV-1048",\n  legal_notice_compiled: true,\n  urgency_clause_attached: true,\n  gateway_status: "201_CREATED"\n}`,
    },
    tracking: {
      title: 'Tracking Agent',
      subtitle: '24/7 SLA Watchdog & Status Telemetry',
      badge: 'Watchdog & Polling',
      latency: '~40ms per ping',
      input: 'Active ticket identifier CIV-1048 + municipal queue status',
      output: 'Monitoring response window · Real-time countdown ticker armed',
      codeSnippet: `WATCHDOG_DAEMON: {\n  target_deadline: "2026-08-30T16:30:00Z",\n  sla_remaining: "31h 42m",\n  inspection_status: "AWAITING_FIELD_CREW"\n}`,
    },
    escalation: {
      title: 'Escalation Agent',
      subtitle: 'Hierarchical Escalation & Human Approval Guard',
      badge: 'Executive Oversight',
      latency: '~210ms',
      input: 'Watchdog SLA breach trigger + Citizen authorization',
      output: 'Tier-2 Executive Escalation dispatched to Director General',
      codeSnippet: `ESCALATION_STAGING: {\n  breach_detected: true,\n  recipient: "Director General of Public Works",\n  human_approval_status: "APPROVED_BY_CITIZEN"\n}`,
    },
  };

  const currentAgent = agentDetails[activeAgentTab];

  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6"
        >
          {/* Top Live Telemetry Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-raised border border-border shadow-glow-cyan text-xs font-semibold text-foreground backdrop-blur-xl">
            <span className="flex h-2 w-2 rounded-full bg-neon-cyan animate-ping" />
            <span className="font-mono text-neon-cyan uppercase">Autonomous Civic Resolution Framework</span>
            <span className="text-foreground-muted">·</span>
            <span className="text-neon-mint font-bold">Zero Bureaucracy</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-foreground max-w-4xl mx-auto leading-[1.06]">
            Report civic issues once.{' '}
            <span className="bg-gradient-to-r from-neon-cyan via-teal-300 to-neon-mint bg-clip-text text-transparent">
              AI solves the rest.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-foreground-secondary max-w-2xl mx-auto leading-relaxed">
            Citizens report a problem once. CivicRelay's autonomous AI agents classify the hazard, find the exact government department, draft legal complaints, and actively enforce resolution deadlines.
          </p>

          {/* CTA Buttons + 1-Click Interactive Sandbox */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/report" className="w-full sm:w-auto">
              <Button
                variant="neon"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
                className="w-full sm:w-auto text-base px-8 py-4 shadow-glow-cyan font-black"
              >
                Report an Issue
              </Button>
            </Link>

            <button
              type="button"
              onClick={runSandboxDemo}
              disabled={simulatingSandbox}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#111A2A] border border-neon-cyan/40 text-xs sm:text-sm font-bold text-neon-cyan hover:bg-[#172235] hover:border-neon-cyan shadow-glow-cyan transition-all flex items-center justify-center gap-2 cursor-pointer font-mono"
            >
              {simulatingSandbox ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-neon-mint" />
                  <span>
                    {sandboxStep === 1
                      ? 'Triage Agent analyzing...'
                      : sandboxStep === 2
                      ? 'Research Agent mapping...'
                      : sandboxStep === 3
                      ? 'Action Agent generating...'
                      : 'Launching Case HUD...'}
                  </span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-neon-cyan" />
                  <span>1-Click Live AI Sandbox Demo</span>
                </>
              )}
            </button>

            <Link to="/community-map" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<MapPin className="w-5 h-5 text-neon-purple" />}
                className="w-full sm:w-auto text-base px-6 py-4"
              >
                Live City Map
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* 3D Visual System Showcase */}
        <div className="mt-12">
          <HeroVisual3D />
        </div>
      </section>

      {/* Live Public Resolutions Ticker */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="p-4 rounded-3xl bg-[#0D1422] border border-[#1E2B42] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono shadow-2xl">
          <div className="flex items-center gap-2 text-neon-cyan shrink-0 font-bold">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>LIVE CIVIC TELEMETRY:</span>
          </div>
          <div className="flex items-center gap-6 overflow-x-auto text-foreground-secondary text-[11px] whitespace-nowrap">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Case #CIV-0984 (Market West) Resolved in 14h
            </span>
            <span className="flex items-center gap-1.5 text-neon-cyan">
              <Clock className="w-3.5 h-3.5" /> Case #CIV-1048 (North Gate Pothole) In Progress · 31h left
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <Flame className="w-3.5 h-3.5" /> Case #CIV-1022 (5th & Pine Lights) Escalated to Director General
            </span>
          </div>
        </div>
      </section>

      {/* Interactive Agent Architecture Inspector (Requirement #1 & #61) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-neon-cyan bg-neon-cyan/10 px-3 py-1 rounded-full border border-neon-cyan/30 mb-2">
            <Cpu className="w-3.5 h-3.5" /> INTERACTIVE AGENT INSPECTOR
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight">
            Explore the 5 Autonomous AI Agents
          </h2>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
            Click any agent to inspect its neural inputs, deterministic outputs, and statutory execution logic
          </p>
        </div>

        {/* Agent Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-surface-raised rounded-3xl border border-border mb-6">
          {[
            { id: 'triage', label: '1. Triage Agent', color: 'text-neon-cyan' },
            { id: 'research', label: '2. Research Agent', color: 'text-neon-mint' },
            { id: 'action', label: '3. Action Agent', color: 'text-neon-purple' },
            { id: 'tracking', label: '4. Tracking Agent', color: 'text-amber-400' },
            { id: 'escalation', label: '5. Escalation Agent', color: 'text-rose-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveAgentTab(tab.id as any)}
              className={`p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-center font-mono ${
                activeAgentTab === tab.id
                  ? 'bg-[#080D17] text-foreground border border-neon-cyan/40 shadow-glow-cyan'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-[#172235]'
              }`}
            >
              <span className={tab.color}>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active Agent Telemetry Card */}
        <Card className="p-6 sm:p-8 border border-border bg-[#0D1422] text-left shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col: Details */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-neon-cyan uppercase px-2.5 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                  {currentAgent.badge}
                </span>
                <span className="text-xs font-mono text-neon-mint flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Latency: {currentAgent.latency}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-black text-foreground">{currentAgent.title}</h3>
                <p className="text-xs text-foreground-secondary mt-0.5">{currentAgent.subtitle}</p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-1">
                  <span className="text-[10px] font-mono uppercase text-foreground-muted block">INPUT TELEMETRY</span>
                  <p className="text-xs font-semibold text-foreground">{currentAgent.input}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-surface border border-border space-y-1">
                  <span className="text-[10px] font-mono uppercase text-foreground-muted block">AUTONOMOUS OUTPUT</span>
                  <p className="text-xs font-bold text-neon-mint">{currentAgent.output}</p>
                </div>
              </div>
            </div>

            {/* Right Col: Monospace Code Snippet Terminal */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl bg-[#080D17] border border-[#1E2B42] p-4 font-mono text-xs text-cyan-300 h-full flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E2B42] text-[11px] text-[#627289]">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-neon-cyan" /> execution_pipeline.json
                  </span>
                  <span>v4.2</span>
                </div>
                <pre className="py-4 text-[11px] text-neon-cyan overflow-x-auto whitespace-pre-wrap leading-relaxed">
                  {currentAgent.codeSnippet}
                </pre>
                <div className="text-[10px] text-foreground-muted pt-2 border-t border-[#1E2B42] flex items-center justify-between">
                  <span>Deterministic SLA Guarantee</span>
                  <span className="text-neon-mint">Verified ✔</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Traditional 311 vs CivicRelay Comparison */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Why CivicRelay vs Traditional Government Forms
          </h2>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
            Eliminating administrative drag with automated multi-agent coordination
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Traditional 311 */}
          <Card className="p-8 border border-rose-500/30 bg-rose-500/5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-rose-400">Traditional Civic Portals & 311</h3>
              <span className="text-xs font-mono text-rose-400 font-bold px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                Manual Drag
              </span>
            </div>
            <ul className="space-y-3 text-xs text-foreground-secondary">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">✕</span>
                <span>Citizen must manually search for correct department and jurisdiction</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">✕</span>
                <span>Tickets get lost in bureaucratic backlog with zero transparency</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">✕</span>
                <span>No automated SLA deadline enforcement or breach warnings</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold mt-0.5">✕</span>
                <span>No formal escalation to department leadership when neglected</span>
              </li>
            </ul>
          </Card>

          {/* CivicRelay Autonomous AI */}
          <Card className="p-8 border border-neon-cyan/40 bg-neon-cyan/5 space-y-4 shadow-glow-cyan">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-neon-cyan">CivicRelay Autonomous Agent</h3>
              <span className="text-xs font-mono text-neon-mint font-bold px-2 py-0.5 rounded bg-neon-mint/10 border border-neon-mint/30">
                Autonomous
              </span>
            </div>
            <ul className="space-y-3 text-xs text-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-neon-mint shrink-0 mt-0.5" />
                <span>Single report with photo or voice; AI resolves exact department</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-neon-mint shrink-0 mt-0.5" />
                <span>Action Agent generates legal-grade formal municipal notice</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-neon-mint shrink-0 mt-0.5" />
                <span>24/7 SLA watchdog with live countdown clock against city charter</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-neon-mint shrink-0 mt-0.5" />
                <span>Autonomous executive escalation with 1-click citizen approval</span>
              </li>
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
};
