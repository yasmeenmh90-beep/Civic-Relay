import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Shield, Cpu, Clock, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border bg-surface/85 backdrop-blur-md mt-auto py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-left">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center text-neon-cyan shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-foreground tracking-tight">CivicRelay</span>
            </div>
            <p className="text-xs text-foreground-secondary leading-relaxed max-w-sm">
              Autonomous multi-agent civic case management. Citizens report problems once; intelligent AI agents handle department routing, formal complaints, SLA monitoring, and escalation.
            </p>
            <div className="flex items-center gap-4 text-xs text-foreground-muted pt-2">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-neon-cyan" /> 5-Agent Architecture
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neon-mint" /> 24/7 SLA Watchdog
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-400" /> Citizen Privacy Protected
              </span>
            </div>
          </div>

          {/* Citizen Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Civic Services</h4>
            <ul className="space-y-2 text-xs text-foreground-secondary">
              <li>
                <Link to="/report" className="hover:text-foreground transition-colors">
                  Report Civic Issue
                </Link>
              </li>
              <li>
                <Link to="/my-issues" className="hover:text-foreground transition-colors">
                  Track My Issues
                </Link>
              </li>
              <li>
                <Link to="/community-map" className="hover:text-foreground transition-colors">
                  Public Community Map
                </Link>
              </li>
            </ul>
          </div>

          {/* Operations & Gov */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Municipal & Legal</h4>
            <ul className="space-y-2 text-xs text-foreground-secondary">
              <li>
                <Link to="/staff" className="hover:text-foreground transition-colors">
                  Staff Intelligence Portal
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Citizen Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service & SLA Charter
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-foreground-muted">
          <p>© 2026 CivicRelay. Autonomous Civic Resolution Framework.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <span>·</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Municipal Routing Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
