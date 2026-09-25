import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, BottomNav, showToast } from '../components';
import { Map, Marker, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { 
  fetchReports, CivicReport, 
  fetchDisasters, Disaster,
  fetchResources, Resource,
  fetchRequestsOffers, RequestOffer
} from '../supabase';
import { Search, MapPin, AlertCircle, Home, HeartPulse, Package, Filter, Navigation, X } from 'lucide-react';

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
  const map = useMap("DEMO_MAP_ID");

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (e.detail.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      setDroppedPin({ lat, lng });
      setSelectedItem(null);
    }
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
            if (map) { map.panTo(pos); map.setZoom(13); }
            if (!isSilent) showToast('📍 Approximate location found');
            return;
          }
        }
      } catch {}
      if (!isSilent) showToast("Unable to get location.");
    };

    if (!navigator.geolocation) return fallbackToIP(silent);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setDroppedPin(pos);
        setSelectedItem(null);
        if (map) { map.panTo(pos); map.setZoom(14); }
      },
      (error) => {
        fallbackToIP(silent);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    if (map && !hasRequestedLoc) {
      setHasRequestedLoc(true);
      locateUser(true);
    }
  }, [map, hasRequestedLoc]);

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
          <Map
            defaultZoom={11}
            defaultCenter={{ lat: 31.25471, lng: 75.70434 }}
            disableDefaultUI={true}
            onClick={handleMapClick}
          >
            {/* Render Incidents (Disasters + Reports) */}
            {(filter === 'All' || filter === 'Incident') && disasters.map(d => (
               <Marker
                 key={'dis_'+d.id}
                 position={{ lat: d.latitude || 0, lng: d.longitude || 0 }}
                 onClick={() => { setSelectedItem(d); setItemType('Incident'); setDroppedPin(null); }}
                 icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
               />
            ))}

            {/* Render Shelters */}
            {(filter === 'All' || filter === 'Shelter') && resources.filter(r => r.type === 'Shelter').map(r => (
               <Marker
                 key={'res_'+r.id}
                 position={{ lat: r.latitude || 0, lng: r.longitude || 0 }}
                 onClick={() => { setSelectedItem(r); setItemType('Shelter'); setDroppedPin(null); }}
                 icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
               />
            ))}

            {/* Render Medical (Mocking type checking) */}
            {(filter === 'All' || filter === 'Medical') && resources.filter(r => r.type === 'Medical').map(r => (
               <Marker
                 key={'med_'+r.id}
                 position={{ lat: r.latitude || 0, lng: r.longitude || 0 }}
                 onClick={() => { setSelectedItem(r); setItemType('Medical'); setDroppedPin(null); }}
                 icon="https://maps.google.com/mapfiles/ms/icons/purple-dot.png"
               />
            ))}

            {/* Render Resources */}
            {(filter === 'All' || filter === 'Resource') && reqOffers.map(r => (
               <Marker
                 key={'req_'+r.id}
                 position={{ lat: r.latitude || 0, lng: r.longitude || 0 }}
                 onClick={() => { setSelectedItem(r); setItemType('Resource'); setDroppedPin(null); }}
                 icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
               />
            ))}

            {droppedPin && (
              <Marker
                position={droppedPin}
                icon="https://maps.google.com/mapfiles/ms/icons/yellow-dot.png"
                zIndex={99}
                draggable={true}
                onDragEnd={(e: google.maps.MapMouseEvent) => {
                  if (e.latLng) setDroppedPin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                }}
              />
            )}
          </Map>
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
