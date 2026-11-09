import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ChevronRight, User, ExternalLink, ArrowRight } from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import { useAuthStore } from '../../store/authStore';

export const LandingNav: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 80);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleQuickDemoLogin = async (email: string) => {
    try {
      await login({ email, password: 'DemoPass123!' });
      navigate('/overview');
    } catch {
      navigate('/login');
    }
  };

  const demoRoles = [
    { title: 'Project Director', email: 'vikram@northstarinfra.com', desc: 'Commercial sign-off & exposure' },
    { title: 'Project Manager', email: 'arjun.pm@northstarinfra.com', desc: 'Site review & work authorization' },
    { title: 'Commercial Manager', email: 'manoj.comm@northstarinfra.com', desc: 'Unit-rate BOQ & cost engine' },
    { title: 'Finance Officer', email: 'anita.fin@northstarinfra.com', desc: 'Tax invoices & billing reconciliation' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-forest/95 backdrop-blur-md border-b border-olive/30 py-3 shadow-elevated'
          : 'bg-transparent py-5 border-b border-olive/15'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand & Technical Metadata */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-industrial border border-copper flex items-center justify-center text-parchment font-mono font-bold text-sm tracking-wider shadow-sm group-hover:border-limestone transition-colors">
              AF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-parchment tracking-tight text-base">AmendFlow</span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-industrial text-limestone border border-olive/40 tracking-widest uppercase">
                  v4.0
                </span>
              </div>
              <p className="text-[10px] text-limestone/70 tracking-wider font-mono hidden sm:block">
                CONSTRUCTION FINANCIAL GOVERNANCE
              </p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-olive/30">
            <span className="w-1.5 h-1.5 rounded-full bg-copper animate-pulse" />
            <span className="font-mono text-[10px] text-limestone tracking-wider">
              PROJECT: NORTHSTAR INFRASTRUCTURE [PRJ-NSR-001]
            </span>
          </div>
        </div>

        {/* Center Technical Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-mono tracking-wider">
          <a
            href="#blueprint-story"
            className="text-limestone hover:text-parchment transition-colors relative py-1"
          >
            [01. BLUEPRINT STORY]
          </a>
          <a
            href="#compare-section"
            className="text-limestone hover:text-parchment transition-colors relative py-1"
          >
            [02. VARIATION AUDIT]
          </a>
          <a
            href="#pipeline-flow"
            className="text-limestone hover:text-parchment transition-colors relative py-1"
          >
            [03. LIFECYCLE]
          </a>
          <a
            href="#exposure-matrix"
            className="text-limestone hover:text-parchment transition-colors relative py-1"
          >
            [04. EXPOSURE MATRIX]
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link to="/overview">
              <MagneticButton variant="copper" className="px-4 py-2 text-xs font-semibold">
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </MagneticButton>
            </Link>
          ) : (
            <>
              {/* Quick 1-Click Demo Launcher */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDemoMenuOpen(!demoMenuOpen)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-olive/40 bg-industrial/80 hover:bg-industrial text-parchment text-xs font-mono tracking-wider transition-all"
                  data-cursor-target="true"
                >
                  <User className="w-3.5 h-3.5 text-copper" />
                  <span>Demo Roles</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${demoMenuOpen ? 'rotate-90' : ''}`} />
                </button>

                {demoMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-72 rounded-lg bg-forest-surface border border-olive/50 shadow-2xl p-2 z-50 text-left font-sans backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150"
                    onMouseLeave={() => setDemoMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-olive/30 mb-1">
                      <p className="text-[11px] font-mono tracking-wider text-limestone uppercase">Instant Role Demo</p>
                      <p className="text-xs font-semibold text-parchment">Northstar Infrastructure</p>
                    </div>
                    {demoRoles.map((role) => (
                      <button
                        key={role.email}
                        onClick={() => handleQuickDemoLogin(role.email)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-industrial/80 transition-colors flex flex-col group cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-parchment group-hover:text-copper transition-colors">
                            {role.title}
                          </span>
                          <span className="font-mono text-[9px] text-limestone/70">1-click ➔</span>
                        </div>
                        <span className="text-[11px] text-limestone">{role.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Sign In Link */}
              <Link
                to="/login"
                className="text-xs font-mono tracking-wider text-limestone hover:text-parchment px-2 py-1 transition-colors"
              >
                Sign In
              </Link>

              {/* Primary Launch App CTA in Oxidised Copper */}
              <Link to="/login">
                <MagneticButton variant="copper" className="px-4 py-2 text-xs font-semibold tracking-wide">
                  <span>Launch App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </MagneticButton>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
