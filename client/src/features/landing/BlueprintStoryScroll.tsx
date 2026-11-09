import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  Clock, 
  Banknote,
  Sparkles
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export const BlueprintStoryScroll: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [activeStage, setActiveStage] = useState<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const st = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.6,
      onUpdate: (self) => {
        const p = self.progress;
        setScrollProgress(p);
        if (p < 0.25) {
          setActiveStage(0); // Baseline
        } else if (p < 0.55) {
          setActiveStage(1); // Discovery
        } else if (p < 0.80) {
          setActiveStage(2); // Revision & Rate Analysis
        } else {
          setActiveStage(3); // Approval & Billing
        }
      },
    });

    return () => {
      st.kill();
    };
  }, []);

  // Stage descriptive titles
  const stages = [
    {
      num: '01',
      title: 'Contractual Baseline Locked',
      eyebrow: 'STAGE 1: SCOPE DISCIPLINE',
      desc: 'Bill of Quantities item Civil-014 defines 12m foundation piers at ₹5.00 Cr. The baseline is mathematically immutable. Direct alterations are prohibited without audited change orders.',
      tag: 'IMMUTABLE BASELINE',
      tagColor: 'text-blueprint-cyan border-blueprint-cyan/30 bg-blueprint-cyan/10',
    },
    {
      num: '02',
      title: 'Geotechnical Site Anomaly',
      eyebrow: 'STAGE 2: SITE OBSERVATION',
      desc: 'During rotary drilling at Pier P-14, core samples encounter fractured, water-bearing granite fault at -11.40m. Soil bearing capacity drops to 180 kPa. Standard design is technically untenable.',
      tag: 'GEOTECHNICAL ANOMALY',
      tagColor: 'text-safety border-safety/30 bg-safety/10',
    },
    {
      num: '03',
      title: 'Engineered Socket Revision',
      eyebrow: 'STAGE 3: INTEGER-PAISE ESTIMATE',
      desc: 'Pier embedment is extended +3.0m into solid sound granite. AmendFlow’s cost engine computes 36 m³ M40 concrete, 4.2 MT epoxy rebar, and 48 rig hours with exact integer paise precision without floating drift.',
      tag: 'RATE AUDIT: ₹ 38,94,750',
      tagColor: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    },
    {
      num: '04',
      title: 'Client Sign-off & Payment',
      eyebrow: 'STAGE 4: REVENUE PROTECTED',
      desc: 'Commercial justification and marked-up CAD evidence are shared via the Client Approver Portal. Approved within 48 hours. Zero revenue leakage. Tax invoice generated and payment fully reconciled.',
      tag: 'CASH RECONCILED',
      tagColor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    },
  ];

  return (
    <div
      id="blueprint-story"
      ref={containerRef}
      className="relative w-full h-[320vh] bg-charcoal-950 text-white"
    >
      {/* Sticky Fullscreen Viewing Theatre */}
      <div className="sticky top-0 h-screen w-full flex flex-col lg:flex-row items-center justify-between overflow-hidden px-4 sm:px-8 lg:px-16 py-12">
        {/* Background Subtle Grid & Technical Rulers */}
        <div className="absolute inset-0 bg-cad-grid-dark opacity-40 pointer-events-none" />

        {/* Top Progress Meter */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-xs font-mono text-white/50 border-b border-white/10 pb-3 z-30">
          <div className="flex items-center gap-3">
            <span className="text-blueprint-cyan font-bold">SCROLL CHOREOGRAPHY</span>
            <span>•</span>
            <span>SECTION: PIER P-14 VARIATION LIFECYCLE</span>
          </div>

          <div className="flex items-center gap-2">
            <span>SCRUB: {Math.round(scrollProgress * 100)}%</span>
            <div className="w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-safety transition-all duration-75"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Left Side: Editorial Storytelling & Stage Narrative */}
        <div className="w-full lg:w-5/12 z-20 mt-12 lg:mt-0 max-w-xl">
          {/* Active Stage Indicator */}
          <div className="font-mono text-xs text-white/50 tracking-widest uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-safety animate-pulse" />
            <span>{stages[activeStage].eyebrow}</span>
          </div>

          {/* Large Editorial Heading */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight mb-4 transition-all duration-300">
            {stages[activeStage].title}
          </h2>

          {/* Status Badge */}
          <div className="mb-6">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono tracking-wider border font-medium ${stages[activeStage].tagColor}`}
            >
              {stages[activeStage].tag}
            </span>
          </div>

          {/* Stage Narrative Description */}
          <p className="text-sm sm:text-base text-white/70 leading-relaxed font-sans mb-8">
            {stages[activeStage].desc}
          </p>

          {/* Real-time Dynamic Stage Data Card */}
          <div className="p-4 rounded-lg bg-charcoal-900 border border-white/15 backdrop-blur-md shadow-xl font-mono text-xs">
            {activeStage === 0 && (
              <div className="space-y-2">
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-white/50">CONTRACT BOQ REF</span>
                  <span className="text-white font-bold">CIVIL-014 [PIER P-14]</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-white/50">BASELINE DEPTH</span>
                  <span className="text-white">12.00 METERS</span>
                </div>
                <div className="flex justify-between text-blueprint-cyan">
                  <span>BASELINE ALLOCATION</span>
                  <span className="font-bold">₹ 5,00,00,000</span>
                </div>
              </div>
            )}

            {activeStage === 1 && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-safety">SOIL BOREHOLE ID</span>
                  <span className="text-white font-bold">BH-P14-2026</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-white/50">ENCOUNTER DEPTH</span>
                  <span className="text-white">EL -11.40M [FAULT ZONE]</span>
                </div>
                <div className="flex justify-between text-safety font-bold">
                  <span>RISK EXPOSURE</span>
                  <span>UNAPPROVED WORK FLAG</span>
                </div>
              </div>
            )}

            {activeStage === 2 && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-white/50">M40 CONCRETE (+36 m³)</span>
                  <span className="text-white">₹ 15,12,000</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-white/50">REBAR FE500D (+4.2 MT)</span>
                  <span className="text-white">₹ 3,57,000</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1">
                  <span className="text-white/50">RIG TIME & OVERHEADS</span>
                  <span className="text-white">₹ 14,94,750</span>
                </div>
                <div className="flex justify-between border-t border-white/20 pt-1 text-amber-400 font-bold">
                  <span>VARIATION ORDER PROPOSED</span>
                  <span>+₹ 38,94,750</span>
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <div className="flex justify-between border-b border-white/10 pb-1.5 text-emerald-400">
                  <span>CLIENT APPROVAL</span>
                  <span className="font-bold">ACCEPTED (SHA-256 HASH)</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-white/50">TAX INVOICE ISSUED</span>
                  <span className="text-white">INV-2026-088</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>PAYMENT RECONCILED</span>
                  <span>₹ 38,94,750 (100%)</span>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center gap-2 mt-6">
            {stages.map((stg, i) => (
              <div
                key={stg.num}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeStage === i ? 'w-8 bg-safety' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Architectural Blueprint Elevation Stage */}
        <div className="w-full lg:w-6/12 h-[420px] sm:h-[500px] lg:h-[600px] flex items-center justify-center relative z-20">
          <div className="w-full h-full rounded-xl bg-charcoal-900 border border-white/15 p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Blueprint Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2 font-mono text-[10px] text-white/50">
              <div className="flex items-center gap-2">
                <span className="text-blueprint-cyan">●</span>
                <span>ELEVATION VIEW: PIER P-14</span>
              </div>
              <div>SCALE: 1:100 METRIC</div>
            </div>

            {/* Dynamic SVG CAD Blueprint */}
            <div className="relative flex-1 flex items-center justify-center my-2">
              <svg viewBox="0 0 500 500" className="w-full h-full max-h-[460px]">
                {/* Strata Layers */}
                <rect x="20" y="240" width="460" height="90" fill="#1E2D36" fillOpacity="0.4" />
                <text x="30" y="255" fill="#8A99A4" fontSize="8" fontFamily="monospace">SILTY CLAY LAYER (0.0M TO -6.0M)</text>

                <rect x="20" y="330" width="460" height="80" fill="#172B3A" fillOpacity="0.5" />
                <text x="30" y="345" fill="#8A99A4" fontSize="8" fontFamily="monospace">WEATHERED SCHIST (-6.0M TO -11.4M)</text>

                {/* Bedrock / Fractured Zone */}
                <rect x="20" y="410" width="460" height="80" fill="#121E24" fillOpacity="0.8" />
                <text x="30" y="425" fill={activeStage >= 1 ? '#E05A34' : '#8A99A4'} fontSize="8" fontFamily="monospace" fontWeight="bold">
                  {activeStage >= 1 ? '⚠ HARD FRACTURED GRANITE FAULT' : 'HARD SOUND GRANITE BEDROCK'}
                </text>

                {/* Pile Cap */}
                <rect x="120" y="160" width="260" height="50" fill="none" stroke="#38BDF8" strokeWidth="2" />
                <text x="130" y="190" fill="#38BDF8" fontSize="9" fontFamily="monospace">REINFORCED PILE CAP</text>

                {/* Pier Column Above Ground */}
                <rect x="190" y="40" width="120" height="120" fill="none" stroke="#38BDF8" strokeWidth="2" />
                <line x1="250" y1="40" x2="250" y2="160" stroke="#38BDF8" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="200" y="100" fill="#38BDF8" fontSize="9" fontFamily="monospace">Ø 1800 PIER</text>

                {/* Bored Piles (Baseline to Y=350) */}
                <line x1="160" y1="210" x2="160" y2="350" stroke="#38BDF8" strokeWidth="3" />
                <line x1="220" y1="210" x2="220" y2="350" stroke="#38BDF8" strokeWidth="3" />
                <line x1="280" y1="210" x2="280" y2="350" stroke="#38BDF8" strokeWidth="3" />
                <line x1="340" y1="210" x2="340" y2="350" stroke="#38BDF8" strokeWidth="3" />

                {/* Stage 0 Baseline Dimension */}
                <line x1="370" y1="210" x2="370" y2="350" stroke="#38BDF8" strokeWidth="1" strokeDasharray="2 2" />
                <text x="380" y="285" fill="#38BDF8" fontSize="8" fontFamily="monospace">BASELINE: -12.0M</text>

                {/* Stage 1: Geotechnical Fault Marker */}
                {activeStage >= 1 && (
                  <g className="animate-in fade-in duration-500">
                    <path
                      d="M 60 350 Q 180 335, 270 355 T 440 345"
                      stroke="#E05A34"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <circle cx="270" cy="355" r="4" fill="#E05A34" className="animate-ping" />
                    <circle cx="270" cy="355" r="4" fill="#E05A34" />
                    <text x="280" y="345" fill="#E05A34" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      FAULT DISCOVERED
                    </text>
                  </g>
                )}

                {/* Stage 2 & 3: Extended Socket (+3m down to Y=430) */}
                {activeStage >= 2 && (
                  <g className="animate-in fade-in duration-500">
                    <line x1="160" y1="350" x2="160" y2="430" stroke="#E05A34" strokeWidth="3.5" />
                    <line x1="220" y1="350" x2="220" y2="430" stroke="#E05A34" strokeWidth="3.5" />
                    <line x1="280" y1="350" x2="280" y2="430" stroke="#E05A34" strokeWidth="3.5" />
                    <line x1="340" y1="350" x2="340" y2="430" stroke="#E05A34" strokeWidth="3.5" />

                    {/* Extended Embedment Base */}
                    <line x1="140" y1="430" x2="360" y2="430" stroke="#E05A34" strokeWidth="2" />
                    <text x="370" y="433" fill="#E05A34" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      REVISED EMBEDMENT: -15.0M (+3.0M)
                    </text>

                    {/* Orange Revision Cloud Box */}
                    <rect
                      x="130" y="335" width="240" height="105"
                      fill="#E05A34" fillOpacity="0.08"
                      stroke="#E05A34" strokeWidth="1.5" strokeDasharray="4 2"
                      rx="4"
                    />
                    <text x="140" y="325" fill="#E05A34" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      REVISION CLOUD: CO-PRJ-001
                    </text>
                  </g>
                )}

                {/* Stage 3: Approval Seal Stamp */}
                {activeStage >= 3 && (
                  <g className="animate-in zoom-in-95 duration-500">
                    <rect x="290" y="50" width="160" height="70" rx="4" fill="#0B1317" stroke="#10B981" strokeWidth="2" />
                    <text x="305" y="75" fill="#10B981" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      ✓ APPROVED FOR BILLING
                    </text>
                    <text x="305" y="92" fill="#10B981" fontSize="8" fontFamily="monospace">
                      CLIENT: PRESTIGE COMMERCIAL
                    </text>
                    <text x="305" y="105" fill="#10B981" fontSize="7" fontFamily="monospace">
                      HASH: 8F3C2A91D... VERIFIED
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Bottom Title Block */}
            <div className="grid grid-cols-3 gap-2 border-t border-white/10 pt-2 text-[9px] font-mono text-white/40">
              <div>
                <span>STATUS: </span>
                <span className="text-white">
                  {activeStage === 0 && 'BASELINE ACTIVE'}
                  {activeStage === 1 && 'SITE FAULT REVIEW'}
                  {activeStage === 2 && 'VARIATION ESTIMATED'}
                  {activeStage === 3 && 'SETTLED & PAID'}
                </span>
              </div>
              <div className="text-center">
                <span>STAGE: </span>
                <span className="text-safety">{activeStage + 1} OF 4</span>
              </div>
              <div className="text-right">
                <span>DWG NO: </span>
                <span className="text-white">NSR-ST-P14-REV3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
