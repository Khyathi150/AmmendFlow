import React, { useEffect, useState, useRef } from 'react';
import { ArrowDown, AlertTriangle, ChevronRight } from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import { Link } from 'react-router-dom';

export const HeroCinematic: React.FC = () => {
  const [animationStep, setAnimationStep] = useState<number>(0);
  const [variationActive, setVariationActive] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Respect reduced motion: instantly complete
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setAnimationStep(5);
      setVariationActive(true);
      return;
    }

    // 5-second cinematic progression with refined, fluid rhythm
    const t1 = setTimeout(() => setAnimationStep(1), 250);   // Grid & Datum
    const t2 = setTimeout(() => setAnimationStep(2), 1000);  // Blueprint vector drawing
    const t3 = setTimeout(() => setAnimationStep(3), 2200);  // Image-mask revelation
    const t4 = setTimeout(() => setAnimationStep(4), 3100);  // Kinetic typography reveal
    const t5 = setTimeout(() => {
      setAnimationStep(5);
      setVariationActive(true);
    }, 4200); // Variation marker & cost ticker

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-screen bg-forest text-parchment overflow-hidden flex flex-col justify-between pt-24 pb-12 select-none"
    >
      {/* 1. Dark Architectural Photographic Base with Cinematic Industrial Colour Grade */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?q=80&w=2070&auto=format&fit=crop"
          alt="Architectural Concrete Structure"
          className={`w-full h-full object-cover object-center filter grayscale contrast-130 brightness-75 transition-all duration-1000 ease-out will-change-transform ${
            animationStep >= 3 ? 'opacity-30 scale-100' : 'opacity-15 scale-105'
          }`}
        />
        {/* Rich Industrial Vignettes & Copper Highlights */}
        <div className="absolute inset-0 bg-gradient-to-t from-forest via-forest/80 to-forest/95" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest via-industrial/40 to-forest" />
      </div>

      {/* 2. Fine Architectural CAD Grid & Datum Lines in Weathered Olive & Limestone */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-cad-grid-dark opacity-60">
        {/* Perimeter Datum Crosshairs */}
        <div className="absolute top-8 left-8 text-limestone/50 font-mono text-[9px] tracking-widest flex items-center gap-1.5">
          <span className="text-copper font-bold">+</span>
          <span>DATUM 00 [12°58'23"N]</span>
        </div>
        <div className="absolute top-8 right-8 text-limestone/50 font-mono text-[9px] tracking-widest flex items-center gap-1.5">
          <span>SPEC: ASTM-A615 / DIN-488</span>
          <span className="text-copper font-bold">+</span>
        </div>
        <div className="absolute bottom-8 left-8 text-limestone/50 font-mono text-[9px] tracking-widest flex items-center gap-1.5">
          <span className="text-copper font-bold">+</span>
          <span>REV: 03-B [FIELD VARIATION]</span>
        </div>
        <div className="absolute bottom-8 right-8 text-limestone/50 font-mono text-[9px] tracking-widest flex items-center gap-1.5">
          <span>DWG: AF-CIVIL-P14</span>
          <span className="text-copper font-bold">+</span>
        </div>

        {/* Dynamic Sweeping Grid Line in Olive/Copper with Smooth Easing */}
        <div
          className={`absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-olive/50 to-transparent transition-all duration-1000 ease-out ${
            animationStep >= 1 ? 'top-1/2 opacity-100' : 'top-0 opacity-0'
          }`}
        />
        <div
          className={`absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-olive/40 to-transparent transition-all duration-1000 ease-out ${
            animationStep >= 1 ? 'left-1/2 opacity-100' : 'left-0 opacity-0'
          }`}
        />
      </div>

      {/* 3. SVG Blueprint Self-Construction (Pier P-14 & Foundation in Limestone & Copper) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-end pr-4 lg:pr-24 overflow-hidden">
        <svg
          viewBox="0 0 600 700"
          className="w-[340px] sm:w-[480px] lg:w-[620px] h-auto opacity-85 drop-shadow-[0_0_20px_rgba(189,104,71,0.2)]"
        >
          <defs>
            <linearGradient id="copperCloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#BD6847" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8E4B33" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Geological Strata Boundaries in Weathered Olive */}
          <g className={`transition-opacity duration-1000 ease-out ${animationStep >= 1 ? 'opacity-85' : 'opacity-0'}`}>
            <line x1="50" y1="340" x2="550" y2="340" stroke="#68745B" strokeWidth="1" strokeDasharray="4 4" />
            <text x="60" y="335" fill="#C9B99E" fontSize="9" fontFamily="monospace">STRATUM 01: COMPACT SILTY CLAY</text>
            
            <line x1="50" y1="460" x2="550" y2="460" stroke="#68745B" strokeWidth="1" strokeDasharray="4 4" />
            <text x="60" y="455" fill="#C9B99E" fontSize="9" fontFamily="monospace">STRATUM 02: WEATHERED ROCK INTERFACE</text>

            {/* Fractured Granite Rock Zone in Oxidised Copper */}
            <path
              d="M 50 540 Q 200 520, 320 545 T 550 535"
              stroke={variationActive ? '#BD6847' : '#68745B'}
              strokeWidth={variationActive ? '2.5' : '1'}
              strokeDasharray={variationActive ? 'none' : '6 3'}
              className="transition-colors duration-500"
            />
            <text x="60" y="555" fill={variationActive ? '#BD6847' : '#C9B99E'} fontSize="9" fontFamily="monospace" fontWeight={variationActive ? 'bold' : 'normal'}>
              {variationActive ? '⚠ UNFORESEEN FRACTURED ROCK FAULT AT -11.40M' : 'STRATUM 03: BEDROCK HORIZON'}
            </text>
          </g>

          {/* Pier Column & Pile Cap Outline in Natural Limestone with Fluid Stroke Drawing */}
          <g>
            {/* Pier Head Cantilever */}
            <path
              d="M 180 80 L 420 80 L 380 160 L 220 160 Z"
              fill="none"
              stroke="#C9B99E"
              strokeWidth="1.8"
              strokeDasharray="600"
              strokeDashoffset={animationStep >= 2 ? 0 : 600}
              style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            {/* Pier Shaft */}
            <line
              x1="240" y1="160" x2="240" y2="340"
              stroke="#C9B99E"
              strokeWidth="2"
              strokeDasharray="200"
              strokeDashoffset={animationStep >= 2 ? 0 : 200}
              style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' }}
            />
            <line
              x1="360" y1="160" x2="360" y2="340"
              stroke="#C9B99E"
              strokeWidth="2"
              strokeDasharray="200"
              strokeDashoffset={animationStep >= 2 ? 0 : 200}
              style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' }}
            />

            {/* Pile Cap */}
            <rect
              x="170" y="340" width="260" height="70"
              fill="none"
              stroke="#C9B99E"
              strokeWidth="2"
              strokeDasharray="700"
              strokeDashoffset={animationStep >= 2 ? 0 : 700}
              style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s' }}
            />

            {/* Bored Foundation Piles (Baseline: to Y=540) */}
            <line
              x1="210" y1="410" x2="210" y2="540"
              stroke="#C9B99E"
              strokeWidth="2.5"
              strokeDasharray="200"
              strokeDashoffset={animationStep >= 2 ? 0 : 200}
              style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.7s' }}
            />
            <line
              x1="270" y1="410" x2="270" y2="540"
              stroke="#C9B99E"
              strokeWidth="2.5"
              strokeDasharray="200"
              strokeDashoffset={animationStep >= 2 ? 0 : 200}
              style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.7s' }}
            />
            <line
              x1="330" y1="410" x2="330" y2="540"
              stroke="#C9B99E"
              strokeWidth="2.5"
              strokeDasharray="200"
              strokeDashoffset={animationStep >= 2 ? 0 : 200}
              style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.7s' }}
            />
            <line
              x1="390" y1="410" x2="390" y2="540"
              stroke="#C9B99E"
              strokeWidth="2.5"
              strokeDasharray="200"
              strokeDashoffset={animationStep >= 2 ? 0 : 200}
              style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.16, 1, 0.3, 1) 0.7s' }}
            />

            {/* Pile Base Line Baseline */}
            <line x1="190" y1="540" x2="410" y2="540" stroke="#C9B99E" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="420" y="543" fill="#C9B99E" fontSize="8" fontFamily="monospace">BASELINE EMBEDMENT: -12.00M</text>

            {/* VARIATION ACTIVE: Smooth Stroke Extension into Hard Granite (+3.0m in Oxidised Copper) */}
            <g
              className="transition-all duration-700 ease-out"
              style={{
                opacity: variationActive ? 1 : 0,
                transform: variationActive ? 'translateY(0)' : 'translateY(-6px)',
              }}
            >
              {/* Extended Pile Shanks */}
              <line x1="210" y1="540" x2="210" y2="620" stroke="#BD6847" strokeWidth="3" strokeDasharray="4 2" />
              <line x1="270" y1="540" x2="270" y2="620" stroke="#BD6847" strokeWidth="3" strokeDasharray="4 2" />
              <line x1="330" y1="540" x2="330" y2="620" stroke="#BD6847" strokeWidth="3" strokeDasharray="4 2" />
              <line x1="390" y1="540" x2="390" y2="620" stroke="#BD6847" strokeWidth="3" strokeDasharray="4 2" />

              {/* Revised Bottom Embedment */}
              <line x1="190" y1="620" x2="410" y2="620" stroke="#BD6847" strokeWidth="2" />
              <text x="420" y="624" fill="#BD6847" fontSize="9" fontFamily="monospace" fontWeight="bold">
                REVISED EMBEDMENT: -15.00M (+3.0M)
              </text>

              {/* Oxidised Copper Revision Cloud with Soft Scale */}
              <path
                d="M 180 520 C 180 500, 220 500, 230 515 C 245 495, 290 495, 305 515 C 320 495, 370 495, 385 515 C 410 500, 435 520, 425 545 C 445 565, 435 605, 420 625 C 435 645, 395 655, 380 640 C 365 655, 315 655, 300 640 C 285 655, 240 655, 225 640 C 205 655, 175 640, 185 615 C 165 595, 170 550, 180 520 Z"
                fill="url(#copperCloudGrad)"
                stroke="#BD6847"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />

              {/* Delta Dimension Indicator */}
              <line x1="160" y1="540" x2="160" y2="620" stroke="#BD6847" strokeWidth="1.5" />
              <polygon points="160,540 157,548 163,548" fill="#BD6847" />
              <polygon points="160,620 157,612 163,612" fill="#BD6847" />
              <text x="110" y="585" fill="#BD6847" fontSize="10" fontFamily="monospace" fontWeight="bold">
                Δ +3.00M
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* 4. Main Editorial Content with Staggered Kinetic Typography */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          {/* Technical Eyebrow Badge */}
          <div
            className="transition-all duration-700 ease-out will-change-transform"
            style={{
              opacity: animationStep >= 3 ? 1 : 0,
              transform: animationStep >= 3 ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded bg-industrial border border-olive/50 backdrop-blur-md mb-6 shadow-subtle">
              <span className="w-2 h-2 rounded-full bg-copper animate-ping" />
              <span className="w-2 h-2 rounded-full bg-copper -ml-4" />
              <span className="font-mono text-[11px] text-parchment tracking-widest uppercase">
                COMMERCIAL RISK & VARIATION GOVERNANCE
              </span>
              <span className="text-olive font-mono">|</span>
              <span className="font-mono text-[10px] text-copper font-semibold">SYS-4.0</span>
            </div>
          </div>

          {/* Kinetic Headline Reveal in Parchment & Limestone with Smooth Cubic-Bezier Curves */}
          <div className="overflow-hidden mb-2">
            <h1
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-parchment leading-[1.08] will-change-transform transition-all duration-1000"
              style={{
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                opacity: animationStep >= 4 ? 1 : 0,
                transform: animationStep >= 4 ? 'translateY(0)' : 'translateY(48px)',
              }}
            >
              EVERY CHANGE <br />
              <span className="text-limestone">ACCOUNTED FOR.</span>
            </h1>
          </div>

          <div className="overflow-hidden mb-6">
            <h2
              className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-parchment-light leading-[1.1] will-change-transform transition-all duration-1000"
              style={{
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: '150ms',
                opacity: animationStep >= 4 ? 1 : 0,
                transform: animationStep >= 4 ? 'translateY(0)' : 'translateY(48px)',
              }}
            >
              EVERY COST PROTECTED.
            </h2>
          </div>

          {/* Editorial Subtext */}
          <p
            className="text-base sm:text-lg text-limestone max-w-2xl font-normal leading-relaxed mb-8 will-change-transform transition-all duration-800"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '300ms',
              opacity: animationStep >= 4 ? 1 : 0,
              transform: animationStep >= 4 ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            The construction change management platform that links site instructions, 
            revised CAD drawings, integer-paise unit rates, and client approvals. 
            Eliminating unapproved work leakage across multi-crore infrastructure contracts.
          </p>

          {/* 5. Live Activated Variation Alert Card with Tactile Spring Entrance */}
          <div
            className="transition-all duration-700 ease-out will-change-transform mb-8"
            style={{
              opacity: variationActive ? 1 : 0,
              transform: variationActive ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.97)',
              pointerEvents: variationActive ? 'auto' : 'none',
            }}
          >
            <div className="p-4 sm:p-5 rounded-lg bg-industrial/95 border border-copper/60 backdrop-blur-md shadow-elevated max-w-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-copper/20 border border-copper flex items-center justify-center text-copper flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-parchment tracking-wider">
                        VARIATION CO-PRJ-NSR-001
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-copper/20 text-copper border border-copper/40 uppercase tracking-widest font-bold">
                        AUDIT ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-limestone mt-0.5 font-sans">
                      Geotechnical rock fault discovered at Pier P-14 requiring +3.0m socket deepening.
                    </p>
                  </div>
                </div>
              </div>

              {/* Minor-Unit Exact Cost Impact Ledger */}
              <div className="mt-3 pt-3 border-t border-olive/30 grid grid-cols-3 gap-2 text-left font-mono">
                <div>
                  <span className="text-[10px] text-limestone/70 block">DIRECT COST</span>
                  <span className="text-xs font-semibold text-parchment">₹ 34,50,000</span>
                </div>
                <div>
                  <span className="text-[10px] text-limestone/70 block">OVERHEAD & GST</span>
                  <span className="text-xs font-semibold text-parchment">₹ 10,50,000</span>
                </div>
                <div>
                  <span className="text-[10px] text-copper block font-bold">TOTAL EXPOSURE</span>
                  <span className="text-xs font-bold text-copper">+₹ 45,00,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div
            className="flex flex-wrap items-center gap-4 transition-all duration-700 ease-out will-change-transform"
            style={{
              transitionDelay: '450ms',
              opacity: animationStep >= 4 ? 1 : 0,
              transform: animationStep >= 4 ? 'translateY(0)' : 'translateY(16px)',
            }}
          >
            <a href="#blueprint-story">
              <MagneticButton
                variant="copper"
                className="px-6 py-3 text-sm font-semibold tracking-wide shadow-copper"
              >
                <span>Inspect Blueprint Transformation</span>
                <ChevronRight className="w-4 h-4" />
              </MagneticButton>
            </a>

            <Link to="/login">
              <MagneticButton
                variant="outline"
                className="px-5 py-3 text-sm font-mono tracking-wider text-parchment border-olive/50 hover:border-limestone bg-forest/80"
              >
                <span>Live Tenant Demo (Northstar Infra)</span>
              </MagneticButton>
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Bottom Technical Status Bar & Smooth Scroll Prompter */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between text-xs font-mono text-limestone/60 border-t border-olive/20 pt-4">
        <div className="hidden sm:flex items-center gap-4">
          <span>COORDINATES: [00:00:00:Z]</span>
          <span>•</span>
          <span>MINOR-UNITS: PAISE PRECISION (0 FLOAT ERROR)</span>
        </div>

        {/* Scroll Indicator */}
        <a
          href="#blueprint-story"
          className="flex items-center gap-2 hover:text-parchment transition-colors group cursor-pointer mx-auto sm:mx-0"
          data-cursor-target="true"
        >
          <span className="text-[10px] tracking-widest uppercase">Scroll for Architectural Transformation</span>
          <div className="w-6 h-6 rounded-full border border-olive/40 flex items-center justify-center group-hover:border-copper group-hover:text-copper transition-colors">
            <ArrowDown className="w-3 h-3 animate-bounce" />
          </div>
        </a>

        <div className="hidden lg:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-copper" />
          <span>RECONCILED TO ISO-9001 AUDIT SPEC</span>
        </div>
      </div>
    </div>
  );
};
