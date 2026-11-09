import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import ReactECharts from 'echarts-for-react';
import {
  TrendingUp,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Receipt,
  Building2,
  Filter,
  ArrowRight,
  Info,
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const FinancialExposureView: React.FC = () => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [activeBucket, setActiveBucket] = useState<string | null>(null);

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res: any = await api.get('/projects');
      return res.data;
    },
  });
  const projects = projectsData?.projects || [];

  const { data: exposureData, isLoading } = useQuery({
    queryKey: ['financial-exposure', selectedProjectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedProjectId !== 'all') params.append('projectId', selectedProjectId);
      const res: any = await api.get(`/financial-exposure?${params.toString()}`);
      return res.data;
    },
  });

  // Query change orders for drilldown based on selected activeBucket
  const { data: drilldownData } = useQuery({
    queryKey: ['exposure-drilldown', selectedProjectId, activeBucket],
    queryFn: async () => {
      if (!activeBucket) return null;
      const params = new URLSearchParams();
      if (selectedProjectId !== 'all') params.append('projectId', selectedProjectId);

      if (activeBucket === 'pending') {
        params.append('status', 'Submitted');
      } else if (activeBucket === 'unapproved') {
        params.append('unapprovedOnly', 'true');
      } else if (activeBucket === 'approved_unbilled') {
        params.append('status', 'Approved');
      }

      const res: any = await api.get(`/change-orders?${params.toString()}`);
      return res.data;
    },
    enabled: Boolean(activeBucket),
  });

  const summary = exposureData?.summary || {
    totalContractBaselinePaise: 0,
    approvedVariationsPaise: 0,
    revisedContractTotalPaise: 0,
    pendingApprovalPaise: 0,
    unapprovedWorkExposurePaise: 0,
    approvedUnbilledPaise: 0,
    invoicedReceivablesPaise: 0,
    realisedCashflowPaise: 0,
  };

  const projectBreakdown = exposureData?.projectBreakdown || [];
  const categoryDist = exposureData?.categoryDistribution || [];
  const drilldownOrders = drilldownData?.changeOrders || [];

  // ECharts Bar Configuration for 5 Exposure Buckets
  const exposureBarOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const item = params[0];
        const valRupees = (item.value || 0).toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR',
        });
        return `<strong>${item.name}</strong><br/>Exposure: ${valRupees}`;
      },
    },
    grid: {
      top: '12%',
      left: '3%',
      right: '4%',
      bottom: '12%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: [
        '1. Pending Review',
        '2. Unapproved Exec.',
        '3. Approved Unbilled',
        '4. Invoiced Unpaid',
        '5. Realised Paid',
      ],
      axisLine: { lineStyle: { color: '#E3E7E9' } },
      axisLabel: { color: '#697783', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F0F2F0' } },
      axisLabel: {
        color: '#697783',
        fontSize: 10,
        formatter: (val: number) => {
          if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)} Cr`;
          if (val >= 100000) return `₹${(val / 100000).toFixed(1)} L`;
          return `₹${val}`;
        },
      },
    },
    series: [
      {
        name: 'Exposure Value (₹)',
        type: 'bar',
        barWidth: '38%',
        data: [
          {
            value: summary.pendingApprovalPaise / 100,
            itemStyle: { color: '#D97706', borderRadius: [4, 4, 0, 0] },
          },
          {
            value: summary.unapprovedWorkExposurePaise / 100,
            itemStyle: { color: '#C53030', borderRadius: [4, 4, 0, 0] },
          },
          {
            value: summary.approvedUnbilledPaise / 100,
            itemStyle: { color: '#357B75', borderRadius: [4, 4, 0, 0] },
          },
          {
            value: summary.invoicedReceivablesPaise / 100,
            itemStyle: { color: '#1D4ED8', borderRadius: [4, 4, 0, 0] },
          },
          {
            value: summary.realisedCashflowPaise / 100,
            itemStyle: { color: '#2E7D32', borderRadius: [4, 4, 0, 0] },
          },
        ],
      },
    ],
  };

  // ECharts Pie Configuration for Category Distribution
  const categoryPieOption = {
    tooltip: {
      trigger: 'item',
      formatter: (param: any) => {
        const valRupees = (param.value || 0).toLocaleString('en-IN', {
          style: 'currency',
          currency: 'INR',
        });
        return `<strong>${param.name}</strong><br/>Proposed Value: ${valRupees} (${param.percent}%)`;
      },
    },
    legend: {
      bottom: 0,
      left: 'center',
      textStyle: { fontSize: 11, color: '#697783' },
    },
    series: [
      {
        name: 'Variation Categories',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '42%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#FFFFFF',
          borderWidth: 2,
        },
        label: { show: false },
        data: categoryDist.map((c: any) => ({
          value: c.totalProposedPaise / 100,
          name: c.category,
        })),
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Financial Exposure & Commercial Risk Matrix
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            5 mutually exclusive financial categories ensuring zero double-counting across the lifecycle
          </p>
        </div>

        {/* Project Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted shrink-0" />
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-xs font-semibold text-text-primary focus:border-secondary focus:outline-none"
          >
            <option value="all">Portfolio Total (All Projects)</option>
            {projects.map((p: any) => (
              <option key={p._id} value={p._id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contract Scope Reconciliation Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Total Contract Baseline
          </div>
          <div className="text-2xl font-bold text-text-primary mt-1 font-mono">
            <CurrencyDisplay paise={summary.totalContractBaselinePaise} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-text-muted" />
            Original signed contractual commitment
          </div>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Total Approved Variations
          </div>
          <div className="text-2xl font-bold text-secondary mt-1 font-mono">
            <CurrencyDisplay paise={summary.approvedVariationsPaise} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-secondary" />
            +
            {summary.totalContractBaselinePaise > 0
              ? (
                  (summary.approvedVariationsPaise / summary.totalContractBaselinePaise) *
                  100
                ).toFixed(2)
              : '0.00'}
            % variation on baseline
          </div>
        </Card>

        <Card className="border-l-4 border-l-primary-hover bg-primary-light/20">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Revised Contract Commitment
          </div>
          <div className="text-2xl font-bold text-primary mt-1 font-mono">
            <CurrencyDisplay paise={summary.revisedContractTotalPaise} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5">
            Baseline Contract + Formally Approved Variations
          </div>
        </Card>
      </div>

      {/* 5 Non-Overlapping Exposure Buckets (Interactive Click-to-Drilldown) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-text-primary tracking-tight">
              Discrete Financial Exposure Domains
            </h2>
            <span className="text-[10px] text-text-muted bg-surface-muted px-2 py-0.5 rounded border border-border">
              Click any card to drill down
            </span>
          </div>
          {activeBucket && (
            <button
              onClick={() => setActiveBucket(null)}
              className="text-xs text-secondary hover:underline font-medium"
            >
              Clear Drilldown Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Bucket 1: Pending Approval */}
          <button
            onClick={() => setActiveBucket(activeBucket === 'pending' ? null : 'pending')}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeBucket === 'pending'
                ? 'border-status-warning bg-status-warning-bg/40 shadow-elevated ring-2 ring-status-warning/40'
                : 'border-border bg-surface hover:shadow-elevated border-t-2 border-t-status-warning'
            }`}
          >
            <div className="flex items-center justify-between text-status-warning mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">1. Pending Review</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-text-primary font-mono">
              <CurrencyDisplay paise={summary.pendingApprovalPaise} compact />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">
              Submitted variation claims undergoing review
            </p>
          </button>

          {/* Bucket 2: Unapproved Execution */}
          <button
            onClick={() => setActiveBucket(activeBucket === 'unapproved' ? null : 'unapproved')}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeBucket === 'unapproved'
                ? 'border-status-danger bg-status-danger-bg shadow-elevated ring-2 ring-status-danger/40'
                : 'border-border bg-status-danger-bg/20 hover:shadow-elevated border-t-2 border-t-status-danger'
            }`}
          >
            <div className="flex items-center justify-between text-status-danger mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">2. Unapproved Exec.</span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-status-danger font-mono">
              <CurrencyDisplay paise={summary.unapprovedWorkExposurePaise} compact />
            </div>
            <p className="text-[11px] text-status-danger/80 mt-1.5 leading-snug font-medium">
              Physical work executing without client approval
            </p>
          </button>

          {/* Bucket 3: Approved Unbilled */}
          <button
            onClick={() => setActiveBucket(activeBucket === 'approved_unbilled' ? null : 'approved_unbilled')}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeBucket === 'approved_unbilled'
                ? 'border-secondary bg-secondary-light/40 shadow-elevated ring-2 ring-secondary/40'
                : 'border-border bg-surface hover:shadow-elevated border-t-2 border-t-secondary'
            }`}
          >
            <div className="flex items-center justify-between text-secondary mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">3. Approved Unbilled</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-text-primary font-mono">
              <CurrencyDisplay paise={summary.approvedUnbilledPaise} compact />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">
              Approved variations awaiting billing generation
            </p>
          </button>

          {/* Bucket 4: Invoiced Receivables */}
          <button
            onClick={() => setActiveBucket(activeBucket === 'invoiced' ? null : 'invoiced')}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeBucket === 'invoiced'
                ? 'border-status-info bg-status-info-bg/40 shadow-elevated ring-2 ring-status-info/40'
                : 'border-border bg-surface hover:shadow-elevated border-t-2 border-t-status-info'
            }`}
          >
            <div className="flex items-center justify-between text-status-info mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">4. Invoiced Unpaid</span>
              <Receipt className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-text-primary font-mono">
              <CurrencyDisplay paise={summary.invoicedReceivablesPaise} compact />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">
              Issued invoices pending disbursement
            </p>
          </button>

          {/* Bucket 5: Realised Cashflow */}
          <button
            onClick={() => setActiveBucket(activeBucket === 'paid' ? null : 'paid')}
            className={`text-left p-4 rounded-xl border transition-all ${
              activeBucket === 'paid'
                ? 'border-status-success bg-status-success-bg/40 shadow-elevated ring-2 ring-status-success/40'
                : 'border-border bg-surface hover:shadow-elevated border-t-2 border-t-status-success'
            }`}
          >
            <div className="flex items-center justify-between text-status-success mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">5. Realised Paid</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-status-success font-mono">
              <CurrencyDisplay paise={summary.realisedCashflowPaise} compact />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">
              Reconciled funds received in contractor bank
            </p>
          </button>
        </div>
      </div>

      {/* Drilldown Table when a bucket is clicked */}
      {activeBucket && (
        <Card className="border-2 border-secondary/40 shadow-elevated">
          <CardHeader>
            <div>
              <CardTitle>
                Underlying Records: {activeBucket.replace('_', ' ').toUpperCase()}
              </CardTitle>
              <CardDescription>
                Auditable list of change orders contributing to this specific financial exposure domain
              </CardDescription>
            </div>
            <button
              onClick={() => setActiveBucket(null)}
              className="text-xs text-text-secondary hover:text-text-primary"
            >
              ✕ Close Drilldown
            </button>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary uppercase">
                  <th className="py-2.5 px-3">Order Number & Title</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Proposed (₹)</th>
                  <th className="py-2.5 px-3 text-right">Approved (₹)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {drilldownOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-text-muted">
                      No records found in this bucket.
                    </td>
                  </tr>
                ) : (
                  drilldownOrders.map((co: any) => (
                    <tr key={co._id} className="hover:bg-surface-subtle">
                      <td className="py-2.5 px-3">
                        <Link to={`/change-orders/${co._id}`} className="font-semibold text-text-primary hover:text-secondary">
                          <span className="font-mono text-xs text-primary font-bold mr-1.5">{co.orderNumber}</span>
                          {co.title}
                        </Link>
                        {co.unapprovedExecution && (
                          <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] bg-status-danger-bg text-status-danger font-semibold border border-status-danger-border">
                            UNAPPROVED WORK
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">{co.category}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-text-primary">
                        <CurrencyDisplay paise={co.totalProposedPaise} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-secondary">
                        <CurrencyDisplay paise={co.totalApprovedPaise} />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={co.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link to={`/change-orders/${co._id}`}>
                          <Button variant="outline" size="sm">
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exposure Distribution Bar Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Exposure Distribution by Category</CardTitle>
              <CardDescription>Non-overlapping commercial risk categories</CardDescription>
            </div>
          </CardHeader>
          <div className="h-72">
            <ReactECharts
              option={exposureBarOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </Card>

        {/* Category Breakdown Donut Chart */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Variation Scope by Category</CardTitle>
              <CardDescription>Composition of change orders across engineering disciplines</CardDescription>
            </div>
          </CardHeader>
          <div className="h-72">
            <ReactECharts
              option={categoryPieOption}
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'svg' }}
            />
          </div>
        </Card>
      </div>

      {/* Per-Project Exposure Breakdown Matrix */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Project Portfolio Exposure Breakdown</CardTitle>
            <CardDescription>Detailed financial posture across all active projects</CardDescription>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary uppercase">
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4 text-right">Baseline Contract</th>
                <th className="py-3 px-4 text-right">Approved Variations</th>
                <th className="py-3 px-4 text-right">Revised Contract</th>
                <th className="py-3 px-4 text-right">Pending Review</th>
                <th className="py-3 px-4 text-right">Unapproved Work Risk</th>
                <th className="py-3 px-4 text-right">Invoiced Receivables</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projectBreakdown.map((p: any) => (
                <tr key={p._id} className="hover:bg-surface-subtle transition-colors">
                  <td className="py-3 px-4">
                    <Link to={`/projects/${p._id}`} className="font-semibold text-text-primary hover:text-secondary">
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-primary font-bold mr-1.5">
                        {p.code}
                      </span>
                      {p.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-text-primary">
                    <CurrencyDisplay paise={p.originalContractPaise} />
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-secondary">
                    <CurrencyDisplay paise={p.approvedVariationsPaise} />
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-primary">
                    <CurrencyDisplay paise={p.revisedContractTotalPaise} />
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-status-warning font-semibold">
                    <CurrencyDisplay paise={p.pendingApprovalPaise} />
                  </td>
                  <td className="py-3 px-4 text-right font-mono">
                    <span className={p.unapprovedWorkExposurePaise > 0 ? 'text-status-danger font-bold' : 'text-text-muted'}>
                      <CurrencyDisplay paise={p.unapprovedWorkExposurePaise} />
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-status-info font-medium">
                    <CurrencyDisplay paise={p.invoicedReceivablesPaise} />
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={p.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
