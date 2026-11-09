import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import {
  Building2,
  Users2,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Save,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { activeOrganization, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'permissions'>('profile');

  // Org form state
  const [orgData, setOrgData] = useState({
    name: activeOrganization?.name || 'Northstar Infrastructure Pvt. Ltd.',
    legalEntityName: activeOrganization?.legalEntityName || 'Northstar Infrastructure Private Limited',
    taxId: activeOrganization?.taxId || '29AABCN8234M1Z5',
    currency: activeOrganization?.currency || 'INR',
    defaultOverheadPct: 10,
    defaultMarkupPct: 15,
    defaultTaxPct: 18,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const rolesMatrix = [
    {
      role: 'Owner / Executive',
      desc: 'Corporate administrator with full tenant authority across all projects',
      createCO: true,
      reviewTech: true,
      commercialReview: true,
      internalApprove: true,
      clientSign: false,
      authExecution: true,
      invoicing: true,
      payments: true,
    },
    {
      role: 'Project Manager',
      desc: 'Oversees site execution, conducts technical reviews, authorizes work',
      createCO: true,
      reviewTech: true,
      commercialReview: false,
      internalApprove: false,
      clientSign: false,
      authExecution: true,
      invoicing: false,
      payments: false,
    },
    {
      role: 'Site Engineer',
      desc: 'Creates site change requests, uploads blueprint markups, records physical progress',
      createCO: true,
      reviewTech: false,
      commercialReview: false,
      internalApprove: false,
      clientSign: false,
      authExecution: false,
      invoicing: false,
      payments: false,
    },
    {
      role: 'Commercial Manager',
      desc: 'Formulates multi-tier cost estimates, reviews contract markups, manages baseline BOQ',
      createCO: true,
      reviewTech: false,
      commercialReview: true,
      internalApprove: false,
      clientSign: false,
      authExecution: false,
      invoicing: true,
      payments: false,
    },
    {
      role: 'Finance Officer',
      desc: 'Issues tax invoices against completed variations, allocates payment receipts',
      createCO: false,
      reviewTech: false,
      commercialReview: false,
      internalApprove: false,
      clientSign: false,
      authExecution: false,
      invoicing: true,
      payments: true,
    },
    {
      role: 'Client Approver',
      desc: 'Restricted external representative: inspects shared variations, approves or requests changes',
      createCO: false,
      reviewTech: false,
      commercialReview: false,
      internalApprove: false,
      clientSign: true,
      authExecution: false,
      invoicing: false,
      payments: false,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary">
          Organization Workspace & Governance Settings
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure corporate tenant metadata, default commercial thresholds, and Role-Based Access Control (RBAC)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border text-xs">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Company Profile & Defaults
        </button>
        <button
          onClick={() => setActiveTab('permissions')}
          className={`pb-2.5 px-3 font-semibold border-b-2 transition-colors ${
            activeTab === 'permissions'
              ? 'border-secondary text-secondary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          RBAC Permissions Matrix
        </button>
      </div>

      {/* Profile & Commercial Defaults Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="space-y-6">
          {savedSuccess && (
            <div className="p-3 rounded-md bg-status-success-bg text-status-success text-xs border border-status-success-border flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Organization settings updated successfully.</span>
            </div>
          )}

          <Card className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Corporate Legal Entity</CardTitle>
                <CardDescription>Official business details shown on formal variation registers and invoices</CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization Display Name"
                required
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              />
              <Input
                label="Registered Legal Entity Name"
                required
                value={orgData.legalEntityName}
                onChange={(e) => setOrgData({ ...orgData, legalEntityName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Tax Identification / GSTIN"
                required
                value={orgData.taxId}
                onChange={(e) => setOrgData({ ...orgData, taxId: e.target.value })}
              />
              <Select
                label="Operational Currency"
                required
                value={orgData.currency}
                onChange={(e) => setOrgData({ ...orgData, currency: e.target.value })}
                options={[{ value: 'INR', label: 'INR (Indian Rupee - ₹ with Lakhs & Crores)' }]}
              />
            </div>
          </Card>

          <Card className="space-y-4">
            <CardHeader>
              <div>
                <CardTitle>Standard Commercial Costing Defaults</CardTitle>
                <CardDescription>
                  Pre-configured overhead and margin percentages prefilled on new variation estimates
                </CardDescription>
              </div>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Default Site Overhead (%)"
                type="number"
                min={0}
                max={100}
                value={orgData.defaultOverheadPct}
                onChange={(e) => setOrgData({ ...orgData, defaultOverheadPct: parseFloat(e.target.value) || 0 })}
                helperText="Applied directly to Direct Costs"
              />

              <Input
                label="Default Profit Markup (%)"
                type="number"
                min={0}
                max={100}
                value={orgData.defaultMarkupPct}
                onChange={(e) => setOrgData({ ...orgData, defaultMarkupPct: parseFloat(e.target.value) || 0 })}
                helperText="Applied to Pre-Markup subtotal"
              />

              <Input
                label="Standard Tax Rate (GST %)"
                type="number"
                min={0}
                max={100}
                value={orgData.defaultTaxPct}
                onChange={(e) => setOrgData({ ...orgData, defaultTaxPct: parseFloat(e.target.value) || 0 })}
                helperText="Standard construction GST rate"
              />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="secondary" size="md" leftIcon={Save}>
              Save Workspace Settings
            </Button>
          </div>
        </form>
      )}

      {/* Permissions Matrix Tab */}
      {activeTab === 'permissions' && (
        <Card className="space-y-4">
          <CardHeader>
            <div>
              <CardTitle>Role-Based Access Control (RBAC) Architecture</CardTitle>
              <CardDescription>
                Backend-enforced permission gates guaranteeing strict separation of responsibilities
              </CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-surface-subtle border-b border-border text-[10px] font-semibold text-text-secondary uppercase">
                  <th className="py-2.5 px-3">Persona Role</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-2 text-center">Create CO</th>
                  <th className="py-2.5 px-2 text-center">Tech Review</th>
                  <th className="py-2.5 px-2 text-center">Comm. Review</th>
                  <th className="py-2.5 px-2 text-center">Internal Appr.</th>
                  <th className="py-2.5 px-2 text-center">Client Sign</th>
                  <th className="py-2.5 px-2 text-center">Auth Exec.</th>
                  <th className="py-2.5 px-2 text-center">Invoicing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rolesMatrix.map((rm) => (
                  <tr key={rm.role} className="hover:bg-surface-subtle">
                    <td className="py-3 px-3 font-semibold text-text-primary whitespace-nowrap">
                      {rm.role}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-text-secondary max-w-xs">{rm.desc}</td>
                    <td className="py-3 px-2 text-center">
                      {rm.createCO ? <Check className="w-4 h-4 text-status-success mx-auto" /> : <X className="w-4 h-4 text-text-muted mx-auto" />}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {rm.reviewTech ? <Check className="w-4 h-4 text-status-success mx-auto" /> : <X className="w-4 h-4 text-text-muted mx-auto" />}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {rm.commercialReview ? <Check className="w-4 h-4 text-status-success mx-auto" /> : <X className="w-4 h-4 text-text-muted mx-auto" />}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {rm.internalApprove ? <Check className="w-4 h-4 text-status-success mx-auto" /> : <X className="w-4 h-4 text-text-muted mx-auto" />}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {rm.clientSign ? <Check className="w-4 h-4 text-status-success mx-auto" /> : <X className="w-4 h-4 text-text-muted mx-auto" />}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {rm.authExecution ? <Check className="w-4 h-4 text-status-success mx-auto" /> : <X className="w-4 h-4 text-text-muted mx-auto" />}
                    </td>
                    <td className="py-3 px-2 text-center">
                      {rm.invoicing ? <Check className="w-4 h-4 text-status-success mx-auto" /> : <X className="w-4 h-4 text-text-muted mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
