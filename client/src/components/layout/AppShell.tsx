import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';

export interface AppShellProps {
  onQuickAction?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ onQuickAction }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      <Sidebar />
      <Header onQuickAction={onQuickAction} />
      <main className="ml-64 mt-14 p-6 sm:p-8 flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          <Breadcrumbs />
          <Outlet />
        </div>
      </main>
    </div>
  );
};

