import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, BottomNav, showToast } from '../components';
import { TilerMap, TilerMarker, TilerMapHandle } from '../components';
import React, { useRef } from 'react';
import { 
  fetchReports, CivicReport, 
  fetchDisasters, Disaster,
  fetchResources, Resource,
  fetchRequestsOffers, RequestOffer
} from '../supabase';
import { Search, MapPin, AlertCircle, Home, HeartPulse, Package, Filter, Navigation, X } from 'lucide-react';

const DOME_TEST_PINS = [
  { id: 'dt1', lat: 31.3260, lng: 75.5761, icon: '🚑', type: 'Medical', title: 'Medical Assistance', description: 'Dome Test: Medical Assistance available in Jalandhar.' },
  { id: 'dt2', lat: 31.6339, lng: 74.8722, icon: '🛟', type: 'Incident', title: 'Rescue / Evacuation', description: 'Dome Test: Rescue and Evacuation center in Amritsar.' },
  { id: 'dt3', lat: 30.9009, lng: 75.8572, icon: '💧', type: 'Resource', title: 'Water', description: 'Dome Test: Drinking water distribution in Ludhiana.' },
  { id: 'dt4', lat: 30.3397, lng: 76.3868, icon: '🍲', type: 'Resource', title: 'Food', description: 'Dome Test: Food camp set up in Patiala.' },
  { id: 'dt5', lat: 30.2109, lng: 74.9454, icon: '💊', type: 'Medical', title: 'Medicine', description: 'Dome Test: Medicine supplies available in Bathinda.' },
  { id: 'dt6', lat: 31.5106, lng: 75.9863, icon: '🏠', type: 'Shelter', title: 'Shelter', description: 'Dome Test: Safe shelter provided in Hoshiarpur.' },
  { id: 'dt7', lat: 31.3980, lng: 75.3882, icon: '🚗', type: 'Resource', title: 'Transportation', description: 'Dome Test: Emergency transportation in Kapurthala.' },
  { id: 'dt8', lat: 32.0419, lng: 75.4053, icon: '👨‍👩‍👧', type: 'Shelter', title: 'Family Assistance', description: 'Dome Test: Family assistance and reunification in Gurdaspur.' },
  { id: 'dt9', lat: 30.7333, lng: 76.7794, icon: '🧰', type: 'Resource', title: 'Emergency Supplies', description: 'Dome Test: Emergency toolkits and supplies in Chandigarh.' },
];

