import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { showToast, Logo } from '../components';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<'home' | 'how-it-works' | 'about'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      const navHeight = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navHeight;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleNavClick = (sectionId: 'home' | 'how-it-works' | 'about') => (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    setActiveSection(sectionId);
    scrollToSection(sectionId);
  };

  // Handle direct navigation to #/how-it-works or #/about
  useEffect(() => {
    if (location.pathname === '/how-it-works' || location.hash.includes('how-it-works')) {
      setActiveSection('how-it-works');
      setTimeout(() => scrollToSection('how-it-works'), 150);
    } else if (location.pathname === '/about' || location.hash.includes('about')) {
      setActiveSection('about');
      setTimeout(() => scrollToSection('about'), 150);
    } else if (location.pathname === '/home') {
      if (window.scrollY < 100) {
        setActiveSection('home');
      }
    }
  }, [location.pathname, location.hash]);

  // Scroll spy to highlight active section in navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const howItWorksEl = document.getElementById('how-it-works');
      const aboutEl = document.getElementById('about');

      if (howItWorksEl && scrollY >= howItWorksEl.offsetTop - 180) {
        setActiveSection('how-it-works');
      } else if (aboutEl && scrollY >= aboutEl.offsetTop - 180) {
        setActiveSection('about');
      } else {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>

<header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/10">
  <div className="h-20 w-full px-gutter-lg flex items-center justify-between">
    <div className="flex items-center gap-space-md">
      <Link to="/home" onClick={() => scrollToSection('home')} className="flex items-center gap-space-sm group">
        <Logo className="h-8 w-auto text-on-surface group-hover:text-primary transition-colors" />
      </Link>
      <span className="hidden sm:inline-flex items-center px-space-sm py-space-xs rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm uppercase tracking-wide">Smart City Portal</span>
    </div>

    <nav className="hidden md:flex items-center gap-space-lg">
      <button
        type="button"
        onClick={handleNavClick('home')}
        className={`font-title-sm text-title-sm transition-colors py-1 cursor-pointer relative ${
          activeSection === 'home'
            ? 'text-primary font-semibold'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <span>Home</span>
        {activeSection === 'home' && (
          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"></span>
        )}
      </button>
      <button
        type="button"
        onClick={handleNavClick('about')}
        className={`font-title-sm text-title-sm transition-colors py-1 cursor-pointer relative ${
          activeSection === 'about'
            ? 'text-primary font-semibold'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <span>About</span>
        {activeSection === 'about' && (
          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"></span>
        )}
      </button>
      <button
        type="button"
        onClick={handleNavClick('how-it-works')}
        className={`font-title-sm text-title-sm transition-colors py-1 cursor-pointer relative ${
          activeSection === 'how-it-works'
            ? 'text-primary font-semibold'
            : 'text-on-surface-variant hover:text-on-surface'
        }`}
      >
        <span>How It Works</span>
        {activeSection === 'how-it-works' && (
          <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full"></span>
        )}
      </button>
      {user ? (
        <Link
          to="/dashboard"
          className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors py-1"
        >
          Dashboard
        </Link>
      ) : (
        <Link
          to="/login"
          className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors py-1"
        >
          Login
        </Link>
      )}
    </nav>

    <div className="flex items-center gap-space-sm sm:gap-space-md">
      <Link
        to="/report"
        className="inline-flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-sm text-title-sm shadow-[0_1px_3px_0_rgba(15,23,42,0.05)] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary active:scale-95"
      >
        <span className="material-symbols-outlined text-[20px]">photo_camera</span>
        <span className="hidden sm:inline">Report an Issue</span>
        <span className="sm:hidden">Report</span>
      </Link>

      <Link
        to="/profile"
        title="View Profile"
        className="w-9 h-9 rounded-full bg-surface-container-high hover:bg-primary text-primary hover:text-on-primary flex items-center justify-center transition-all shadow-sm hover:scale-105"
      >
        <span className="material-symbols-outlined text-[20px]">person</span>
      </Link>

      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-on-surface hover:bg-surface-container-high transition-colors"
        aria-label="Toggle navigation menu"
      >
        <span className="material-symbols-outlined text-[24px]">
          {mobileMenuOpen ? 'close' : 'menu'}
        </span>
      </button>
    </div>
  </div>

  {/* Mobile Dropdown Navigation */}
  {mobileMenuOpen && (
    <div className="md:hidden w-full bg-surface/98 backdrop-blur-2xl border-b border-outline-variant/20 shadow-xl px-gutter-lg py-space-md flex flex-col gap-space-xs">
      <button
        type="button"
        onClick={handleNavClick('home')}
        className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-xl font-title-sm text-title-sm transition-colors text-left ${
          activeSection === 'home'
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-on-surface hover:bg-surface-container-low'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">home</span>
        <span>Home</span>
      </button>
      <button
        type="button"
        onClick={handleNavClick('about')}
        className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-xl font-title-sm text-title-sm transition-colors text-left ${
          activeSection === 'about'
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-on-surface hover:bg-surface-container-low'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">info</span>
        <span>About RESQGRID</span>
      </button>
      <button
        type="button"
        onClick={handleNavClick('how-it-works')}
        className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-xl font-title-sm text-title-sm transition-colors text-left ${
          activeSection === 'how-it-works'
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-on-surface hover:bg-surface-container-low'
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">account_tree</span>
        <span>How It Works</span>
      </button>
      <Link
        to="/map"
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center gap-space-sm px-space-md py-space-sm rounded-xl font-title-sm text-title-sm text-on-surface hover:bg-surface-container-low transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">map</span>
        <span>Ward Operations Map</span>
      </Link>
      {user ? (
        <Link
          to="/dashboard"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-space-sm px-space-md py-space-sm rounded-xl font-title-sm text-title-sm text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">dashboard</span>
          <span>Dashboard</span>
        </Link>
      ) : (
        <Link
          to="/login"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center gap-space-sm px-space-md py-space-sm rounded-xl font-title-sm text-title-sm text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">login</span>
          <span>Login</span>
        </Link>
      )}
      <div className="pt-space-xs mt-space-xs border-t border-outline-variant/10">
        <Link
          to="/report"
          onClick={() => setMobileMenuOpen(false)}
          className="w-full inline-flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-xl bg-primary text-on-primary font-title-sm text-title-sm shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">photo_camera</span>
          <span>Report an Issue</span>
        </Link>
      </div>
    </div>
  )}
</header>
<main className="w-full pt-20 bg-surface">
  <div className="flex flex-col w-full">
    {/**/}
    <section className="w-full px-gutter-lg pt-space-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-surface-container-low rounded-xl p-space-sm px-space-md shadow-sm">
        <div className="flex items-center gap-space-sm">
          <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary">Live System Status</span>
          <span className="text-outline-variant font-body-sm text-body-sm">|</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            Dispatch Engine v4.2 Active across 14 Municipal Wards. Mean triage duration: 11 minutes.
          </p>
        </div>

      </div>
    </section>
    {/**/}
    <section className="w-full px-gutter-lg pt-space-xl pb-space-2xl overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
        {/**/}
        <div className="lg:col-span-6 flex flex-col items-start">
          <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm mb-space-md shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-primary">verified</span>
            <span>Official Public Works Coordination Network</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-tight">
            Fix Your City. <br className="hidden sm:inline"/>
            <span className="text-primary">One Report at a Time.</span>
          </h1>
          <p className="mt-space-md font-body-lg text-body-lg text-on-surface-variant max-w-xl">
            Report civic problems, track their progress, and help build a better community with transparent AI-accelerated municipal triage.
          </p>
          {/**/}
          <div className="mt-space-xl flex flex-wrap items-center gap-space-md w-full sm:w-auto">
            <Link to="/report" className="inline-flex items-center justify-center gap-space-sm px-space-lg py-space-sm rounded-lg bg-primary-container hover:bg-primary text-on-primary font-title-md text-title-md shadow-md transition-all transform hover:-translate-y-0.5 focus:outline-none"  >
              <span className="material-symbols-outlined text-[22px]">add_a_photo</span>
              <span>Report an Issue</span>
            </Link>
            <Link to="/explore" className="inline-flex items-center justify-center gap-space-sm px-space-lg py-space-sm rounded-lg bg-surface-container-lowest hover:bg-surface-container text-on-surface font-title-md text-title-md shadow-sm transition-colors"  >
              <span className="material-symbols-outlined text-primary text-[22px]">explore</span>
              <span>Explore Issues</span>
            </Link>
          </div>
          {/**/}
          <div className="mt-space-lg pt-space-md bg-surface-container-low/70 rounded-xl p-space-md w-full max-w-lg shadow-sm">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-primary font-bold">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
              </div>
              <div className="flex flex-col">
                <span className="font-title-sm text-title-sm text-on-surface">Average resolution time: 48 hours</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">Over 12,400+ verified city repairs logged this calendar year</span>
              </div>
            </div>
          </div>
          {/**/}
          <div className="mt-space-lg grid grid-cols-3 gap-space-md w-full max-w-lg">
            <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
              <div className="font-headline-sm text-headline-sm text-primary">99.1%</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">GPS Precision</div>
            </div>
            <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
              <div className="font-headline-sm text-headline-sm text-tertiary">14 Wards</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">Coverage</div>
            </div>
            <div className="bg-surface-container-lowest p-space-sm rounded-lg shadow-sm">
              <div className="font-headline-sm text-headline-sm text-on-surface">Zero</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">Paperwork</div>
            </div>
          </div>
        </div>
        {/**/}
        <div className="lg:col-span-6 relative">
          {/**/}
          <div className="absolute -top-10 -right-10 w-80 h-80 bg-primary-fixed rounded-full blur-3xl opacity-40 -z-10"></div>
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-tertiary-fixed rounded-full blur-3xl opacity-30 -z-10"></div>
          {/**/}
          <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden p-space-sm">
            {/**/}

            <div className="relative w-full h-[460px] mt-space-sm rounded-xl overflow-hidden bg-surface-container-high">
              <svg className="absolute inset-0 w-full h-full opacity-60" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#cbdbf5" strokeWidth="1"></path>
                  </pattern>
                </defs>
                <rect fill="url(#grid)" height="100%" width="100%"></rect>
                <path d="M-20,120 Q180,90 320,190 T640,240" fill="none" stroke="#ffffff" strokeLinecap="round" strokeWidth="12"></path>
                <path d="M-20,120 Q180,90 320,190 T640,240" fill="none" stroke="#b7c4ff" strokeDasharray="6,6" strokeWidth="4"></path>
                <path d="M220,-20 L280,500" fill="none" stroke="#ffffff" strokeWidth="16"></path>
                <path d="M120,440 L480,40" fill="none" stroke="#ffffff" strokeWidth="10"></path>
                {/**/}
                <rect fill="#7ffc97" height="110" opacity="0.35" rx="16" width="130" x="360" y="40"></rect>
                <text className="font-label-sm text-[11px] font-semibold tracking-wider" fill="#00501f" x="380" y="95">OAK PARK DIST.</text>
                {/**/}
                <path d="M40,460 C120,380 180,390 340,310 C420,270 520,320 620,290" fill="none" stroke="#d3e4fe" strokeLinecap="round" strokeWidth="24"></path>
              </svg>
              {/**/}
              {/**/}
              <div className="absolute top-[80px] left-[18px] sm:left-[35px] max-w-[270px] bg-surface-container-lowest p-space-sm rounded-xl shadow-lg transform transition hover:scale-105">
                <div className="flex items-start gap-space-xs">
                  <div className="w-7 h-7 rounded-full bg-error-container flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-error text-[16px]">warning</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="font-title-sm text-[12px] text-on-surface font-bold truncate">Pothole on Main Rd</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-[10px] uppercase font-bold">Critical</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">Dispatched #924</span>
                    </div>
                  </div>
                </div>
              </div>
              {/**/}
              <div className="absolute top-[148px] left-[70px] flex items-center justify-center">
                <span className="w-4 h-4 rounded-full bg-error animate-ping absolute"></span>
                <span className="w-3.5 h-3.5 rounded-full bg-error shadow-md border-2 border-surface-container-lowest"></span>
              </div>
              {/**/}
              <div className="absolute top-[170px] right-[16px] sm:right-[32px] max-w-[260px] bg-surface-container-lowest p-space-sm rounded-xl shadow-lg transform transition hover:scale-105">
                <div className="flex items-start gap-space-xs">
                  <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">lightbulb</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-title-sm text-[12px] text-on-surface font-bold truncate">Streetlight Fault</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[10px]">5th Ave • Ward 2</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant font-medium">Assigned</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute top-[238px] right-[90px] flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-secondary shadow-md border-2 border-surface-container-lowest"></span>
              </div>
              {/**/}
              <div className="absolute bottom-[110px] left-[30px] sm:left-[60px] max-w-[270px] bg-surface-container-lowest p-space-sm rounded-xl shadow-lg transform transition hover:scale-105">
                <div className="flex items-start gap-space-xs">
                  <div className="w-7 h-7 rounded-full bg-surface-variant flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">water_drop</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-title-sm text-[12px] text-on-surface font-bold truncate">Water Main Leak</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-surface-variant text-primary font-label-sm text-[10px]">Market St</span>
                      <span className="font-body-sm text-[11px] text-primary font-semibold">In Progress (64%)</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-[80px] left-[130px] flex items-center justify-center">
                <span className="w-4 h-4 rounded-full bg-primary animate-pulse absolute"></span>
                <span className="w-3.5 h-3.5 rounded-full bg-primary shadow-md border-2 border-surface-container-lowest"></span>
              </div>
              {/**/}
              <div className="absolute bottom-[24px] right-[24px] sm:right-[40px] max-w-[280px] bg-surface-container-lowest p-space-sm rounded-xl shadow-lg">
                <div className="flex items-start gap-space-xs">
                  <div className="w-7 h-7 rounded-full bg-tertiary-container flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-tertiary-fixed text-[16px]">task_alt</span>
                  </div>
                  <div className="min-w-0">
                    <span className="font-title-sm text-[12px] text-on-surface font-bold">Broken Footpath • Oak Park</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded bg-tertiary-fixed-dim/30 text-tertiary font-label-sm text-[10px] font-bold uppercase">Resolved 2h ago</span>
                      <span className="font-body-sm text-[11px] text-on-surface-variant">Inspected ✓</span>
                    </div>
                  </div>
                </div>
              </div>
              {/**/}
              <div className="absolute top-4 right-4 bg-inverse-surface/90 backdrop-blur-md px-space-sm py-1.5 rounded-xl shadow-xl flex items-center gap-space-xs text-inverse-on-surface">
                <div className="w-6 h-6 rounded-md bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary text-[14px]">auto_awesome</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-[10px] text-secondary-container">VISION MODEL V2</span>
                  <span className="font-title-sm text-[11px] font-semibold">Instant AI Photo Analysis (98% confidence)</span>
                </div>
              </div>
              {/**/}

            </div>
            {/**/}
            <div className="mt-space-sm px-space-sm py-1 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                High-resolution spatial layer synced 2s ago
              </span>
              <span className="font-body-sm text-[11px]">Sub-meter GPS telemetry active</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/**/}
    <section className="w-full px-gutter-lg py-space-xl bg-surface-container-low shadow-sm my-space-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-lg">
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">Municipal Velocity Index</span>
            <h2 className="font-headline-md text-headline-md text-on-surface mt-1">Measurable Civic Improvements</h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 md:mt-0">Audited public dashboard synchronized with city department feeds.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Citizen Filings</span>
              <div className="w-9 h-9 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">assignment_turned_in</span>
              </div>
            </div>
            <div className="mt-space-md">
              <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight" id="stat-reports">14,820</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Verified Reports Filed</p>
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center gap-1 text-tertiary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+18% from last quarter</span>
            </div>
          </div>
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Completion Rate</span>
              <div className="w-9 h-9 rounded-lg bg-tertiary-fixed-dim/40 flex items-center justify-center text-tertiary">
                <span className="material-symbols-outlined text-[20px]">verified</span>
              </div>
            </div>
            <div className="mt-space-md">
              <div className="font-headline-xl text-headline-xl text-tertiary tracking-tight">94.2%</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Resolution Rate</p>
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
              <span>Target: &gt;90% SLA compliance</span>
            </div>
          </div>
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">Integration</span>
              <div className="w-9 h-9 rounded-lg bg-secondary-container flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </div>
            </div>
            <div className="mt-space-md">
              <div className="font-headline-xl text-headline-xl text-on-surface tracking-tight">28</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Public Departments Connected</p>
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
              <span>Water, Roads, Power, Transit &amp; Parks</span>
            </div>
          </div>
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">First Dispatch</span>
              <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-[20px]">timer</span>
              </div>
            </div>
            <div className="mt-space-md">
              <div className="font-headline-xl text-headline-xl text-primary tracking-tight">3.8 hrs</div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Avg Response Time</p>
            </div>
            <div className="mt-space-sm pt-space-xs flex items-center gap-1 text-tertiary font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
              <span>Down from 18.4 hrs baseline</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/**/}
    <section id="about" className="w-full px-gutter-lg py-space-2xl scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-space-xl">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">About RESQGRID • Core Architecture</span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1">Designed for speed, built for accountability</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">
            Transforming citizen input into immediate public works field dispatches through modern civic technology.
          </p>
        </div>
        {/**/}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg">
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center mb-space-md shadow-sm">
                <span className="material-symbols-outlined text-[26px]">touch_app</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Report in seconds</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
                Snap a photo or enter an address. Enjoy frictionless 3-step reporting without bureaucratic paperwork or endless municipal phone queues.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md bg-surface-container-low p-space-sm rounded-xl">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold">Average time: 24 seconds</span>
            </div>
          </div>
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-surface-variant text-primary flex items-center justify-center mb-space-md shadow-sm">
                <span className="material-symbols-outlined text-[26px]">smart_toy</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">AI-powered issue detection</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
                Computer vision model categorizes potholes, water leaks, and electrical hazards while assessing structural severity automatically.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md bg-surface-container-low p-space-sm rounded-xl">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold">98.4% Classification Accuracy</span>
            </div>
          </div>
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-fixed flex items-center justify-center mb-space-md shadow-sm">
                <span className="material-symbols-outlined text-[26px]">alt_route</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Automatic department routing</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
                Instant smart dispatch directly to Public Works, Electrical Grid, Water Board, or Sanitation teams without administrative delays.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md bg-surface-container-low p-space-sm rounded-xl">
              <span className="font-label-sm text-label-sm text-primary uppercase font-bold">Zero manual sorting</span>
            </div>
          </div>
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow">
            <div>
              <div className="w-12 h-12 rounded-xl bg-tertiary-fixed text-tertiary flex items-center justify-center mb-space-md shadow-sm">
                <span className="material-symbols-outlined text-[26px]">fact_check</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Real-time tracking</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm">
                Live timeline updates from citizen submission to GPS crew arrival, culminating in verified before-and-after resolution proof.
              </p>
            </div>
            <div className="mt-space-lg pt-space-md bg-surface-container-low p-space-sm rounded-xl">
              <span className="font-label-sm text-label-sm text-tertiary uppercase font-bold">Photo verified resolution</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    {/**/}
    <section id="how-it-works" className="w-full px-gutter-lg py-space-2xl bg-surface-container-low/50 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        {/**/}
        <div className="text-center max-w-3xl mx-auto mb-space-2xl">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">How It Works • End-to-End Workflow</span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mt-space-xs">Simple, Transparent, and Accountable</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-space-xs">
            From street report to municipal repair in 4 simple steps
          </p>
        </div>
        {/**/}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-lg relative">
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-md relative flex flex-col">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center mb-space-md shadow-sm">
              1
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">1. Report</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm mb-space-md">
              Snap a photo of any civic defect with automatic geo-tagging and quick citizen description.
            </p>
            <div className="mt-auto bg-surface-container rounded-xl p-space-sm overflow-hidden">
              <img className="w-full h-36 object-cover rounded-lg" data-alt="A clean top-down smartphone mock preview showing a citizen capturing a camera photo of cracked asphalt with GPS coordinate badges overlaid in corporate blue and white." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqW-KDghVAJElP0yU1doHTA6HSM3klJ--kQqVL6XxbpMyOenjNiGSHCGuJUQjJt-d81g9e7f1L6LJwfvbEFiRUCg9Eor-C_7Dpu24jx-mv1NJ9JhKbi8tjLgowL1lTsuVwRSVAXWqUxy4HbPA4aSJFAifU1tRcYfKlpEHbn7tLctlW--O2gmqHkzvLuI35gfCGUXleQ7phmtqVVBdd2fTPvkKggrVS9iZeh1Gxt-KsMFkM5_FeMv26"/>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span className="font-semibold">Ward 7 • Main St</span>
                <span className="text-primary">Auto-located</span>
              </div>
            </div>
          </div>
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-md relative flex flex-col">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center mb-space-md shadow-sm">
              2
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">2. AI Detects</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm mb-space-md">
              Intelligent computer vision analyzes image severity, verifies authenticity, and tags the exact municipal department.
            </p>
            <div className="mt-auto bg-surface-container rounded-xl p-space-sm overflow-hidden">
              {/**/}
              <div className="w-full h-36 bg-surface-container-highest rounded-lg p-space-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[10px] uppercase font-bold text-primary">Analysis Complete</span>
                  <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between font-label-sm text-[11px] text-on-surface">
                    <span>Class: Roadway Depression</span>
                    <span className="font-bold">99.2%</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div className="bg-primary h-full rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <div className="flex justify-between font-label-sm text-[10px] text-on-surface-variant">
                    <span>Priority: High</span>
                    <span>Duplicate Check: Passed</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Department: Roads &amp; Transit</span>
                <span className="text-tertiary">Verified</span>
              </div>
            </div>
          </div>
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-md relative flex flex-col">
            <div className="w-10 h-10 rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm flex items-center justify-center mb-space-md shadow-sm">
              3
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">3. Authority Acts</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm mb-space-md">
              City field officers receive prioritized work orders and dispatch maintenance crews immediately.
            </p>
            <div className="mt-auto bg-surface-container rounded-xl p-space-sm overflow-hidden">
              <img className="w-full h-36 object-cover rounded-lg" data-alt="Municipal municipal road maintenance crew wearing high-visibility vests working on an urban street repair with modern utility trucks under daylight." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT6YSIg7yuimpwZIWFFGJKetHeQHJUuuSDkCdQzOF_60Wpfdx4fpS6SiA08L98EijXt0v9FVoWFREYhgf6QRdfTVWpV5yOp6TvF4JpX6VrEQJx32Y8aWJeUDdejdE5mZiliMUiHW3Vp-0xOk54scPC6KnSy33BCqQGGGXhOUoRjndpH-pobAMB1KMiDK6nK99wMEWD_yQcoc-5tnAsT8lNK2iEMeBoH8OeCxwCfL-RwYl_c4T-837N"/>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span>Crew Unit #14 Assigned</span>
                <span className="text-on-secondary-fixed font-semibold">En Route</span>
              </div>
            </div>
          </div>
          {/**/}
          <div className="bg-surface-container-lowest p-space-lg rounded-2xl shadow-md relative flex flex-col">
            <div className="w-10 h-10 rounded-full bg-tertiary text-on-tertiary font-headline-sm text-headline-sm flex items-center justify-center mb-space-md shadow-sm">
              4
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">4. Issue Resolved</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mt-space-sm mb-space-md">
              Public works team uploads before-and-after verification photo. Citizen receives confirmation and rates the fix.
            </p>
            <div className="mt-auto bg-surface-container rounded-xl p-space-sm overflow-hidden">
              <div className="w-full h-36 bg-tertiary-fixed-dim/20 rounded-lg p-space-sm flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[10px] uppercase font-bold text-tertiary">Inspection Signed Off</span>
                  <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
                </div>
                <div className="text-center py-2">
                  <div className="text-tertiary font-headline-sm text-headline-sm font-bold">100% Repaired</div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">Citizen feedback: ★★★★★ (5.0)</span>
                </div>
                <div className="w-full bg-tertiary-fixed h-1.5 rounded-full"></div>
              </div>
              <div className="mt-2 flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                <span className="font-semibold text-tertiary">Case Closed</span>
                <span>Logged to Public Ledger</span>
              </div>
            </div>
          </div>
        </div>
        {/**/}
        <div className="mt-space-xl p-space-lg bg-surface-container-lowest rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">verified</span>
            </div>
            <div>
              <h4 className="font-title-md text-title-md text-on-surface">Ready to report something in your neighborhood?</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">No account required for immediate urgent hazard alerts.</p>
            </div>
          </div>
          <Link to="/report" className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-title-sm text-title-sm hover:bg-on-primary-fixed-variant transition-colors shadow-sm whitespace-nowrap"  >
            <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            <span>Start Citizen Report</span>
          </Link>
        </div>
      </div>
    </section>
    {/**/}
    <section className="w-full px-gutter-lg py-space-md bg-surface-container-highest">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-space-md">
        <div className="flex items-center gap-space-sm">
          <span className="font-label-sm text-label-sm uppercase font-bold text-on-surface">Latest Public Fixes:</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-semibold">
              ✓ Street light on Ward 3
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-semibold">
              ✓ Drainage clear on 8th Ave
            </span>
            <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-[11px] font-semibold">
              ✓ Stop sign replacement on Cedar Rd
            </span>
          </div>
        </div>
        <Link to="/tracking" className="text-primary font-title-sm text-title-sm hover:underline flex items-center gap-1"  >
          <span>View full audit log</span>
          <span className="material-symbols-outlined text-[16px]">launch</span>
        </Link>
      </div>
    </section>
    {/**/}
    <section className="w-full px-gutter-lg py-space-2xl">
      <div className="max-w-5xl mx-auto bg-primary-container text-on-primary rounded-2xl p-space-xl md:p-space-2xl shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -bottom-16 w-64 h-64 bg-on-primary-fixed-variant/40 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-primary-container font-semibold">Civic Pride In Action</span>
          <h2 className="font-headline-lg text-headline-lg text-on-primary mt-space-xs">
            Transform Your City With Simple, Transparent Reporting.
          </h2>
          <p className="font-body-lg text-body-lg text-on-primary-container mt-space-sm">
            Join over 48,000 engaged neighbors, district engineers, and local councilors making streets safer every day.
          </p>
          <div className="mt-space-xl flex flex-wrap items-center gap-space-md">
            <Link to="/report" className="inline-flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-surface text-primary font-title-md text-title-md hover:bg-surface-bright transition-all shadow-md"  >
              <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
              <span>Submit a Civic Report</span>
            </Link>
            <button type="button" onClick={handleNavClick('how-it-works')} className="inline-flex items-center justify-center gap-space-xs px-space-lg py-space-sm rounded-lg bg-on-primary-fixed-variant/30 text-on-primary font-title-md text-title-md hover:bg-on-primary-fixed-variant/50 transition-colors cursor-pointer"  >
              <span>Learn How Wards Participate</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</main>
<footer className="w-full bg-surface-container-low shadow-[0_-1px_0_rgba(0,0,0,0.04)] py-space-2xl">
  <div className="w-full px-gutter-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-space-xl">
    <div className="max-w-md">
      <div className="flex items-center gap-space-sm mb-space-sm">
        <Logo className="h-8 w-auto text-on-surface" />
      </div>
      <p className="font-body-md text-body-md text-on-surface-variant">Empowering citizens and municipal authorities with transparent, AI-driven public issue resolution.</p>
    </div>
    <div className="flex flex-wrap gap-space-lg">
      <Link to="/dashboard" className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors"  >Platform Dashboard</Link>
      <Link to="/admin" className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors"  >Departments Portal</Link>
      <button type="button" onClick={() => showToast('CivicFix is committed to open data privacy and citizen security.')} className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"  >Privacy Policy</button>
      <button type="button" onClick={() => showToast('Terms of Service: Municipal open access portal under civic trust.')} className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"  >Terms of Service</button>
      <Link to="/dashboard" className="font-title-sm text-title-sm text-on-surface-variant hover:text-on-surface transition-colors"  >Hackathon Demo 2026</Link>
    </div>
  </div>
  <div className="w-full px-gutter-lg mt-space-xl pt-space-lg flex flex-col sm:flex-row items-center justify-between text-on-surface-variant font-label-md text-label-md gap-space-sm">
    <span>© 2026 RESQGRID Municipal Technologies. All rights reserved.</span>
    <span>Civic Trust &amp; Open Infrastructure</span>
  </div>
</footer>

    </>
  );
}
