import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  GitPullRequest,
  TrendingUp,
  FolderClosed,
  BarChart3,
  Users2,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';

export const Sidebar: React.FC = () => {
  const { user, activeOrganization, logout } = useAuthStore();

  const navItems = [
    { label: 'Overview', to: '/overview', icon: LayoutDashboard },
    { label: 'Projects', to: '/projects', icon: Building2 },
    { label: 'Change Orders', to: '/change-orders', icon: GitPullRequest },
    { label: 'BOQ Management', to: '/boq', icon: FileSpreadsheet },
    { label: 'Financial Exposure', to: '/financial-exposure', icon: TrendingUp },
    { label: 'Invoices & Billing', to: '/invoices', icon: BarChart3 },
    { label: 'Documents', to: '/documents', icon: FolderClosed },
    { label: 'Reports', to: '/reports', icon: BarChart3 },
    { label: 'Team & Settings', to: '/settings', icon: Users2 },
  ];

  return (
    <aside className="w-64 h-screen bg-forest text-parchment flex flex-col fixed left-0 top-0 z-30 select-none border-r border-olive/30 shadow-xl">
      {/* Brand Header */}
      <div className="p-4 border-b border-olive/30 flex items-center gap-3 bg-forest-surface/40">
        <div className="w-9 h-9 rounded bg-industrial border border-copper flex items-center justify-center text-parchment shadow-sm font-bold text-base tracking-wider">
          AF
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-parchment flex items-center gap-1.5">
            AmendFlow
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 bg-copper/20 text-copper rounded border border-copper/40 tracking-wider">
              PRO
            </span>
          </h1>
          <p className="text-[10px] text-limestone font-mono leading-tight">
            CIVIL FINANCIAL CONTROL
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-mono font-semibold text-olive uppercase tracking-widest">
          Platform Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all duration-150',
                  isActive
                    ? 'bg-copper text-parchment shadow-copper font-semibold'
                    : 'text-limestone hover:bg-industrial hover:text-parchment'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* Footer Tenant & User Context */}
      <div className="p-3 border-t border-olive/30 bg-industrial/40">
        {activeOrganization && (
          <div className="px-3 py-2 rounded-md bg-forest border border-olive/40 mb-2 shadow-subtle">
            <div className="text-[9px] uppercase font-mono font-bold text-olive tracking-widest">
              TENANT WORKSPACE
            </div>
            <div className="text-xs font-semibold text-parchment truncate mt-0.5">
              {activeOrganization.name}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-copper font-mono font-bold">
                {activeOrganization.currency}
              </span>
              <span className="text-[10px] text-limestone flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3 text-copper" />
                {activeOrganization.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded bg-industrial border border-copper/60 text-copper font-mono font-bold text-xs flex items-center justify-center shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0 truncate">
              <div className="text-xs font-semibold text-parchment truncate">{user?.name}</div>
              <div className="text-[10px] text-limestone truncate font-mono">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-1.5 text-limestone hover:text-parchment hover:bg-industrial rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

