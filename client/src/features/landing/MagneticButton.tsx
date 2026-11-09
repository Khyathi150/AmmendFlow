import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'primary' | 'safety' | 'outline' | 'dark';
  strength?: number;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  strength = 24,
  type = 'button',
  disabled = false,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !buttonRef.current) return;
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
    primary:
      'bg-primary text-white hover:bg-primary-hover border border-primary-hover shadow-subtle',
    safety:
      'bg-safety text-white hover:bg-safety-hover border border-safety-hover shadow-subtle',
    outline:
      'bg-transparent text-text-primary hover:bg-white/80 border border-border-dark',
    dark:
      'bg-charcoal-800 text-white hover:bg-charcoal-700 border border-white/10 hover:border-white/20',
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
      whileTap={{ scale: 0.96 }}
      className={`relative inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none overflow-hidden rounded-md ${variantStyles[variant]} ${className}`}
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
