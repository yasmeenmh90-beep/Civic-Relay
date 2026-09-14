import React, { useEffect, useState } from 'react';
import { Sparkles, Database, ShieldAlert, CheckCircle2, KeyRound } from 'lucide-react';
import { getCurrentSystemStatus, probeSystemStatus, SystemStatus } from '../../api/modeManager';

export const DemoModeBanner: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus>(getCurrentSystemStatus());

  useEffect(() => {
    probeSystemStatus().then(setStatus);

    const handleModeChange = (e: CustomEvent<SystemStatus>) => {
      setStatus(e.detail);
    };

    window.addEventListener('civicrelay:mode_changed' as any, handleModeChange);
    return () => {
      window.removeEventListener('civicrelay:mode_changed' as any, handleModeChange);
    };
  }, []);

  // When in dynamic mode, never display top banner
  if (status.mode === 'dynamic') {
    return null;
  }

  // Demo Mode Banner
  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/25 px-4 py-1.5 text-xs text-amber-900 font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider shadow-xs">
            <Sparkles className="w-3 h-3" />
            DEMO MODE
          </span>
          <span className="text-amber-800 text-xs">
            Operating with demo data ({!status.has_api_key ? 'No API key detected' : 'Database offline'}). Set API key & database to switch to Dynamic Application.
          </span>
        </div>
        <div className="flex items-center gap-2 text-amber-700 text-[11px]">
          <KeyRound className="w-3.5 h-3.5" />
          <span>Add <code className="font-mono font-semibold">GEMINI_API_KEY</code> or <code className="font-mono font-semibold">API_KEY</code> to .env</span>
        </div>
      </div>
    </div>
  );
};
