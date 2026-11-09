import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Building, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const RegisterView: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
    phone: '',
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!formData.name || !formData.email || !formData.password || !formData.organizationName) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 8) {
      setLocalError('Password must be at least 8 characters long.');
      return;
    }

    try {
      await register(formData);
      navigate('/');
    } catch (err) {
      // Error in store
    }
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
        <p className="text-xs text-text-secondary mt-1">
          Set up your organization and protect your project margins
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-6 shadow-subtle rounded-xl border border-border sm:px-8">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="pb-1 border-b border-border mb-2">
              <h3 className="text-sm font-semibold text-text-primary">Create Organization Workspace</h3>
              <p className="text-xs text-text-secondary">You will be designated as the Organization Owner</p>
            </div>

            {(error || localError) && (
              <div className="p-3 rounded-md bg-status-danger-bg border border-status-danger-border flex items-start gap-2.5 text-xs text-status-danger">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error || localError}</span>
              </div>
            )}

            <Input
              label="Full Name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Vikram Malhotra"
              leftIcon={UserIcon}
            />

            <Input
              label="Work Email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. vikram@northstarinfra.com"
              leftIcon={Mail}
            />

            <Input
              label="Company / Organization Name"
              name="organizationName"
              type="text"
              required
              value={formData.organizationName}
              onChange={handleChange}
              placeholder="e.g. Northstar Infrastructure Pvt. Ltd."
              leftIcon={Building}
            />

            <Input
              label="Phone Number"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. +91 98765 43210"
              leftIcon={Phone}
              helperText="For critical project authorization SMS alerts"
            />

            <Input
              label="Password (min 8 chars)"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              leftIcon={Lock}
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={ArrowRight}
            >
              Initialize Workspace
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-text-secondary">
            Already registered?{' '}
            <Link to="/login" className="text-secondary font-semibold hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
