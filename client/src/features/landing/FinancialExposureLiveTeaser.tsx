import React from 'react';
import { 
  ShieldAlert, 
  Clock, 
  FileText, 
  Receipt, 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  Info
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MagneticButton } from './MagneticButton';

export const FinancialExposureLiveTeaser: React.FC = () => {
  const buckets = [
    {
      id: 'pending',
      title: 'Pending Approval',
      value: '₹ 1,85,00,000',
      compact: '₹ 1.85 Cr',
      subtitle: 'Proposed variations under review',
      status: 'In Review',
      color: 'border-amber-400 bg-amber-500/10 text-amber-500',
      icon: Clock,
      desc: 'Submitted claims undergoing technical or commercial determination. Not yet approved for work or billing.',
    },
    {
      id: 'unapproved',
      title: 'Unapproved Work Exposure',
      value: '₹ 25,00,000',
      compact: '₹ 25.00 L',
      subtitle: 'Physical work executing before sign-off',
      status: 'High Risk',
      color: 'border-safety bg-safety/10 text-safety',
      icon: ShieldAlert,
      desc: 'Work authorized early under urgent site conditions without client sign-off. Requires documented PM justification.',
    },
    {
      id: 'approved',
      title: 'Approved Unbilled',
      value: '₹ 45,00,000',
      compact: '₹ 45.00 L',
      subtitle: 'Formally signed variations ready to invoice',
      status: 'Ready to Bill',
      color: 'border-blue-500 bg-blue-500/10 text-blue-500',
      icon: FileText,
      desc: 'Client-approved scope modifications with verified unit rates awaiting next billing cycle tax invoice issuance.',
    },
    {
      id: 'receivables',
      title: 'Invoiced Receivables',
      value: '₹ 1,50,00,000',
      compact: '₹ 1.50 Cr',
      subtitle: 'Tax invoices issued with balance due',
      status: 'Outstanding',
      color: 'border-purple-500 bg-purple-500/10 text-purple-500',
      icon: Receipt,
      desc: 'Invoices issued to client accounts departments with outstanding contractual payment milestones.',
    },
    {
      id: 'realised',
      title: 'Realised Cashflow',
      value: '₹ 8,40,00,000',
      compact: '₹ 8.40 Cr',
      subtitle: 'Reconciled bank collections',
      status: 'Secured Cash',
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-500',
      icon: CheckCircle2,
      desc: 'Fully deposited and reconciled variation payments safely banked into contractor accounts. Revenue leakage: 0%.',
    },
  ];

  return (
    <section id="exposure-matrix" className="py-24 bg-charcoal-950 text-white relative border-t border-white/10">
      {/* CAD Watermark */}
      <div className="absolute inset-0 bg-cad-grid-dark opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 border-b border-white/10 pb-8">
          <div>
            <div className="font-mono text-xs text-safety tracking-widest uppercase mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-safety animate-pulse" />
              <span>DISCRETE 5-BUCKET RISK GOVERNANCE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              FINANCIAL EXPOSURE MATRIX
            </h2>
            <p className="text-sm text-white/60 mt-1 max-w-xl font-sans">
              Unlike generic spreadsheets that confuse claims with revenue, AmendFlow maintains five mutually exclusive non-overlapping exposure buckets.
            </p>
          </div>

          <div className="mt-4 md:mt-0 font-mono text-xs text-white/50 flex items-center gap-2">
            <Info className="w-4 h-4 text-blueprint-cyan" />
            <span>TENANT: NORTHSTAR INFRASTRUCTURE LIVE DATA</span>
          </div>
        </div>

        {/* 5 Exposure Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
          {buckets.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className="rounded-xl bg-charcoal-900 border border-white/15 p-5 shadow-xl flex flex-col justify-between hover:border-white/30 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`p-2 rounded-lg border ${b.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-white/10 text-white/70">
                      {b.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-mono tracking-wider text-white/60 uppercase">
                    {b.title}
                  </h4>

                  <div className="my-2">
                    <span className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-white block">
                      {b.compact}
                    </span>
                    <span className="text-[11px] font-mono text-white/40 block">
                      {b.value}
                    </span>
                  </div>

                  <p className="text-xs text-white/60 leading-relaxed font-sans mt-3">
                    {b.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-white/40">
                  <span>DISCRETE LEDGER</span>
                  <span className="text-white/60">PAISE MATH</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Callout & Live Workspace Link */}
        <div className="p-6 rounded-xl bg-charcoal-900 border border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-base font-bold text-white">
              Ready to eliminate unapproved variation leakage?
            </h4>
            <p className="text-xs text-white/60 mt-0.5">
              Experience the live financial control dashboard pre-seeded with multi-crore infrastructure data.
            </p>
          </div>

          <Link to="/login">
            <MagneticButton variant="safety" className="px-6 py-2.5 text-xs font-bold tracking-wider">
              <span>Enter Financial Exposure Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </MagneticButton>
          </Link>
        </div>
      </div>
    </section>
  );
};
