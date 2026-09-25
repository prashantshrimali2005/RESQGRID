import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header, BottomNav } from '../components';
import { fetchDisasters, fetchResources, Disaster, Resource, fetchRequestsOffers, RequestOffer } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { AlertCircle, Map, HeartHandshake, Package, Navigation, MapPin, Activity, HelpCircle, Phone, RadioReceiver } from 'lucide-react';

export default function DashboardPage() {
  const { user, profile } = useAuth();
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [offers, setOffers] = useState<RequestOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [sosActive, setSosActive] = useState(false);
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

  return (
    <div className="bg-surface-muted min-h-screen">
      <Header />
      <main className="w-full pt-24 pb-32 md:pb-8 md:pl-24">
        <div className="max-w-4xl mx-auto px-4 md:px-8 space-y-6">
          
          {/* Header & Location */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span className="text-sm font-medium">Your current location</span>
              </div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">
                Downtown Metro Area
              </h1>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-card border border-border-light">
              <div className="w-10 h-10 rounded-full bg-safe/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-safe" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">Status: Stable</p>
                <p className="text-xs text-text-secondary">Last updated just now</p>
              </div>
            </div>
          </div>

          {/* Emergency Alert (if any) */}
          {activeDisastersCount > 0 && (
            <div className="bg-critical/10 border border-critical/20 rounded-xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-critical/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-critical" />
              </div>
              <div>
                <h3 className="font-bold text-critical">FLASH FLOOD WARNING</h3>
                <p className="text-sm text-text-primary mt-1 font-medium">Heavy rainfall expected in Sector 4 and 5. Avoid low-lying areas.</p>
                <div className="flex gap-4 mt-2">
                  <span className="text-xs font-semibold text-critical">Valid until: 8:00 PM</span>
                  <Link to="/map" className="text-xs font-bold text-brand-600 underline">View on map</Link>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <h2 className="text-lg font-bold text-text-primary mt-8 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <Link to="/report" className="flex flex-col items-center justify-center gap-3 p-4 bg-white rounded-2xl shadow-card hover:shadow-elevated transition-all border border-border-light group">
              <div className="w-12 h-12 rounded-full bg-critical/10 text-critical flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm text-text-primary">Report Emergency</span>
            </Link>

            <button onClick={triggerSOS} className="flex flex-col items-center justify-center gap-3 p-4 bg-critical text-white rounded-2xl shadow-glow-critical hover:scale-[1.02] active:scale-95 transition-all">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <RadioReceiver className="w-6 h-6" />
              </div>
              <span className="font-bold text-sm">Request SOS</span>
            </button>

            <Link to="/map" className="flex flex-col items-center justify-center gap-3 p-4 bg-white rounded-2xl shadow-card hover:shadow-elevated transition-all border border-border-light group">
              <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Navigation className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm text-text-primary">Live Map</span>
            </Link>

            <Link to="/resources?type=shelter" className="flex flex-col items-center justify-center gap-3 p-4 bg-white rounded-2xl shadow-card hover:shadow-elevated transition-all border border-border-light group">
              <div className="w-12 h-12 rounded-full bg-safe/10 text-safe flex items-center justify-center group-hover:scale-110 transition-transform">
                <Map className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm text-text-primary">Find Shelter</span>
            </Link>

            <Link to="/resources?tab=offer" className="flex flex-col items-center justify-center gap-3 p-4 bg-white rounded-2xl shadow-card hover:shadow-elevated transition-all border border-border-light group">
              <div className="w-12 h-12 rounded-full bg-warning/10 text-warning flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm text-text-primary">Offer Resources</span>
            </Link>

            <Link to="/volunteers" className="flex flex-col items-center justify-center gap-3 p-4 bg-white rounded-2xl shadow-card hover:shadow-elevated transition-all border border-border-light group">
              <div className="w-12 h-12 rounded-full bg-info/10 text-info flex items-center justify-center group-hover:scale-110 transition-transform">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm text-text-primary">Volunteer</span>
            </Link>
          </div>

          {/* Live Status Section */}
          <div className="mt-8 bg-white rounded-2xl p-5 md:p-6 shadow-card border border-border-light">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-brand-600" />
              Live Area Status
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-surface-muted rounded-xl">
                <div className="text-2xl font-black text-critical">{loading ? '-' : activeDisastersCount}</div>
                <div className="text-xs font-semibold text-text-secondary uppercase mt-1">Nearby Incidents</div>
              </div>
              <div className="p-4 bg-surface-muted rounded-xl">
                <div className="text-2xl font-black text-safe">{loading ? '-' : shelterCount}</div>
                <div className="text-xs font-semibold text-text-secondary uppercase mt-1">Active Shelters</div>
              </div>
              <div className="p-4 bg-surface-muted rounded-xl">
                <div className="text-2xl font-black text-brand-600">82%</div>
                <div className="text-xs font-semibold text-text-secondary uppercase mt-1">Shelter Capacity</div>
              </div>
              <div className="p-4 bg-surface-muted rounded-xl">
                <div className="text-2xl font-black text-warning">{loading ? '-' : offers.length}</div>
                <div className="text-xs font-semibold text-text-secondary uppercase mt-1">Pending Requests</div>
              </div>
            </div>
          </div>

        </div>
      </main>
      
      <BottomNav />

      {/* SOS MODALS */}
      {sosStep === 1 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-inverted/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-floating animate-slide-up">
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
            
            <div className="bg-surface-muted rounded-xl p-4 text-left space-y-3 mb-8">
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
