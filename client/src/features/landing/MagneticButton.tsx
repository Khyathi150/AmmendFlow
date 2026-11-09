import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'copper' | 'industrial' | 'limestone' | 'outline' | 'dark' | 'safety' | 'primary';
  strength?: number;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'copper',
  strength = 24,
  type = 'button',
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !buttonRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const { clientX, clientY } = e;
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();

    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);

    setPosition({
      x: (middleX / width) * strength,
      y: (middleY / height) * strength,
    });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  const variantStyles = {
    copper:
      'bg-copper text-parchment hover:bg-copper-hover border border-copper/80 shadow-copper font-semibold',
    safety:
      'bg-copper text-parchment hover:bg-copper-hover border border-copper/80 shadow-copper font-semibold',
    industrial:
      'bg-industrial text-parchment hover:bg-industrial-light border border-olive/40 shadow-subtle',
    primary:
      'bg-industrial text-parchment hover:bg-industrial-light border border-olive/40 shadow-subtle',
    limestone:
      'bg-limestone text-forest hover:bg-limestone-light border border-limestone-dark shadow-subtle font-semibold',
    outline:
      'bg-forest/60 text-parchment hover:bg-industrial/80 border border-olive/50 hover:border-limestone/70 backdrop-blur-sm',
    dark:
      'bg-forest text-parchment hover:bg-forest-surface border border-olive/40 hover:border-copper/60',
  };

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.2 }}
      whileTap={{ scale: 0.98 }}
      className={`relative inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none overflow-hidden rounded-md ${variantStyles[variant] || variantStyles.copper} ${className}`}
      data-cursor-target="true"
    >
      <motion.span
        animate={{ x: position.x * 0.4, y: position.y * 0.4 }}
        transition={{ type: 'spring', stiffness: 220, damping: 18, mass: 0.2 }}
        className="relative z-10 flex items-center gap-2"
      >
        {children}
      </motion.span>
    </motion.button>
  );
};
