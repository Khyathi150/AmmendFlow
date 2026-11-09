import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  GitPullRequest,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Save,
  Send,
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { calculateEstimateTotals } from '../../../../server/src/utils/currencyMath';

export const NewChangeOrderView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('projectId') || '';

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    projectId: preselectedProjectId,
    title: '',
    category: 'Additional Work',
    priority: 'Medium',
    originatingParty: 'Contractor',
    reason: '',
    description: '',
    scheduleImpactDays: 0,
    linkedBoqItemIds: [] as string[],
    overheadPct: 10,
    markupPct: 15,
    taxPct: 18,
    estimateNotes: '',
  });

  // Estimate line items state
  const [estimateItems, setEstimateItems] = useState([
    {
      description: '',
      category: 'Material' as const,
      quantity: 1,
      unit: 'nos',
      unitRateRupees: 0,
      boqItemRef: '',
    },
  ]);

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res: any = await api.get('/projects');
      return res.data;
    },
  });
  const projects = projectsData?.projects || [];

  const targetProjectId = formData.projectId || (projects[0]?._id ?? '');

  const { data: boqData } = useQuery({
    queryKey: ['project-boq', targetProjectId],
    queryFn: async () => {
      if (!targetProjectId) return null;
      const res: any = await api.get(`/projects/${targetProjectId}/boq`);
      return res.data;
    },
    enabled: Boolean(targetProjectId),
  });
  const boqItems = boqData?.items || [];

  // Line item handlers
  const addLineItem = () => {
    setEstimateItems((prev) => [
      ...prev,
      {
        description: '',
        category: 'Material',
        quantity: 1,
        unit: 'nos',
        unitRateRupees: 0,
        boqItemRef: '',
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setEstimateItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    setEstimateItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Live calculation of financial totals in integer paise
  const directCostPaise = estimateItems.reduce((acc, item) => {
    const ratePaise = Math.round((Number(item.unitRateRupees) || 0) * 100);
    const lineTotal = Math.round((Number(item.quantity) || 0) * ratePaise);
    return acc + lineTotal;
  }, 0);

  const totals = calculateEstimateTotals(
    directCostPaise,
    formData.overheadPct,
    formData.markupPct,
    formData.taxPct
  );

  const createMutation = useMutation({
    mutationFn: async (isDraft: boolean) => {
      const payload = {
        projectId: targetProjectId,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        originatingParty: formData.originatingParty,
        reason: formData.reason,
        scheduleImpactDays: Number(formData.scheduleImpactDays) || 0,
        linkedBoqItemIds: formData.linkedBoqItemIds,
        isDraft,
        estimate: {
          items: estimateItems.filter((it) => it.description.trim().length > 0),
          overheadPct: formData.overheadPct,
          markupPct: formData.markupPct,
          taxPct: formData.taxPct,
          notes: formData.estimateNotes,
        },
      };
      const res: any = await api.post('/change-orders', payload);
      return res.data;
    },
    onSuccess: (data) => {
      navigate(`/change-orders/${data.changeOrder._id}`);
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create change order');
    },
  });

  const steps = [
    { number: 1, title: 'Classification' },
    { number: 2, title: 'Scope & BOQ' },
    { number: 3, title: 'Impact' },
    { number: 4, title: 'Cost Estimate' },
    { number: 5, title: 'Review & Submit' },
  ];

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (!formData.title || formData.title.trim().length < 3) {
        setError('Please enter a descriptive variation title (at least 3 characters).');
        return;
      }
      if (!formData.reason || formData.reason.trim().length < 5) {
        setError('Please provide the commercial or site justification for modification.');
        return;
      }
    }
    if (currentStep === 2) {
      if (!formData.description || formData.description.trim().length < 10) {
        setError('Please provide a detailed engineering scope description (at least 10 characters).');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Log New Change Order (Variation Request)
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            5-step structured engineering, scope, and unit-rate financial formulation
          </p>
        </div>
        <Link to="/change-orders">
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
        </Link>
      </div>

      {/* Step Indicator */}
      <div className="grid grid-cols-5 gap-2">
        {steps.map((s) => {
          const isDone = currentStep > s.number;
          const isCurrent = currentStep === s.number;
          return (
            <div
              key={s.number}
              className={`p-2.5 rounded-lg border text-center transition-all ${isCurrent
                  ? 'border-secondary bg-secondary-light text-secondary font-bold shadow-sm'
                  : isDone
                    ? 'border-border bg-surface text-text-primary'
                    : 'border-border/60 bg-surface-subtle text-text-muted'
                }`}
            >
              <div className="text-[10px] uppercase tracking-wider font-semibold">
                Step {s.number}
              </div>
              <div className="text-xs truncate font-medium">{s.title}</div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="p-3.5 rounded-md bg-status-danger-bg border border-status-danger-border flex items-start gap-2.5 text-xs text-status-danger">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Basic Info & Classification */}
      {currentStep === 1 && (
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle>Step 1: Project & Variation Classification</CardTitle>
              <CardDescription>Target contract, origin party, and reason for scope variation</CardDescription>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Associated Project"
              required
              value={targetProjectId}
              onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
              options={projects.map((p: any) => ({
                value: p._id,
                label: `${p.code} — ${p.name}`,
              }))}
            />

            <Select
              label="Variation Category"
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'Additional Work', label: 'Additional Work (New Scope)' },
                { value: 'Omitted Work', label: 'Omitted Work (Deduction)' },
                { value: 'Quantity Variation', label: 'Quantity Variation (Overrun/Underrun)' },
                { value: 'Material Substitution', label: 'Material Substitution' },
                { value: 'Design Modification', label: 'Design Modification (Architectural/Structural)' },
                { value: 'Time Extension', label: 'Time Extension Claim' },
                { value: 'Other', label: 'Other Variation' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Priority Level"
              required
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              options={[
                { value: 'Low', label: 'Low — Routine documentation' },
                { value: 'Medium', label: 'Medium — Normal review timeline' },
                { value: 'High', label: 'High — Affects upcoming construction activities' },
                { value: 'Urgent', label: 'Urgent — Critical path blocked on site' },
              ]}
            />

            <Select
              label="Originating Request Party"
              required
              value={formData.originatingParty}
              onChange={(e) => setFormData({ ...formData, originatingParty: e.target.value as any })}
              options={[
                { value: 'Contractor', label: 'Contractor Site Team' },
                { value: 'Client', label: 'Client / Developer Instruction' },
                { value: 'Architect', label: 'Architect Drawing Revision' },
                { value: 'Consultant', label: 'Structural / MEP Consultant' },
                { value: 'Site Condition', label: 'Differing Site / Geotechnical Condition' },
              ]}
            />
          </div>

          <Input
            label="Variation Title"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="e.g. Additional Bored Cast-In-Situ Piles at Tower B Basement"
          />

          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Justification & Root Cause <span className="text-status-danger">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Explain why this change is necessary and why it was not part of original scope (e.g. Encountered hard fractured granite rock during basement excavation at -8m depth requiring percussion drilling)."
              className="w-full p-3 rounded-md border border-border text-xs text-text-primary focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/20"
            />
          </div>
        </Card>
      )}

      {/* Step 2: Scope Description & BOQ Mapping */}
      {currentStep === 2 && (
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle>Step 2: Engineering Scope & Baseline BOQ Linkage</CardTitle>
              <CardDescription>Provide comprehensive technical specification and map to contract items</CardDescription>
            </div>
          </CardHeader>

          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1">
              Comprehensive Scope of Work Specification <span className="text-status-danger">*</span>
            </label>
            <textarea
              rows={5}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the complete scope of works to be performed, engineering methodology, dimensions, grade of materials, and machinery requirements."
              className="w-full p-3 rounded-md border border-border text-xs text-text-primary focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-primary block mb-1.5">
              Link to Contract Baseline BOQ Items (Optional)
            </label>
            <p className="text-[11px] text-text-secondary mb-2">
              Select any existing contractual BOQ lines impacted by this variation to automatically calculate revised quantities and variance.
            </p>

            <div className="max-h-48 overflow-y-auto border border-border rounded-md divide-y divide-border bg-surface-subtle p-2">
              {boqItems.length === 0 ? (
                <div className="p-3 text-center text-xs text-text-muted">No baseline BOQ items found for this project.</div>
              ) : (
                boqItems.map((item: any) => {
                  const isChecked = formData.linkedBoqItemIds.includes(item._id);
                  return (
                    <label key={item._id} className="flex items-center gap-3 p-2 hover:bg-surface rounded cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              linkedBoqItemIds: [...prev.linkedBoqItemIds, item._id],
                            }));
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              linkedBoqItemIds: prev.linkedBoqItemIds.filter((id) => id !== item._id),
                            }));
                          }
                        }}
                        className="rounded border-border text-secondary focus:ring-secondary/20"
                      />
                      <span className="font-mono font-bold text-text-primary">{item.itemCode}</span>
                      <span className="text-text-secondary truncate">{item.description}</span>
                      <span className="ml-auto font-mono text-[11px] text-text-muted">
                        ({item.baselineQuantity} {item.unit})
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Step 3: Supporting Evidence & Schedule Impact */}
      {currentStep === 3 && (
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle>Step 3: Schedule Impact & Supporting Substantiation</CardTitle>
              <CardDescription>Quantify time delay and attach site instructions or engineer communications</CardDescription>
            </div>
          </CardHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Schedule Impact (Contractual Delay in Days)"
              type="number"
              min={0}
              value={formData.scheduleImpactDays}
              onChange={(e) => setFormData({ ...formData, scheduleImpactDays: parseInt(e.target.value, 10) || 0 })}
              helperText="Zero indicates this change order will be completed within agreed master project schedule."
            />

            <div>
              <label className="text-xs font-semibold text-text-primary block mb-1">
                Supporting Documentation & Instructions
              </label>
              <p className="text-xs text-text-secondary p-3 bg-surface-subtle border border-border rounded-md">
                Drawings and PDF attachments can be uploaded in the <strong>Documents & Drawing Annotations</strong> tab after logging this change order to overlay visual markup clouds and arrows.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Step 4: High-Precision Cost Estimation Engine */}
      {currentStep === 4 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Step 4: Unit-Rate Cost Estimation Engine</CardTitle>
                <CardDescription>
                  Formulate direct costs across Material, Labour, Equipment, Subcontracting with exact integer paise precision
                </CardDescription>
              </div>
              <Button variant="secondary" size="sm" leftIcon={Plus} onClick={addLineItem}>
                Add Cost Item
              </Button>
            </CardHeader>

            {/* Line items table */}
            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary uppercase">
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 w-20">Unit</th>
                    <th className="py-2.5 px-3 w-24 text-right">Quantity</th>
                    <th className="py-2.5 px-3 w-32 text-right">Unit Rate (₹)</th>
                    <th className="py-2.5 px-3 w-32 text-right">Line Total (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {estimateItems.map((item, index) => {
                    const ratePaise = Math.round((Number(item.unitRateRupees) || 0) * 100);
                    const linePaise = Math.round((Number(item.quantity) || 0) * ratePaise);

                    return (
                      <tr key={index} className="hover:bg-surface-subtle">
                        <td className="py-2 px-3">
                          <select
                            value={item.category}
                            onChange={(e) => updateLineItem(index, 'category', e.target.value)}
                            className="h-8 px-2 rounded border border-border bg-surface text-xs focus:border-secondary focus:outline-none"
                          >
                            <option value="Material">Material</option>
                            <option value="Labour">Labour</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Subcontracting">Subcontracting</option>
                            <option value="Other">Other</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="Specification / description..."
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            className="w-full h-8 px-2 rounded border border-border bg-surface text-xs focus:border-secondary focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            placeholder="m3, MT"
                            value={item.unit}
                            onChange={(e) => updateLineItem(index, 'unit', e.target.value)}
                            className="w-full h-8 px-2 rounded border border-border bg-surface text-xs focus:border-secondary focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-full h-8 px-2 rounded border border-border bg-surface text-xs text-right font-mono focus:border-secondary focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            step="any"
                            min={0}
                            value={item.unitRateRupees}
                            onChange={(e) => updateLineItem(index, 'unitRateRupees', parseFloat(e.target.value) || 0)}
                            className="w-full h-8 px-2 rounded border border-border bg-surface text-xs text-right font-mono focus:border-secondary focus:outline-none"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-text-primary">
                          <CurrencyDisplay paise={linePaise} />
                        </td>
                        <td className="py-2 px-2 text-center">
                          {estimateItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              className="text-text-muted hover:text-status-danger p-1 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Financial Breakdown Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border mt-4">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                      Overhead (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.overheadPct}
                      onChange={(e) => setFormData({ ...formData, overheadPct: parseFloat(e.target.value) || 0 })}
                      className="w-full h-8 px-2 rounded border border-border bg-surface text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                      Profit Markup (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.markupPct}
                      onChange={(e) => setFormData({ ...formData, markupPct: parseFloat(e.target.value) || 0 })}
                      className="w-full h-8 px-2 rounded border border-border bg-surface text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-text-secondary block mb-1">
                      Tax GST (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.taxPct}
                      onChange={(e) => setFormData({ ...formData, taxPct: parseFloat(e.target.value) || 0 })}
                      className="w-full h-8 px-2 rounded border border-border bg-surface text-xs font-mono"
                    />
                  </div>
                </div>

                <Input
                  label="Estimator Commercial Notes"
                  value={formData.estimateNotes}
                  onChange={(e) => setFormData({ ...formData, estimateNotes: e.target.value })}
                  placeholder="e.g. Rates quoted based on prevailing CPWD DSR 2024 schedule."
                />
              </div>

              {/* Exact Cost Accounting Receipt Box */}
              <div className="bg-surface-subtle p-4 rounded-lg border border-border space-y-2 text-xs">
                <div className="flex justify-between text-text-secondary">
                  <span>Direct Works Cost (Direct Cost):</span>
                  <CurrencyDisplay paise={totals.directCostPaise} />
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Overhead ({totals.overheadPct}%):</span>
                  <CurrencyDisplay paise={totals.overheadPaise} />
                </div>
                <div className="flex justify-between text-text-primary font-medium pt-1 border-t border-border/60">
                  <span>Pre-Markup Subtotal:</span>
                  <CurrencyDisplay paise={totals.preMarkupPaise} />
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Profit Markup ({totals.markupPct}%):</span>
                  <CurrencyDisplay paise={totals.markupPaise} />
                </div>
                <div className="flex justify-between text-text-secondary">
                  <span>Tax ({totals.taxPct}% GST):</span>
                  <CurrencyDisplay paise={totals.taxPaise} />
                </div>
                <div className="flex justify-between text-base font-bold text-primary pt-2 border-t-2 border-primary/20">
                  <span>Proposed Total Client Charge:</span>
                  <CurrencyDisplay paise={totals.totalProposedPaise} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Step 5: Summary Review & Formal Submission */}
      {currentStep === 5 && (
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle>Step 5: Review & Formal Verification</CardTitle>
              <CardDescription>Inspect complete variation submission package before dispatch</CardDescription>
            </div>
          </CardHeader>

          <div className="grid grid-cols-2 gap-4 text-xs bg-surface-subtle p-4 rounded-lg border border-border">
            <div>
              <span className="text-[11px] text-text-secondary block">Variation Title:</span>
              <span className="font-semibold text-text-primary">{formData.title}</span>
            </div>
            <div>
              <span className="text-[11px] text-text-secondary block">Classification:</span>
              <span className="font-semibold text-text-primary">{formData.category} • Priority: {formData.priority}</span>
            </div>
            <div>
              <span className="text-[11px] text-text-secondary block">Originating Party:</span>
              <span className="font-semibold text-text-primary">{formData.originatingParty}</span>
            </div>
            <div>
              <span className="text-[11px] text-text-secondary block">Schedule Impact:</span>
              <span className="font-semibold text-text-primary">{formData.scheduleImpactDays} Days</span>
            </div>
          </div>

          <div className="p-4 rounded-lg border-2 border-secondary/30 bg-secondary-light/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider block">
                Final Proposed Change Value
              </span>
              <p className="text-xs text-text-secondary mt-0.5">
                Includes {totals.directCostPaise > 0 ? estimateItems.length : 0} direct line items, overhead, profit margin, and GST.
              </p>
            </div>
            <div className="text-2xl font-bold text-primary font-mono">
              <CurrencyDisplay paise={totals.totalProposedPaise} />
            </div>
          </div>
        </Card>
      )}

      {/* Step Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {currentStep > 1 ? (
          <Button variant="outline" size="sm" leftIcon={ArrowLeft} onClick={handleBack}>
            Back: Step {currentStep - 1}
          </Button>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={Save}
            onClick={() => createMutation.mutate(true)}
            isLoading={createMutation.isPending}
          >
            Save Incomplete Draft
          </Button>

          {currentStep < 5 ? (
            <Button variant="secondary" size="sm" rightIcon={ArrowRight} onClick={handleNext}>
              Next: Step {currentStep + 1}
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              size="md"
              leftIcon={Send}
              onClick={() => createMutation.mutate(false)}
              isLoading={createMutation.isPending}
            >
              Submit Change Order for Approval
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

