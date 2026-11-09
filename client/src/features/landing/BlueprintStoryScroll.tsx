import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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

  // Stage descriptive titles in Luxury Architectural Palette
  const stages = [
    {
      num: '01',
      title: 'Contractual Baseline Locked',
      eyebrow: 'STAGE 1: SCOPE DISCIPLINE',
      desc: 'Bill of Quantities item Civil-014 defines 12m foundation piers at ₹5.00 Cr. The baseline is mathematically immutable. Direct alterations are prohibited without audited change orders.',
      tag: 'IMMUTABLE BASELINE',
      tagColor: 'text-limestone border-olive/50 bg-forest/80',
    },
    {
      num: '02',
      title: 'Geotechnical Site Anomaly',
      eyebrow: 'STAGE 2: SITE OBSERVATION',
      desc: 'During rotary drilling at Pier P-14, core samples encounter fractured, water-bearing granite fault at -11.40m. Soil bearing capacity drops to 180 kPa. Standard design is technically untenable.',
      tag: 'GEOTECHNICAL ANOMALY',
      tagColor: 'text-copper border-copper/50 bg-copper/15',
    },
    {
      num: '03',
      title: 'Engineered Socket Revision',
      eyebrow: 'STAGE 3: INTEGER-PAISE ESTIMATE',
      desc: 'Pier embedment is extended +3.0m into solid sound granite. AmendFlow’s cost engine computes 36 m³ M40 concrete, 4.2 MT epoxy rebar, and 48 rig hours with exact integer paise precision without floating drift.',
      tag: 'RATE AUDIT: ₹ 38,94,750',
      tagColor: 'text-copper border-copper/50 bg-copper/20',
    },
    {
      num: '04',
      title: 'Client Sign-off & Payment',
      eyebrow: 'STAGE 4: REVENUE PROTECTED',
      desc: 'Commercial justification and marked-up CAD evidence are shared via the Client Approver Portal. Approved within 48 hours. Zero revenue leakage. Tax invoice generated and payment fully reconciled.',
      tag: 'CASH RECONCILED (100%)',
      tagColor: 'text-limestone border-olive/50 bg-forest/80',
    },
  ];

  return (
    <div
      id="blueprint-story"
      ref={containerRef}
      className="relative w-full h-[320vh] bg-industrial text-parchment"
    >
      {/* Sticky Fullscreen Viewing Theatre */}
      <div className="sticky top-0 h-screen w-full flex flex-col lg:flex-row items-center justify-between overflow-hidden px-4 sm:px-8 lg:px-16 py-12">
        {/* Background Subtle Industrial CAD Grid */}
        <div className="absolute inset-0 bg-cad-grid-dark opacity-35 pointer-events-none" />

        {/* Top Progress Meter */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-xs font-mono text-limestone border-b border-olive/30 pb-3 z-30">
          <div className="flex items-center gap-3">
            <span className="text-copper font-bold">SCROLL CHOREOGRAPHY</span>
            <span className="text-olive">•</span>
            <span>SECTION: PIER P-14 VARIATION LIFECYCLE</span>
          </div>

          <div className="flex items-center gap-2">
            <span>SCRUB: {Math.round(scrollProgress * 100)}%</span>
            <div className="w-24 h-1.5 rounded-full bg-forest overflow-hidden border border-olive/40">
              <div
                className="h-full bg-copper transition-all duration-75"
                style={{ width: `${scrollProgress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Left Side: Editorial Storytelling & Stage Narrative in Parchment & Limestone */}
        <div className="w-full lg:w-5/12 z-20 mt-12 lg:mt-0 max-w-xl">
          {/* Active Stage Indicator */}
          <div className="font-mono text-xs text-copper tracking-widest uppercase mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-copper animate-pulse" />
            <span>{stages[activeStage].eyebrow}</span>
          </div>

          {/* Large Editorial Heading in Parchment */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-parchment leading-tight mb-4 transition-all duration-300">
            {stages[activeStage].title}
          </h2>

          {/* Status Badge */}
          <div className="mb-6">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono tracking-wider border font-medium ${stages[activeStage].tagColor}`}
            >
              {stages[activeStage].tag}
            </span>
          </div>

          {/* Stage Narrative Description in Limestone */}
          <p className="text-sm sm:text-base text-limestone leading-relaxed font-sans mb-8">
            {stages[activeStage].desc}
          </p>

          {/* Real-time Dynamic Stage Data Card in Forest Charcoal */}
          <div className="p-4 rounded-lg bg-forest border border-olive/50 backdrop-blur-md shadow-elevated font-mono text-xs">
            {activeStage === 0 && (
              <div className="space-y-2">
                <div className="flex justify-between border-b border-olive/20 pb-1.5">
                  <span className="text-limestone/70">CONTRACT BOQ REF</span>
                  <span className="text-parchment font-bold">CIVIL-014 [PIER P-14]</span>
                </div>
                <div className="flex justify-between border-b border-olive/20 pb-1.5">
                  <span className="text-limestone/70">BASELINE DEPTH</span>
                  <span className="text-parchment">12.00 METERS</span>
                </div>
                <div className="flex justify-between text-copper font-bold">
                  <span>BASELINE ALLOCATION</span>
                  <span>₹ 5,00,00,000</span>
                </div>
              </div>
            )}

            {activeStage === 1 && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <div className="flex justify-between border-b border-olive/20 pb-1.5">
                  <span className="text-copper font-bold">SOIL BOREHOLE ID</span>
                  <span className="text-parchment font-bold">BH-P14-2026</span>
                </div>
                <div className="flex justify-between border-b border-olive/20 pb-1.5">
                  <span className="text-limestone/70">ENCOUNTER DEPTH</span>
                  <span className="text-parchment">EL -11.40M [FAULT ZONE]</span>
                </div>
                <div className="flex justify-between text-copper font-bold">
                  <span>RISK EXPOSURE</span>
                  <span>UNAPPROVED WORK FLAG</span>
                </div>
              </div>
            )}

            {activeStage === 2 && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <div className="flex justify-between border-b border-olive/20 pb-1">
                  <span className="text-limestone/70">M40 CONCRETE (+36 m³)</span>
                  <span className="text-parchment">₹ 15,12,000</span>
                </div>
                <div className="flex justify-between border-b border-olive/20 pb-1">
                  <span className="text-limestone/70">REBAR FE500D (+4.2 MT)</span>
                  <span className="text-parchment">₹ 3,57,000</span>
                </div>
                <div className="flex justify-between border-b border-olive/20 pb-1">
                  <span className="text-limestone/70">RIG TIME & OVERHEADS</span>
                  <span className="text-parchment">₹ 14,94,750</span>
                </div>
                <div className="flex justify-between border-t border-olive/40 pt-1 text-copper font-bold">
                  <span>VARIATION ORDER PROPOSED</span>
                  <span>+₹ 38,94,750</span>
                </div>
              </div>
            )}

            {activeStage === 3 && (
              <div className="space-y-2 animate-in fade-in duration-300">
                <div className="flex justify-between border-b border-olive/20 pb-1.5 text-copper font-bold">
                  <span>CLIENT APPROVAL</span>
                  <span>ACCEPTED (SHA-256 HASH)</span>
                </div>
                <div className="flex justify-between border-b border-olive/20 pb-1.5">
                  <span className="text-limestone/70">TAX INVOICE ISSUED</span>
                  <span className="text-parchment">INV-2026-088</span>
                </div>
                <div className="flex justify-between text-copper font-bold">
                  <span>PAYMENT RECONCILED</span>
                  <span>₹ 38,94,750 (100%)</span>
                </div>
              </div>
            )}
          </div>

          {/* Stepper Dots in Copper & Olive */}
          <div className="flex items-center gap-2 mt-6">
            {stages.map((stg, i) => (
              <div
                key={stg.num}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeStage === i ? 'w-8 bg-copper' : 'w-2 bg-olive/40'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Side: Architectural Blueprint Elevation Stage */}
        <div className="w-full lg:w-6/12 h-[420px] sm:h-[500px] lg:h-[600px] flex items-center justify-center relative z-20">
          <div className="w-full h-full rounded-xl bg-forest border border-olive/50 p-4 sm:p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Blueprint Header */}
            <div className="flex items-center justify-between border-b border-olive/30 pb-2 font-mono text-[10px] text-limestone">
              <div className="flex items-center gap-2">
                <span className="text-copper">●</span>
                <span>ELEVATION VIEW: PIER P-14</span>
              </div>
              <div>SCALE: 1:100 METRIC</div>
            </div>

            {/* Dynamic SVG CAD Blueprint in Limestone & Copper */}
            <div className="relative flex-1 flex items-center justify-center my-2">
              <svg viewBox="0 0 500 500" className="w-full h-full max-h-[460px]">
                {/* Strata Layers */}
                <rect x="20" y="240" width="460" height="90" fill="#28362E" fillOpacity="0.7" />
                <text x="30" y="255" fill="#C9B99E" fontSize="8" fontFamily="monospace">SILTY CLAY LAYER (0.0M TO -6.0M)</text>

                <rect x="20" y="330" width="460" height="80" fill="#1F2A24" fillOpacity="0.8" />
                <text x="30" y="345" fill="#C9B99E" fontSize="8" fontFamily="monospace">WEATHERED SCHIST (-6.0M TO -11.4M)</text>

                {/* Bedrock / Fractured Zone */}
                <rect x="20" y="410" width="460" height="80" fill="#151D19" fillOpacity="0.95" />
                <text x="30" y="425" fill={activeStage >= 1 ? '#BD6847' : '#68745B'} fontSize="8" fontFamily="monospace" fontWeight="bold">
                  {activeStage >= 1 ? '⚠ HARD FRACTURED GRANITE FAULT' : 'HARD SOUND GRANITE BEDROCK'}
                </text>

                {/* Pile Cap in Limestone */}
                <rect x="120" y="160" width="260" height="50" fill="none" stroke="#C9B99E" strokeWidth="2" />
                <text x="130" y="190" fill="#C9B99E" fontSize="9" fontFamily="monospace">REINFORCED PILE CAP</text>

                {/* Pier Column Above Ground */}
                <rect x="190" y="40" width="120" height="120" fill="none" stroke="#C9B99E" strokeWidth="2" />
                <line x1="250" y1="40" x2="250" y2="160" stroke="#C9B99E" strokeWidth="0.5" strokeDasharray="3 3" />
                <text x="200" y="100" fill="#C9B99E" fontSize="9" fontFamily="monospace">Ø 1800 PIER</text>

                {/* Bored Piles (Baseline to Y=350) */}
                <line x1="160" y1="210" x2="160" y2="350" stroke="#C9B99E" strokeWidth="3" />
                <line x1="220" y1="210" x2="220" y2="350" stroke="#C9B99E" strokeWidth="3" />
                <line x1="280" y1="210" x2="280" y2="350" stroke="#C9B99E" strokeWidth="3" />
                <line x1="340" y1="210" x2="340" y2="350" stroke="#C9B99E" strokeWidth="3" />

                {/* Stage 0 Baseline Dimension */}
                <line x1="370" y1="210" x2="370" y2="350" stroke="#C9B99E" strokeWidth="1" strokeDasharray="2 2" />
                <text x="380" y="285" fill="#C9B99E" fontSize="8" fontFamily="monospace">BASELINE: -12.0M</text>

                {/* Stage 1: Geotechnical Fault Marker in Copper */}
                {activeStage >= 1 && (
                  <g className="animate-in fade-in duration-500">
                    <path
                      d="M 60 350 Q 180 335, 270 355 T 440 345"
                      stroke="#BD6847"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                    />
                    <circle cx="270" cy="355" r="4" fill="#BD6847" className="animate-ping" />
                    <circle cx="270" cy="355" r="4" fill="#BD6847" />
                    <text x="280" y="345" fill="#BD6847" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      FAULT DISCOVERED
                    </text>
                  </g>
                )}

                {/* Stage 2 & 3: Extended Socket (+3m down to Y=430 in Oxidised Copper) */}
                {activeStage >= 2 && (
                  <g className="animate-in fade-in duration-500">
                    <line x1="160" y1="350" x2="160" y2="430" stroke="#BD6847" strokeWidth="3.5" />
                    <line x1="220" y1="350" x2="220" y2="430" stroke="#BD6847" strokeWidth="3.5" />
                    <line x1="280" y1="350" x2="280" y2="430" stroke="#BD6847" strokeWidth="3.5" />
                    <line x1="340" y1="350" x2="340" y2="430" stroke="#BD6847" strokeWidth="3.5" />

                    {/* Extended Embedment Base */}
                    <line x1="140" y1="430" x2="360" y2="430" stroke="#BD6847" strokeWidth="2" />
                    <text x="370" y="433" fill="#BD6847" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      REVISED EMBEDMENT: -15.0M (+3.0M)
                    </text>

                    {/* Copper Revision Cloud Box */}
                    <rect
                      x="130" y="335" width="240" height="105"
                      fill="#BD6847" fillOpacity="0.12"
                      stroke="#BD6847" strokeWidth="1.5" strokeDasharray="4 2"
                      rx="4"
                    />
                    <text x="140" y="325" fill="#BD6847" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      REVISION CLOUD: CO-PRJ-001
                    </text>
                  </g>
                )}

                {/* Stage 3: Approval Seal Stamp */}
                {activeStage >= 3 && (
                  <g className="animate-in zoom-in-95 duration-500">
                    <rect x="290" y="50" width="160" height="70" rx="4" fill="#151D19" stroke="#C9B99E" strokeWidth="2" />
                    <text x="305" y="75" fill="#C9B99E" fontSize="11" fontFamily="monospace" fontWeight="bold">
                      ✓ APPROVED FOR BILLING
                    </text>
                    <text x="305" y="92" fill="#E5DCCB" fontSize="8" fontFamily="monospace">
                      CLIENT: PRESTIGE COMMERCIAL
                    </text>
                    <text x="305" y="105" fill="#BD6847" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      HASH: 8F3C2A91D... VERIFIED
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Bottom Title Block */}
            <div className="grid grid-cols-3 gap-2 border-t border-olive/30 pt-2 text-[9px] font-mono text-limestone">
              <div>
                <span>STATUS: </span>
                <span className="text-parchment font-semibold">
                  {activeStage === 0 && 'BASELINE ACTIVE'}
                  {activeStage === 1 && 'SITE FAULT REVIEW'}
                  {activeStage === 2 && 'VARIATION ESTIMATED'}
                  {activeStage === 3 && 'SETTLED & PAID'}
                </span>
              </div>
              <div className="text-center">
                <span>STAGE: </span>
                <span className="text-copper font-bold">{activeStage + 1} OF 4</span>
              </div>
              <div className="text-right">
                <span>DWG NO: </span>
                <span className="text-parchment">NSR-ST-P14-REV3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
