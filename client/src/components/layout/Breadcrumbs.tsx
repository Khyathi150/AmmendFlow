import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const routeNameMap: Record<string, string> = {
    projects: 'Projects',
    'change-orders': 'Change Orders',
    boq: 'BOQ Management',
    'financial-exposure': 'Financial Exposure',
    invoices: 'Invoices & Billing',
    documents: 'Documents',
    reports: 'Reports',
    settings: 'Team & Settings',
  };

  return (
    <nav className="flex items-center text-xs text-text-secondary mb-4 space-x-1.5" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-text-primary flex items-center transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNameMap[value] || (value.length > 15 ? `${value.substring(0, 10)}...` : value);

        return (
          <React.Fragment key={to}>
            <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
            {isLast ? (
              <span className="font-semibold text-text-primary truncate">{displayName}</span>
            ) : (
              <Link to={to} className="hover:text-text-primary transition-colors truncate">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

