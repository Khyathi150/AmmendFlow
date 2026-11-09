import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const LoginView: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    try {
      await login({ email, password });
      navigate('/overview');
    } catch (err: any) {
      // Error handled by store
    }
  };

  const handleFillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    clearError();
    setLocalError(null);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-white shadow-md font-bold text-xl mb-3">
          AF
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          AmendFlow
        </h2>
        <p className="text-xs text-text-secondary mt-1 max-w-xs mx-auto">
          Every change accounted for. Every cost protected.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-subtle rounded-xl border border-border sm:px-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="pb-1 border-b border-border mb-2">
              <h3 className="text-sm font-semibold text-text-primary">Sign in to your account</h3>
              <p className="text-xs text-text-secondary">Enter credentials to access your tenant projects</p>
            </div>

            {(error || localError) && (
              <div className="p-3 rounded-md bg-status-danger-bg border border-status-danger-border flex items-start gap-2.5 text-xs text-status-danger">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error || localError}</span>
              </div>
            )}

            <Input
              label="Work Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. vikram@northstarinfra.com"
              leftIcon={Mail}
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              leftIcon={Lock}
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-text-secondary">
                <input type="checkbox" className="rounded border-border text-secondary focus:ring-secondary/20" />
                <span>Remember this workstation</span>
              </label>
              <a href="#forgot" className="text-secondary hover:underline font-medium">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={ArrowRight}
            >
              Sign In to AmendFlow
            </Button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="mt-6 pt-5 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
                Demonstration Accounts
              </span>
              <span className="text-[10px] text-text-secondary font-mono">Password: DemoPass123!</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-left">
              <button
                type="button"
                onClick={() => handleFillDemo('vikram@northstarinfra.com', 'DemoPass123!')}
                className="p-2 text-left border border-border rounded-md hover:bg-surface-subtle transition-colors text-xs"
              >
                <div className="font-semibold text-text-primary">Vikram M.</div>
                <div className="text-[10px] text-secondary">Director (Owner)</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('arjun.pm@northstarinfra.com', 'DemoPass123!')}
                className="p-2 text-left border border-border rounded-md hover:bg-surface-subtle transition-colors text-xs"
              >
                <div className="font-semibold text-text-primary">Arjun R.</div>
                <div className="text-[10px] text-secondary">Project Manager</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('priya.site@northstarinfra.com', 'DemoPass123!')}
                className="p-2 text-left border border-border rounded-md hover:bg-surface-subtle transition-colors text-xs"
              >
                <div className="font-semibold text-text-primary">Priya S.</div>
                <div className="text-[10px] text-secondary">Site Engineer</div>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('client.rep@prestigecommercial.com', 'DemoPass123!')}
                className="p-2 text-left border border-border rounded-md hover:bg-surface-subtle transition-colors text-xs"
              >
                <div className="font-semibold text-text-primary">Rohan K.</div>
                <div className="text-[10px] text-secondary">Client Approver</div>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-text-secondary">
            Need a new organization workspace?{' '}
            <Link to="/register" className="text-secondary font-semibold hover:underline">
              Create an organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

