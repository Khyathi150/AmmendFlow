import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GitPullRequest,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  CheckCheck,
  ShieldAlert,
  Send,
  Building2,
  UserCheck,
  FileText,
  DollarSign,
  History,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Tabs } from '../../components/ui/Tabs';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { formatDate, formatDateTime } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { ApprovalModal } from '../approvals/ApprovalModal';

export const ChangeOrderDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { activeOrganization, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('scope');
  const [isAuthorizeModalOpen, setIsAuthorizeModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [unapprovedJustification, setUnapprovedJustification] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['change-order', id],
    queryFn: async () => {
      const res: any = await api.get(`/change-orders/${id}`);
      return res.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.post(`/change-orders/${id}/submit`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-order', id] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to submit change order');
    },
  });

  const authorizeMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.post(`/change-orders/${id}/authorize-execution`, {
        unapprovedJustification,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-order', id] });
      setIsAuthorizeModalOpen(false);
      setUnapprovedJustification('');
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to authorize execution');
    },
  });

  const startWorkMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.post(`/change-orders/${id}/start-work`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-order', id] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to record work start');
    },
  });

  const completeWorkMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.post(`/change-orders/${id}/complete-work`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-order', id] });
    },
    onError: (err: any) => {
      setActionError(err.message || 'Failed to complete work');
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-text-secondary">Loading change order details...</div>;
  }

  const changeOrder = data?.changeOrder;
  const approvals = data?.approvals || [];
  const estimates = data?.estimates || [];
  const activityLogs = data?.activityLogs || [];
  const activeEstimate = changeOrder?.activeEstimateId;
  const project = changeOrder?.project;

  const isClientApproved = changeOrder?.status === 'Approved';
  const canAuthorizeEarly = ['Submitted', 'Technical Review', 'Commercial Review', 'Internal Approval', 'Client Approval'].includes(
    changeOrder?.status
  );

  const workflowSteps = [
    'Draft',
    'Submitted',
    'Technical Review',
    'Commercial Review',
    'Internal Approval',
    'Client Approval',
    'Approved',
    'Authorised for Execution',
    'In Progress',
    'Completed',
    'Invoiced',
    'Paid',
  ];

  const currentStepIndex = workflowSteps.indexOf(changeOrder?.status);

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/change-orders"
          className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Change Orders Register
        </Link>
        <span className="text-xs font-mono text-text-muted">
          Created: {formatDate(changeOrder.createdAt)}
        </span>
      </div>

      {/* Main Order Header Card */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary text-white font-bold tracking-wider">
              {changeOrder.orderNumber}
            </span>
            <StatusBadge status={changeOrder.status} size="sm" />
            <span className="px-2 py-0.5 rounded bg-surface-muted text-text-secondary text-[11px] font-semibold border border-border">
              {changeOrder.category}
            </span>
            <span className="px-2 py-0.5 rounded bg-surface-muted text-text-secondary text-[11px] font-semibold border border-border">
              Priority: {changeOrder.priority}
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-text-primary">{changeOrder.title}</h1>

          <p className="text-xs text-text-secondary mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Project: <strong className="text-text-primary">{project?.code} — {project?.name}</strong>
            </span>
            <span>
              Originating Party: <strong className="text-text-primary">{changeOrder.originatingParty}</strong>
            </span>
            <span>
              Requested By: <strong className="text-text-primary">{changeOrder.requestedBy?.name || 'Engineer'}</strong>
            </span>
            <span>
              Schedule Impact: <strong className="text-text-primary">{changeOrder.scheduleImpactDays} Days</strong>
            </span>
          </p>
        </div>

        {/* Financial Proposed / Approved Box */}
        <div className="flex items-center gap-4 bg-surface-subtle p-4 rounded-lg border border-border shrink-0">
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-text-muted block">Proposed Total</span>
            <div className="text-lg font-bold text-text-primary font-mono">
              <CurrencyDisplay paise={changeOrder.totalProposedPaise} />
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-semibold text-secondary block">Approved Total</span>
            <div className="text-lg font-bold text-secondary font-mono">
              <CurrencyDisplay paise={changeOrder.totalApprovedPaise} />
            </div>
          </div>
        </div>
      </div>

      {/* Critical Unapproved Execution Alert Banner */}
      {changeOrder.unapprovedExecution && (
        <div className="p-4 rounded-xl bg-status-danger-bg border-2 border-status-danger-border flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
          <div className="text-xs text-status-danger space-y-1 flex-1">
            <h4 className="font-bold text-sm tracking-tight text-status-danger">
              CRITICAL NOTICE: WORK EXECUTED WITHOUT FORMAL CLIENT APPROVAL
            </h4>
            <p className="leading-relaxed">
              This variation was authorized for physical site execution before client sign-off was secured. It is currently categorized under <strong>Work Performed Without Documented Approval</strong> in the financial risk exposure matrix.
            </p>
            {changeOrder.unapprovedJustification && (
              <p className="p-2 rounded bg-white/70 border border-status-danger-border/60 text-text-primary font-medium mt-1">
                <strong>Mandatory Justification:</strong> "{changeOrder.unapprovedJustification}"
                <span className="block text-[10px] text-text-secondary mt-0.5 font-normal">
                  Authorized by: {changeOrder.unapprovedAuthorizedBy?.name || 'Authorized Manager'} • {formatDateTime(changeOrder.unapprovedAuthorizedAt)}
                </span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Operational Workflow Progress Stepper */}
      <Card className="p-4 overflow-hidden">
        <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
          Approval & Execution Lifecycle Pipeline
        </div>
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {workflowSteps.map((step, idx) => {
            const isPassed = currentStepIndex > idx;
            const isCurrent = currentStepIndex === idx;

            return (
              <div key={step} className="flex items-center shrink-0">
                <div
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all whitespace-nowrap flex items-center gap-1 ${
                    isCurrent
                      ? 'bg-secondary text-white shadow-sm'
                      : isPassed
                      ? 'bg-secondary-light text-secondary border border-secondary/20'
                      : 'bg-surface-subtle text-text-muted border border-border/60'
                  }`}
                >
                  {isPassed && <CheckCircle2 className="w-3 h-3" />}
                  <span>{step}</span>
                </div>
                {idx < workflowSteps.length - 1 && (
                  <div className={`w-3 h-0.5 mx-0.5 ${isPassed ? 'bg-secondary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Action Controls Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-subtle flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-text-secondary">
          Current State: <strong className="text-text-primary font-semibold">{changeOrder.status}</strong>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {['Submitted', 'Technical Review', 'Commercial Review', 'Internal Approval', 'Client Approval'].includes(
            changeOrder.status
          ) && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={ShieldCheck}
              onClick={() => setIsApprovalModalOpen(true)}
            >
              Review & Sign-Off ({changeOrder.status})
            </Button>
          )}

          {changeOrder.status === 'Draft' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={Send}
              onClick={() => submitMutation.mutate()}
              isLoading={submitMutation.isPending}
            >
              Submit for Technical Review
            </Button>
          )}

          {/* Authorize Execution button (available if Approved OR early with justification) */}
          {(isClientApproved || canAuthorizeEarly) && changeOrder.status !== 'Authorised for Execution' && (
            <Button
              variant={isClientApproved ? 'secondary' : 'danger'}
              size="sm"
              leftIcon={Play}
              onClick={() => setIsAuthorizeModalOpen(true)}
            >
              {isClientApproved ? 'Authorize Execution' : 'Authorize Early Execution (Unapproved)'}
            </Button>
          )}

          {changeOrder.status === 'Authorised for Execution' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={Play}
              onClick={() => startWorkMutation.mutate()}
              isLoading={startWorkMutation.isPending}
            >
              Commence Work on Site (In Progress)
            </Button>
          )}

          {changeOrder.status === 'In Progress' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={CheckCheck}
              onClick={() => completeWorkMutation.mutate()}
              isLoading={completeWorkMutation.isPending}
            >
              Mark Physical Work Completed
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'scope', label: 'Scope & Technical Justification', icon: FileText },
          { id: 'estimate', label: 'Cost Estimation Breakdown', icon: DollarSign },
          { id: 'approvals', label: 'Approval Sign-Offs', count: approvals.length, icon: UserCheck },
          { id: 'activity', label: 'Append-Only Audit Trail', count: activityLogs.length, icon: History },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Scope & Technical Justification */}
      {activeTab === 'scope' && (
        <div className="space-y-4">
          <Card className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Detailed Engineering Scope</CardTitle>
                <CardDescription>Specification of physical works and methods</CardDescription>
              </div>
            </CardHeader>
            <p className="text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
              {changeOrder.description}
            </p>

            <div className="pt-3 border-t border-border">
              <span className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider block mb-1">
                Root Cause & Commercial Justification
              </span>
              <p className="text-xs text-text-primary leading-relaxed bg-surface-subtle p-3 rounded-md border border-border">
                {changeOrder.reason}
              </p>
            </div>
          </Card>

          {/* Linked Baseline BOQ Items */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Linked Contract Baseline BOQ Items</CardTitle>
                <CardDescription>Original contractual lines impacted by this variation</CardDescription>
              </div>
            </CardHeader>

            {changeOrder.linkedBoqItemIds?.length === 0 ? (
              <p className="text-xs text-text-muted">No baseline BOQ items linked to this variation.</p>
            ) : (
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden text-xs">
                {changeOrder.linkedBoqItemIds?.map((item: any) => (
                  <div key={item._id} className="p-3 bg-surface hover:bg-surface-subtle flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-text-primary mr-2">{item.itemCode}</span>
                      <span className="text-text-primary">{item.description}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-text-muted mr-3">
                        Baseline: {item.baselineQuantity} {item.unit}
                      </span>
                      <CurrencyDisplay paise={item.unitRatePaise} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab 2: Cost Estimate Breakdown */}
      {activeTab === 'estimate' && (
        <div className="space-y-4">
          <Card className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Cost Estimate Formulation (Versioned Snapshot)</CardTitle>
                <CardDescription>
                  Unit-rate breakdown calculated with minor units (paise) precision
                </CardDescription>
              </div>
              {activeEstimate && (
                <span className="px-2.5 py-1 rounded bg-primary-light text-primary text-xs font-mono font-bold">
                  Version v{activeEstimate.version}
                </span>
              )}
            </CardHeader>

            {!activeEstimate || !activeEstimate.items || activeEstimate.items.length === 0 ? (
              <p className="text-xs text-text-muted">No cost estimation line items recorded.</p>
            ) : (
              <>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary uppercase">
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3 text-right">Unit Rate</th>
                        <th className="py-2.5 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {activeEstimate.items.map((it: any, i: number) => (
                        <tr key={i} className="hover:bg-surface-subtle">
                          <td className="py-2 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary text-[10px] font-semibold">
                              {it.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-medium text-text-primary">{it.description}</td>
                          <td className="py-2 px-3 font-mono text-text-secondary">{it.unit}</td>
                          <td className="py-2 px-3 text-right font-mono text-text-primary">
                            {it.quantity.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-text-primary">
                            <CurrencyDisplay paise={it.unitRatePaise} />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-text-primary">
                            <CurrencyDisplay paise={it.totalPaise} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mathematical Summary Card */}
                <div className="max-w-md ml-auto bg-surface-subtle p-4 rounded-lg border border-border space-y-2 text-xs">
                  <div className="flex justify-between text-text-secondary">
                    <span>Direct Works Cost (Direct Cost):</span>
                    <CurrencyDisplay paise={activeEstimate.directCostPaise} />
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Overhead ({activeEstimate.overheadPct}%):</span>
                    <CurrencyDisplay paise={activeEstimate.overheadPaise} />
                  </div>
                  <div className="flex justify-between text-text-primary font-medium pt-1 border-t border-border/60">
                    <span>Pre-Markup Subtotal:</span>
                    <CurrencyDisplay paise={activeEstimate.preMarkupPaise} />
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Profit Markup ({activeEstimate.markupPct}%):</span>
                    <CurrencyDisplay paise={activeEstimate.markupPaise} />
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>Applicable Tax ({activeEstimate.taxPct}% GST):</span>
                    <CurrencyDisplay paise={activeEstimate.taxPaise} />
                  </div>
                  <div className="flex justify-between text-sm font-bold text-primary pt-2 border-t-2 border-primary/20">
                    <span>Proposed Client Amount:</span>
                    <CurrencyDisplay paise={activeEstimate.totalProposedPaise} />
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Tab 3: Formal Approval History */}
      {activeTab === 'approvals' && (
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle>Formal Approval & Review Trail</CardTitle>
              <CardDescription>Multi-stage technical, commercial, internal, and client sign-offs</CardDescription>
            </div>
          </CardHeader>

          {approvals.length === 0 ? (
            <p className="text-xs text-text-muted">No formal approval reviews recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {approvals.map((app: any) => (
                <div key={app._id} className="p-3.5 rounded-lg border border-border bg-surface-subtle text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">{app.stage}</span>
                      <StatusBadge status={app.decision} size="sm" />
                    </div>
                    <span className="text-[11px] text-text-muted font-mono">{formatDateTime(app.signedAt)}</span>
                  </div>
                  <p className="text-text-primary leading-relaxed">{app.comments}</p>
                  <div className="text-[11px] text-text-secondary">
                    Signed by: <strong className="text-text-primary">{app.approver?.name}</strong> ({app.approver?.email})
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: Append-Only Audit Trail */}
      {activeTab === 'activity' && (
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle>Append-Only Audit Log</CardTitle>
              <CardDescription>Tamper-evident record of all lifecycle events</CardDescription>
            </div>
          </CardHeader>

          <div className="space-y-2.5">
            {activityLogs.map((log: any) => (
              <div key={log._id} className="p-3 rounded-md bg-surface-subtle border border-border text-xs flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-text-primary">{log.action}</div>
                  <div className="text-text-secondary mt-0.5">{log.summary}</div>
                  <div className="text-[10px] text-text-muted mt-1">Actor: {log.actor?.name || 'System User'}</div>
                </div>
                <div className="text-[10px] text-text-muted font-mono shrink-0">
                  {formatDateTime(log.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Authorize Execution Modal */}
      <Modal
        isOpen={isAuthorizeModalOpen}
        onClose={() => setIsAuthorizeModalOpen(false)}
        title={isClientApproved ? 'Authorize Work Execution' : 'CRITICAL: Authorize Unapproved Site Execution'}
        description={
          isClientApproved
            ? 'Client has formally signed off. Site team will be instructed to proceed.'
            : 'MANDATORY REQUIREMENT: Work has NOT yet been approved by the client. Authorizing execution requires a formal justification and will flag commercial risk exposure.'
        }
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-md bg-status-danger-bg text-status-danger text-xs border border-status-danger-border">
              {actionError}
            </div>
          )}

          {!isClientApproved && (
            <div className="p-3 rounded-md bg-status-danger-bg/50 border border-status-danger-border text-xs text-status-danger space-y-1">
              <strong className="block font-bold">Risk Exposure Impact:</strong>
              This variation's proposed value of{' '}
              <CurrencyDisplay paise={changeOrder.totalProposedPaise} /> will immediately be added to{' '}
              <strong>Work Performed Without Documented Approval</strong>.
            </div>
          )}

          {!isClientApproved && (
            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Mandatory Operational Justification <span className="text-status-danger">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={unapprovedJustification}
                onChange={(e) => setUnapprovedJustification(e.target.value)}
                placeholder="Explain why execution cannot wait for formal client approval (e.g. Superstructure progress will halt, deep excavation pit exposed to monsoon rain risk, critical path milestone)."
                className="w-full p-2.5 rounded-md border border-border text-xs text-text-primary focus:border-secondary focus:outline-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button variant="outline" size="sm" onClick={() => setIsAuthorizeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={isClientApproved ? 'secondary' : 'danger'}
              size="sm"
              onClick={() => authorizeMutation.mutate()}
              isLoading={authorizeMutation.isPending}
            >
              {isClientApproved ? 'Confirm Authorization' : 'Authorize Under Risk'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Stage Approval Review Modal */}
      <ApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        changeOrderId={changeOrder._id}
        orderNumber={changeOrder.orderNumber}
        proposedPaise={changeOrder.totalProposedPaise}
        currentStatus={changeOrder.status}
      />
    </div>
  );
};
