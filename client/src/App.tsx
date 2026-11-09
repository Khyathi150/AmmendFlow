import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { AppShell } from './components/layout/AppShell';
import { LoginView } from './features/auth/LoginView';
import { RegisterView } from './features/auth/RegisterView';
import { OverviewView } from './features/dashboard/OverviewView';
import { ProjectsListView } from './features/projects/ProjectsListView';
import { ProjectDetailView } from './features/projects/ProjectDetailView';
import { BOQManagementView } from './features/boq/BOQManagementView';
import { ChangeOrdersListView } from './features/change-orders/ChangeOrdersListView';
import { NewChangeOrderView } from './features/change-orders/NewChangeOrderView';
import { ChangeOrderDetailView } from './features/change-orders/ChangeOrderDetailView';
import { FinancialExposureView } from './features/financial-exposure/FinancialExposureView';
import { InvoicesView } from './features/invoices/InvoicesView';
import { DocumentsView } from './features/documents/DocumentsView';
import { ReportsView } from './features/reports/ReportsView';
import { SettingsView } from './features/settings/SettingsView';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 2, // 2 minutes
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-secondary animate-spin mb-3" />
        <p className="text-xs text-text-secondary font-medium">Verifying tenant session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<OverviewView />} />
            <Route path="projects" element={<ProjectsListView />} />
            <Route path="projects/:id" element={<ProjectDetailView />} />
            <Route path="boq" element={<BOQManagementView />} />
            <Route path="change-orders" element={<ChangeOrdersListView />} />
            <Route path="change-orders/new" element={<NewChangeOrderView />} />
            <Route path="change-orders/:id" element={<ChangeOrderDetailView />} />
            <Route path="financial-exposure" element={<FinancialExposureView />} />
            <Route path="invoices" element={<InvoicesView />} />
            <Route path="documents" element={<DocumentsView />} />
            <Route path="reports" element={<ReportsView />} />
            <Route path="settings" element={<SettingsView />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
