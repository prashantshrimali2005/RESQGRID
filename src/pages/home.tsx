import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Map as MapIcon, 
  Clock, 
  Bell, 
  ArrowRight, 
  Radio, 
  PhoneCall, 
  AlertTriangle,
  Info,
  CheckCircle2,
  Navigation,
  HeartHandshake,
  PackagePlus,
  Users,
  Search,
  Menu,
  X
} from 'lucide-react';

const LandingPage = ({ onNavigateToLogin }) => {
  const [sosActive, setSosActive] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOffline, setIsOffline] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Simulate network connectivity changes
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="container">
        <div className="navbar">
          <div className="logo">
            <div className="logo-icon">
              <ShieldAlert size={16} />
            </div>
            RESQGRID
          </div>
          
          <div className="hidden md:flex nav-links">
            <a href="#how-it-works" className="nav-link">How it works</a>
            <a href="#capabilities" className="nav-link">Capabilities</a>
            <a href="#demo" className="nav-link">Explore demo</a>
            <button 
              className="btn btn-outline"
              onClick={onNavigateToLogin}
            >
              Sign In
            </button>
            <button 
              onClick={() => setSosActive(true)}
              className="btn btn-sos"
            >
              <Radio size={16} /> SOS
            </button>
          </div>

          <button 
            className="md:hidden btn-ghost"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden flex flex-col gap-4 py-4 border-t border-gray-200">
             <a href="#how-it-works" className="nav-link" onClick={() => setShowMobileMenu(false)}>How it works</a>
             <a href="#capabilities" className="nav-link" onClick={() => setShowMobileMenu(false)}>Capabilities</a>
             <a href="#demo" className="nav-link" onClick={() => setShowMobileMenu(false)}>Explore demo</a>
             <button 
              className="btn btn-outline w-full"
              onClick={() => { onNavigateToLogin(); setShowMobileMenu(false); }}
            >
              Sign In
            </button>
             <button 
              onClick={() => { setSosActive(true); setShowMobileMenu(false); }}
              className="btn btn-sos w-full"
            >
              <Radio size={16} /> SOS
            </button>
          </div>
        )}
      </nav>

      {/* Network Status Indicator */}
      {isOffline && (
        <div className="bg-orange-100 text-orange-800 px-4 py-2 text-center text-sm font-medium flex justify-center items-center gap-2">
          <AlertTriangle size={16} /> 
          OFFLINE MODE: You are currently disconnected. Emergency requests will queue and sync when reconnected.
          <span className="ml-4 bg-orange-200 px-2 py-1 rounded text-xs">3 actions waiting to sync</span>
        </div>
      )}

      {/* Hero Section */}
      <section className="container">
        <div className="hero">
          <div className="hero-content">
            <div className="hero-subtitle">
              Built for the moments that matter
            </div>
            <h1>When it matters, everyone moves as one.</h1>
            <p className="hero-description">
              RESQGRID brings citizens, responders, volunteers and resources into one calm, coordinated view — so help can move faster when every second counts.
            </p>
            <div className="flex flex-wrap gap-4 mt-6">
              <button className="btn btn-primary">
                Open live dashboard <ArrowRight size={16} />
              </button>
              <button className="btn btn-outline" onClick={() => setSosActive(true)}>
                <Radio size={16} /> Try SOS flow
              </button>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-blue-800 font-bold text-xs">R</div>
                <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex items-center justify-center text-green-800 font-bold text-xs">J</div>
                <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-orange-800 font-bold text-xs">K</div>
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-gray-800 font-bold text-xs">+</div>
              </div>
              <span>Designed for citizens and the people who respond</span>
            </div>
          </div>
          
          <div className="hero-visual hidden md:flex">
            <div className="app-mockup">
              <div className="floating-alert top-right">
                <div className="alert-icon warning">
                  <AlertTriangle size={18} />
                </div>
                <div className="alert-content">
                  <h4>Flash flood warning</h4>
                  <p>Sector 17 • 6 min ago</p>
                </div>
              </div>
              
              <div className="floating-alert bottom-left">
                <div className="alert-icon info">
                  <Navigation size={18} />
                </div>
                <div className="alert-content">
                  <h4>North District • Online</h4>
                  <p>Live coordination • Updated just now</p>
                </div>
              </div>

              <img 
                src="https://images.unsplash.com/photo-1599839619722-39751411ea63?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                alt="Emergency Responders" 
                className="mockup-img"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur p-4 border-t border-gray-100">
                <div className="text-xs font-semibold text-green-600 mb-1 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div> SYSTEM: OPERATIONAL
                </div>
                <div className="font-bold text-gray-800">14 responders active nearby</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Operations Dashboard */}
      <section className="container pb-20">
        <div className="text-center mb-12">
          <div className="hero-subtitle justify-center mb-4">See it in action</div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--text-primary)]">A calmer view<br/>of crisis.</h2>
        </div>

        <div className="tabs justify-center">
          <div className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <Radio size={16} className="inline mr-2" /> Dashboard
          </div>
          <div className={`tab ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
            <MapIcon size={16} className="inline mr-2" /> Live map
          </div>
          <div className={`tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            <Clock size={16} className="inline mr-2" /> Requests
          </div>
          <div className={`tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
            <Bell size={16} className="inline mr-2" /> Alerts
          </div>
        </div>

        {activeTab === 'map' && (
          <div className="dashboard-preview animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="dashboard-header">
              <div>
                <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wider font-semibold mb-1">Live Operations Map</div>
                <h3 className="text-xl font-bold">North District</h3>
              </div>
              <button className="btn btn-outline text-sm py-1.5"><MapIcon size={14} className="mr-2" /> Filters</button>
            </div>
            
            <div className="map-container">
              {/* Map Markers */}
              <div className="absolute top-1/4 left-1/4 bg-red-500 text-white p-2 rounded-full shadow-lg cursor-pointer transform hover:scale-110 transition-transform">
                <AlertTriangle size={16} />
              </div>
              <div className="absolute top-1/2 left-1/3 bg-blue-500 text-white p-2 rounded-full shadow-lg cursor-pointer transform hover:scale-110 transition-transform">
                <Navigation size={16} />
              </div>
              <div className="absolute bottom-1/3 right-1/4 bg-green-500 text-white p-2 rounded-full shadow-lg cursor-pointer transform hover:scale-110 transition-transform">
                <ShieldAlert size={16} />
              </div>
              <div className="absolute top-1/3 right-1/3 bg-orange-500 text-white p-2 rounded-full shadow-lg cursor-pointer transform hover:scale-110 transition-transform">
                <Users size={16} />
              </div>
              
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur rounded-lg p-2 shadow-sm border border-gray-100 flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Incidents</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Shelters</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Hospitals</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
               <div className="bg-white p-6 rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border-color)]">
                  <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Local Status</h4>
                  <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                    <CheckCircle2 size={24} /> Stable
                  </div>
                  <p className="text-sm mt-2 text-gray-500">All primary routes clear. 2 minor incidents reported.</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border-color)]">
                  <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Nearby Shelters</h4>
                  <div className="text-2xl font-bold text-[var(--text-primary)]">3 <span className="text-sm font-normal text-gray-500">available</span></div>
                  <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-green-500 h-full w-[45%]"></div>
                  </div>
                  <p className="text-xs mt-1 text-gray-500 text-right">45% Capacity</p>
               </div>
               <div className="bg-white p-6 rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border-color)] bg-orange-50/50 border-orange-100">
                  <h4 className="text-sm font-semibold text-orange-800 mb-2">Active Warnings</h4>
                  <div className="text-lg font-bold text-orange-700 flex items-start gap-2">
                    <AlertTriangle size={20} className="mt-0.5 shrink-0" />
                    <span>Heavy rainfall expected in next 2 hours.</span>
                  </div>
               </div>
             </div>

             <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
             <div className="quick-actions">
              <div className="action-card sos" onClick={() => setSosActive(true)}>
                <div className="action-icon">
                  <Radio size={24} />
                </div>
                <div className="action-title text-[var(--accent-coral)]">SOS Emergency</div>
                <p className="text-xs text-[var(--text-secondary)]">Immediate life-threatening situations only</p>
              </div>
              
              <div className="action-card">
                <div className="action-icon">
                  <AlertTriangle size={24} />
                </div>
                <div className="action-title">Report Incident</div>
                <p className="text-xs text-[var(--text-secondary)]">Report fires, floods, blockages, etc.</p>
              </div>
              
              <div className="action-card">
                <div className="action-icon">
                  <HeartHandshake size={24} />
                </div>
                <div className="action-title">Request Help</div>
                <p className="text-xs text-[var(--text-secondary)]">Ask for food, water, medicine, or shelter</p>
              </div>
              
              <div className="action-card">
                <div className="action-icon" style={{backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e'}}>
                  <Search size={24} />
                </div>
                <div className="action-title">Find Shelter</div>
                <p className="text-xs text-[var(--text-secondary)]">Locate nearest safe zones and availability</p>
              </div>

              <div className="action-card">
                <div className="action-icon" style={{backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>
                  <PackagePlus size={24} />
                </div>
                <div className="action-title">Offer Resources</div>
                <p className="text-xs text-[var(--text-secondary)]">Donate supplies or vehicles</p>
              </div>

              <div className="action-card">
                <div className="action-icon" style={{backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6'}}>
                  <Users size={24} />
                </div>
                <div className="action-title">Volunteer</div>
                <p className="text-xs text-[var(--text-secondary)]">Register your skills and availability</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--border-color)] animate-in fade-in duration-500">
            <h3 className="text-xl font-bold mb-6">My Requests & Reports</h3>
            
            <div className="space-y-4">
              <div className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <HeartHandshake size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold">Medical Assistance</h4>
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">Resolved</span>
                    </div>
                    <p className="text-sm text-gray-500 text-sm">Req #1024 • Submitted Today, 10:21 AM</p>
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="text-sm font-semibold text-gray-700 mb-1">Responder: Sarah J.</div>
                  <button className="text-sm text-[var(--accent-teal)] font-semibold hover:underline">View Timeline</button>
                </div>
              </div>

              <div className="border border-gray-100 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold">Road Blockage Reported</h4>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-semibold">Under Review</span>
                    </div>
                    <p className="text-sm text-gray-500">Rep #2045 • Main St. Intersection</p>
                  </div>
                </div>
                <div className="md:text-right">
                  <button className="text-sm text-[var(--accent-teal)] font-semibold hover:underline">View Details</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
           <div className="bg-white rounded-2xl p-6 shadow-sm border border-[var(--border-color)] animate-in fade-in duration-500">
             <h3 className="text-xl font-bold mb-6">Emergency Alerts</h3>
             <div className="space-y-4">
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-4">
                  <div className="mt-1 text-red-600"><AlertTriangle size={24} /></div>
                  <div>
                    <h4 className="font-bold text-red-800">FLASH FLOOD WARNING</h4>
                    <p className="text-sm text-red-700 mt-1">Residents in Sector 17 should move to higher ground immediately. Evacuation shelters at High School open.</p>
                    <p className="text-xs text-red-500 mt-2">Issued 10 mins ago • Valid until 8:00 PM</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4">
                  <div className="mt-1 text-blue-600"><Info size={24} /></div>
                  <div>
                    <h4 className="font-bold text-blue-800">Power Restoration Update</h4>
                    <p className="text-sm text-blue-700 mt-1">Crews are working on restoring power in the Downtown area. Expected resolution in 2 hours.</p>
                    <p className="text-xs text-blue-500 mt-2">Issued 1 hr ago</p>
                  </div>
                </div>
             </div>
           </div>
        )}
      </section>

      {/* SOS Modal Overlay */}
      {sosActive && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setSosActive(false)}>
              <X size={24} />
            </button>
            
            <div className="sos-header">
              <div className="sos-pulse">
                <Radio size={32} />
              </div>
              <div className="text-xs font-bold text-[var(--accent-coral)] tracking-wider uppercase mb-2">SOS Active</div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)]">Help is on the way.</h3>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Your emergency request has been sent to nearby responders.
              </p>
            </div>

            <div className="sos-details">
              <div className="detail-row">
                <span className="detail-label">Request ID</span>
                <span className="detail-value">REQ-2048</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Location</span>
                <span className="detail-value flex items-center gap-1">North District <MapIcon size={12} className="text-gray-400" /></span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Response estimate</span>
                <span className="detail-value text-green-600">8-12 minutes</span>
              </div>
            </div>

            <div className="responder-card">
              <div className="responder-avatar">AM</div>
              <div className="responder-info flex-1">
                <h5>Alex M. <span className="text-xs font-normal text-gray-500 ml-1">assigned</span></h5>
                <p>First responder • 1.2 km away</p>
              </div>
              <div className="text-xs font-bold text-green-600 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> EN ROUTE
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary w-full bg-[var(--text-primary)] text-white hover:bg-[var(--text-secondary)]">
                Keep this screen open <CheckCircle2 size={16} className="ml-1" />
              </button>
              <button className="btn bg-gray-100 text-gray-700 hover:bg-gray-200 p-3" title="Call Emergency Services">
                <PhoneCall size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tailwind utility classes for quick inline styling without huge css file */}
      <style dangerouslySetInnerHTML={{__html: `
        .hidden { display: none; }
        @media (min-width: 768px) { .md\\:flex { display: flex; } .md\\:hidden { display: none; } }
        .flex-wrap { flex-wrap: wrap; }
        .mt-6 { margin-top: 1.5rem; }
        .mt-8 { margin-top: 2rem; }
        .mb-12 { margin-bottom: 3rem; }
        .mb-4 { margin-bottom: 1rem; }
        .mb-6 { margin-bottom: 1.5rem; }
        .pb-20 { padding-bottom: 5rem; }
        .text-center { text-align: center; }
        .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
        @media (min-width: 768px) { .md\\:text-5xl { font-size: 3rem; line-height: 1; } .md\\:flex-row { flex-direction: row; } .md\\:text-right { text-align: right; } }
        .font-extrabold { font-weight: 800; }
        .grid { display: grid; }
        .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
        @media (min-width: 768px) { .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        .w-full { width: 100%; }
        .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
        .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
        .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
        .text-xs { font-size: 0.75rem; line-height: 1rem; }
        .font-semibold { font-weight: 600; }
        .font-bold { font-weight: 700; }
        .uppercase { text-transform: uppercase; }
        .tracking-wider { letter-spacing: 0.05em; }
        .rounded-full { border-radius: 9999px; }
        .rounded-2xl { border-radius: 1rem; }
        .rounded-xl { border-radius: 0.75rem; }
        .bg-white { background-color: rgb(255 255 255); }
        .bg-gray-100 { background-color: rgb(243 244 246); }
        .bg-gray-200 { background-color: rgb(229 231 235); }
        .bg-red-50 { background-color: rgb(254 242 242); }
        .bg-red-100 { background-color: rgb(254 226 226); }
        .bg-red-500 { background-color: rgb(239 68 68); }
        .bg-green-100 { background-color: rgb(220 252 231); }
        .bg-green-500 { background-color: rgb(34 197 94); }
        .bg-blue-50 { background-color: rgb(239 246 255); }
        .bg-blue-100 { background-color: rgb(219 234 254); }
        .bg-blue-500 { background-color: rgb(59 130 246); }
        .bg-orange-50 { background-color: rgb(255 247 237); }
        .bg-orange-100 { background-color: rgb(255 237 213); }
        .bg-orange-200 { background-color: rgb(254 215 170); }
        .bg-orange-500 { background-color: rgb(249 115 22); }
        .text-gray-400 { color: rgb(156 163 175); }
        .text-gray-500 { color: rgb(107 114 128); }
        .text-gray-700 { color: rgb(55 65 81); }
        .text-red-500 { color: rgb(239 68 68); }
        .text-red-600 { color: rgb(220 38 38); }
        .text-red-700 { color: rgb(185 28 28); }
        .text-red-800 { color: rgb(153 27 27); }
        .text-green-600 { color: rgb(22 163 74); }
        .text-green-700 { color: rgb(21 128 61); }
        .text-blue-500 { color: rgb(59 130 246); }
        .text-blue-600 { color: rgb(37 99 235); }
        .text-blue-700 { color: rgb(29 78 216); }
        .text-blue-800 { color: rgb(30 64 175); }
        .text-orange-600 { color: rgb(234 88 12); }
        .text-orange-700 { color: rgb(194 65 12); }
        .text-orange-800 { color: rgb(154 52 18); }
        .border-gray-100 { border-color: rgb(243 244 246); }
        .border-red-100 { border-color: rgb(254 226 226); }
        .border-blue-100 { border-color: rgb(219 234 254); }
        .border-orange-100 { border-color: rgb(255 237 213); }
        .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
        .px-4 { padding-left: 1rem; padding-right: 1rem; }
        .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
        .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
        .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .p-2 { padding: 0.5rem; }
        .p-3 { padding: 0.75rem; }
        .p-4 { padding: 1rem; }
        .p-6 { padding: 1.5rem; }
        .absolute { position: absolute; }
        .top-1\\/4 { top: 25%; }
        .top-1\\/3 { top: 33.333333%; }
        .top-1\\/2 { top: 50%; }
        .left-1\\/4 { left: 25%; }
        .left-1\\/3 { left: 33.333333%; }
        .bottom-1\\/3 { bottom: 33.333333%; }
        .right-1\\/4 { right: 25%; }
        .right-1\\/3 { right: 33.333333%; }
        .w-10 { width: 2.5rem; }
        .h-10 { height: 2.5rem; }
        .w-8 { width: 2rem; }
        .h-8 { height: 2rem; }
        .w-2 { width: 0.5rem; }
        .h-2 { height: 0.5rem; }
        .w-1\\.5 { width: 0.375rem; }
        .h-1\\.5 { height: 0.375rem; }
        .shadow-sm { box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
        .shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
        .flex-1 { flex: 1 1 0%; }
        .shrink-0 { flex-shrink: 0; }
        .-space-x-2 > :not([hidden]) ~ :not([hidden]) { margin-left: -0.5rem; }
        .ml-1 { margin-left: 0.25rem; }
        .ml-4 { margin-left: 1rem; }
        .mr-2 { margin-right: 0.5rem; }
        .mt-0\\.5 { margin-top: 0.125rem; }
        .mt-1 { margin-top: 0.25rem; }
        .mt-2 { margin-top: 0.5rem; }
        .mt-3 { margin-top: 0.75rem; }
        .border-t { border-top-width: 1px; }
        .border-gray-200 { border-color: rgb(229 231 235); }
        .hover\\:underline:hover { text-decoration: underline; }
        .animate-in { animation: fadeIn 0.5s ease-out; }
      `}} />
    </div>
  );
};

export default LandingPage;
