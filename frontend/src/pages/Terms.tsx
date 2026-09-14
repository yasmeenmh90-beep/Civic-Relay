import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-left space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Overview
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-neon-purple text-xs font-bold border border-purple-200 dark:border-purple-800">
          <Scale className="w-3.5 h-3.5" /> Public Service Agreement
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
          Terms of Service & SLA Charter
        </h1>
        <p className="text-xs text-foreground-muted font-mono">Effective date: September 2026</p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-neon-mint" /> 1. Autonomous Agent Scope
          </h2>
          <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
            CivicRelay operates as an autonomous civic advocacy agent on behalf of citizens. The system interfaces with public municipality endpoints and publishes formal citizen notices under open government service standards.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" /> 2. Emergency Services Exemption
          </h2>
          <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
            CivicRelay is engineered for civil infrastructure, utility failures, environmental hazards, and municipal maintenance. It is NOT a replacement for emergency response services (911, 112, or local immediate rescue dispatch).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Scale className="w-4 h-4 text-neon-cyan" /> 3. Human Approval in the Loop
          </h2>
          <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
            While routine research, routing, and telemetry tracking occur autonomously, formal escalations to supervisory or executive municipal bodies require explicit citizen authorization prior to final transmission.
          </p>
        </section>
      </Card>
    </div>
  );
};

