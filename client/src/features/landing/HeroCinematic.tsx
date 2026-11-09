import React, { useEffect, useState, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ArrowDown, AlertTriangle, CheckCircle2, ChevronRight, Layers, FileText } from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import { Link } from 'react-router-dom';

export const HeroCinematic: React.FC = () => {
  const [animationStep, setAnimationStep] = useState<number>(0);
  const [variationActive, setVariationActive] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 5-second cinematic progression
    const t1 = setTimeout(() => setAnimationStep(1), 300);   // Grid & Datum
    const t2 = setTimeout(() => setAnimationStep(2), 1200);  // Blueprint vector drawing
    const t3 = setTimeout(() => setAnimationStep(3), 2400);  // Image-mask revelation
    const t4 = setTimeout(() => setAnimationStep(4), 3300);  // Kinetic typography reveal
    const t5 = setTimeout(() => {
      setAnimationStep(5);
      setVariationActive(true);
    }, 4400); // Variation marker & cost ticker

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
      className="relative w-full min-h-screen bg-charcoal-950 text-white overflow-hidden flex flex-col justify-between pt-24 pb-12 select-none"
    >
      {/* 1. Dark Architectural Photographic Base */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?q=80&w=2070&auto=format&fit=crop"
          alt="Architectural Concrete Structure"
          className={`w-full h-full object-cover object-center filter grayscale contrast-125 transition-all duration-1000 ${
            animationStep >= 3 ? 'opacity-35 scale-100' : 'opacity-15 scale-105'
          }`}
        />
        {/* Cinematic Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/70 to-charcoal-950/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950 via-transparent to-charcoal-950" />
      </div>

      {/* 2. Fine Architectural CAD Grid & Datum Lines */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-cad-grid-dark opacity-60">
        {/* Perimeter Datum Crosshairs */}
        <div className="absolute top-8 left-8 text-white/30 font-mono text-[9px] tracking-widest flex items-center gap-1.5">
          <span className="text-blueprint-cyan">+</span>
          <span>DATUM 00 [12°58'23"N]</span>
        </div>
        <div className="absolute top-8 right-8 text-white/30 font-mono text-[9px] tracking-widest flex items-center gap-1.5">
          <span>SPEC: ASTM-A615 / DIN-488</span>
          <span className="text-blueprint-cyan">+</span>
        </div>
        <div className="absolute bottom-8 left-8 text-white/30 font-mono text-[9px] tracking-widest flex items-center gap-1.5">
          <span className="text-safety">+</span>
          <span>REV: 03-B [MODIFIED SCOPE]</span>
        </div>
        <div className="absolute bottom-8 right-8 text-white/30 font-mono text-[9px] tracking-widest flex items-center gap-1.5">
          <span>DWG: AF-CIVIL-P14</span>
          <span className="text-blueprint-cyan">+</span>
        </div>

        {/* Dynamic Sweeping Grid Line */}
        <div
          className={`absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blueprint-cyan/40 to-transparent transition-all duration-1000 ${
            animationStep >= 1 ? 'top-1/2 opacity-100' : 'top-0 opacity-0'
          }`}
        />
        <div
          className={`absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blueprint-cyan/30 to-transparent transition-all duration-1000 ${
            animationStep >= 1 ? 'left-1/2 opacity-100' : 'left-0 opacity-0'
          }`}
        />
      </div>

      {/* 3. SVG Blueprint Self-Construction (Pier P-14 & Foundation) */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-end pr-4 lg:pr-24 overflow-hidden">
        <svg
          viewBox="0 0 600 700"
          className="w-[340px] sm:w-[480px] lg:w-[620px] h-auto opacity-75 drop-shadow-[0_0_15px_rgba(56,189,248,0.15)]"
        >
          <defs>
            <pattern id="soilHatch" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="10" stroke="#38BDF8" strokeWidth="0.5" strokeOpacity="0.2" />
            </pattern>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E05A34" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#D94E28" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Geological Strata Boundaries */}
          <g className={`transition-opacity duration-1000 ${animationStep >= 1 ? 'opacity-80' : 'opacity-0'}`}>
            <line x1="50" y1="340" x2="550" y2="340" stroke="#8A99A4" strokeWidth="1" strokeDasharray="4 4" />
            <text x="60" y="335" fill="#8A99A4" fontSize="9" fontFamily="monospace">STRATUM 01: COMPACT SILTY CLAY</text>
            
            <line x1="50" y1="460" x2="550" y2="460" stroke="#8A99A4" strokeWidth="1" strokeDasharray="4 4" />
            <text x="60" y="455" fill="#8A99A4" fontSize="9" fontFamily="monospace">STRATUM 02: WEATHERED ROCK INTERFACE</text>

            {/* Fractured Granite Rock Zone */}
            <path
              d="M 50 540 Q 200 520, 320 545 T 550 535"
              stroke={variationActive ? '#E05A34' : '#8A99A4'}
              strokeWidth={variationActive ? '2' : '1'}
              strokeDasharray={variationActive ? 'none' : '6 3'}
              className="transition-colors duration-500"
            />
            <text x="60" y="555" fill={variationActive ? '#E05A34' : '#8A99A4'} fontSize="9" fontFamily="monospace" fontWeight={variationActive ? 'bold' : 'normal'}>
              {variationActive ? '⚠ UNFORESEEN FRACTURED ROCK FAULT AT -11.40M' : 'STRATUM 03: BEDROCK HORIZON'}
            </text>
          </g>

          {/* Pier Column & Pile Cap Outline */}
          <g className="text-blueprint-cyan">
            {/* Pier Head Cantilever */}
            <path
              d="M 180 80 L 420 80 L 380 160 L 220 160 Z"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.5"
              strokeDasharray={animationStep >= 2 ? '0' : '600'}
              strokeDashoffset={animationStep >= 2 ? '0' : '600'}
              style={{ transition: 'stroke-dashoffset 1.8s ease-in-out' }}
            />
            {/* Pier Shaft */}
            <line
              x1="240" y1="160" x2="240" y2="340"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeDasharray={animationStep >= 2 ? '0' : '200'}
              strokeDashoffset={animationStep >= 2 ? '0' : '200'}
              style={{ transition: 'stroke-dashoffset 1.4s ease-in-out 0.3s' }}
            />
            <line
              x1="360" y1="160" x2="360" y2="340"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeDasharray={animationStep >= 2 ? '0' : '200'}
              strokeDashoffset={animationStep >= 2 ? '0' : '200'}
              style={{ transition: 'stroke-dashoffset 1.4s ease-in-out 0.3s' }}
            />

            {/* Pile Cap */}
            <rect
              x="170" y="340" width="260" height="70"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2"
              strokeDasharray={animationStep >= 2 ? '0' : '700'}
              strokeDashoffset={animationStep >= 2 ? '0' : '700'}
              style={{ transition: 'stroke-dashoffset 1.6s ease-in-out 0.5s' }}
            />

            {/* Bored Foundation Piles (Baseline: to Y=540) */}
            <line x1="210" y1="410" x2="210" y2="540" stroke="#38BDF8" strokeWidth="2.5" />
            <line x1="270" y1="410" x2="270" y2="540" stroke="#38BDF8" strokeWidth="2.5" />
            <line x1="330" y1="410" x2="330" y2="540" stroke="#38BDF8" strokeWidth="2.5" />
            <line x1="390" y1="410" x2="390" y2="540" stroke="#38BDF8" strokeWidth="2.5" />

            {/* Pile Base Line Baseline */}
            <line x1="190" y1="540" x2="410" y2="540" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="420" y="543" fill="#38BDF8" fontSize="8" fontFamily="monospace">BASE EMBEDMENT: -12.00M</text>

            {/* VARIATION ACTIVE: Animated Extension into Hard Granite (+3.0m deeper) */}
            {variationActive && (
              <g className="animate-in fade-in duration-700">
                {/* Extended Pile Shanks */}
                <line x1="210" y1="540" x2="210" y2="620" stroke="#E05A34" strokeWidth="3" strokeDasharray="4 2" />
                <line x1="270" y1="540" x2="270" y2="620" stroke="#E05A34" strokeWidth="3" strokeDasharray="4 2" />
                <line x1="330" y1="540" x2="330" y2="620" stroke="#E05A34" strokeWidth="3" strokeDasharray="4 2" />
                <line x1="390" y1="540" x2="390" y2="620" stroke="#E05A34" strokeWidth="3" strokeDasharray="4 2" />

                {/* Revised Bottom Embedment */}
                <line x1="190" y1="620" x2="410" y2="620" stroke="#E05A34" strokeWidth="2" />
                <text x="420" y="624" fill="#E05A34" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  REVISED EMBEDMENT: -15.00M (+3.0M)
                </text>

                {/* Safety Orange Revision Cloud */}
                <path
                  d="M 180 520 C 180 500, 220 500, 230 515 C 245 495, 290 495, 305 515 C 320 495, 370 495, 385 515 C 410 500, 435 520, 425 545 C 445 565, 435 605, 420 625 C 435 645, 395 655, 380 640 C 365 655, 315 655, 300 640 C 285 655, 240 655, 225 640 C 205 655, 175 640, 185 615 C 165 595, 170 550, 180 520 Z"
                  fill="url(#cloudGrad)"
                  stroke="#E05A34"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />

                {/* Delta Dimension Indicator */}
                <line x1="160" y1="540" x2="160" y2="620" stroke="#E05A34" strokeWidth="1.5" />
                <polygon points="160,540 157,548 163,548" fill="#E05A34" />
                <polygon points="160,620 157,612 163,612" fill="#E05A34" />
                <text x="110" y="585" fill="#E05A34" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  Δ +3.00M
                </text>
              </g>
            )}
          </g>
        </svg>
      </div>

      {/* 4. Main Editorial Content & Kinetic Typography */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center">
        <div className="max-w-3xl">
          {/* Technical Eyebrow & Status Badge */}
          <div
            className={`transition-all duration-700 ${
              animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <div className="inline-flex items-center gap-2.5 px-3 py-1 rounded bg-charcoal-900 border border-white/15 backdrop-blur-md mb-6">
              <span className="w-2 h-2 rounded-full bg-safety animate-ping" />
              <span className="w-2 h-2 rounded-full bg-safety -ml-4" />
              <span className="font-mono text-[11px] text-white/90 tracking-widest uppercase">
                COMMERCIAL RISK & VARIATION GOVERNANCE
              </span>
              <span className="text-white/30 font-mono">|</span>
              <span className="font-mono text-[10px] text-blueprint-cyan">SYS-4.0</span>
            </div>
          </div>

          {/* Kinetic Headline Reveal (Masked Inset Lines) */}
          <div className="overflow-hidden mb-2">
            <h1
              className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] transition-all duration-1000 ${
                animationStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
            >
              EVERY CHANGE <br />
              <span className="text-white/80">ACCOUNTED FOR.</span>
            </h1>
          </div>

          <div className="overflow-hidden mb-6">
            <h2
              className={`text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-secondary-light leading-[1.1] transition-all duration-1000 delay-200 ${
                animationStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
              }`}
            >
              EVERY COST PROTECTED.
            </h2>
          </div>

          {/* Editorial Subtext */}
          <p
            className={`text-base sm:text-lg text-white/70 max-w-2xl font-normal leading-relaxed mb-8 transition-all duration-700 delay-300 ${
              animationStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            The construction change management platform that links site instructions, 
            revised CAD drawings, integer-paise unit rates, and client approvals. 
            Eliminating unapproved work leakage across multi-crore infrastructure contracts.
          </p>

          {/* 5. Live Activated Variation Alert Card */}
          <div
            className={`transition-all duration-700 delay-500 mb-8 ${
              variationActive
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
            }`}
          >
            <div className="p-4 sm:p-5 rounded-lg bg-charcoal-900/95 border border-safety/40 backdrop-blur-md shadow-2xl max-w-xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-safety/20 border border-safety/40 flex items-center justify-center text-safety flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white tracking-wider">
                        VARIATION CO-PRJ-NSR-001
                      </span>
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-safety/20 text-safety border border-safety/30 uppercase tracking-widest">
                        AUDIT ACTIVE
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mt-0.5 font-sans">
                      Geotechnical rock fault discovered at Pier P-14 requiring +3.0m socket deepening.
                    </p>
                  </div>
                </div>
              </div>

              {/* Minor-Unit Exact Cost Impact Ledger */}
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-left font-mono">
                <div>
                  <span className="text-[10px] text-white/40 block">DIRECT COST</span>
                  <span className="text-xs font-semibold text-white">₹ 34,50,000</span>
                </div>
                <div>
                  <span className="text-[10px] text-white/40 block">OVERHEAD & GST</span>
                  <span className="text-xs font-semibold text-white">₹ 10,50,000</span>
                </div>
                <div>
                  <span className="text-[10px] text-safety block">TOTAL EXPOSURE</span>
                  <span className="text-xs font-bold text-safety">+₹ 45,00,000</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div
            className={`flex flex-wrap items-center gap-4 transition-all duration-700 delay-700 ${
              animationStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            <a href="#blueprint-story">
              <MagneticButton
                variant="safety"
                className="px-6 py-3 text-sm font-semibold tracking-wide shadow-lg"
              >
                <span>Inspect Blueprint Transformation</span>
                <ChevronRight className="w-4 h-4" />
              </MagneticButton>
            </a>

            <Link to="/login">
              <MagneticButton
                variant="outline"
                className="px-5 py-3 text-sm font-mono tracking-wider text-white border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10"
              >
                <span>Live Tenant Demo (Northstar Infra)</span>
              </MagneticButton>
            </Link>
          </div>
        </div>
      </div>

      {/* 6. Bottom Technical Status Bar & Smooth Scroll Prompter */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex items-center justify-between text-xs font-mono text-white/40 border-t border-white/10 pt-4">
        <div className="hidden sm:flex items-center gap-4">
          <span>COORDINATES: [00:00:00:Z]</span>
          <span>•</span>
          <span>MINOR-UNITS: PAISE PRECISION (0 FLOAT ERROR)</span>
        </div>

        {/* Scroll Indicator */}
        <a
          href="#blueprint-story"
          className="flex items-center gap-2 hover:text-white transition-colors group cursor-pointer mx-auto sm:mx-0"
          data-cursor-target="true"
        >
          <span className="text-[10px] tracking-widest uppercase">Scroll for Architectural Transformation</span>
          <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center group-hover:border-safety group-hover:text-safety transition-colors">
            <ArrowDown className="w-3 h-3 animate-bounce" />
          </div>
        </a>

        <div className="hidden lg:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>RECONCILED TO ISO-9001 AUDIT SPEC</span>
        </div>
      </div>
    </div>
  );
};

