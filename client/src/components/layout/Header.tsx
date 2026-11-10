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
    <header className="h-14 bg-forest border-b border-olive/30 fixed top-0 right-0 left-64 z-20 flex items-center justify-between px-6 select-none shadow-sm">
      {/* Left: Organization Switcher */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-md hover:bg-industrial border border-transparent hover:border-olive/40 transition-all text-left"
          >
            <div className="w-6 h-6 rounded bg-industrial border border-copper/50 text-copper flex items-center justify-center shrink-0">
              <Building className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-parchment leading-tight truncate max-w-[180px]">
                {activeOrganization?.name || 'Select Organization'}
              </div>
              <div className="text-[10px] text-limestone leading-none font-mono">
                Role: <span className="font-semibold text-copper">{activeOrganization?.role?.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-limestone shrink-0" />
          </button>

          {isOrgDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOrgDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-1 w-64 bg-forest-surface rounded-lg border border-olive/50 shadow-elevated py-1.5 z-50">
                <div className="px-3 py-1.5 text-[10px] font-mono font-semibold text-olive uppercase tracking-wider border-b border-olive/30">
                  Available Workspaces
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {organizations.map((org) => {
                    const isSelected = org._id === activeOrganization?._id;
                    return (
                      <button
                        key={org._id}
                        onClick={() => handleSwitch(org._id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-industrial transition-colors text-left"
                      >
                        <div className="truncate">
                          <div className="font-medium text-parchment truncate">{org.name}</div>
                          <div className="text-[10px] text-limestone font-mono">{org.currency} • {org.role?.toUpperCase()}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-copper shrink-0" />}
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
          <Search className="w-4 h-4 text-limestone absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects, change orders (e.g. CO-001), BOQ items..."
            className="w-full h-8 pl-9 pr-4 rounded-md border border-olive/40 bg-industrial/60 text-xs text-parchment placeholder:text-limestone/60 focus:bg-industrial focus:border-copper focus:outline-none focus:ring-1 focus:ring-copper/30 transition-all font-sans"
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
            className="p-2 text-limestone hover:text-parchment hover:bg-industrial rounded-md relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-copper" />
            )}
          </button>
        </div>

        {/* User initials bubble */}
        <div className="w-8 h-8 rounded bg-industrial border border-copper text-copper flex items-center justify-center font-mono font-bold text-xs shadow-sm">
          {user?.name?.[0] || 'U'}
        </div>
      </div>
    </header>
  );
};

