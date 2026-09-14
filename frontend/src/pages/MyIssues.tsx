import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FolderOpen,
  PlusCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Inbox,
} from 'lucide-react';
import { getIssues } from '../api/issues';
import { Issue } from '../types/issue';
import { IssueCard } from '../components/issues/IssueCard';
import { Button } from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ErrorState } from '../components/ui/ErrorState';

export const MyIssuesPage: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchIssuesList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getIssues();
      setIssues(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve cases.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuesList();
  }, []);

  // Filter & Search Logic
  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      (issue.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.category || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.ticket?.ticket_number || issue.ticket_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.authority || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') {
      return issue.status !== 'resolved' && issue.status !== 'failed';
    }
    if (activeFilter === 'resolved') {
      return issue.status === 'resolved';
    }
    if (activeFilter === 'escalated') {
      return (
        issue.status === 'escalated' ||
        issue.status === 'escalation_pending' ||
        issue.status === 'sla_expired'
      );
    }
    return true;
  });

  // Calculate Metrics
  const totalCount = issues.length;
  const activeCount = issues.filter((i) => i.status !== 'resolved' && i.status !== 'failed').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;
  const escalatedCount = issues.filter(
    (i) => i.status === 'escalated' || i.status === 'escalation_pending' || i.status === 'sla_expired'
  ).length;

  return (
    <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            My Civic Issues
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary mt-1">
            Actively managed resolution cases tracked across municipal departments
          </p>
        </div>

        <Link to="/report">
          <Button
            variant="neon"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Report New Issue
          </Button>
        </Link>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-card">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-foreground-muted block">
            Total Cases
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-foreground font-mono mt-1 block">
            {totalCount}
          </span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-card">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-neon-cyan block">
            Active / In Progress
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-cyan-700 dark:text-neon-cyan font-mono mt-1 block">
            {activeCount}
          </span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-card">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-neon-mint block">
            Resolved
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-neon-mint font-mono mt-1 block">
            {resolvedCount}
          </span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-card">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
            Escalated / Overdue
          </span>
          <span className="text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-400 font-mono mt-1 block">
            {escalatedCount}
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
          {[
            { id: 'all', label: 'All Cases', count: totalCount },
            { id: 'active', label: 'Active', count: activeCount },
            { id: 'resolved', label: 'Resolved', count: resolvedCount },
            { id: 'escalated', label: 'Escalated / Overdue', count: escalatedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeFilter === tab.id
                  ? 'bg-foreground text-background shadow-sm'
                  : 'bg-surface border border-border text-foreground-secondary hover:text-foreground hover:bg-surface-raised'
              }`}
            >
              {tab.label} <span className="text-[10px] opacity-70 font-mono">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search cases, tickets, authorities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface border border-border text-foreground text-xs rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 placeholder:text-foreground-muted"
          />
        </div>
      </div>

      {/* Issues Grid / State Render */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={fetchIssuesList} />
      ) : filteredIssues.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8" />}
          title={searchQuery ? 'No matching issues found' : 'No civic issues yet'}
          description={
            searchQuery
              ? 'Try searching with a different keyword or adjusting the status filter.'
              : 'See a pothole, broken streetlight, or municipal problem? Report it once and CivicRelay will manage it autonomously.'
          }
          actionLabel="Report an Issue"
          onAction={() => (window.location.href = '/report')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
};
