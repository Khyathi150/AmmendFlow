import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeftRight } from 'lucide-react';

interface Hotspot {
  id: string;
  x: number; // percentage
  y: number; // percentage
  label: string;
  title: string;
  spec: string;
  commercialImpact: string;
  engineerNote: string;
}

export const InteractiveBlueprintCompare: React.FC = () => {
  const [sliderPos, setSliderPos] = useState<number>(50); // 0 to 100%
  const [activeHotspot, setActiveHotspot] = useState<string>('pile');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const hotspots: Hotspot[] = [
    {
      id: 'pile',
      x: 38,
      y: 72,
      label: '01. REVISED EMBEDMENT',
      title: 'Bored Cast-In-Situ Piles (+3.0m)',
      spec: 'Concrete Grade: M40 Self-Compacting | Rebar: Fe500D (4.2 MT)',
      commercialImpact: '+₹ 18,69,000 (Direct Piling & Material)',
      engineerNote: 'Hydraulic rotary rig encountered fractured quartzite with high artesian water pressure. Deepened socket to anchor into unweathered granite.',
    },
    {
      id: 'strata',
      x: 68,
      y: 56,
      label: '02. FAULT INTERFACE',
      title: 'Geotechnical Borehole Log BH-04',
      spec: 'Rock Quality Designation (RQD): 22% (Very Poor) | Permeability: High',
      commercialImpact: 'Triggered Clause 14.2 (Unforeseen Ground Conditions)',
      engineerNote: 'Differing site condition certified by Third-Party Geotechnical Consultant. Precludes standard 12.0m bearing capacity.',
    },
    {
      id: 'approval',
      x: 74,
      y: 22,
      label: '03. CLIENT APPROVAL',
      title: 'Prestige Commercial Sign-Off',
      spec: 'Approval Status: Formally Approved | Hash: 8F3C...2A91D',
      commercialImpact: '100% Billable. Variation Order CO-001 Issued',
      engineerNote: 'Joint site measurement logged. Signed off by Client Representative within 48h to prevent piling rig standby charges.',
    },
    {
      id: 'cap',
      x: 32,
      y: 35,
      label: '04. LOAD TRANSFER CAP',
      title: 'Reinforced Concrete Pile Cap',
      spec: 'Dimensions: 5.2m x 5.2m x 1.8m | Baseline Scope Unaltered',
      commercialImpact: '₹ 0.00 Variance (Preserved Contractual Baseline)',
      engineerNote: 'Pile cap geometry remains within original structural tolerance despite pile extension, avoiding pier repositioning.',
    },
  ];

  const currentHotspotData = hotspots.find((h) => h.id === activeHotspot) || hotspots[0];

  // Fluid, boundary-free drag tracking
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      setSliderPos((x / rect.width) * 100);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging]);

  return (
    <section id="compare-section" className="py-24 bg-forest text-parchment relative overflow-hidden border-t border-olive/20">
      {/* Background Architectural Watermark */}
      <div className="absolute inset-0 bg-cad-grid-dark opacity-30 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-olive/30 pb-8">
          <div>
            <div className="font-mono text-xs text-copper tracking-widest uppercase mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-copper" />
              <span>INTERACTIVE DRAWING AUDIT</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-parchment">
              BASELINE VS. REVISED DRAWING
            </h2>
            <p className="text-sm text-limestone mt-1 max-w-xl font-sans">
              Drag the architectural inspection divider or select hotspots to audit exact dimensional and financial deltas between contractual baseline and approved execution.
            </p>
          </div>

          {/* Quick Slider Shortcuts in Industrial Green & Copper */}
          <div className="mt-4 md:mt-0 flex items-center gap-2 font-mono text-xs">
            <button
              onClick={() => setSliderPos(100)}
              className={`px-3 py-1.5 rounded border transition-all duration-300 ${
                sliderPos > 90 ? 'bg-limestone/20 border-limestone text-parchment' : 'border-olive/40 text-limestone hover:text-parchment'
              }`}
            >
              100% BASELINE
            </button>
            <button
              onClick={() => setSliderPos(50)}
              className={`px-3 py-1.5 rounded border transition-all duration-300 ${
                sliderPos >= 40 && sliderPos <= 60 ? 'bg-copper/25 border-copper text-copper font-bold' : 'border-olive/40 text-limestone hover:text-parchment'
              }`}
            >
              50/50 SPLIT
            </button>
            <button
              onClick={() => setSliderPos(0)}
              className={`px-3 py-1.5 rounded border transition-all duration-300 ${
                sliderPos < 10 ? 'bg-copper/25 border-copper text-copper font-bold' : 'border-olive/40 text-limestone hover:text-parchment'
              }`}
            >
              100% REVISED
            </button>
          </div>
        </div>

        {/* Comparison Stage Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Interactive Drawing Canvas (8 Cols) */}
          <div className="lg:col-span-8">
            <div
              ref={containerRef}
              className="relative w-full h-[420px] sm:h-[520px] rounded-xl bg-industrial-dark border border-olive/50 overflow-hidden shadow-2xl select-none cursor-ew-resize touch-none will-change-transform"
              onPointerDown={(e) => {
                setIsDragging(true);
                if (containerRef.current) {
                  const rect = containerRef.current.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                  setSliderPos((x / rect.width) * 100);
                }
              }}
            >
              {/* Layer 1: Revised Variation Drawing (Background Base in Industrial Green) */}
              <div className="absolute inset-0 p-6 flex flex-col justify-between bg-industrial">
                <div className="flex justify-between text-[10px] font-mono text-copper font-bold">
                  <span>● REVISED DRAWING: NSR-DWG-P14-REV-03B</span>
                  <span>STATUS: APPROVED VARIATION (+₹ 38,94,750)</span>
                </div>

                {/* Revised CAD SVG Rendering in Copper & Limestone */}
                <div className="flex-1 flex items-center justify-center">
                  <svg viewBox="0 0 500 400" className="w-full h-full max-h-[360px]">
                    {/* Strata */}
                    <line x1="20" y1="200" x2="480" y2="200" stroke="#68745B" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="20" y1="280" x2="480" y2="280" stroke="#BD6847" strokeWidth="1.5" strokeDasharray="4 4" />
                    <text x="30" y="275" fill="#BD6847" fontSize="8" fontFamily="monospace">FAULT ZONE EL -11.4M</text>

                    {/* Column & Cap */}
                    <rect x="200" y="40" width="100" height="90" fill="none" stroke="#C9B99E" strokeWidth="2" />
                    <rect x="150" y="130" width="200" height="40" fill="none" stroke="#C9B99E" strokeWidth="2" />

                    {/* Piles to -15.0m (Deepened in Oxidised Copper) */}
                    <line x1="180" y1="170" x2="180" y2="350" stroke="#BD6847" strokeWidth="3" />
                    <line x1="230" y1="170" x2="230" y2="350" stroke="#BD6847" strokeWidth="3" />
                    <line x1="270" y1="170" x2="270" y2="350" stroke="#BD6847" strokeWidth="3" />
                    <line x1="320" y1="170" x2="320" y2="350" stroke="#BD6847" strokeWidth="3" />

                    {/* Revision Cloud in Copper */}
                    <rect
                      x="160" y="270" width="180" height="90"
                      fill="#BD6847" fillOpacity="0.12"
                      stroke="#BD6847" strokeWidth="1.5" strokeDasharray="4 2"
                      rx="4"
                    />
                    <text x="170" y="370" fill="#BD6847" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      SOCKET EXTENSION: -15.0M (+3.0M)
                    </text>

                    {/* Client Approval Stamp */}
                    <rect x="340" y="50" width="130" height="50" rx="3" fill="#151D19" stroke="#C9B99E" strokeWidth="1.5" />
                    <text x="350" y="70" fill="#C9B99E" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      ✓ CLIENT APPROVED
                    </text>
                    <text x="350" y="85" fill="#BD6847" fontSize="7" fontFamily="monospace" fontWeight="bold">
                      HASH: 8F3C...2A91D
                    </text>
                  </svg>
                </div>

                <div className="text-[9px] font-mono text-limestone">
                  REVISION DELTA: +3.0M DEPTH · +36 M³ CONCRETE · +4.2 MT REBAR
                </div>
              </div>

              {/* Layer 2: Baseline Drawing (Clipped via Slider position with smooth CSS transition when not dragging) */}
              <div
                className="absolute inset-0 p-6 flex flex-col justify-between bg-forest border-r border-limestone will-change-[clip-path]"
                style={{
                  clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                  transition: isDragging ? 'none' : 'clip-path 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div className="flex justify-between text-[10px] font-mono text-limestone font-bold">
                  <span>● CONTRACT BASELINE: NSR-DWG-P14-REV-00</span>
                  <span>ORIGINAL CONTRACT SCOPE (-12.0M)</span>
                </div>

                {/* Baseline CAD SVG Rendering in Natural Limestone */}
                <div className="flex-1 flex items-center justify-center">
                  <svg viewBox="0 0 500 400" className="w-full h-full max-h-[360px]">
                    <line x1="20" y1="200" x2="480" y2="200" stroke="#68745B" strokeWidth="1" strokeDasharray="4 4" />
                    <line x1="20" y1="280" x2="480" y2="280" stroke="#68745B" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="30" y="275" fill="#C9B99E" fontSize="8" fontFamily="monospace">BEDROCK HORIZON -12.0M</text>

                    {/* Column & Cap */}
                    <rect x="200" y="40" width="100" height="90" fill="none" stroke="#C9B99E" strokeWidth="2" />
                    <rect x="150" y="130" width="200" height="40" fill="none" stroke="#C9B99E" strokeWidth="2" />

                    {/* Piles to -12.0m Only */}
                    <line x1="180" y1="170" x2="180" y2="280" stroke="#C9B99E" strokeWidth="3" />
                    <line x1="230" y1="170" x2="230" y2="280" stroke="#C9B99E" strokeWidth="3" />
                    <line x1="270" y1="170" x2="270" y2="280" stroke="#C9B99E" strokeWidth="3" />
                    <line x1="320" y1="170" x2="320" y2="280" stroke="#C9B99E" strokeWidth="3" />

                    <text x="170" y="300" fill="#C9B99E" fontSize="9" fontFamily="monospace">
                      BASELINE EMBEDMENT: -12.0M
                    </text>
                  </svg>
                </div>

                <div className="text-[9px] font-mono text-limestone">
                  CONTRACT BOQ VALUE: ₹ 5,00,00,000 [IMMUTABLE BASELINE]
                </div>
              </div>

              {/* Draggable Divider Handle in Limestone & Copper */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-limestone cursor-ew-resize z-30 will-change-[left]"
                style={{
                  left: `${sliderPos}%`,
                  transition: isDragging ? 'none' : 'left 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-forest border-2 border-copper text-parchment flex items-center justify-center shadow-elevated transition-transform hover:scale-110 active:scale-95">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-copper" />
                </div>
              </div>

              {/* Clickable Interactive Hotspot Pins with Pulsing Radar Rings */}
              {hotspots.map((spot) => (
                <button
                  key={spot.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveHotspot(spot.id);
                  }}
                  className="absolute z-40 transform -translate-x-1/2 -translate-y-1/2 group transition-transform duration-300 ease-out"
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    transform: activeHotspot === spot.id ? 'translate(-50%, -50%) scale(1.2)' : 'translate(-50%, -50%) scale(1)',
                  }}
                  data-blueprint-hotspot="true"
                >
                  <div className="relative flex items-center justify-center">
                    {/* Subtle Radar Ring */}
                    <span className="absolute -inset-1.5 rounded-full bg-copper/20 animate-ping opacity-60 pointer-events-none" />

                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${
                        activeHotspot === spot.id
                          ? 'border-copper bg-copper text-parchment shadow-copper'
                          : 'border-limestone bg-forest text-parchment group-hover:border-copper'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    </span>
                    <span className="absolute -top-6 whitespace-nowrap font-mono text-[9px] px-2 py-0.5 rounded bg-forest/95 text-parchment border border-olive/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      {spot.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Slider Instructions */}
            <div className="flex items-center justify-between text-xs font-mono text-limestone mt-3 px-1">
              <span>◄ SLIDE TO REVEAL BASELINE</span>
              <span>CLICK RADAR PINS TO INSPECT DETAILS</span>
              <span>SLIDE TO REVEAL REVISION ►</span>
            </div>
          </div>

          {/* Hotspot Detailed Inspector Card in Industrial Green */}
          <div className="lg:col-span-4">
            <div className="rounded-xl bg-industrial border border-olive/50 p-6 shadow-elevated relative">
              <div className="flex items-center justify-between border-b border-olive/30 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-copper animate-pulse" />
                  <span className="font-mono text-xs text-copper tracking-wider font-bold">
                    {currentHotspotData.label}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-limestone">AUDIT LOG</span>
              </div>

              {/* Title & Specifications with Animated Content Switch */}
              <div key={activeHotspot} className="animate-in fade-in duration-300">
                <h3 className="text-xl font-bold text-parchment mb-2">
                  {currentHotspotData.title}
                </h3>

                <div className="p-3 rounded bg-forest border border-olive/40 font-mono text-xs mb-4">
                  <span className="text-limestone block text-[10px] uppercase mb-1">TECHNICAL SPECIFICATION</span>
                  <span className="text-parchment leading-relaxed">{currentHotspotData.spec}</span>
                </div>

                {/* Commercial Cost Impact in Copper Highlight */}
                <div className="p-3 rounded bg-copper/15 border border-copper/50 font-mono text-xs mb-4">
                  <span className="text-copper block text-[10px] uppercase font-bold mb-1">COMMERCIAL IMPACT</span>
                  <span className="text-copper font-bold text-sm">{currentHotspotData.commercialImpact}</span>
                </div>

                {/* Field Engineer & Consultant Note */}
                <div className="space-y-1 text-xs text-limestone leading-relaxed font-sans mb-6">
                  <span className="font-mono text-[10px] text-limestone/70 block uppercase">ENGINEERING JUSTIFICATION</span>
                  <p>{currentHotspotData.engineerNote}</p>
                </div>
              </div>

              {/* Hotspot Switcher Tabs */}
              <div className="border-t border-olive/30 pt-4">
                <span className="font-mono text-[10px] text-limestone uppercase block mb-2">HOTSPOT SELECTOR</span>
                <div className="grid grid-cols-2 gap-2">
                  {hotspots.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => setActiveHotspot(h.id)}
                      className={`text-left px-2.5 py-1.5 rounded font-mono text-[10px] tracking-wider border transition-all duration-200 ${
                        activeHotspot === h.id
                          ? 'border-copper bg-copper/25 text-parchment font-bold scale-[1.02]'
                          : 'border-olive/30 bg-forest/80 text-limestone hover:text-parchment hover:border-olive'
                      }`}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