const getEmojiIcon = (emoji: string) => {
  return `data:image/svg+xml;charset=UTF-8,` + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="15" fill="white" stroke="#333" stroke-width="2" />
      <text x="50%" y="54%" font-size="18" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    </svg>
  `);
};

export default function MapPage() {
  const navigate = useNavigate();
  
  // Data State
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reqOffers, setReqOffers] = useState<RequestOffer[]>([]);

  // UI State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [itemType, setItemType] = useState<string>(''); // 'Incident', 'Shelter', 'Medical', 'Resource'
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Map State
  const [hasRequestedLoc, setHasRequestedLoc] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{lat: number, lng: number} | null>(null);
  const mapRef = useRef<TilerMapHandle>(null);

  const handleMapClick = useCallback((e: { lat: number; lng: number }) => {
      const lat = e.lat;
      const lng = e.lng;
      setDroppedPin({ lat, lng });
      setSelectedItem(null);
  }, []);

  const locateUser = (silent = false) => {
    const fallbackToIP = async (isSilent: boolean) => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const pos = { lat: Number(data.latitude), lng: Number(data.longitude) };
            setDroppedPin(pos);
            setSelectedItem(null);
            if (mapRef.current) { mapRef.current.panTo(pos); mapRef.current.setZoom(13); }
            if (!isSilent) showToast('📍 Approximate location found');
            return;
          }
        }
      } catch (err) {
        console.warn("IP Geolocation failed:", err);
      }
      
      // Final Fallback for Dome Testing
      const pos = { lat: 31.25471, lng: 75.70434 }; // Punjab center
      setDroppedPin(pos);
      setSelectedItem(null);
      if (mapRef.current) { mapRef.current.panTo(pos); mapRef.current.setZoom(9); }
      if (!isSilent) showToast("📍 Mock location (Punjab) used for Dome Testing.");
    };

    if (!navigator.geolocation) return fallbackToIP(silent);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setDroppedPin(pos);
        setSelectedItem(null);
        if (mapRef.current) { mapRef.current.panTo(pos); mapRef.current.setZoom(14); }
      },
      (error) => {
        console.warn("Geolocation Error:", error);
        fallbackToIP(silent);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    if (mapRef.current && !hasRequestedLoc) {
      setHasRequestedLoc(true);
      locateUser(true);
    }
  }, [hasRequestedLoc]);

  useEffect(() => {
    async function load() {
      try {
        const [repData, disData, resData, reqOffData] = await Promise.all([
          fetchReports(),
          fetchDisasters(),
          fetchResources(),
          fetchRequestsOffers()
        ]);
        setReports(repData || []);
        setDisasters(disData || []);
        setResources(resData || []);
        setReqOffers(reqOffData || []);
      } catch (err) {
        console.error('Failed to fetch map data:', err);
      }
    }
    load();
  }, []);

  const filters = [
    { id: 'All', label: 'All', icon: <Filter className="w-4 h-4" /> },
    { id: 'Incident', label: 'Incidents', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'Shelter', label: 'Shelters', icon: <Home className="w-4 h-4" /> },
    { id: 'Medical', label: 'Medical', icon: <HeartPulse className="w-4 h-4" /> },
    { id: 'Resource', label: 'Resources', icon: <Package className="w-4 h-4" /> }
  ];

  return (
    <div className="w-full h-screen flex flex-col">
      <Header />
      <main className="flex-1 relative w-full h-full overflow-hidden bg-surface-muted">
        
        {/* Floating Search Bar */}
        <div className="absolute top-20 md:top-24 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md z-10">
          <div className="bg-white rounded-full shadow-floating border border-border-light flex items-center px-4 py-3 gap-3">
            <Search className="w-5 h-5 text-text-muted" />
            <input 
              type="text"
              placeholder="Search locations, incidents, resources..."
              className="flex-1 bg-transparent outline-none text-text-primary text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Toggles */}
        <div className="absolute top-[140px] md:top-[160px] left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-10 overflow-x-auto no-scrollbar pb-2">
          <div className="flex gap-2 min-w-max px-2 md:justify-center">
            {filters.map((f) => (
              <button 
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-sm ${
                  filter === f.id
                    ? 'bg-text-primary text-white border-transparent'
                    : 'bg-white text-text-secondary border border-border-light hover:bg-surface-muted'
                }`}
              >
                {f.icon}
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute inset-0 z-0">
          <TilerMap
            ref={mapRef}
            id="DEMO_MAP_ID"
            defaultZoom={11}
            defaultCenter={{ lat: 31.25471, lng: 75.70434 }}
            onClick={handleMapClick}
          >
            {/* Render Incidents (Disasters + Reports) */}
            {(filter === 'All' || filter === 'Incident') && disasters.map(d => (
               <TilerMarker
                 key={'dis_'+d.id}
                 position={{ lat: d.latitude || 0, lng: d.longitude || 0 }}
                 onClick={() => { setSelectedItem(d); setItemType('Incident'); setDroppedPin(null); }}
                 icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
               />
            ))}

            {/* Render Shelters */}
            {(filter === 'All' || filter === 'Shelter') && resources.filter(r => r.type === 'Shelter').map(r => (
               <TilerMarker
                 key={'res_'+r.id}
                 position={{ lat: r.latitude || 0, lng: r.longitude || 0 }}
                 onClick={() => { setSelectedItem(r); setItemType('Shelter'); setDroppedPin(null); }}
                 icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
               />
            ))}

            {/* Render Medical (Mocking type checking) */}
            {(filter === 'All' || filter === 'Medical') && resources.filter(r => r.type === 'Medical').map(r => (
               <TilerMarker
                 key={'med_'+r.id}
                 position={{ lat: r.latitude || 0, lng: r.longitude || 0 }}
                 onClick={() => { setSelectedItem(r); setItemType('Medical'); setDroppedPin(null); }}
                 icon="https://maps.google.com/mapfiles/ms/icons/purple-dot.png"
               />
            ))}

            {/* Render Resources */}
            {(filter === 'All' || filter === 'Resource') && reqOffers.map(r => (
               <TilerMarker
                 key={'req_'+r.id}
                 position={{ lat: r.latitude || 0, lng: r.longitude || 0 }}
                 onClick={() => { setSelectedItem(r); setItemType('Resource'); setDroppedPin(null); }}
                 icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
               />
            ))}

            {/* Render Dome Test Pins */}
            {DOME_TEST_PINS.filter(p => filter === 'All' || filter === p.type).map(p => (
               <TilerMarker
                 key={p.id}
                 position={{ lat: p.lat, lng: p.lng }}
                 onClick={() => { setSelectedItem(p); setItemType(p.type); setDroppedPin(null); }}
                 icon={getEmojiIcon(p.icon)}
               />
            ))}

            {droppedPin && (
              <TilerMarker
                position={droppedPin}
                icon="https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                zIndex={99}
                draggable={true}
                onDragEnd={(e: { lat: number; lng: number }) => {
                  setDroppedPin({ lat: e.lat, lng: e.lng });
                }}
              />
            )}
          </TilerMap>
        </div>
        
        {/* Detail Card Overlay */}
        <div className={`absolute bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-[400px] md:bottom-8 z-10 bg-white rounded-3xl shadow-floating border border-border-light p-5 flex flex-col gap-4 transition-all duration-300 ${selectedItem ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-48 opacity-0 scale-95 pointer-events-none'}`}>
          {selectedItem && (
            <>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                    ${itemType === 'Incident' ? 'bg-critical/10 text-critical' : 
                      itemType === 'Shelter' ? 'bg-safe/10 text-safe' : 
                      itemType === 'Medical' ? 'bg-brand-100 text-brand-600' : 
                      'bg-warning/10 text-warning'}`}
                  >
                    {itemType}
                  </span>
                  {selectedItem.verified && <span className="bg-safe text-white text-[10px] px-1.5 py-0.5 rounded font-bold">Verified</span>}
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-1 rounded-full bg-surface-muted text-text-secondary hover:bg-border-light transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <h4 className="text-lg font-black text-text-primary tracking-tight line-clamp-1">{selectedItem.title || selectedItem.name || selectedItem.category}</h4>
                <p className="text-sm font-medium text-text-secondary mt-1 line-clamp-2">
                  {selectedItem.description}
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => navigate('/resources')}
                  className="flex-1 py-3 rounded-xl bg-text-primary text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-black transition-colors"
                >
                  View Details
                </button>
                <button 
                  className="w-12 h-12 rounded-xl bg-surface-muted text-text-primary border border-border-light flex items-center justify-center hover:bg-border-light transition-colors"
                >
                  <Navigation className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Dropped Pin Card Overlay */}
        <div className={`absolute bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-[400px] md:bottom-8 z-10 bg-white rounded-3xl shadow-floating border border-border-light p-5 flex flex-col gap-4 transition-all duration-300 ${droppedPin && !selectedItem ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-48 opacity-0 scale-95 pointer-events-none'}`}>
          {droppedPin && (
            <>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="pt-1">
                  <h4 className="font-bold text-text-primary">Selected Location</h4>
                  <p className="font-mono text-xs text-text-secondary mt-0.5">
                    {droppedPin.lat.toFixed(5)}, {droppedPin.lng.toFixed(5)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/report?lat=${droppedPin.lat}&lng=${droppedPin.lng}`)}
                  className="flex-1 py-3 rounded-xl bg-critical text-white text-sm font-bold flex items-center justify-center gap-2 shadow-glow-critical"
                >
                  <AlertCircle className="w-4 h-4" /> Report Emergency Here
                </button>
                <button onClick={() => setDroppedPin(null)} className="px-4 py-3 rounded-xl bg-surface-muted text-text-primary font-bold text-sm border border-border-light hover:bg-border-light transition-colors">Clear</button>
              </div>
            </>
          )}
        </div>
        
        <button onClick={() => locateUser(false)} className="absolute bottom-24 right-4 md:bottom-8 md:left-32 z-10 w-14 h-14 rounded-full bg-white text-brand-600 shadow-floating border border-border-light flex items-center justify-center hover:bg-brand-50 transition-colors">
          <Navigation className="w-6 h-6" />
        </button>
      </main>
      <BottomNav active="map" />
    </div>
  );
}
