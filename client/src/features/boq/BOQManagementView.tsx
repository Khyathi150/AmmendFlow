import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Lock,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { api, downloadAuthenticatedFile } from '../../lib/axios';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { StatusBadge } from '../../components/shared/StatusBadge';

export const BOQManagementView: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res: any = await api.get('/projects');
      return res.data;
    },
  });

  const projects = projectsData?.projects || [];
  const activeProjectId = selectedProjectId || (projects[0]?._id ?? '');

  const { data: boqData, isLoading } = useQuery({
    queryKey: ['boq-management', activeProjectId, category, search],
    queryFn: async () => {
      if (!activeProjectId) return null;
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      if (search) params.append('search', search);
      const res: any = await api.get(`/projects/${activeProjectId}/boq?${params.toString()}`);
      return res.data;
    },
    enabled: Boolean(activeProjectId),
  });

  const items = boqData?.items || [];
  const summary = boqData?.summary || {
    itemCount: 0,
    totalBaselineAmountPaise: 0,
    totalRevisedAmountPaise: 0,
    netVariancePaise: 0,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Bill of Quantities (BOQ) Master Register
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Immutable contract baseline items and approved scope variation comparisons
          </p>
        </div>
        {activeProjectId && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={Download}
            onClick={() =>
              downloadAuthenticatedFile(
                `/projects/${activeProjectId}/boq/export`,
                `BOQ-Schedule.csv`
              )
            }
          >
            Export Full Schedule (CSV)
          </Button>
        )}
      </div>

      {/* Project Selector & Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex flex-col justify-center">
          <label className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block mb-1.5">
            Target Project Contract
          </label>
          <select
            value={activeProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="w-full h-9 px-3 rounded-md border border-border bg-surface text-xs font-semibold text-text-primary focus:border-secondary focus:outline-none"
          >
            {projects.map((p: any) => (
              <option key={p._id} value={p._id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Baseline Contract Total
          </div>
          <div className="text-xl font-bold text-text-primary mt-1 font-mono">
            <CurrencyDisplay paise={summary.totalBaselineAmountPaise} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5">{summary.itemCount} baseline line items</div>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Revised Contract Scope
          </div>
          <div className="text-xl font-bold text-secondary mt-1 font-mono">
            <CurrencyDisplay paise={summary.totalRevisedAmountPaise} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5">With all approved change orders</div>
        </Card>

        <Card className="border-l-4 border-l-primary-hover bg-primary-light/20">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Net Variation Variance
          </div>
          <div className="text-xl font-bold text-primary mt-1 font-mono">
            <CurrencyDisplay paise={summary.netVariancePaise} colorize />
          </div>
          <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-secondary" />
            +
            {summary.totalBaselineAmountPaise > 0
              ? ((summary.netVariancePaise / summary.totalBaselineAmountPaise) * 100).toFixed(2)
              : '0.00'}
            % variation
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search BOQ items by code or specification description..."
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-xs text-text-primary placeholder:text-text-muted focus:border-secondary focus:ring-1 focus:ring-secondary/20 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-text-muted shrink-0" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:ring-1 focus:ring-secondary/20 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Civil">Civil</option>
            <option value="Structural">Structural</option>
            <option value="MEP">MEP</option>
            <option value="Finishing">Finishing</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="External Works">External Works</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* BOQ Items Schedule Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                <th className="py-3 px-3.5">Item Code</th>
                <th className="py-3 px-3.5">Category</th>
                <th className="py-3 px-3.5">Scope Specification</th>
                <th className="py-3 px-3.5">Unit</th>
                <th className="py-3 px-3.5 text-right">Baseline Quantity</th>
                <th className="py-3 px-3.5 text-right">Unit Rate</th>
                <th className="py-3 px-3.5 text-right">Baseline Amount</th>
                <th className="py-3 px-3.5 text-right">Revised Quantity</th>
                <th className="py-3 px-3.5 text-right">Revised Amount</th>
                <th className="py-3 px-3.5 text-center">Baseline State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-text-muted">
                    Loading Bill of Quantities...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-muted">
                    No BOQ line items found for this selection.
                  </td>
                </tr>
              ) : (
                items.map((item: any) => {
                  const hasVar = item.hasVariation;
                  return (
                    <tr key={item._id} className="hover:bg-surface-subtle transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-text-primary">
                        {item.itemCode}
                      </td>
                      <td className="py-3 px-3.5">
                        <span className="px-2 py-0.5 rounded bg-surface-muted text-text-secondary text-[10px] font-semibold">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-text-primary max-w-xs truncate" title={item.description}>
                        {item.description}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-text-secondary">{item.unit}</td>
                      <td className="py-3 px-3.5 text-right font-mono text-text-primary">
                        {item.baselineQuantity.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-text-primary">
                        <CurrencyDisplay paise={item.unitRatePaise} />
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-semibold text-text-primary">
                        <CurrencyDisplay paise={item.baselineAmountPaise} />
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono">
                        <span className={hasVar ? 'font-bold text-secondary' : 'text-text-primary'}>
                          {item.revisedQuantity.toLocaleString('en-IN')}
                        </span>
                        {hasVar && (
                          <span className="text-[10px] text-secondary block font-semibold">
                            +{item.variationQuantity} {item.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-text-primary">
                        <CurrencyDisplay paise={item.revisedAmountPaise} />
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        {item.isLocked ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-secondary font-medium">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : (
                          <span className="text-[10px] text-status-warning font-semibold">Unlocked</span>
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
  );
};

