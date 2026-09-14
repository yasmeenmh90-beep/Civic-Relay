import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { DemoModeBanner } from '../common/DemoModeBanner';
import { CookieConsent } from '../common/CookieConsent';

export const AppShell: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-neon-cyan/20 selection:text-foreground">
      {/* Background ambient neon orbs (subtle & soft) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-[450px] h-[450px] bg-neon-mint/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 left-1/3 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-3xl" />
      </div>

      <DemoModeBanner />
      <Navbar />
      <main className="flex-1 w-full flex flex-col">{children}</main>
      <Footer />
      <CookieConsent />
    </div>
  );
};
