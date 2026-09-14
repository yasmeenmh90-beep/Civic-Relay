import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

const COOKIE_KEY = 'civicrelay_consent_accepted';

export const CookieConsent: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(COOKIE_KEY);
    if (!accepted) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Privacy and cookie notice"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-2xl backdrop-blur-xl flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-neon-cyan" />
            <span>Citizen Privacy Protected</span>
          </div>
          <button
            onClick={() => setVisible(false)}
            aria-label="Dismiss cookie banner"
            className="text-foreground-muted hover:text-foreground transition-colors p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-foreground-secondary leading-relaxed">
          CivicRelay uses essential session storage and local device tokens to manage issue reports and verify municipality SLA response times. No commercial profiling. Read our{' '}
          <Link to="/privacy" className="underline hover:text-foreground text-cyan-600 dark:text-neon-cyan">
            Privacy Policy
          </Link>.
        </p>
        <div className="flex items-center gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" onClick={() => setVisible(false)}>
            Close
          </Button>
          <Button variant="neon" size="sm" onClick={handleAccept}>
            Got it
          </Button>
        </div>
      </div>
    </aside>
  );
};

