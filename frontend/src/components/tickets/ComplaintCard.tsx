import React, { useState } from 'react';
import { FormalComplaint } from '../../types/ticket';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Copy, Check, FileText, Send, Sparkles, Building } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { formatShortDateTime } from '../../utils/date';

export interface ComplaintCardProps {
  complaint?: FormalComplaint;
  className?: string;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, className }) => {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  if (!complaint) return null;

  const handleCopy = async () => {
    const fullText = `SUBJECT: ${complaint.subject}\nTO: ${complaint.recipient_authority}\n\n${complaint.body}\n\n${complaint.urgency_clause || ''}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success('Copied to Clipboard', 'Formal complaint notice text copied.');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy Failed', 'Unable to access clipboard.');
    }
  };

  return (
    <Card className={className}>
      <div className="p-6 sm:p-8 text-left space-y-6">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-neon-cyan flex items-center justify-center shadow-soft">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">
                  GENERATED FORMAL NOTICE
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neon-cyan/15 text-cyan-800 border border-neon-cyan/30">
                  <Sparkles className="w-3 h-3 text-neon-cyan" /> Action Agent
                </span>
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight mt-0.5">
                Official Municipal Complaint Document
              </h3>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            leftIcon={copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            {copied ? 'Copied' : 'Copy Notice'}
          </Button>
        </div>

        {/* Paper / Formal Document Container */}
        <div className="bg-surface-raised rounded-2xl p-5 sm:p-6 border border-border font-sans shadow-inner space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pb-4 border-b border-border">
            <div>
              <span className="text-foreground-muted uppercase font-bold tracking-wider text-[10px] block">
                Target Authority
              </span>
              <span className="font-bold text-foreground flex items-center gap-1.5 mt-0.5">
                <Building className="w-3.5 h-3.5 text-foreground-muted" />
                {complaint.recipient_authority}
              </span>
            </div>
            <div>
              <span className="text-foreground-muted uppercase font-bold tracking-wider text-[10px] block">
                Generated Date
              </span>
              <span className="font-mono text-foreground mt-0.5 block">
                {formatShortDateTime(complaint.generated_at)}
              </span>
            </div>
          </div>

          <div>
            <span className="text-foreground-muted uppercase font-bold tracking-wider text-[10px] block mb-1">
              Subject Line
            </span>
            <p className="text-sm font-bold text-foreground bg-surface p-3 rounded-xl border border-border shadow-xs">
              {complaint.subject}
            </p>
          </div>

          <div>
            <span className="text-foreground-muted uppercase font-bold tracking-wider text-[10px] block mb-1">
              Notice Body
            </span>
            <div className="bg-surface p-4 rounded-xl border border-border shadow-xs text-xs sm:text-sm text-foreground-secondary leading-relaxed whitespace-pre-line">
              {complaint.body}
            </div>
          </div>

          {complaint.urgency_clause && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-700 dark:text-amber-300 font-medium">
              <span className="font-bold uppercase tracking-wider text-[10px] block text-amber-600 dark:text-amber-400">
                Statutory Charter Clause
              </span>
              {complaint.urgency_clause}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
