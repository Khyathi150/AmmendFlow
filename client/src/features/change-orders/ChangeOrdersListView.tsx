import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import {
  GitPullRequest,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Building2,
  Calendar,
} from 'lucide-react';
import { api } from '../../lib/axios';
import { ChangeOrder } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { formatDate } from '../../lib/utils';

export const ChangeOrdersListView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || 'all';

  const [projectId, setProjectId] = useState(initialProjectId);
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [unapprovedOnly, setUnapprovedOnly] = useState(false);
  const [search, setSearch] = useState('');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res: any = await api.get('/projects');
      return res.data;
    },
  });
  const projects = projectsData?.projects || [];

  const { data, isLoading } = useQuery({
    queryKey: ['change-orders', projectId, status, category, priority, unapprovedOnly, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId !== 'all') params.append('projectId', projectId);
      if (status !== 'all') params.append('status', status);
      if (category !== 'all') params.append('category', category);
      if (priority !== 'all') params.append('priority', priority);
      if (unapprovedOnly) params.append('unapprovedOnly', 'true');
      if (search) params.append('search', search);

      const res: any = await api.get(`/change-orders?${params.toString()}`);
      return res.data;
    },
  });

  const changeOrders: ChangeOrder[] = data?.changeOrders || [];
  const summary = data?.summary || { totalProposed: 0, totalApproved: 0, unapprovedWorkCount: 0 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Change Orders & Variations Register
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Traceable lifecycle management from site instruction to client billing
          </p>
        </div>
        <Link to="/change-orders/new">
          <Button variant="secondary" size="sm" leftIcon={Plus}>
            New Change Order
          </Button>
        </Link>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Total Variation Orders
          </div>
          <div className="text-2xl font-bold text-text-primary mt-1 font-mono">
            {changeOrders.length}
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Across matching filters</div>
        </Card>

        <Card className="border-l-4 border-l-status-warning">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Total Proposed Value
          </div>
          <div className="text-2xl font-bold text-text-primary mt-1 font-mono">
            <CurrencyDisplay paise={summary.totalProposed} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Submitted claims pipeline</div>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Total Approved Value
          </div>
          <div className="text-2xl font-bold text-secondary mt-1 font-mono">
            <CurrencyDisplay paise={summary.totalApproved} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Formally agreed by client</div>
        </Card>

        <Card className="border-l-4 border-l-status-danger bg-status-danger-bg/20">
          <div className="text-[11px] font-semibold text-status-danger uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            Unapproved Work Claims
          </div>
          <div className="text-2xl font-bold text-status-danger mt-1 font-mono">
            {summary.unapprovedWorkCount}
          </div>
          <div className="text-xs text-status-danger/80 mt-0.5 font-medium">
            Executed without client sign-off
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-surface p-3 rounded-lg border border-border">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number (e.g. CO-PRJ-001) or title..."
            className="w-full h-8 pl-9 pr-3 rounded-md border border-border bg-surface-subtle text-xs text-text-primary focus:bg-surface focus:border-secondary focus:outline-none"
          />
        </div>

        {/* Project Selector */}
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

        {/* Status Selector */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-8 px-2.5 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:outline-none"
        >
          <option value="all">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Submitted">Submitted</option>
          <option value="Technical Review">Technical Review</option>
          <option value="Commercial Review">Commercial Review</option>
          <option value="Internal Approval">Internal Approval</option>
          <option value="Client Approval">Client Approval</option>
          <option value="Approved">Approved</option>
          <option value="Authorised for Execution">Authorised for Execution</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Ready for Invoicing">Ready for Invoicing</option>
          <option value="Invoiced">Invoiced</option>
          <option value="Paid">Paid</option>
          <option value="Changes Requested">Changes Requested</option>
          <option value="Rejected">Rejected</option>
        </select>

        {/* Category Selector */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 px-2.5 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="Additional Work">Additional Work</option>
          <option value="Omitted Work">Omitted Work</option>
          <option value="Quantity Variation">Quantity Variation</option>
          <option value="Material Substitution">Material Substitution</option>
          <option value="Design Modification">Design Modification</option>
          <option value="Time Extension">Time Extension</option>
        </select>

        {/* Unapproved work toggle */}
        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-surface-subtle border border-border text-xs font-semibold cursor-pointer select-none text-text-primary">
          <input
            type="checkbox"
            checked={unapprovedOnly}
            onChange={(e) => setUnapprovedOnly(e.target.checked)}
            className="rounded border-border text-status-danger focus:ring-status-danger/20"
          />
          <span className={unapprovedOnly ? 'text-status-danger' : 'text-text-secondary'}>
            Unapproved Work Only
          </span>
        </label>
      </div>

      {/* Change Orders Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Order ID & Title</th>
                <th className="py-3 px-4">Project</th>
                <th className="py-3 px-4">Category & Priority</th>
                <th className="py-3 px-4">Originator</th>
                <th className="py-3 px-4 text-right">Proposed Amount</th>
                <th className="py-3 px-4 text-right">Approved Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted">
                    Loading change orders...
                  </td>
                </tr>
              ) : changeOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    No change orders found matching filter criteria.
                  </td>
                </tr>
              ) : (
                changeOrders.map((co: any) => {
                  const projectObj = typeof co.project === 'object' ? co.project : null;

                  return (
                    <tr key={co._id} className="hover:bg-surface-subtle transition-colors group">
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/change-orders/${co._id}`}
                          className="font-semibold text-text-primary group-hover:text-secondary flex items-center gap-1.5 transition-colors"
                        >
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-primary font-bold border border-border">
                            {co.orderNumber}
                          </span>
                          <span className="truncate max-w-sm">{co.title}</span>
                        </Link>
                        {co.unapprovedExecution && (
                          <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] bg-status-danger-bg text-status-danger font-semibold border border-status-danger-border">
                            <AlertTriangle className="w-3 h-3" />
                            UNAPPROVED WORK EXECUTION
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        <span className="font-semibold text-text-primary block">
                          {projectObj?.code || '—'}
                        </span>
                        <span className="text-[11px] truncate max-w-[150px] block">
                          {projectObj?.name || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-text-primary font-medium">{co.category}</div>
                        <div className="text-[10px] text-text-secondary mt-0.5">
                          Priority: <strong className="text-text-primary">{co.priority}</strong>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        <div className="font-medium text-text-primary">{co.originatingParty}</div>
                        <div className="text-[10px] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-text-muted" />
                          {formatDate(co.requestDate || co.createdAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-text-primary whitespace-nowrap">
                        <CurrencyDisplay paise={co.totalProposedPaise} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-secondary whitespace-nowrap">
                        <CurrencyDisplay paise={co.totalApprovedPaise} />
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <StatusBadge status={co.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link to={`/change-orders/${co._id}`}>
                          <Button variant="outline" size="sm" rightIcon={ArrowRight}>
                            View Details
                          </Button>
                        </Link>
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
