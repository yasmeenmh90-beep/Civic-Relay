import React, { useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  FolderOpen,
  MapPin,
  BarChart3,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  X,
  Sparkles,
  Search,
  Command,
  Cpu,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { CommandPalette } from '../common/CommandPalette';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isStaff, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200',
      isActive
        ? 'bg-foreground text-background shadow-md font-bold ring-1 ring-white/10'
        : 'text-foreground-secondary hover:text-foreground hover:bg-surface-elevated/70'
    );

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-surface/90 backdrop-blur-2xl border-b border-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-surface-elevated to-surface-raised border border-border flex items-center justify-center shadow-card group-hover:border-foreground/30 group-hover:shadow-3d-hover transition-all duration-200">
                  <div className="relative flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-cyan-500 dark:text-neon-cyan transition-transform duration-200 group-hover:scale-105" />
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </div>
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-foreground font-sans">
                      CivicRelay
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] font-semibold tracking-tight bg-surface-raised border border-border text-foreground-secondary group-hover:border-border-hover group-hover:text-foreground transition-all shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Autonomous Dispatch
                    </span>
                  </div>
                  <span className="text-[11px] text-foreground-muted hidden sm:flex items-center gap-1.5 font-medium tracking-tight">
                    Municipal Case Routing & SLA Resolution
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 bg-surface-raised p-1.5 rounded-2xl border border-border">
              <NavLink to="/report" className={navItemClass}>
                <PlusCircle className="w-4 h-4 text-neon-cyan" />
                <span>Report Issue</span>
              </NavLink>

              <NavLink to="/my-issues" className={navItemClass}>
                <FolderOpen className="w-4 h-4 text-neon-mint" />
                <span>My Cases</span>
              </NavLink>

              <NavLink to="/community-map" className={navItemClass}>
                <MapPin className="w-4 h-4 text-neon-purple" />
                <span>Live Map</span>
              </NavLink>

              {isStaff && (
                <NavLink
                  to="/staff"
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all',
                      isActive
                        ? 'bg-purple-600 text-white shadow-glow-purple'
                        : 'text-purple-400 hover:bg-purple-950/40'
                    )
                  }
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Staff Command</span>
                </NavLink>
              )}
            </nav>

            {/* Right Action Stack: Search / Command Palette + User + Theme */}
            <div className="hidden md:flex items-center gap-3">
              {/* Command Palette Trigger Pill */}
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-surface-raised border border-border text-xs text-foreground-secondary hover:text-foreground hover:border-neon-cyan/40 hover:shadow-glow-cyan transition-all cursor-pointer font-mono"
              >
                <Search className="w-3.5 h-3.5 text-neon-cyan" />
                <span className="hidden xl:inline">Command HUD</span>
                <kbd className="text-[10px] bg-surface px-1.5 py-0.5 rounded border border-border text-foreground-muted">
                  ⌘K
                </kbd>
              </button>

              {isAuthenticated && user ? (
                <div className="flex items-center gap-3 pl-3 border-l border-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-400 to-mint-300 p-0.5 shadow-sm">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full rounded-full bg-[#080D17] flex items-center justify-center text-white text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-foreground leading-tight">{user.name}</span>
                      <span className="text-[10px] font-mono text-neon-cyan capitalize">{user.role}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    title="Log out"
                    className="p-2 text-foreground-secondary hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login">
                    <Button variant="ghost" size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="neon" size="sm" leftIcon={<UserPlus className="w-4 h-4" />}>
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button + toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <button
                type="button"
                onClick={() => setCommandPaletteOpen(true)}
                className="p-2.5 rounded-xl bg-surface-raised border border-border text-foreground hover:border-neon-cyan/40"
                aria-label="Command search"
              >
                <Search className="w-4 h-4 text-neon-cyan" />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-xl bg-surface-raised border border-border text-foreground hover:bg-surface-elevated transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-border bg-surface px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-1.5">
              <Link
                to="/report"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-surface-raised text-foreground font-semibold"
              >
                <PlusCircle className="w-5 h-5 text-neon-cyan" />
                <span>Report Issue</span>
              </Link>

              <Link
                to="/my-issues"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface-raised text-foreground-secondary font-medium"
              >
                <FolderOpen className="w-5 h-5 text-neon-mint" />
                <span>My Cases & Live SLA</span>
              </Link>

              <Link
                to="/community-map"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface-raised text-foreground-secondary font-medium"
              >
                <MapPin className="w-5 h-5 text-neon-purple" />
                <span>Community Map</span>
              </Link>

              {isStaff && (
                <Link
                  to="/staff"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-purple-950/40 text-purple-300 font-semibold border border-purple-800/40"
                >
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span>Staff Command Dashboard</span>
                </Link>
              )}
            </nav>

            <div className="pt-4 border-t border-border flex flex-col gap-2">
              {isAuthenticated && user ? (
                <div className="flex items-center justify-between p-3 bg-surface-raised rounded-2xl border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#080D17] text-white flex items-center justify-center text-xs font-bold border border-border">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{user.name}</p>
                      <p className="text-xs font-mono text-neon-cyan capitalize">{user.role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" size="md" className="w-full">
                      Log In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="neon" size="md" className="w-full">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  );
};
