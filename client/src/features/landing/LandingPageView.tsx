import React, { useEffect } from 'react';
import { ArchitecturalCursor } from './ArchitecturalCursor';
import { LandingNav } from './LandingNav';
import { HeroCinematic } from './HeroCinematic';
import { BlueprintStoryScroll } from './BlueprintStoryScroll';
import { InteractiveBlueprintCompare } from './InteractiveBlueprintCompare';
import { LifecyclePipelineFlow } from './LifecyclePipelineFlow';
import { FinancialExposureLiveTeaser } from './FinancialExposureLiveTeaser';
import { LandingFooter } from './LandingFooter';

export const LandingPageView: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-charcoal-950 text-white font-sans selection:bg-safety selection:text-white relative">
      {/* Precision Surveyor Architectural Cursor */}
      <ArchitecturalCursor />

      {/* Architectural Navigation Header */}
      <LandingNav />

      {/* 1. Cinematic Opening Hero (First 5 Seconds Sequence) */}
      <HeroCinematic />

      {/* 2. Pinned Architectural Blueprint Transformation (GSAP ScrollTrigger) */}
      <BlueprintStoryScroll />

      {/* 3. Interactive Blueprint Hotspot & Drawing Compare Slider */}
      <InteractiveBlueprintCompare />

      {/* 4. Connected Lifecycle Pipeline Flow */}
      <LifecyclePipelineFlow />

      {/* 5. Discrete 5-Bucket Financial Exposure Matrix */}
      <FinancialExposureLiveTeaser />

      {/* 6. Technical Drawing Stamp & Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPageView;
