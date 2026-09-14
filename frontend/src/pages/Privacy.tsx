import React from 'react';
import { Shield, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-left space-y-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Overview
      </Link>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-neon-cyan text-xs font-bold border border-cyan-200 dark:border-cyan-800">
          <Shield className="w-3.5 h-3.5" /> Civic Data Protection Protocol
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
          Citizen Privacy Policy
        </h1>
        <p className="text-xs text-foreground-muted font-mono">Last revised: September 2026</p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-neon-cyan" /> 1. Data Collection & Purpose
          </h2>
          <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
            CivicRelay collects issue descriptions, uploaded photographic evidence, and geolocation coordinates solely for the purpose of municipal dispatch, department routing, and SLA enforcement.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-neon-mint" /> 2. Automated Redaction & Masking
          </h2>
          <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
            Before photographic evidence or incident reports are forwarded into public records or municipal APIs, our Triage and Action Agents automatically scrub identifiable personal telephone numbers, home unit specifics, and personally identifiable faces.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-400" /> 3. Data Retention & Citizen Rights
          </h2>
          <p className="text-xs sm:text-sm text-foreground-secondary leading-relaxed">
            Citizens may request deletion of resolved case histories at any time. Once an issue has reached verified resolution, municipal telemetry is archived in an anonymized civic quality index.
          </p>
        </section>
      </Card>
    </div>
  );
};

