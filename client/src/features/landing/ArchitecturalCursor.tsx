import React, { useEffect, useState, useRef } from 'react';

export const ArchitecturalCursor: React.FC = () => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: -100, y: -100 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const currentPos = useRef({ x: -100, y: -100 });
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    // Only activate for non-touch devices
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);

      // Check if target is clickable or interactive
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = !!target.closest('button, a, input, select, [role="button"], [data-cursor-target]');
        setIsPointer(interactive);
        const blueprintHotspot = !!target.closest('[data-blueprint-hotspot]');
        setIsHovered(blueprintHotspot);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      setIsVisible(true);
    };

    // Smooth animation loop
    const updateLoop = () => {
      const ease = 0.22;
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * ease;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * ease;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
      }

      setCoords({
        x: Math.round(currentPos.current.x),
        y: Math.round(currentPos.current.y),
      });

      rafId.current = requestAnimationFrame(updateLoop);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    rafId.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform -translate-x-1/2 -translate-y-1/2"
      style={{
        transition: 'opacity 0.2s ease',
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Precision Crosshairs */}
      <div className="relative flex items-center justify-center">
        {/* Horizontal axis */}
        <div
          className={`absolute h-[1px] -left-5 -right-5 transition-colors duration-200 ${
            isHovered ? 'bg-safety' : isPointer ? 'bg-blueprint-cyan' : 'bg-white/40'
          }`}
        />
        {/* Vertical axis */}
        <div
          className={`absolute w-[1px] -top-5 -bottom-5 transition-colors duration-200 ${
            isHovered ? 'bg-safety' : isPointer ? 'bg-blueprint-cyan' : 'bg-white/40'
          }`}
        />

        {/* Center reticle */}
        <div
          className={`w-5 h-5 rounded-full border transition-all duration-200 flex items-center justify-center ${
            isHovered
              ? 'scale-150 border-safety bg-safety/10'
              : isPointer
              ? 'scale-125 border-blueprint-cyan bg-blueprint-cyan/10'
              : 'scale-100 border-white/60 bg-transparent'
          }`}
        >
          <div
            className={`w-1 h-1 rounded-full transition-colors duration-200 ${
              isHovered ? 'bg-safety' : isPointer ? 'bg-blueprint-cyan' : 'bg-white'
            }`}
          />
        </div>

        {/* Dynamic CAD Coordinate Readout */}
        <div className="absolute left-4 top-4 select-none pointer-events-none whitespace-nowrap">
          <div className="font-mono text-[9px] tracking-widest px-1.5 py-0.5 rounded bg-charcoal-900/90 text-white/70 border border-white/10 backdrop-blur-sm shadow-sm">
            <span>X:{coords.x}</span>
            <span className="mx-1 text-white/30">|</span>
            <span>Y:{coords.y}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

