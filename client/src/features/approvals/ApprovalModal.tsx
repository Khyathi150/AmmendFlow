import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/axios';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';

export interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  changeOrderId: string;
  orderNumber: string;
  proposedPaise: number;
  currentStatus: string;
  defaultStage?: string;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  changeOrderId,
  orderNumber,
  proposedPaise,
  currentStatus,
  defaultStage,
}) => {
  const queryClient = useQueryClient();

  // Determine appropriate default stage from current status
  const getInitialStage = () => {
    if (defaultStage) return defaultStage;
    if (currentStatus === 'Submitted') return 'Technical Review';
    if (currentStatus === 'Technical Review') return 'Commercial Review';
    if (currentStatus === 'Commercial Review') return 'Internal Approval';
    if (currentStatus === 'Internal Approval') return 'Client Approval';
    return 'Technical Review';
  };

  const [stage, setStage] = useState(getInitialStage());
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'Changes Requested'>('Approved');
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  const approvalMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.post(`/change-orders/${changeOrderId}/approvals`, {
        stage,
        decision,
        comments,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-order', changeOrderId] });
      queryClient.invalidateQueries({ queryKey: ['change-orders'] });
      queryClient.invalidateQueries({ queryKey: ['financial-exposure'] });
      onClose();
      setComments('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to record approval decision');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!comments || comments.trim().length < 5) {
      setError('Please provide detailed rationale for your decision (min 5 characters).');
      return;
    }
    approvalMutation.mutate();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Formal Evaluation: ${orderNumber}`}
      description="Cryptographically logged commercial sign-off and state machine transition"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-md bg-status-danger-bg text-status-danger text-xs border border-status-danger-border">
            {error}
          </div>
        )}

        <div className="p-3 rounded-lg bg-surface-subtle border border-border flex items-center justify-between text-xs">
          <div>
            <span className="text-text-secondary block">Proposed Value:</span>
            <span className="font-mono font-bold text-text-primary text-sm">
              <CurrencyDisplay paise={proposedPaise} />
            </span>
          </div>
          <div className="text-right">
            <span className="text-text-secondary block">Current Stage:</span>
            <span className="font-semibold text-secondary">{currentStatus}</span>
          </div>
        </div>

        <Select
          label="Approval Checkpoint Stage"
          required
          value={stage}
          onChange={(e) => setStage(e.target.value)}
          options={[
            { value: 'Technical Review', label: 'Technical Review (Feasibility & Constructibility)' },
            { value: 'Commercial Review', label: 'Commercial Review (Unit Rates & BOQ Alignment)' },
            { value: 'Internal Approval', label: 'Internal Contractor Sign-off (Director / Owner)' },
            { value: 'Client Approval', label: 'Client / Developer Formal Sign-off' },
          ]}
        />

        <div>
          <label className="text-xs font-semibold text-text-primary block mb-1.5">
            Decision Outcome
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDecision('Approved')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                decision === 'Approved'
                  ? 'border-status-success bg-status-success-bg text-status-success shadow-sm'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-subtle'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve
            </button>

            <button
              type="button"
              onClick={() => setDecision('Changes Requested')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                decision === 'Changes Requested'
                  ? 'border-status-warning bg-status-warning-bg text-status-warning shadow-sm'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-subtle'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              Clarification
            </button>

            <button
              type="button"
              onClick={() => setDecision('Rejected')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                decision === 'Rejected'
                  ? 'border-status-danger bg-status-danger-bg text-status-danger shadow-sm'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-subtle'
              }`}
            >
              <XCircle className="w-4 h-4" />
              Reject
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-primary block mb-1">
            Formal Rationale & Evaluation Comments <span className="text-status-danger">*</span>
          </label>
          <textarea
            rows={3}
            required
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Document technical or commercial reasons for your determination..."
            className="w-full p-2.5 rounded-md border border-border text-xs text-text-primary focus:border-secondary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-[11px] text-text-muted p-2 rounded bg-surface-subtle border border-border/60">
          <ShieldCheck className="w-4 h-4 text-secondary shrink-0" />
          <span>Decision will be permanently preserved in the immutable project audit ledger.</span>
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            isLoading={approvalMutation.isPending}
          >
            Submit Determination
          </Button>
        </div>
      </form>
    </Modal>
  );
};

