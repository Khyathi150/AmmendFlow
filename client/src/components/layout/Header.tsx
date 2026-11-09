import React, { useState } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Building,
  PlusCircle,
  Check,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';

export interface HeaderProps {
  onQuickAction?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onQuickAction }) => {
  const { activeOrganization, organizations, switchOrg, user } = useAuthStore();
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [unreadCount] = useState(3);

  const handleSwitch = async (orgId: string) => {
    if (orgId === activeOrganization?._id) {
      setIsOrgDropdownOpen(false);
      return;
    }
    try {
      await switchOrg(orgId);
      setIsOrgDropdownOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to switch org:', err);
    }
  };

  return (
    <header className="h-14 bg-surface border-b border-border fixed top-0 right-0 left-64 z-20 flex items-center justify-between px-6">
      {/* Left: Organization Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-surface-subtle border border-transparent hover:border-border transition-all text-left"
          >
            <div className="w-6 h-6 rounded bg-primary-light text-primary flex items-center justify-center shrink-0">
              <Building className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-text-primary leading-tight truncate max-w-[180px]">
                {activeOrganization?.name || 'Select Organization'}
              </div>
              <div className="text-[10px] text-text-secondary leading-none">
                Role: <span className="font-medium text-secondary">{activeOrganization?.role?.replace('_', ' ')}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
          </button>

          {isOrgDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOrgDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1 w-64 bg-surface rounded-lg border border-border shadow-elevated py-1.5 z-50">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-text-muted uppercase tracking-wider border-b border-border">
                  Available Workspaces
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {organizations.map((org) => {
                    const isSelected = org._id === activeOrganization?._id;
                    return (
                      <button
                        key={org._id}
                        onClick={() => handleSwitch(org._id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-surface-subtle transition-colors text-left"
                      >
                        <div className="truncate">
                          <div className="font-medium text-text-primary truncate">{org.name}</div>
                          <div className="text-[10px] text-text-secondary">{org.currency} • {org.role}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-secondary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, change orders (e.g. CO-001), BOQ items..."
            className="w-full h-8 pl-9 pr-4 rounded-md border border-border bg-surface-subtle text-xs text-text-primary placeholder:text-text-muted focus:bg-surface focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/20 transition-all"
          />
        </div>
      </div>

      {/* Right: Notifications & Quick Actions */}
      <div className="flex items-center gap-3">
        {onQuickAction && (
          <Button variant="secondary" size="sm" leftIcon={PlusCircle} onClick={onQuickAction}>
            New Change Order
          </Button>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            title="Notifications"
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-subtle rounded-md relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-danger" />
            )}
          </button>
        </div>

        {/* User initials bubble */}
        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-xs shadow-sm">
          {user?.name?.[0] || 'U'}
        </div>
      </div>
    </header>
  );
};
