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
    <aside className="w-64 h-screen bg-primary text-white flex flex-col fixed left-0 top-0 z-30 select-none border-r border-primary-hover/50">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-wider">
          AF
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
            AmendFlow
            <span className="text-[10px] font-medium px-1.5 py-0.2 bg-secondary/30 text-teal-200 rounded border border-teal-500/30">
              PRO
            </span>
          </h1>
          <p className="text-[10px] text-gray-300 font-normal leading-tight">
            Financial & Scope Control
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
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
                    ? 'bg-secondary text-white shadow-sm'
                    : 'text-gray-300 hover:bg-white/5 hover:text-white'
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
      <div className="p-3 border-t border-white/10 bg-primary-hover/40">
        {activeOrganization && (
          <div className="px-3 py-2 rounded-md bg-white/5 border border-white/10 mb-2">
            <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
              Tenant Workspace
            </div>
            <div className="text-xs font-medium text-white truncate mt-0.5">
              {activeOrganization.name}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-teal-300 font-mono">
                {activeOrganization.currency}
              </span>
              <span className="text-[10px] text-gray-300 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-secondary" />
                {activeOrganization.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-secondary-light text-secondary font-semibold text-xs flex items-center justify-center shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="min-w-0 truncate">
              <div className="text-xs font-medium text-white truncate">{user?.name}</div>
              <div className="text-[10px] text-gray-400 truncate">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Log Out"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

