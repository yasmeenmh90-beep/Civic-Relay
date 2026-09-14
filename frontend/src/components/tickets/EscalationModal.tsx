import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { EscalationDraft } from '../../types/ticket';
import { approveEscalation } from '../../api/tickets';
import { useToast } from '../../context/ToastContext';
import { ShieldAlert, AlertTriangle, Send, CheckCircle, ShieldCheck } from 'lucide-react';

export interface EscalationModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  draft?: EscalationDraft;
  onApproved: () => void;
}

export const EscalationModal: React.FC<EscalationModalProps> = ({
  isOpen,
  onClose,
  ticketId,
  draft,
  onApproved,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const toast = useToast();

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await approveEscalation(ticketId, userNotes);
      toast.success('Escalation Dispatched', 'Your case was escalated to municipal executive leadership.');
      onApproved();
      onClose();
    } catch (err: any) {
      toast.error('Escalation Approval Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fallbackDraft: EscalationDraft = {
    subject: `ESCALATION: Statutory SLA Overdue on Ticket #${ticketId}`,
    recipient: 'Office of the Director General of Municipal Works',
    reason: 'SLA threshold exceeded without verified on-site dispatch or status update.',
    body: `Notice of administrative escalation for Ticket #${ticketId}. The citizen report has surpassed the standard municipal response window. Under Citizen Service Charter §4.2, immediate executive intervention and prioritized crew deployment is requested.`,
    days_overdue: 1,
  };

  const activeDraft = draft || fallbackDraft;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review & Approve Escalation"
      subtitle="Escalation Agent has prepared formal municipal escalation for your authorization."
      maxWidth="xl"
    >
      <div className="space-y-5 text-left">
        {/* Warning Banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-transparent border border-amber-500/30">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-amber-950">Response SLA Exceeded</h4>
            <p className="text-amber-800 mt-0.5 leading-relaxed">
              Your civic complaint did not receive the required municipal response within the statutory window. CivicRelay AI has prepared a formal escalation notice.
            </p>
          </div>
        </div>

        {/* Reason Card */}
        <div className="p-4 rounded-2xl bg-surface-raised border border-border space-y-1">
          <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">
            Escalation Grounds
          </span>
          <p className="text-xs font-semibold text-foreground">{activeDraft.reason}</p>
        </div>

        {/* Prepared Escalation Content */}
        <div className="bg-surface-raised rounded-2xl p-4 sm:p-5 border border-border space-y-3 font-sans">
          <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider block">
            Prepared Escalation Dispatch
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-foreground-muted text-[10px] font-bold block">RECIPIENT OVERSIGHT</span>
              <span className="font-bold text-foreground">{activeDraft.recipient}</span>
            </div>
            <div>
              <span className="text-foreground-muted text-[10px] font-bold block">ESCALATION TIER</span>
              <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">Tier 2 Executive Priority</span>
            </div>
          </div>

          <div>
            <span className="text-foreground-muted text-[10px] font-bold block mb-1">SUBJECT</span>
            <p className="text-xs font-bold text-foreground bg-surface p-2.5 rounded-xl border border-border">
              {activeDraft.subject}
            </p>
          </div>

          <div>
            <span className="text-foreground-muted text-[10px] font-bold block mb-1">ESCALATION BODY</span>
            <p className="text-xs text-foreground-secondary bg-surface p-3 rounded-xl border border-border whitespace-pre-line leading-relaxed">
              {activeDraft.body}
            </p>
          </div>
        </div>

        {/* Human in the loop guarantee */}
        <div className="flex items-center gap-2 text-xs text-foreground-secondary py-1">
          <ShieldCheck className="w-4 h-4 text-neon-cyan shrink-0" />
          <span>Nothing will be dispatched to municipal authorities without your explicit approval.</span>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            variant="neon"
            size="md"
            onClick={handleApprove}
            isLoading={isSubmitting}
            leftIcon={<Send className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            Approve & Escalate
          </Button>
        </div>
      </div>
    </Modal>
  );
};
