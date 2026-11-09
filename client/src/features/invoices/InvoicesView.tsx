import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Invoice } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { formatDate } from '../../lib/utils';

export const InvoicesView: React.FC = () => {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  // Modals state
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // New Invoice Form
  const [newInvoiceData, setNewInvoiceData] = useState({
    projectId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    selectedChangeOrderIds: [] as string[],
    subtotalRupees: '',
    taxRupees: '',
    notes: '',
  });
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Record Payment Form
  const [paymentData, setPaymentData] = useState({
    amountRupees: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'RTGS' as const,
    referenceNumber: '',
    notes: '',
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res: any = await api.get('/projects');
      return res.data;
    },
  });
  const projects = projectsData?.projects || [];

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices', projectId, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId !== 'all') params.append('projectId', projectId);
      if (status !== 'all') params.append('status', status);
      const res: any = await api.get(`/invoices?${params.toString()}`);
      return res.data;
    },
  });

  // Query approved change orders for invoice creation
  const targetProjectForInvoice = newInvoiceData.projectId || (projects[0]?._id ?? '');
  const { data: approvedOrdersData } = useQuery({
    queryKey: ['approved-orders-for-invoice', targetProjectForInvoice],
    queryFn: async () => {
      if (!targetProjectForInvoice) return null;
      const res: any = await api.get(`/change-orders?projectId=${targetProjectForInvoice}&status=Completed`);
      return res.data;
    },
    enabled: Boolean(targetProjectForInvoice) && isNewInvoiceOpen,
  });
  const availableOrders = approvedOrdersData?.changeOrders || [];

  // Create Invoice Mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await api.post('/invoices', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-exposure'] });
      setIsNewInvoiceOpen(false);
      setNewInvoiceData({
        projectId: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        selectedChangeOrderIds: [],
        subtotalRupees: '',
        taxRupees: '',
        notes: '',
      });
    },
    onError: (err: any) => {
      setInvoiceError(err.message || 'Failed to issue invoice');
    },
  });

  // Record Payment Mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async ({ invoiceId, payload }: { invoiceId: string; payload: any }) => {
      const res: any = await api.post(`/invoices/${invoiceId}/payments`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['financial-exposure'] });
      setIsRecordPaymentOpen(false);
      setSelectedInvoice(null);
      setPaymentData({
        amountRupees: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'RTGS',
        referenceNumber: '',
        notes: '',
      });
    },
    onError: (err: any) => {
      setPaymentError(err.message || 'Failed to record payment');
    },
  });

  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceError(null);

    const subtotal = parseFloat(newInvoiceData.subtotalRupees);
    const tax = parseFloat(newInvoiceData.taxRupees) || 0;

    if (isNaN(subtotal) || subtotal <= 0) {
      setInvoiceError('Please enter a valid invoice subtotal.');
      return;
    }
    if (newInvoiceData.selectedChangeOrderIds.length === 0) {
      setInvoiceError('Please select at least one variation order to bill.');
      return;
    }

    createInvoiceMutation.mutate({
      projectId: targetProjectForInvoice,
      changeOrderIds: newInvoiceData.selectedChangeOrderIds,
      invoiceNumber: newInvoiceData.invoiceNumber.toUpperCase().trim(),
      invoiceDate: newInvoiceData.invoiceDate,
      dueDate: newInvoiceData.dueDate,
      subtotalRupees: subtotal,
      taxRupees: tax,
      notes: newInvoiceData.notes,
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    const amount = parseFloat(paymentData.amountRupees);
    if (isNaN(amount) || amount <= 0) {
      setPaymentError('Please enter a positive payment amount.');
      return;
    }

    if (!selectedInvoice) return;

    recordPaymentMutation.mutate({
      invoiceId: selectedInvoice._id,
      payload: {
        amountRupees: amount,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        referenceNumber: paymentData.referenceNumber,
        notes: paymentData.notes,
      },
    });
  };

  const invoices: Invoice[] = invoicesData?.invoices || [];
  const summary = invoicesData?.summary || { totalInvoiced: 0, totalPaid: 0, totalBalanceDue: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Variation Invoicing & Receivables Reconciliation
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Issue tax invoices against completed change orders and reconcile incoming bank payments
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={Plus}
          onClick={() => {
            setNewInvoiceData((prev) => ({
              ...prev,
              projectId: projects[0]?._id || '',
              invoiceNumber: `INV-${Date.now().toString().slice(-5)}`,
            }));
            setIsNewInvoiceOpen(true);
          }}
        >
          Issue Variation Invoice
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Total Variation Billed
          </div>
          <div className="text-2xl font-bold text-text-primary mt-1 font-mono">
            <CurrencyDisplay paise={summary.totalInvoiced} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Across {invoices.length} invoices</div>
        </Card>

        <Card className="border-l-4 border-l-status-success">
          <div className="text-[11px] font-semibold text-status-success uppercase tracking-wider">
            Total Reconciled Received
          </div>
          <div className="text-2xl font-bold text-status-success mt-1 font-mono">
            <CurrencyDisplay paise={summary.totalPaid} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Verified deposited cashflow</div>
        </Card>

        <Card className="border-l-4 border-l-status-info">
          <div className="text-[11px] font-semibold text-status-info uppercase tracking-wider">
            Outstanding Receivables
          </div>
          <div className="text-2xl font-bold text-status-info mt-1 font-mono">
            <CurrencyDisplay paise={summary.totalBalanceDue} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Unpaid client balances</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-surface p-3 rounded-lg border border-border">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="h-8 px-2.5 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:outline-none"
        >
          <option value="all">All Projects</option>
          {projects.map((p: any) => (
            <option key={p._id} value={p._id}>
              {p.code} — {p.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-8 px-2.5 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="Issued">Issued</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Variations Covered</th>
                <th className="py-3 px-4">Invoice Date / Due Date</th>
                <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                <th className="py-3 px-4 text-right">Paid (₹)</th>
                <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-text-muted">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-text-muted">
                    No variation invoices found. Issue a new invoice against approved change orders above.
                  </td>
                </tr>
              ) : (
                invoices.map((inv: any) => {
                  const proj = typeof inv.project === 'object' ? inv.project : null;
                  const cos = Array.isArray(inv.changeOrders) ? inv.changeOrders : [];

                  return (
                    <tr key={inv._id} className="hover:bg-surface-subtle transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-text-primary">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-text-primary block">{proj?.code || '—'}</span>
                        <span className="text-[11px] text-text-secondary truncate max-w-[150px] block">
                          {proj?.clientName || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        <div className="flex flex-wrap gap-1">
                          {cos.map((co: any) => (
                            <span
                              key={co._id || co}
                              className="px-1.5 py-0.2 rounded bg-surface-muted text-primary text-[10px] font-mono font-semibold border border-border"
                            >
                              {co.orderNumber || 'CO'}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                        <div className="text-[11px]">{formatDate(inv.invoiceDate)}</div>
                        <div className="text-[10px] text-text-muted">Due: {formatDate(inv.dueDate)}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-text-primary whitespace-nowrap">
                        <CurrencyDisplay paise={inv.totalAmountPaise} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-status-success font-medium whitespace-nowrap">
                        <CurrencyDisplay paise={inv.amountPaidPaise} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={inv.balanceDuePaise > 0 ? 'text-status-info' : 'text-text-muted'}>
                          <CurrencyDisplay paise={inv.balanceDuePaise} />
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <StatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {inv.balanceDuePaise > 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            leftIcon={CreditCard}
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPaymentData((prev) => ({
                                ...prev,
                                amountRupees: (inv.balanceDuePaise / 100).toString(),
                              }));
                              setIsRecordPaymentOpen(true);
                            }}
                          >
                            Record Payment
                          </Button>
                        )}
                        {inv.balanceDuePaise === 0 && (
                          <span className="text-[11px] text-status-success font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice Modal */}
      <Modal
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        title="Issue Variation Invoice"
        description="Select completed change orders and formulate tax billing record"
        maxWidth="lg"
      >
        <form onSubmit={handleInvoiceSubmit} className="space-y-4">
          {invoiceError && (
            <div className="p-3 rounded-md bg-status-danger-bg text-status-danger text-xs border border-status-danger-border">
              {invoiceError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Project"
              required
              value={targetProjectForInvoice}
              onChange={(e) => setNewInvoiceData({ ...newInvoiceData, projectId: e.target.value })}
              options={projects.map((p: any) => ({
                value: p._id,
                label: `${p.code} — ${p.name}`,
              }))}
            />

            <Input
              label="Invoice Number"
              required
              value={newInvoiceData.invoiceNumber}
              onChange={(e) => setNewInvoiceData({ ...newInvoiceData, invoiceNumber: e.target.value })}
              placeholder="e.g. INV-2026-001"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoice Date"
              type="date"
              required
              value={newInvoiceData.invoiceDate}
              onChange={(e) => setNewInvoiceData({ ...newInvoiceData, invoiceDate: e.target.value })}
            />
            <Input
              label="Due Date"
              type="date"
              required
              value={newInvoiceData.dueDate}
              onChange={(e) => setNewInvoiceData({ ...newInvoiceData, dueDate: e.target.value })}
            />
          </div>

          {/* Change Orders Selector */}
          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Select Completed Variations to Bill <span className="text-status-danger">*</span>
            </label>
            <div className="max-h-40 overflow-y-auto border border-border rounded-md divide-y divide-border bg-surface-subtle p-2">
              {availableOrders.length === 0 ? (
                <div className="p-3 text-center text-xs text-text-muted">
                  No completed change orders available to bill for this project.
                </div>
              ) : (
                availableOrders.map((co: any) => {
                  const isChecked = newInvoiceData.selectedChangeOrderIds.includes(co._id);
                  return (
                    <label key={co._id} className="flex items-center gap-3 p-2 hover:bg-surface rounded cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          let newIds = [];
                          if (e.target.checked) {
                            newIds = [...newInvoiceData.selectedChangeOrderIds, co._id];
                          } else {
                            newIds = newInvoiceData.selectedChangeOrderIds.filter((id) => id !== co._id);
                          }
                          // Automatically update subtotal from sum of selected change orders
                          const sumPaise = availableOrders
                            .filter((o: any) => newIds.includes(o._id))
                            .reduce((acc: number, o: any) => acc + (o.totalApprovedPaise || 0), 0);

                          const subtotalRupees = (sumPaise / 100).toFixed(2);
                          const taxRupees = ((sumPaise * 0.18) / 100).toFixed(2);

                          setNewInvoiceData((prev) => ({
                            ...prev,
                            selectedChangeOrderIds: newIds,
                            subtotalRupees,
                            taxRupees,
                          }));
                        }}
                        className="rounded border-border text-secondary focus:ring-secondary/20"
                      />
                      <span className="font-mono font-bold text-text-primary">{co.orderNumber}</span>
                      <span className="text-text-secondary truncate">{co.title}</span>
                      <span className="ml-auto font-mono font-semibold text-text-primary">
                        <CurrencyDisplay paise={co.totalApprovedPaise} />
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Subtotal (₹ INR)"
              type="number"
              step="any"
              required
              value={newInvoiceData.subtotalRupees}
              onChange={(e) => setNewInvoiceData({ ...newInvoiceData, subtotalRupees: e.target.value })}
              placeholder="0.00"
            />
            <Input
              label="Applicable GST Tax (₹ INR)"
              type="number"
              step="any"
              value={newInvoiceData.taxRupees}
              onChange={(e) => setNewInvoiceData({ ...newInvoiceData, taxRupees: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsNewInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={createInvoiceMutation.isPending}
            >
              Issue Tax Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        title={`Record Payment for ${selectedInvoice?.invoiceNumber}`}
        description="Allocate incoming funds to reconcile outstanding balance"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {paymentError && (
            <div className="p-3 rounded-md bg-status-danger-bg text-status-danger text-xs border border-status-danger-border">
              {paymentError}
            </div>
          )}

          {selectedInvoice && (
            <div className="p-3 rounded-lg bg-surface-subtle border border-border flex items-center justify-between text-xs">
              <div>
                <span className="text-text-secondary block">Total Billed:</span>
                <span className="font-mono font-bold text-text-primary">
                  <CurrencyDisplay paise={selectedInvoice.totalAmountPaise} />
                </span>
              </div>
              <div className="text-right">
                <span className="text-text-secondary block">Balance Outstanding:</span>
                <span className="font-mono font-bold text-status-info text-sm">
                  <CurrencyDisplay paise={selectedInvoice.balanceDuePaise} />
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Payment Amount (₹ INR)"
              type="number"
              step="any"
              required
              value={paymentData.amountRupees}
              onChange={(e) => setPaymentData({ ...paymentData, amountRupees: e.target.value })}
              placeholder="Amount received"
              helperText="Cannot exceed outstanding balance"
            />
            <Input
              label="Payment Date"
              type="date"
              required
              value={paymentData.paymentDate}
              onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Payment Method"
              required
              value={paymentData.paymentMethod}
              onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value as any })}
              options={[
                { value: 'RTGS', label: 'RTGS (Real Time Gross Settlement)' },
                { value: 'NEFT', label: 'NEFT (Electronic Funds Transfer)' },
                { value: 'Bank Transfer', label: 'Direct Bank Wire' },
                { value: 'Cheque', label: 'Bank Cheque / Demand Draft' },
                { value: 'Letter of Credit', label: 'Letter of Credit (LC)' },
                { value: 'Other', label: 'Other' },
              ]}
            />
            <Input
              label="Bank Reference / UTR Number"
              required
              value={paymentData.referenceNumber}
              onChange={(e) => setPaymentData({ ...paymentData, referenceNumber: e.target.value })}
              placeholder="e.g. UTR-HDFC-982348"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsRecordPaymentOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={recordPaymentMutation.isPending}
            >
              Reconcile Payment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

