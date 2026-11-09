import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Receipt,
  Building2,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const OverviewView: React.FC = () => {
  const { data: exposureData, isLoading: exposureLoading } = useQuery({
    queryKey: ['financial-exposure'],
    queryFn: async () => {
      const res: any = await api.get('/financial-exposure');
      return res.data;
    },
  });

  const { data: projectsData, isLoading: projectsLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res: any = await api.get('/projects');
      return res.data;
    },
  });

  const { data: recentOrdersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-change-orders'],
    queryFn: async () => {
      const res: any = await api.get('/change-orders?limit=5');
      return res.data;
    },
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

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Executive Financial & Variation Overview
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Real-time multi-project financial exposure, baseline reconciliations and variation risk.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/change-orders/new">
            <Button variant="secondary" size="sm">
              Log Change Order
            </Button>
          </Link>
          <Link to="/reports">
            <Button variant="outline" size="sm">
              Export Register
            </Button>
          </Link>
        </div>
      </div>

      {/* Contract Baseline vs Variations Hero Metric Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Contract Baseline Value
          </div>
          <div className="text-2xl font-bold text-text-primary mt-1 font-mono">
            <CurrencyDisplay paise={summary.totalContractBaselinePaise} />
          </div>
          <div className="text-xs text-text-secondary mt-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-text-muted" />
            Original signed contract scope
          </div>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Approved Variations Value
          </div>
          <div className="text-2xl font-bold text-secondary mt-1 font-mono">
            <CurrencyDisplay paise={summary.approvedVariationsPaise} />
          </div>
          <div className="text-xs text-text-secondary mt-1 flex items-center gap-1">
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

        <Card className="border-l-4 border-l-primary-hover bg-primary-light/30">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Revised Contract Commitment
          </div>
          <div className="text-2xl font-bold text-primary mt-1 font-mono">
            <CurrencyDisplay paise={summary.revisedContractTotalPaise} />
          </div>
          <div className="text-xs text-text-secondary mt-1">
            Baseline + Approved variations
          </div>
        </Card>
      </div>

      {/* 5 Mutually Exclusive Financial Exposure Buckets */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary tracking-tight">
              Risk & Exposure Breakdown (5 Non-Overlapping Buckets)
            </h2>
            <p className="text-xs text-text-secondary">
              Categorized commercial risk across active construction works
            </p>
          </div>
          <Link to="/financial-exposure" className="text-xs text-secondary font-medium hover:underline flex items-center gap-1">
            Interactive Matrix <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Bucket 1: Pending Approval */}
          <Card className="border-t-2 border-t-status-warning hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between text-status-warning mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">1. Pending Approval</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-text-primary font-mono">
              <CurrencyDisplay paise={summary.pendingApprovalPaise} compact />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">
              Submitted & under review by management/client
            </p>
          </Card>

          {/* Bucket 2: Unapproved Execution */}
          <Card className="border-t-2 border-t-status-danger bg-status-danger-bg/20 hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between text-status-danger mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">2. Unapproved Work</span>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-status-danger font-mono">
              <CurrencyDisplay paise={summary.unapprovedWorkExposurePaise} compact />
            </div>
            <p className="text-[11px] text-status-danger/80 mt-1.5 leading-snug font-medium">
              Physical work executing without client sign-off
            </p>
          </Card>

          {/* Bucket 3: Approved Unbilled */}
          <Card className="border-t-2 border-t-secondary hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between text-secondary mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">3. Approved Unbilled</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-text-primary font-mono">
              <CurrencyDisplay paise={summary.approvedUnbilledPaise} compact />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">
              Approved variations awaiting invoice generation
            </p>
          </Card>

          {/* Bucket 4: Invoiced Receivables */}
          <Card className="border-t-2 border-t-status-info hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between text-status-info mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">4. Invoiced Unpaid</span>
              <Receipt className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-text-primary font-mono">
              <CurrencyDisplay paise={summary.invoicedReceivablesPaise} compact />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">
              Variation invoices issued, payment pending
            </p>
          </Card>

          {/* Bucket 5: Realised Cashflow */}
          <Card className="border-t-2 border-t-status-success hover:shadow-elevated transition-shadow">
            <div className="flex items-center justify-between text-status-success mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider">5. Realised Paid</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-lg font-bold text-status-success font-mono">
              <CurrencyDisplay paise={summary.realisedCashflowPaise} compact />
            </div>
            <p className="text-[11px] text-text-secondary mt-1.5 leading-snug">
              Reconciled funds deposited in contractor account
            </p>
          </Card>
        </div>
      </div>

      {/* Grid: Active Projects & Recent Change Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Summary */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Active Projects Portfolio</CardTitle>
              <CardDescription>Major infrastructure and building undertakings</CardDescription>
            </div>
            <Link to="/projects">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>

          <div className="space-y-3">
            {projectsLoading ? (
              <div className="p-4 text-xs text-text-secondary">Loading projects...</div>
            ) : projectsData?.projects?.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">No projects found.</div>
            ) : (
              projectsData?.projects?.map((proj: any) => (
                <Link
                  key={proj._id}
                  to={`/projects/${proj._id}`}
                  className="block p-3.5 rounded-lg border border-border hover:bg-surface-subtle hover:border-border-dark transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-secondary font-semibold uppercase">
                        {proj.code}
                      </span>
                      <h4 className="text-xs font-semibold text-text-primary mt-0.5">
                        {proj.name}
                      </h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Client: {proj.clientName} • {proj.location?.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-text-primary font-mono">
                        <CurrencyDisplay paise={proj.originalContractPaise} compact />
                      </div>
                      <StatusBadge status={proj.status} size="sm" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Recent Change Orders */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Variation Requests</CardTitle>
              <CardDescription>Latest change requests advancing through approval pipeline</CardDescription>
            </div>
            <Link to="/change-orders">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>

          <div className="space-y-3">
            {ordersLoading ? (
              <div className="p-4 text-xs text-text-secondary">Loading change orders...</div>
            ) : recentOrdersData?.changeOrders?.length === 0 ? (
              <div className="p-6 text-center text-xs text-text-muted">No change orders logged yet.</div>
            ) : (
              recentOrdersData?.changeOrders?.map((co: any) => (
                <Link
                  key={co._id}
                  to={`/change-orders/${co._id}`}
                  className="block p-3.5 rounded-lg border border-border hover:bg-surface-subtle hover:border-border-dark transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-primary font-semibold uppercase">
                          {co.orderNumber}
                        </span>
                        {co.unapprovedExecution && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-status-danger-bg text-status-danger font-semibold border border-status-danger-border flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            UNAPPROVED WORK
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-text-primary mt-1 truncate">
                        {co.title}
                      </h4>
                      <p className="text-[11px] text-text-secondary mt-0.5">
                        Category: {co.category}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-text-primary font-mono">
                        <CurrencyDisplay paise={co.totalProposedPaise} />
                      </div>
                      <div className="mt-1">
                        <StatusBadge status={co.status} size="sm" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

