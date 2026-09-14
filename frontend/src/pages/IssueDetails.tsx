import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Building2,
  MapPin,
  Calendar,
  FileCheck2,
  CheckCircle2,
  Send,
  Sparkles,
  Flame,
  Check,
} from 'lucide-react';
import { getIssueById } from '../api/issues';
import { escalateTicket, resolveTicket } from '../api/tickets';
import { Issue } from '../types/issue';
import { StatusBadge, SeverityBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SLAStatus } from '../components/tickets/SLAStatus';
import { TicketDetails } from '../components/tickets/TicketDetails';
import { ComplaintCard } from '../components/tickets/ComplaintCard';
import { EscalationModal } from '../components/tickets/EscalationModal';
import { AgentTimeline } from '../components/agents/AgentTimeline';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { formatDate, formatDateTime, calculateSLARemaining } from '../utils/date';
import { formatTicketId } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

export const IssueDetailsPage: React.FC = () => {
  const { issueId } = useParams<{ issueId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Escalation Modal state
  const [isEscalationModalOpen, setIsEscalationModalOpen] = useState(false);
  const [escalationDraft, setEscalationDraft] = useState<any>(null);
  const [isPreparingEscalation, setIsPreparingEscalation] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  const fetchIssueData = async () => {
    if (!issueId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getIssueById(issueId);
      setIssue(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load case details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueData();
  }, [issueId]);

  // Open Escalation Flow (Requirement #32 & #33)
  const handleOpenEscalation = async () => {
    const ticketId = issue?.ticket?.id || issue?.ticket_id || issueId || 'CIV-1000';
    setIsPreparingEscalation(true);
    try {
      const result = await escalateTicket(ticketId);
      setEscalationDraft(result.draft);
      setIsEscalationModalOpen(true);
    } catch (err: any) {
      toast.error('Escalation Draft Error', err.message);
    } finally {
      setIsPreparingEscalation(false);
    }
  };

  // Resolve Case (Requirement #34)
  const handleResolveCase = async () => {
    const ticketId = issue?.ticket?.id || issue?.ticket_id || issueId || 'CIV-1000';
    setIsResolving(true);
    try {
      await resolveTicket(ticketId, 'Citizen verified repair completion.');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00D9FF', '#5CFFB0', '#35D07F', '#9B8CFF'],
      });
      toast.success('Case Resolved', 'Thank you for making our community safer!');
      await fetchIssueData();
    } catch (err: any) {
      toast.error('Resolution Failed', err.message);
    } finally {
      setIsResolving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 rounded-3xl" />
            <Skeleton className="h-96 rounded-3xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-72 rounded-3xl" />
            <Skeleton className="h-72 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <ErrorState
          title="Case Not Found"
          message={error || 'The requested civic case could not be retrieved.'}
          onRetry={fetchIssueData}
        />
      </div>
    );
  }

  const ticketId = issue.ticket?.id || issue.ticket_id || formatTicketId(issue.id);
  const deadline = issue.ticket?.expected_response_at || issue.expected_response_at;
  const isResolved = issue.status === 'resolved';
  const isEscalated = issue.status === 'escalated';
  const isPendingEscalation = issue.status === 'escalation_pending' || issue.status === 'sla_expired';

  // Check live SLA
  const slaCalc = calculateSLARemaining(deadline, issue.sla_hours || 48);
  const showEscalationPrompt = (slaCalc.isExpired || isPendingEscalation) && !isResolved && !isEscalated;

  return (
    <div className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-left space-y-8">
      {/* Back button & Case Header */}
      <div>
        <Link
          to="/my-issues"
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-secondary hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Issues
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-mono font-bold text-cyan-700 dark:text-neon-cyan bg-surface-raised px-2.5 py-1 rounded-lg border border-border">
                CASE #{issue.tracking_code || formatTicketId(issue.id)}
              </span>
              <SeverityBadge severity={issue.severity} size="sm" />
              <StatusBadge status={issue.status} size="md" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-2">
              {issue.title || `${issue.category.toUpperCase()} Case`}
            </h1>
            <p className="text-xs text-foreground-secondary mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" /> Registered {formatDateTime(issue.created_at)}
            </p>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {!isResolved && (
              <Button
                variant="success"
                size="md"
                onClick={handleResolveCase}
                isLoading={isResolving}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Mark as Resolved
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Escalation Prompt Banner if SLA Expired */}
      {showEscalationPrompt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 rounded-3xl bg-surface border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-neon-warning"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500 text-slate-900 shadow-sm shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Response SLA Exceeded — Escalation Ready
              </h3>
              <p className="text-xs text-foreground-secondary mt-1 max-w-xl leading-relaxed">
                The municipal response window has passed without on-site resolution. CivicRelay's Escalation Agent has prepared an executive notice for your review.
              </p>
            </div>
          </div>

          <Button
            variant="neon"
            size="md"
            onClick={handleOpenEscalation}
            isLoading={isPreparingEscalation}
            rightIcon={<Send className="w-4 h-4" />}
            className="shrink-0 w-full sm:w-auto"
          >
            Review Escalation
          </Button>
        </motion.div>
      )}

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2-Column: Summary, SLA, Complaint, Location */}
        <div className="lg:col-span-2 space-y-8">
          {/* Real-time SLA Status Component */}
          <SLAStatus
            ticketId={ticketId}
            expectedResponseDate={deadline}
            totalHours={issue.sla_hours || 48}
            isEscalated={isEscalated}
            isResolved={isResolved}
            onExpiryTriggered={fetchIssueData}
          />

          {/* Issue Summary & Evidence Card */}
          <Card className="p-6 sm:p-8 space-y-6">
            <h3 className="text-lg font-bold text-foreground tracking-tight border-b border-border pb-4">
              Citizen Report Summary
            </h3>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block mb-1">
                Description of Issue
              </span>
              <p className="text-sm text-foreground leading-relaxed bg-surface-raised p-4 rounded-2xl border border-border">
                {issue.description}
              </p>
            </div>

            {/* Photo Evidence */}
            {issue.image_url && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted block mb-2">
                  Uploaded Photo Evidence
                </span>
                <div className="rounded-2xl overflow-hidden border border-border bg-slate-900 max-h-80">
                  <img
                    src={issue.image_url}
                    alt="Report Evidence"
                    className="w-full h-full object-cover max-h-80"
                  />
                </div>
              </div>
            )}

            {/* Location preview */}
            <div className="p-4 rounded-2xl bg-surface-raised border border-border flex items-start gap-3">
              <MapPin className="w-5 h-5 text-neon-cyan shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold text-foreground block">Report Location</span>
                <p className="text-foreground-secondary mt-0.5">
                  {issue.address || 'Central District · GPS Pinpoint Verified'}
                </p>
                {issue.latitude && issue.longitude && (
                  <span className="font-mono text-[11px] text-foreground-muted block mt-1">
                    Coordinates: {issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}
                  </span>
                )}
              </div>
            </div>
          </Card>

          {/* Generated Formal Complaint Document */}
          <ComplaintCard complaint={issue.complaint} />
        </div>

        {/* Right 1-Column: Municipal Ticket & Agent Timeline */}
        <div className="space-y-8">
          {/* Municipal Ticket Metadata */}
          {issue.ticket && <TicketDetails ticket={issue.ticket} />}

          {/* Permanent Case Lifecycle Timeline */}
          <Card className="p-6 sm:p-7">
            <AgentTimeline
              steps={issue.agent_steps || []}
              title="Autonomous Case Timeline"
              subtitle="Persistent audit log of agent operations & municipal telemetry"
            />
          </Card>
        </div>
      </div>

      {/* Escalation Review & Approval Modal (Requirement #33) */}
      <EscalationModal
        isOpen={isEscalationModalOpen}
        onClose={() => setIsEscalationModalOpen(false)}
        ticketId={ticketId}
        draft={escalationDraft || issue.ticket?.escalation_draft}
        onApproved={fetchIssueData}
      />
    </div>
  );
};
