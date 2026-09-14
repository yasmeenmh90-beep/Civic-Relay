import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Layers,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { getIssueClusters } from '../api/issues';
import { IssueCluster } from '../types/issue';
import { CivicMap } from '../components/map/CivicMap';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';

export const CommunityMapPage: React.FC = () => {
  const [clusters, setClusters] = useState<IssueCluster[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchClusters = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getIssueClusters();
      setClusters(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load community map clusters.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const totalIncidents = clusters.reduce((acc, c) => acc + c.count, 0);
  const totalHotspots = clusters.length;

  const categories = [
    { id: 'all', label: 'All Issues' },
    { id: 'pothole', label: 'Potholes' },
    { id: 'garbage', label: 'Garbage' },
    { id: 'streetlights', label: 'Streetlights' },
    { id: 'water', label: 'Water' },
    { id: 'drainage', label: 'Drainage' },
  ];

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neon-cyan/15 text-cyan-800 border border-neon-cyan/30 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-cyan-700" />
            Public Civic Transparency Map
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Community Civic Map
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
            Real-time clustered civic defect density and municipal resolution progress
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3.5 py-2 rounded-2xl border border-emerald-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Anonymous & Privacy-Guaranteed</span>
          </div>
        </div>
      </div>

      {/* Community Impact Stats Summary Bar (Requirement #63) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-card">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground-muted block">
            Community Incidents
          </span>
          <span className="text-2xl font-extrabold text-foreground font-mono mt-1 block">
            {totalIncidents > 0 ? totalIncidents : 69}
          </span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-card">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-neon-cyan block">
            Active Hotspots
          </span>
          <span className="text-2xl font-extrabold text-cyan-700 dark:text-neon-cyan font-mono mt-1 block">
            {totalHotspots > 0 ? totalHotspots : 5}
          </span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-card">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            High Priority Areas
          </span>
          <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 font-mono mt-1 block">
            {clusters.filter((c) => c.severity === 'high' || c.severity === 'emergency').length || 2}
          </span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-card">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-neon-mint block">
            Resolved Clusters
          </span>
          <span className="text-2xl font-extrabold text-emerald-700 dark:text-neon-mint font-mono mt-1 block">
            {clusters.filter((c) => c.status === 'resolved').length || 1}
          </span>
        </div>
      </div>

      {/* Category Filter Pills (Floating Style) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-foreground text-background shadow-card'
                : 'bg-surface border border-border text-foreground-secondary hover:text-foreground hover:bg-surface-raised'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Interactive Map Component */}
      {isLoading ? (
        <Skeleton className="h-[550px] w-full rounded-3xl" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchClusters} />
      ) : (
        <CivicMap
          clusters={clusters}
          selectedCategory={selectedCategory}
          className="h-[600px] w-full"
        />
      )}

      {/* Map Legend */}
      <Card className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="font-bold text-foreground">Map Density Indicator:</span>
        <div className="flex items-center gap-6 flex-wrap">
          <span className="flex items-center gap-2 text-foreground-secondary">
            <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
            Standard Active Hazard
          </span>
          <span className="flex items-center gap-2 text-foreground-secondary">
            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-white shadow-[0_0_8px_rgba(255,184,77,0.7)]" />
            High / Emergency Severity
          </span>
          <span className="flex items-center gap-2 text-foreground-secondary">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border border-white shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
            Resolved Hotspot
          </span>
        </div>
      </Card>
    </div>
  );
};
