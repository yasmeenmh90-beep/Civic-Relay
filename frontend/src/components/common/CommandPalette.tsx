import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  PlusCircle,
  FolderOpen,
  MapPin,
  BarChart3,
  Sparkles,
  Clock,
  ArrowRight,
  Shield,
  Command,
  X,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { isStaff } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
          // Toggle handled by caller
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'report',
      icon: <PlusCircle className="w-4 h-4 text-neon-cyan" />,
      title: 'Report New Civic Issue',
      subtitle: 'Upload photo, geolocate, and launch autonomous multi-agent triage',
      category: 'Primary Actions',
      handler: () => {
        navigate('/report');
        onClose();
      },
    },
    {
      id: 'my-issues',
      icon: <FolderOpen className="w-4 h-4 text-neon-mint" />,
      title: 'My Civic Cases & Live SLA',
      subtitle: 'View tracking telemetry and countdown timers for active reports',
      category: 'Navigation',
      handler: () => {
        navigate('/my-issues');
        onClose();
      },
    },
    {
      id: 'community-map',
      icon: <MapPin className="w-4 h-4 text-neon-purple" />,
      title: 'Public Community Map',
      subtitle: 'Explore clustered civic hotspots and municipal resolution density',
      category: 'Navigation',
      handler: () => {
        navigate('/community-map');
        onClose();
      },
    },
    {
      id: 'staff-portal',
      icon: <BarChart3 className="w-4 h-4 text-purple-400" />,
      title: 'Staff Intelligence Operations Dashboard',
      subtitle: 'Municipal command telemetry, sensor anomalies, and SLA compliance',
      category: 'Operations',
      handler: () => {
        navigate('/staff');
        onClose();
      },
    },
    {
      id: 'demo-sandbox',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      title: 'Launch Autonomous Simulation Demo',
      subtitle: 'Jump straight into real-time multi-agent processing pipeline',
      category: 'Simulation & Demo',
      handler: () => {
        navigate('/processing/iss-901');
        onClose();
      },
    },
    {
      id: 'case-pothole',
      icon: <FileText className="w-4 h-4 text-cyan-300" />,
      title: 'Case #CIV-1048: Severe Pothole on North Gate',
      subtitle: 'Active case · Municipal Roads Dept · 31h remaining on SLA',
      category: 'Active Cases',
      handler: () => {
        navigate('/issues/iss-901');
        onClose();
      },
    },
    {
      id: 'case-streetlight',
      icon: <AlertTriangle className="w-4 h-4 text-rose-400" />,
      title: 'Case #CIV-1022: Streetlight Array at 5th & Pine (Overdue)',
      subtitle: 'SLA Expired · Bureau of Street Lighting · Escalation Ready',
      category: 'Active Cases',
      handler: () => {
        navigate('/issues/iss-902');
        onClose();
      },
    },
  ];

  const filteredActions = actions.filter(
    (action) =>
      action.title.toLowerCase().includes(query.toLowerCase()) ||
      action.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      action.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-24 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#0D1422] border border-[#1E2B42] rounded-3xl shadow-2xl overflow-hidden z-10 text-left"
        >
          {/* Search Input Bar */}
          <div className="relative flex items-center px-5 py-4 border-b border-[#1E2B42] bg-[#111A2A]/50">
            <Search className="w-5 h-5 text-neon-cyan shrink-0 mr-3" />
            <input
              type="text"
              autoFocus
              placeholder="Type a command, search civic cases, or jump to route... (ESC to close)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-[#F5F7FA] placeholder-[#627289] focus:outline-none"
            />
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#627289] bg-[#080D17] px-2 py-1 rounded-lg border border-[#1E2B42]">
              <span>ESC</span>
            </div>
          </div>

          {/* Results List */}
          <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
            {filteredActions.length === 0 ? (
              <div className="py-12 text-center text-[#9AA7BA]">
                <Search className="w-8 h-8 text-[#627289] mx-auto mb-2" />
                <p className="text-sm">No matching commands or cases found</p>
              </div>
            ) : (
              filteredActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.handler}
                  className="w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-left hover:bg-[#172235] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#080D17] border border-[#1E2B42] flex items-center justify-center shrink-0 group-hover:border-neon-cyan/40 transition-colors">
                      {action.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F5F7FA] group-hover:text-neon-cyan transition-colors">
                          {action.title}
                        </span>
                        <span className="text-[10px] font-mono text-[#627289] uppercase px-1.5 py-0.2 rounded bg-[#080D17]">
                          {action.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#9AA7BA] truncate mt-0.5">
                        {action.subtitle}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#627289] group-hover:text-neon-cyan group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))
            )}
          </div>

          {/* Footer Shortcuts */}
          <div className="px-5 py-3 border-t border-[#1E2B42] bg-[#080D17] flex items-center justify-between text-[11px] text-[#627289] font-mono">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-neon-cyan" /> CivicRelay Autonomous Command HUD
            </span>
            <span>Use ↑↓ to navigate · ↵ to select</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
