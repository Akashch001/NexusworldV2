import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { COMPANY_INFO } from '../../data/companyData';

interface HeaderProps {
  onNavigate: (sectionId: string) => void;
  onOpenConcierge?: () => void;
  isConciergeOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onOpenConcierge, isConciergeOpen }) => {
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          
          setScrolled(currentScrollY > 20);

          // Top of page behavior
          if (currentScrollY <= 50) {
            setVisible(true);
          } else if (!mobileMenuOpen && !isConciergeOpen) {
            // Only auto-hide if menu is closed and concierge is closed
            const delta = currentScrollY - lastScrollY.current;
            if (delta > 10) {
              setVisible(false); // scrolling down
            } else if (delta < -10) {
              setVisible(true); // scrolling up
            }
          }

          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen, isConciergeOpen]);

  useEffect(() => {
    if (isConciergeOpen) {
      setVisible(true);
    }
  }, [isConciergeOpen]);

  useEffect(() => {
    if (mobileMenuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [mobileMenuOpen]);

  const navItems = [
    { label: 'Capabilities', id: 'capabilities' },
    { label: 'The Lab', id: 'lab' },
    { label: 'Process', id: 'process' },
    { label: 'Philosophy', id: 'philosophy' },
    { label: 'Impact', id: 'impact' },
  ];

  const handleLinkClick = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        scrolled
          ? 'bg-[#050507]/85 backdrop-blur-xl border-b border-white/[0.08] py-3.5 shadow-2xl shadow-black/60'
          : 'bg-transparent py-5'
      } ${
        !visible ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Mark & Identity */}
        <button
          onClick={() => handleLinkClick('hero')}
          className="group flex items-center gap-3 text-left focus:outline-none"
        >
          <div className="relative w-8 h-8 rounded bg-void-card border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:border-signal/60 group-hover:shadow-[0_0_12px_rgba(37,99,235,0.4)]">
            <span className="font-display font-bold text-white text-sm tracking-wider">N</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-signal animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm tracking-widest text-white uppercase group-hover:text-signal-bright transition-colors">
                {COMPANY_INFO.brand}
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-zinc-500 font-mono tracking-tight leading-none mt-0.5">
              DIGITAL PRODUCT AGENCY
            </p>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleLinkClick(item.id)}
              className="relative px-3 py-1.5 text-sm font-medium text-zinc-300 hover:text-white rounded-md hover:bg-white/[0.04] transition-all duration-200 focus:outline-none"
            >
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* CTA & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {onOpenConcierge && (
            <button
              onClick={onOpenConcierge}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-void-surface text-[11px] font-mono text-zinc-300 hover:text-white transition-all duration-200 focus:outline-none"
              title="Open Nexus Intelligence"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-signal" />
              <span>NORA</span>
            </button>
          )}

          <button
            onClick={() => handleLinkClick('contact')}
            className="group relative inline-flex items-center gap-2 px-4 py-2 rounded bg-signal hover:bg-signal-bright text-white text-xs font-semibold tracking-wide transition-all duration-200 shadow-[0_0_15px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] focus:outline-none"
          >
            <span>Start a Project</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded bg-void-card border border-white/10 text-zinc-300 hover:text-white focus:outline-none"
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#050507]/98 backdrop-blur-2xl px-6 py-6 transition-all">
          <div className="flex flex-col gap-3">
            {onOpenConcierge && (
              <button
                onClick={() => {
                  onOpenConcierge();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-between py-2 text-sm font-medium text-signal-bright border-b border-white/[0.04] text-left"
              >
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-signal" />
                  NORA
                </span>
                <span className="text-[10px] font-mono uppercase bg-signal/15 px-2 py-0.5 rounded text-signal-bright border border-signal/30">
                  NEXUS INTELLIGENCE
                </span>
              </button>
            )}
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleLinkClick(item.id)}
                className="flex items-center justify-between py-2 text-base font-medium text-zinc-300 hover:text-white border-b border-white/[0.04] text-left"
              >
                <span>{item.label}</span>
                <ArrowUpRight className="w-4 h-4 text-zinc-600" />
              </button>
            ))}
            <button
              onClick={() => handleLinkClick('contact')}
              className="mt-3 w-full py-3 text-center text-xs font-semibold uppercase tracking-wider text-white bg-signal rounded"
            >
              Start a Project
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
