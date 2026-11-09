import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  MapPin,
  Calendar,
} from 'lucide-react';
import { api } from '../../lib/axios';
import { Project, ProjectStatus } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { CurrencyDisplay } from '../../components/shared/CurrencyDisplay';
import { formatDate } from '../../lib/utils';
import { rupeesToPaise } from '../../lib/utils';

export const ProjectsListView: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating project
  const [newProject, setNewProject] = useState({
    name: '',
    code: '',
    description: '',
    clientName: '',
    contractorName: 'Northstar Infrastructure Pvt. Ltd.',
    city: 'Bengaluru',
    state: 'Karnataka',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    contractAmountRupees: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res: any = await api.get(`/projects?${params.toString()}`);
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res: any = await api.post('/projects', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsCreateModalOpen(false);
      setNewProject({
        name: '',
        code: '',
        description: '',
        clientName: '',
        contractorName: 'Northstar Infrastructure Pvt. Ltd.',
        city: 'Bengaluru',
        state: 'Karnataka',
        startDate: new Date().toISOString().split('T')[0],
        targetEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        contractAmountRupees: '',
      });
    },
    onError: (err: any) => {
      setFormError(err.message || 'Failed to create project');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amountRupees = parseFloat(newProject.contractAmountRupees);
    if (isNaN(amountRupees) || amountRupees <= 0) {
      setFormError('Please enter a valid original contract amount.');
      return;
    }

    createMutation.mutate({
      name: newProject.name,
      code: newProject.code.toUpperCase().trim(),
      description: newProject.description,
      clientName: newProject.clientName,
      contractorName: newProject.contractorName,
      location: {
        city: newProject.city,
        state: newProject.state,
        country: 'India',
      },
      startDate: newProject.startDate,
      targetEndDate: newProject.targetEndDate,
      originalContractPaise: Math.round(amountRupees * 100),
      currency: 'INR',
      status: 'Active',
    });
  };

  const projects: Project[] = data?.projects || [];

  // Summary statistics
  const totalBaseline = projects.reduce((acc, p) => acc + (p.originalContractPaise || 0), 0);
  const totalApproved = projects.reduce((acc: number, p: any) => acc + (p.approvedVariationsPaise || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary">
            Construction Projects Portfolio
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Active contracts, baseline commitments, and variation accounting
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={Plus}
          onClick={() => setIsCreateModalOpen(true)}
        >
          New Project
        </Button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-primary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Active Projects Count
          </div>
          <div className="text-2xl font-bold text-text-primary mt-1 font-mono">
            {projects.length}
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Under commercial governance</div>
        </Card>

        <Card className="border-l-4 border-l-secondary">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Total Contract Baseline
          </div>
          <div className="text-2xl font-bold text-text-primary mt-1 font-mono">
            <CurrencyDisplay paise={totalBaseline} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5">Original contract scope sum</div>
        </Card>

        <Card className="border-l-4 border-l-primary-hover bg-primary-light/20">
          <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Total Approved Variations
          </div>
          <div className="text-2xl font-bold text-secondary mt-1 font-mono">
            <CurrencyDisplay paise={totalApproved} />
          </div>
          <div className="text-xs text-text-secondary mt-0.5 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-secondary" />
            +
            {totalBaseline > 0 ? ((totalApproved / totalBaseline) * 100).toFixed(2) : '0.00'}% net scope increase
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
            placeholder="Search by project name, code (e.g. PRJ-001), or client..."
            className="w-full h-9 pl-9 pr-3 rounded-md border border-border bg-surface text-xs text-text-primary placeholder:text-text-muted focus:border-secondary focus:ring-1 focus:ring-secondary/20 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-text-muted shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-border bg-surface text-xs text-text-primary focus:border-secondary focus:ring-1 focus:ring-secondary/20 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Planning">Planning</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Code & Project Name</th>
                <th className="py-3 px-4">Client & Location</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4 text-right">Baseline Contract</th>
                <th className="py-3 px-4 text-right">Approved Variations</th>
                <th className="py-3 px-4 text-right">Revised Contract</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-text-muted">
                    Loading projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-muted">
                    No projects found matching current criteria.
                  </td>
                </tr>
              ) : (
                projects.map((project: any) => {
                  const baseline = project.originalContractPaise || 0;
                  const variations = project.approvedVariationsPaise || 0;
                  const revised = baseline + variations;
                  const variationPct = baseline > 0 ? (variations / baseline) * 100 : 0;

                  return (
                    <tr
                      key={project._id}
                      className="hover:bg-surface-subtle transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <Link
                          to={`/projects/${project._id}`}
                          className="font-semibold text-text-primary group-hover:text-secondary flex items-center gap-1.5 transition-colors"
                        >
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-muted text-primary font-bold border border-border">
                            {project.code}
                          </span>
                          <span>{project.name}</span>
                        </Link>
                        {project.description && (
                          <p className="text-[11px] text-text-secondary line-clamp-1 mt-0.5">
                            {project.description}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-text-primary">{project.clientName}</div>
                        <div className="text-[11px] text-text-secondary flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-text-muted" />
                          {project.location?.city}, {project.location?.state}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3 h-3 text-text-muted" />
                          {formatDate(project.startDate)}
                        </div>
                        <div className="text-[10px] text-text-muted mt-0.5">
                          Target: {formatDate(project.targetEndDate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-text-primary whitespace-nowrap">
                        <CurrencyDisplay paise={baseline} />
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                        <div className="font-medium text-secondary">
                          <CurrencyDisplay paise={variations} />
                        </div>
                        {variations > 0 && (
                          <div className="text-[10px] text-secondary font-semibold">
                            +{variationPct.toFixed(1)}%
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-primary whitespace-nowrap">
                        <CurrencyDisplay paise={revised} />
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <StatusBadge status={project.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link to={`/projects/${project._id}`}>
                          <Button variant="outline" size="sm" rightIcon={ArrowRight}>
                            Control Center
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

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initialize New Construction Project"
        description="Establish contractual baseline, client entity, and project identification"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-md bg-status-danger-bg text-status-danger text-xs border border-status-danger-border">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Project Code (e.g. PRJ-NSR-004)"
              required
              value={newProject.code}
              onChange={(e) => setNewProject({ ...newProject, code: e.target.value.toUpperCase() })}
              placeholder="PRJ-004"
            />
            <Input
              label="Project Title"
              required
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              placeholder="e.g. Commercial Office Complex - Phase 2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Client Organization"
              required
              value={newProject.clientName}
              onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
              placeholder="e.g. Prestige Estates Projects Ltd."
            />
            <Input
              label="Appointed Main Contractor"
              required
              value={newProject.contractorName}
              onChange={(e) => setNewProject({ ...newProject, contractorName: e.target.value })}
              placeholder="e.g. Northstar Infrastructure Pvt. Ltd."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="City"
              required
              value={newProject.city}
              onChange={(e) => setNewProject({ ...newProject, city: e.target.value })}
              placeholder="Bengaluru"
            />
            <Input
              label="State"
              required
              value={newProject.state}
              onChange={(e) => setNewProject({ ...newProject, state: e.target.value })}
              placeholder="Karnataka"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contract Start Date"
              type="date"
              required
              value={newProject.startDate}
              onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
            />
            <Input
              label="Target Completion Date"
              type="date"
              required
              value={newProject.targetEndDate}
              onChange={(e) => setNewProject({ ...newProject, targetEndDate: e.target.value })}
            />
          </div>

          <Input
            label="Original Baseline Contract Value (₹ INR)"
            type="number"
            required
            value={newProject.contractAmountRupees}
            onChange={(e) => setNewProject({ ...newProject, contractAmountRupees: e.target.value })}
            placeholder="e.g. 150000000 (₹15.00 Cr)"
            helperText="Stored precisely in minor units (paise). Becomes the immutable contractual baseline."
          />

          <div className="pt-2 flex justify-end gap-3 border-t border-border mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              isLoading={createMutation.isPending}
            >
              Establish Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

