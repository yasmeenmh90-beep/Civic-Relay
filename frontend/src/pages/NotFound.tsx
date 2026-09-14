import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, MapPin, PlusCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { DepthCard } from '../components/ui/DepthCard';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto my-auto">
      <DepthCard glowColor="cyan" tiltIntensity={12} glass className="p-8 sm:p-10 border border-border/80">
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-6 shadow-glow-cyan/20 border border-border">
          <Compass className="w-10 h-10 text-neon-cyan animate-spin-slow" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-ping" />
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-rose-500/10 text-rose-500 dark:text-rose-400 border border-rose-500/20">
          HTTP 404 · Unresolved Sector
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-4">
          Route Not Found
        </h1>
        <p className="text-xs sm:text-sm text-foreground-secondary mt-2 leading-relaxed">
          The civic coordinate or municipal record you requested does not exist or has been securely archived by our telemetry engine.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link to="/" className="w-full sm:w-auto">
            <Button variant="neon" size="md" leftIcon={<Home className="w-4 h-4" />} className="w-full">
              Return Home
            </Button>
          </Link>
          <Link to="/community-map" className="w-full sm:w-auto">
            <Button variant="secondary" size="md" leftIcon={<MapPin className="w-4 h-4 text-neon-cyan" />} className="w-full">
              Community Map
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-center gap-4 text-[11px] text-foreground-muted font-mono">
          <span>CIV-ERR: ROUTE_UNREACHABLE</span>
          <span>·</span>
          <span>SLA WATCHDOG OK</span>
        </div>
      </DepthCard>
    </div>
  );
};

