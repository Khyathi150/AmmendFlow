import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Building2,
  Calendar,
  AlertTriangle,
  Printer,
} from 'lucide-react';
import { api, downloadAuthenticatedFile } from '../../lib/axios';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { formatDate } from '../../lib/utils';

export const ReportsView: React.FC = () => {
  const [projectId, setProjectId] = useState<string>('all');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res: any = await api.get('/projects');
      return res.data;
    },
  });
  const projects = projectsData?.projects || [];

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['variation-register-report', projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId !== 'all') params.append('projectId', projectId);
      const res: any = await api.get(`/reports/variation-register?${params.toString()}`);
      return res.data;
    },
  });

  const changeOrders = reportData?.changeOrders || [];

  const exportPath = `/reports/variation-register?format=csv${
    projectId !== 'all' ? `&projectId=${projectId}` : ''
  }`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Executive Variation Register & Audit Reports
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Formal commercial registers compliant with standard construction contractual guidelines
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={Download}
            onClick={() => downloadAuthenticatedFile(exportPath, 'Variation-Register.csv')}
          >
            Download CSV Register
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={Printer}
            onClick={() => window.print()}
          >
            Print Summary
          </Button>
        </div>
      </div>

      {/* Filter */}
      <Card className="flex items-center justify-between p-3.5">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-text-muted" />
          <span className="text-xs font-semibold text-text-primary">Project Filter:</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="h-8 px-3 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:outline-none"
          >
            <option value="all">Consolidated Portfolio (All Projects)</option>
            {projects.map((p: any) => (
              <option key={p._id} value={p._id}>
                {p.code} — {p.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs font-mono text-text-secondary">
          {changeOrders.length} Variation Records
        </span>
      </Card>

      {/* Formal Tabular Variation Register */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-subtle">
        <div className="p-4 bg-surface-subtle border-b border-border">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide">
            Contract Variation Register Schedule
          </h2>
          <p className="text-[11px] text-text-secondary mt-0.5">
            Comprehensive audit record showing date requested, scope, proposed financial impact, formal approval determination, and schedule delay
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-subtle/60 border-b border-border text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                <th className="py-2.5 px-3">Order Number</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Title & Classification</th>
                <th className="py-2.5 px-3">Originator</th>
                <th className="py-2.5 px-3">Date Requested</th>
                <th className="py-2.5 px-3 text-right">Delay (Days)</th>
                <th className="py-2.5 px-3 text-right">Proposed (₹)</th>
                <th className="py-2.5 px-3 text-right">Approved (₹)</th>
                <th className="py-2.5 px-3 text-center">Lifecycle Status</th>
                <th className="py-2.5 px-3 text-center">Unapproved Work</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-text-muted">
                    Generating report data...
                  </td>
                </tr>
              ) : changeOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-text-muted">
                    No variations found for the selected scope.
                  </td>
                </tr>
              ) : (
                changeOrders.map((co: any) => {
                  const proj = typeof co.project === 'object' ? co.project : null;

                  return (
                    <tr key={co._id} className="hover:bg-surface-subtle">
                      <td className="py-2.5 px-3 font-mono font-bold text-text-primary">
                        {co.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">
                        <span className="font-semibold text-text-primary">{proj?.code || '—'}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-text-primary">{co.title}</div>
                        <div className="text-[10px] text-text-muted">{co.category}</div>
                      </td>
                      <td className="py-2.5 px-3 text-text-secondary">{co.originatingParty}</td>
                      <td className="py-2.5 px-3 font-mono text-text-secondary">
                        {formatDate(co.requestDate || co.createdAt)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-text-primary">
                        {co.scheduleImpactDays || 0}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-text-primary">
                        <CurrencyDisplay paise={co.totalProposedPaise} />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-secondary">
                        <CurrencyDisplay paise={co.totalApprovedPaise} />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={co.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {co.unapprovedExecution ? (
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-status-danger-bg text-status-danger font-bold border border-status-danger-border">
                            YES (RISK)
                          </span>
                        ) : (
                          <span className="text-text-muted text-[10px]">No</span>
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

