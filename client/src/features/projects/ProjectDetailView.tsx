import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  FileSpreadsheet,
  Plus,
  Lock,
  Download,
  Upload,
  UserCheck,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Tabs } from '../../components/ui/Tabs';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/utils';

export const ProjectDetailView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // BOQ Item state
  const [boqSearch, setBoqSearch] = useState('');
  const [boqCategory, setBoqCategory] = useState('all');
  const [isAddBOQModalOpen, setIsAddBOQModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCSVText, setImportCSVText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  // New BOQ Item Form
  const [newItem, setNewItem] = useState({
    itemCode: '',
    description: '',
    category: 'Civil',
    unit: 'm3',
    baselineQuantity: '',
    unitRateRupees: '',
    notes: '',
  });

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const res: any = await api.get(`/projects/${id}`);
      return res.data;
    },
  });

  const { data: boqData, isLoading: boqLoading } = useQuery({
    queryKey: ['project-boq', id, boqCategory, boqSearch],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (boqCategory !== 'all') params.append('category', boqCategory);
      if (boqSearch) params.append('search', boqSearch);
      const res: any = await api.get(`/projects/${id}/boq?${params.toString()}`);
      return res.data;
    },
  });

  const { data: changeOrdersData } = useQuery({
    queryKey: ['project-change-orders', id],
    queryFn: async () => {
      const res: any = await api.get(`/change-orders?projectId=${id}`);
      return res.data;
    },
  });

  // Lock baseline mutation
  const lockMutation = useMutation({
    mutationFn: async () => {
      const res: any = await api.post(`/projects/${id}/boq/lock`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-boq', id] });
    },
  });

  // Create BOQ Item mutation
  const createBOQMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await api.post(`/projects/${id}/boq`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-boq', id] });
      setIsAddBOQModalOpen(false);
      setNewItem({
        itemCode: '',
        description: '',
        category: 'Civil',
        unit: 'm3',
        baselineQuantity: '',
        unitRateRupees: '',
        notes: '',
      });
    },
  });

  // Import CSV mutation
  const importMutation = useMutation({
    mutationFn: async (rows: any[]) => {
      const res: any = await api.post(`/projects/${id}/boq/import`, { rows });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-boq', id] });
      setIsImportModalOpen(false);
      setImportCSVText('');
    },
    onError: (err: any) => {
      setImportError(err.message || 'Import failed');
    },
  });

  const handleAddBOQSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(newItem.baselineQuantity);
    const rateRupees = parseFloat(newItem.unitRateRupees);
    if (isNaN(qty) || isNaN(rateRupees)) return;

    createBOQMutation.mutate({
      itemCode: newItem.itemCode,
      description: newItem.description,
      category: newItem.category,
      unit: newItem.unit,
      baselineQuantity: qty,
      unitRatePaise: Math.round(rateRupees * 100),
      notes: newItem.notes,
    });
  };

  const handleCSVImport = () => {
    setImportError(null);
    try {
      const lines = importCSVText.trim().split('\n');
      if (lines.length < 2) {
        setImportError('CSV must include a header line and at least one data row.');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((p) => p.trim().replace(/"/g, ''));
        if (parts.length >= 4) {
          rows.push({
            itemCode: parts[0] || `ITEM-${i}`,
            category: parts[1] || 'General',
            description: parts[2] || 'Line Item',
            unit: parts[3] || 'nos',
            baselineQuantity: parseFloat(parts[4]) || 1,
            unitRateRupees: parseFloat(parts[5]) || 0,
            notes: parts[6] || '',
          });
        }
      }

      if (rows.length === 0) {
        setImportError('Could not parse any valid rows.');
        return;
      }

      importMutation.mutate(rows);
    } catch (err: any) {
      setImportError(err.message || 'Error processing CSV');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-text-secondary">Loading project data...</div>;
  }

  const project = projectData?.project;
  const financial = projectData?.financialSummary || {};
  const members = projectData?.members || [];
  const boqItems = boqData?.items || [];
  const changeOrders = changeOrdersData?.changeOrders || [];

  const allItemsLocked = boqItems.length > 0 && boqItems.every((item: any) => item.isLocked);

  return (
    <div className="space-y-6">
      {/* Project Master Header */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-primary text-white font-bold tracking-wider">
              {project.code}
            </span>
            <StatusBadge status={project.status} size="sm" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">{project.name}</h1>
          <p className="text-xs text-text-secondary mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>Client: <strong className="text-text-primary">{project.clientName}</strong></span>
            <span>Contractor: <strong className="text-text-primary">{project.contractorName}</strong></span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-text-muted" />
              {project.location?.city}, {project.location?.state}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              {formatDate(project.startDate)} – {formatDate(project.targetEndDate)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link to={`/change-orders/new?projectId=${project._id}`}>
            <Button variant="secondary" size="sm" leftIcon={Plus}>
              Log Change Order
            </Button>
          </Link>
          <a href={`/api/projects/${project._id}/boq/export`} download>
            <Button variant="outline" size="sm" leftIcon={Download}>
              Export BOQ CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Contract & Reconciled Financial Exposure Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Original Baseline Value
          </div>
          <div className="text-xl font-bold text-text-primary mt-1 font-mono">
            <CurrencyDisplay paise={financial.originalContractPaise} />
          </div>
          <div className="text-[11px] text-text-secondary mt-0.5">Immutable signed contract base</div>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Approved Variations Value
          </div>
          <div className="text-xl font-bold text-secondary mt-1 font-mono">
            <CurrencyDisplay paise={financial.approvedVariationsPaise} />
          </div>
          <div className="text-[11px] text-secondary mt-0.5 font-medium">
            +
            {financial.originalContractPaise > 0
              ? (
                  (financial.approvedVariationsPaise / financial.originalContractPaise) *
                  100
                ).toFixed(2)
              : '0.00'}
            % variation on contract
          </div>
        </Card>

        <Card className="border-l-4 border-l-primary-hover bg-primary-light/20">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Revised Contract Commitment
          </div>
          <div className="text-xl font-bold text-primary mt-1 font-mono">
            <CurrencyDisplay paise={financial.revisedContractTotalPaise} />
          </div>
          <div className="text-[11px] text-text-secondary mt-0.5">Baseline + Approved scope</div>
        </Card>

        <Card className="border-l-4 border-l-status-danger bg-status-danger-bg/20">
          <div className="text-[11px] font-semibold text-status-danger uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Unapproved Work Performed
          </div>
          <div className="text-xl font-bold text-status-danger mt-1 font-mono">
            <CurrencyDisplay paise={financial.unapprovedWorkExposurePaise} />
          </div>
          <div className="text-[11px] text-status-danger/80 mt-0.5 font-medium">
            Execution risk pending approval
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview & Governance' },
          { id: 'boq', label: 'Bill of Quantities (BOQ)', count: boqItems.length },
          { id: 'variations', label: 'Change Orders & Variations', count: changeOrders.length },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 1: Overview & Governance */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Project Master Scope</CardTitle>
                <CardDescription>Contractual description and key milestones</CardDescription>
              </div>
            </CardHeader>
            <p className="text-xs text-text-primary leading-relaxed">
              {project.description ||
                'Construction of high-specification commercial development including substructure civil works, reinforced concrete superstructure, MEP infrastructure, and façade engineering.'}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-xs">
              <div>
                <span className="text-[11px] text-text-secondary block">Client Organization:</span>
                <span className="font-semibold text-text-primary">{project.clientName}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-secondary block">Appointed Main Contractor:</span>
                <span className="font-semibold text-text-primary">{project.contractorName}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-secondary block">Execution City & State:</span>
                <span className="font-semibold text-text-primary">{project.location?.city}, {project.location?.state}</span>
              </div>
              <div>
                <span className="text-[11px] text-text-secondary block">Contract Currency:</span>
                <span className="font-semibold text-text-primary">{project.currency} (Indian Rupee)</span>
              </div>
            </div>
          </Card>

          <Card className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Assigned Project Team</CardTitle>
                <CardDescription>Role authorization and project contacts</CardDescription>
              </div>
            </CardHeader>
            <div className="space-y-2.5">
              {members.length === 0 ? (
                <p className="text-xs text-text-muted">No team members assigned.</p>
              ) : (
                members.map((m: any) => (
                  <div key={m._id} className="flex items-center gap-3 p-2 rounded-md bg-surface-subtle border border-border">
                    <div className="w-7 h-7 rounded-full bg-secondary-light text-secondary font-bold text-xs flex items-center justify-center shrink-0">
                      {m.user?.name?.[0] || 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text-primary truncate">{m.user?.name}</div>
                      <div className="text-[10px] text-secondary font-medium uppercase">{m.projectRole}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Tab 2: Bill of Quantities (BOQ) */}
      {activeTab === 'boq' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search item code or description..."
                value={boqSearch}
                onChange={(e) => setBoqSearch(e.target.value)}
                className="h-8 px-3 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:outline-none"
              />
              <select
                value={boqCategory}
                onChange={(e) => setBoqCategory(e.target.value)}
                className="h-8 px-3 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Civil">Civil</option>
                <option value="Structural">Structural</option>
                <option value="MEP">MEP</option>
                <option value="Finishing">Finishing</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {!allItemsLocked && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Upload}
                    onClick={() => setIsImportModalOpen(true)}
                  >
                    Import CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Plus}
                    onClick={() => setIsAddBOQModalOpen(true)}
                  >
                    Add BOQ Item
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={Lock}
                    onClick={() => lockMutation.mutate()}
                    isLoading={lockMutation.isPending}
                  >
                    Lock Baseline
                  </Button>
                </>
              )}
              {allItemsLocked && (
                <span className="px-2.5 py-1 rounded bg-secondary-light text-secondary text-xs font-semibold border border-secondary/20 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Contract Baseline Locked (Immutable)
                </span>
              )}
            </div>
          </div>

          {/* BOQ Table */}
          <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="py-2.5 px-3">Item Code</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Scope Specification Description</th>
                    <th className="py-2.5 px-3">Unit</th>
                    <th className="py-2.5 px-3 text-right">Baseline Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 text-right">Baseline Total</th>
                    <th className="py-2.5 px-3 text-right">Revised Qty</th>
                    <th className="py-2.5 px-3 text-right">Revised Total</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {boqLoading ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-text-muted">
                        Loading Bill of Quantities...
                      </td>
                    </tr>
                  ) : boqItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-text-muted">
                        No BOQ line items found. Import a schedule or add baseline lines above.
                      </td>
                    </tr>
                  ) : (
                    boqItems.map((item: any) => {
                      const hasVar = item.hasVariation;
                      return (
                        <tr key={item._id} className="hover:bg-surface-subtle transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-text-primary">
                            {item.itemCode}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary text-[10px] font-semibold">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-text-primary max-w-sm truncate" title={item.description}>
                            {item.description}
                          </td>
                          <td className="py-2.5 px-3 text-text-secondary font-mono">{item.unit}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-text-primary">
                            {item.baselineQuantity.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-text-primary">
                            <CurrencyDisplay paise={item.unitRatePaise} />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-text-primary">
                            <CurrencyDisplay paise={item.baselineAmountPaise} />
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            <span className={hasVar ? 'font-bold text-secondary' : 'text-text-primary'}>
                              {item.revisedQuantity.toLocaleString('en-IN')}
                            </span>
                            {hasVar && (
                              <span className="text-[10px] text-secondary block font-semibold">
                                +{item.variationQuantity} {item.unit}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-text-primary">
                            <CurrencyDisplay paise={item.revisedAmountPaise} />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {item.isLocked ? (
                              <span className="text-[10px] text-text-muted flex items-center justify-center gap-1">
                                <Lock className="w-3 h-3 text-secondary" /> Locked
                              </span>
                            ) : (
                              <span className="text-[10px] text-status-warning font-semibold">Draft</span>
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
        </div>
      )}

      {/* Tab 3: Change Orders & Variations */}
      {activeTab === 'variations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">
              All Change Orders for {project.name}
            </h3>
            <Link to={`/change-orders/new?projectId=${project._id}`}>
              <Button variant="secondary" size="sm" leftIcon={Plus}>
                New Change Order
              </Button>
            </Link>
          </div>

          <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-subtle">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                    <th className="py-3 px-4">Order Number & Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Originator</th>
                    <th className="py-3 px-4 text-right">Proposed Amount</th>
                    <th className="py-3 px-4 text-right">Approved Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {changeOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-text-muted">
                        No change orders logged for this project yet.
                      </td>
                    </tr>
                  ) : (
                    changeOrders.map((co: any) => (
                      <tr key={co._id} className="hover:bg-surface-subtle transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            to={`/change-orders/${co._id}`}
                            className="font-semibold text-text-primary hover:text-secondary transition-colors"
                          >
                            <span className="font-mono text-xs text-primary font-bold mr-1.5">
                              {co.orderNumber}
                            </span>
                            {co.title}
                          </Link>
                          {co.unapprovedExecution && (
                            <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] bg-status-danger-bg text-status-danger font-semibold border border-status-danger-border">
                              UNAPPROVED WORK
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{co.category}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-muted text-text-primary">
                            {co.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-text-secondary">{co.originatingParty}</td>
                        <td className="py-3 px-4 text-right font-mono font-medium text-text-primary">
                          <CurrencyDisplay paise={co.totalProposedPaise} />
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-secondary">
                          <CurrencyDisplay paise={co.totalApprovedPaise} />
                        </td>
                        <td className="py-3 px-4 text-center">
                          <StatusBadge status={co.status} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link to={`/change-orders/${co._id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add BOQ Item Modal */}
      <Modal
        isOpen={isAddBOQModalOpen}
        onClose={() => setIsAddBOQModalOpen(false)}
        title="Add Contract Baseline BOQ Item"
        description="Insert contractual specification line into project baseline schedule"
      >
        <form onSubmit={handleAddBOQSubmit} className="space-y-3.5">
          <Input
            label="Item Code (e.g. 1.01.A)"
            required
            value={newItem.itemCode}
            onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
            placeholder="1.01.A"
          />

          <Select
            label="Work Category"
            required
            value={newItem.category}
            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
            options={[
              { value: 'Civil', label: 'Civil' },
              { value: 'Structural', label: 'Structural' },
              { value: 'MEP', label: 'MEP' },
              { value: 'Finishing', label: 'Finishing' },
              { value: 'Infrastructure', label: 'Infrastructure' },
              { value: 'External Works', label: 'External Works' },
              { value: 'General', label: 'General' },
            ]}
          />

          <Input
            label="Scope Specification Description"
            required
            value={newItem.description}
            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
            placeholder="Detailed description of works"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit (e.g. m3, MT, nos)"
              required
              value={newItem.unit}
              onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
              placeholder="m3"
            />
            <Input
              label="Baseline Quantity"
              type="number"
              step="any"
              required
              value={newItem.baselineQuantity}
              onChange={(e) => setNewItem({ ...newItem, baselineQuantity: e.target.value })}
              placeholder="100"
            />
          </div>

          <Input
            label="Contract Unit Rate (₹ INR)"
            type="number"
            step="any"
            required
            value={newItem.unitRateRupees}
            onChange={(e) => setNewItem({ ...newItem, unitRateRupees: e.target.value })}
            placeholder="4500"
            helperText="Base unit rate agreed in original contract"
          />

          <div className="pt-2 flex justify-end gap-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddBOQModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={createBOQMutation.isPending}
            >
              Add Baseline Item
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import CSV Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Bulk Import Bill of Quantities (CSV)"
        description="Paste comma-separated BOQ lines: ItemCode, Category, Description, Unit, Quantity, RateRupees, Notes"
        maxWidth="lg"
      >
        <div className="space-y-3.5">
          {importError && (
            <div className="p-3 rounded-md bg-status-danger-bg text-status-danger text-xs border border-status-danger-border">
              {importError}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              CSV Data (Comma-Separated)
            </label>
            <textarea
              rows={8}
              value={importCSVText}
              onChange={(e) => setImportCSVText(e.target.value)}
              placeholder={`ItemCode,Category,Description,Unit,Quantity,RateRupees,Notes\n1.01,Civil,Earthwork excavation in foundation,m3,450,350,Standard cut\n1.02,Civil,Plain cement concrete 1:4:8,m3,85,4200,Sub-base\n2.01,Structural,TMT Fe500 Reinforcement Steel,MT,25,65000,Primary bars`}
              className="w-full p-3 rounded-md border border-border font-mono text-xs bg-surface text-text-primary focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/20"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleCSVImport}
              isLoading={importMutation.isPending}
            >
              Parse & Import Lines
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

