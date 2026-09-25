import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, BottomNav } from '../components';
import { fetchDisasters, fetchResources, Disaster, Resource, fetchRequestsOffers, RequestOffer } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Map, HeartHandshake, Package, ArrowRight, ArrowUpRight, CheckCircle2, ClipboardList, History, RadioReceiver, MapPin } from 'lucide-react';
import { WeatherWidget } from '../WeatherWidget';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [offers, setOffers] = useState<RequestOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sosStep, setSosStep] = useState(0); // 0 = idle, 1 = confirm, 2 = active

  useEffect(() => {
    async function load() {
      try {
        const [d, r, o] = await Promise.all([
          fetchDisasters(),
          fetchResources(),
          fetchRequestsOffers('Request')
        ]);
        setDisasters(d || []);
        setResources(r || []);
        setOffers(o || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeDisastersCount = disasters.filter(d => d.status === 'Active').length;
  const shelterCount = resources.filter(r => r.type === 'Shelter').length;
  
  // SOS Functions
  const triggerSOS = () => setSosStep(1);
  const confirmSOS = () => setSosStep(2);
  const cancelSOS = () => setSosStep(0);

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Citizen';

  return (
    <div className="bg-surface-muted min-h-screen">
      <Header />
      <main className="w-full pt-28 pb-32 md:pb-8">
        <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-6 animate-fade-in">
          
          {/* Greeting */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-text-primary">
              Hello, {displayName} 👋
            </h1>
            <p className="text-text-secondary mt-1 font-medium">Your disaster response coordination dashboard.</p>
          </div>

          {/* Hero Cards (CivicFix Style) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            
            {/* Primary Action */}
            <div 
              onClick={triggerSOS}
              className="md:col-span-3 bg-critical text-white rounded-[24px] p-6 cursor-pointer relative overflow-hidden shadow-glow-critical hover:scale-[1.02] transition-transform flex flex-col justify-between min-h-[180px] group"
            >
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
              <div className="flex justify-between items-start relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md shadow-sm">
                  <RadioReceiver className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-6 h-6 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="mt-8 relative z-10">
                <h3 className="text-2xl font-black tracking-tight">Request SOS</h3>
                <p className="text-white/90 text-sm mt-1 font-medium">Immediate life-threatening situations</p>
              </div>
            </div>

            {/* Secondary Action */}
            <Link 
              to="/map" 
              className="md:col-span-2 bg-white text-text-primary rounded-[24px] p-6 shadow-card hover:shadow-elevated transition-all border border-border-light flex flex-col justify-between min-h-[180px] group"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-surface-muted rounded-xl flex items-center justify-center text-brand-600 group-hover:bg-brand-50 transition-colors shadow-sm border border-border-light">
                  <Map className="w-6 h-6" />
                </div>
                <ArrowRight className="w-6 h-6 text-text-secondary group-hover:text-text-primary transition-colors group-hover:translate-x-1" />
              </div>
              <div className="mt-8">
                <h3 className="text-xl font-bold tracking-tight">Operations Map</h3>
                <p className="text-text-secondary text-sm mt-1 font-medium">Live citywide hazard tracker</p>
              </div>
            </Link>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-light flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100">
                <ClipboardList className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="font-black text-xl text-text-primary leading-none mb-1">{loading ? '-' : offers.length}</div>
                <div className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Active Requests</div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-border-light flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-safe/10 flex items-center justify-center shrink-0 border border-safe/20">
                <CheckCircle2 className="w-5 h-5 text-safe" />
              </div>
              <div>
                <div className="font-black text-xl text-text-primary leading-none mb-1">{loading ? '-' : shelterCount}</div>
                <div className="text-xs text-text-secondary font-semibold uppercase tracking-wider">Safe Shelters</div>
              </div>
            </div>
          </div>

          {/* Additional Quick Actions Grid */}
          <div className="grid grid-cols-3 gap-3">
            <Link to="/report" className="bg-white rounded-xl p-4 shadow-sm border border-border-light text-center hover:bg-surface-muted transition-colors group">
              <div className="w-10 h-10 mx-auto rounded-full bg-warning/10 text-warning flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-text-primary">Report Issue</span>
            </Link>
            <Link to="/resources" className="bg-white rounded-xl p-4 shadow-sm border border-border-light text-center hover:bg-surface-muted transition-colors group">
              <div className="w-10 h-10 mx-auto rounded-full bg-info/10 text-info flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-text-primary">Resources</span>
            </Link>
            <Link to="/volunteers" className="bg-white rounded-xl p-4 shadow-sm border border-border-light text-center hover:bg-surface-muted transition-colors group">
              <div className="w-10 h-10 mx-auto rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-text-primary">Volunteer</span>
            </Link>
          </div>

          {/* Weather Widget (Hidden on CivicFix, but useful for RESQGRID) */}
          <div className="mt-4">
            <WeatherWidget />
          </div>

          {/* My Recent Reports */}
          <div className="mt-8">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2 mb-4 uppercase tracking-wider">
              <History className="w-4 h-4 text-brand-600" />
              My Recent Reports
            </h2>
            
            <div className="bg-white rounded-[24px] p-10 shadow-sm border border-border-light text-center">
              <div className="w-16 h-16 bg-surface-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-border-light">
                <ClipboardList className="w-8 h-8 text-text-secondary" />
              </div>
              <h3 className="font-bold text-text-primary text-lg mb-2 tracking-tight">No reports filed yet</h3>
              <p className="text-sm text-text-secondary max-w-xs mx-auto font-medium">
                Help improve your neighborhood. Tap "Report Issue" to get started.
              </p>
            </div>
          </div>

        </div>
      </main>
      
      <BottomNav />

      {/* SOS MODALS */}
      {sosStep === 1 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-inverted/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-floating animate-slide-up border-2 border-critical">
            <div className="bg-critical p-6 text-center text-white">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-fast">
                <AlertCircle className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-black">REQUEST SOS</h2>
              <p className="opacity-90 font-medium">You are about to transmit an emergency signal.</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 bg-surface-muted p-3 rounded-xl border border-border-light">
                <MapPin className="w-5 h-5 text-text-secondary" />
                <div className="text-sm">
                  <p className="font-semibold text-text-primary">Location</p>
                  <p className="text-text-secondary">Downtown Metro Area (Detected)</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-bold text-text-primary">What do you need?</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 px-3 border-2 border-brand-500 bg-brand-50 rounded-lg text-brand-700 font-bold text-sm">Medical</button>
                  <button className="py-2 px-3 border border-border-light rounded-lg text-text-secondary font-medium text-sm hover:bg-surface-muted">Rescue</button>
                  <button className="py-2 px-3 border border-border-light rounded-lg text-text-secondary font-medium text-sm hover:bg-surface-muted">Shelter</button>
                  <button className="py-2 px-3 border border-border-light rounded-lg text-text-secondary font-medium text-sm hover:bg-surface-muted">Supplies</button>
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-3">
                <button onClick={cancelSOS} className="py-3 rounded-xl font-bold text-text-secondary bg-surface-muted hover:bg-border-light transition-colors">
                  Cancel
                </button>
                <button onClick={confirmSOS} className="py-3 rounded-xl font-bold text-white bg-critical hover:bg-red-700 shadow-glow-critical transition-all">
                  ACTIVATE SOS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {sosStep === 2 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-critical/90 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-floating animate-slide-up p-8 text-center border-4 border-critical">
            <div className="w-24 h-24 bg-critical text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-critical animate-pulse-fast">
              <RadioReceiver className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-black text-critical mb-2">SOS ACTIVE</h2>
            <p className="text-text-primary font-medium mb-6">Your emergency signal has been broadcasted to nearby responders and authorities.</p>
            
            <div className="bg-surface-muted rounded-xl p-4 text-left space-y-3 mb-8 border border-border-light">
              <div className="flex justify-between items-center border-b border-border-light pb-2">
                <span className="text-sm font-semibold text-text-secondary">Request ID</span>
                <span className="text-sm font-bold text-text-primary">#REQ-8902</span>
              </div>
              <div className="flex justify-between items-center border-b border-border-light pb-2">
                <span className="text-sm font-semibold text-text-secondary">Status</span>
                <span className="text-sm font-bold text-warning">Responder Assigned</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-text-secondary">ETA</span>
                <span className="text-sm font-bold text-text-primary">~8 minutes</span>
              </div>
            </div>

            <button onClick={cancelSOS} className="w-full py-4 rounded-xl font-bold text-text-primary border-2 border-border-light hover:bg-surface-muted transition-colors">
              I AM SAFE NOW (CANCEL)
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
