import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="bg-forest text-parchment border-t border-olive/30 pt-16 pb-12 font-sans relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Architectural Grid Block */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16 pb-12 border-b border-olive/20">
          {/* Brand & Manifesto */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded bg-industrial border border-copper flex items-center justify-center text-parchment font-mono font-bold text-sm">
                AF
              </div>
              <span className="font-bold text-lg text-parchment tracking-tight">AmendFlow</span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-industrial text-limestone border border-olive/40">
                v4.0
              </span>
            </div>

            <p className="text-sm text-limestone max-w-md leading-relaxed mb-4">
              The premier construction change management and financial control software designed for general contractors, commercial managers, and infrastructure developers.
            </p>

            <p className="font-mono text-xs text-copper font-semibold">
              "Every change accounted for. Every cost protected."
            </p>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="font-mono text-xs font-bold text-parchment uppercase tracking-wider mb-3">
              SYSTEM MODULES
            </h4>
            <ul className="space-y-2 text-xs font-mono text-limestone">
              <li><Link to="/login" className="hover:text-copper transition-colors">01. Project Control Center</Link></li>
              <li><Link to="/login" className="hover:text-copper transition-colors">02. Baseline BOQ Schedule</Link></li>
              <li><Link to="/login" className="hover:text-copper transition-colors">03. Variation 5-Step Wizard</Link></li>
              <li><Link to="/login" className="hover:text-copper transition-colors">04. Drawing Vector Annotations</Link></li>
              <li><Link to="/login" className="hover:text-copper transition-colors">05. 5-Bucket Exposure Ledger</Link></li>
              <li><Link to="/login" className="hover:text-copper transition-colors">06. Tax Invoices & Reconciliation</Link></li>
            </ul>
          </div>

          {/* Demo Tenant Credentials */}
          <div>
            <h4 className="font-mono text-xs font-bold text-parchment uppercase tracking-wider mb-3">
              PRE-SEEDED DEMO ACCOUNTS
            </h4>
            <div className="p-3.5 rounded bg-industrial border border-olive/50 font-mono text-[11px] text-parchment space-y-1.5 shadow-subtle">
              <div><span className="text-limestone">TENANT:</span> Northstar Infra</div>
              <div><span className="text-limestone">DIRECTOR:</span> vikram@northstarinfra.com</div>
              <div><span className="text-limestone">PROJECT MGR:</span> arjun.pm@northstarinfra.com</div>
              <div><span className="text-limestone">PASSWORD:</span> DemoPass123!</div>
              <div className="pt-2">
                <Link to="/login" className="text-copper font-bold hover:underline inline-flex items-center gap-1 font-sans">
                  <span>Sign in to live workspace</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CAD Drawing Title Block Stamp */}
        <div className="p-4 rounded-lg bg-industrial/80 border border-olive/40 font-mono text-[10px] text-limestone grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
          <div>
            <span className="text-olive block">SYSTEM SPECIFICATION</span>
            <span className="text-parchment font-semibold">DIN 18202 / ISO 9001:2015</span>
          </div>
          <div>
            <span className="text-olive block">PRECISION ENGINE</span>
            <span className="text-copper font-bold">INTEGER MINOR-UNITS (PAISE)</span>
          </div>
          <div>
            <span className="text-olive block">SYSTEM CLOCK</span>
            <span className="text-parchment font-semibold">{time || 'LIVE CLOCK'}</span>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-olive block">COPYRIGHT</span>
            <span className="text-parchment font-semibold">© 2026 AMENDFLOW INC.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
