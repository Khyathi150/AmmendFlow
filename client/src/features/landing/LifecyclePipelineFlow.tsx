import React, { useState } from 'react';
import { 
  FileEdit, 
  Search, 
  Calculator, 
  ShieldCheck, 
  HardHat, 
  CheckCircle, 
  Receipt, 
  Banknote
} from 'lucide-react';

interface PipelineStep {
  id: string;
  number: string;
  title: string;
  role: string;
  governanceRule: string;
  dataArtifact: string;
  icon: any;
}

export const LifecyclePipelineFlow: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(2);

  const steps: PipelineStep[] = [
    {
      id: 'request',
      number: '01',
      title: 'Site Request',
      role: 'Site Engineer',
      governanceRule: 'Originating party, reason & schedule impact logged with photo/drawing evidence.',
      dataArtifact: 'ChangeOrder [Status: Submitted]',
      icon: FileEdit,
    },
    {
      id: 'scope',
      number: '02',
      title: 'Scope Audit',
      role: 'Project Manager',
      governanceRule: 'Verified against locked baseline BOQ. Direct alterations blocked.',
      dataArtifact: 'Scope Review Record',
      icon: Search,
    },
    {
      id: 'estimate',
      number: '03',
      title: 'Cost Engine',
      role: 'Commercial Manager',
      governanceRule: 'Integer paise arithmetic. Material, labour, rig rates, 15% overhead & 18% GST.',
      dataArtifact: 'CostEstimate [Paise Minor Units]',
      icon: Calculator,
    },
    {
      id: 'approval',
      number: '04',
      title: 'Approval Gate',
      role: 'Client Approver',
      governanceRule: 'Dual-gate approval. Formally signed off via external client portal with hash freeze.',
      dataArtifact: 'Approval [Decision: Approved]',
      icon: ShieldCheck,
    },
    {
      id: 'execution',
      number: '05',
      title: 'Site Execution',
      role: 'Site Team',
      governanceRule: 'Early work execution requires logged written justification & flags exposure.',
      dataArtifact: 'Execution Authorization Log',
      icon: HardHat,
    },
    {
      id: 'completion',
      number: '06',
      title: 'Work Completion',
      role: 'Site Engineer',
      governanceRule: 'As-built dimensions, core logs, and concrete cube test certificates attached.',
      dataArtifact: 'Completion Sign-off Record',
      icon: CheckCircle,
    },
    {
      id: 'invoicing',
      number: '07',
      title: 'Tax Invoicing',
      role: 'Finance Officer',
      governanceRule: 'Invoices issued strictly against approved completed values. Overbilling blocked.',
      dataArtifact: 'Tax Invoice [INV-2026-088]',
      icon: Receipt,
    },
    {
      id: 'payment',
      number: '08',
      title: 'Cashflow Settled',
      role: 'Finance Officer',
      governanceRule: 'Reconciled to commercial accounts. Zero revenue leakage.',
      dataArtifact: 'Payment [Reconciled 100%]',
      icon: Banknote,
    },
  ];

  return (
    <section id="pipeline-flow" className="py-24 bg-limestone text-forest relative border-t border-b border-limestone-dark">
      {/* Limestone Subtle CAD Drafting Grid */}
      <div className="absolute inset-0 bg-cad-grid-limestone opacity-60 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header with High Contrast Deep Forest Text */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-forest text-parchment border border-olive text-xs font-mono tracking-widest uppercase mb-3 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-copper" />
            <span>THE UNIFIED VARIATION LIFECYCLE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-forest">
            EVERY STEP AUDITED. ZERO REVENUE LEAKAGE.
          </h2>
          <p className="text-sm sm:text-base text-industrial font-medium mt-2">
            A single connected journey from unpredictable sub-surface site discovery to reconciled bank deposit.
          </p>
        </div>

        {/* Connected Step Pipeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-12">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={st.id}
                onClick={() => setActiveStep(idx)}
                className={`text-left p-3 rounded-lg border transition-all cursor-pointer relative group flex flex-col justify-between h-36 ${
                  isSelected
                    ? 'bg-forest text-parchment border-copper shadow-elevated scale-105 z-20'
                    : 'bg-[#DCD0BB] hover:bg-parchment-light border-limestone-dark/60 text-forest'
                }`}
              >
                {/* Step Number & Line */}
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`font-mono text-[10px] tracking-wider font-bold ${
                      isSelected ? 'text-copper' : 'text-olive'
                    }`}
                  >
                    STEP {st.number}
                  </span>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-copper' : 'text-forest/70 group-hover:text-copper'}`} />
                </div>

                {/* Title */}
                <div>
                  <h4 className={`text-xs font-bold leading-tight ${isSelected ? 'text-parchment' : 'text-forest'}`}>
                    {st.title}
                  </h4>
                  <p className={`text-[10px] mt-0.5 truncate ${isSelected ? 'text-limestone' : 'text-industrial'}`}>
                    {st.role}
                  </p>
                </div>

                {/* Progress bar pill */}
                <div className="w-full h-1 rounded-full bg-black/15 overflow-hidden mt-1">
                  <div
                    className={`h-full ${
                      isSelected ? 'bg-copper' : idx < activeStep ? 'bg-olive' : 'bg-transparent'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Stage Detailed Audit Dossier Card in Deep Forest Charcoal */}
        <div className="rounded-xl bg-forest text-parchment border border-olive/60 shadow-2xl p-6 sm:p-8 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-olive/30 pb-4 mb-6 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-copper text-parchment flex items-center justify-center font-mono font-bold text-base shadow-copper">
                {steps[activeStep].number}
              </div>
              <div>
                <h3 className="text-xl font-bold text-parchment">
                  {steps[activeStep].title} — Governance Specifications
                </h3>
                <p className="text-xs text-limestone font-mono">
                  ACTOR ROLE: {steps[activeStep].role.toUpperCase()}
                </p>
              </div>
            </div>

            <span className="font-mono text-xs px-2.5 py-1 rounded bg-industrial text-copper border border-copper/40 font-semibold self-start sm:self-auto">
              DATA ARTIFACT: {steps[activeStep].dataArtifact}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <span className="font-mono text-[10px] text-limestone uppercase tracking-wider block mb-1">
                COMMERCIAL GOVERNANCE RULE
              </span>
              <p className="text-parchment font-medium leading-relaxed">
                {steps[activeStep].governanceRule}
              </p>
            </div>

            <div>
              <span className="font-mono text-[10px] text-limestone uppercase tracking-wider block mb-1">
                SYSTEM SAFEGUARDS
              </span>
              <ul className="text-limestone text-xs space-y-1.5 list-disc list-inside">
                <li>Automated audit logging in append-only Activity Ledger</li>
                <li>Minor units (paise) integer precision without floating drift</li>
                <li>Role-based access control with tenant isolation</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-olive/30 flex items-center justify-between text-xs">
            <span className="font-mono text-limestone">
              NORTHSTAR INFRASTRUCTURE WORKFLOW SPECIFICATION
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                disabled={activeStep === 0}
                className="px-3 py-1 rounded border border-olive/40 disabled:opacity-30 hover:bg-industrial text-parchment"
              >
                Previous Step
              </button>
              <button
                onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                disabled={activeStep === steps.length - 1}
                className="px-3 py-1 rounded bg-copper text-parchment disabled:opacity-30 hover:bg-copper-hover font-semibold"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
