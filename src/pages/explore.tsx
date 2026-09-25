import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, showToast } from '../components';
import { Map, Marker, useMap, MapMouseEvent } from '@vis.gl/react-google-maps';
import { fetchReports, CivicReport } from '../supabase';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState<CivicReport | null>(null);
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hasRequestedLoc, setHasRequestedLoc] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{lat: number, lng: number} | null>(null);
  const map = useMap("DEMO_MAP_ID");

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (e.detail.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      setDroppedPin({ lat, lng });
      setSelectedIssue(null);
    }
  }, []);

  const locateUser = (silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) showToast("Geolocation is not supported by your browser.");
      fallbackToIP(silent);
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      setUserLocation(pos);
      if (map) {
        map.panTo(pos);
        map.setZoom(15);
      }
    };

    // IP-based fallback for approximate location
    const fallbackToIP = async (isSilent: boolean) => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const pos = { lat: data.latitude, lng: data.longitude };
            setUserLocation(pos);
            if (map) {
              map.panTo(pos);
              map.setZoom(13);
            }
            return;
          }
        }
      } catch {
        // ignore
      }
      if (!isSilent) showToast("Unable to get location. Please check GPS settings.");
    };

    const onError = (error: GeolocationPositionError) => {
      // If high-accuracy timed out, retry with low accuracy
      if (error.code === error.TIMEOUT) {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          () => fallbackToIP(silent),
          { enableHighAccuracy: false, timeout: 15000, maximumAge: Infinity }
        );
        return;
      }
      console.warn("Geolocation unavailable, using IP fallback.");
      fallbackToIP(silent);
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
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
        const data = await fetchReports();
        if (data && data.length > 0) {
          setReports(data);
        } else {
          setReports([
            {
              id: 'demo-1',
              ticket_id: '#CF1024',
              category: 'Pothole',
              description: 'Severe road depression on Main St.',
              location_address: 'LPU',
              latitude: 31.25471,
              longitude: 75.70434,
              image_url: '/pothole.jpg',
              status: 'In Progress',
              priority: 'High',
              department: 'Roads & Infrastructure'
            }
          ]);
        }
      } catch (err) {
        console.error('Failed to fetch map markers from Supabase:', err);
      }
    }
    load();
  }, []);

  const filteredReports = reports.filter(r => {
    if (r.status === 'Cancelled') return false;
    
    const matchesFilter = filter === 'All' || (r.category && r.category.toLowerCase().includes(filter.toLowerCase()));
    const matchesSearch = !searchTerm || 
      (r.ticket_id && r.ticket_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.category && r.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.location_address && r.location_address.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    if (searchTerm && filteredReports.length > 0 && map) {
      map.panTo({ lat: filteredReports[0].latitude, lng: filteredReports[0].longitude });
    }
  }, [searchTerm, filteredReports, map]);

  return (
    <div className="w-full h-screen flex flex-col">
      <main className="flex-1 relative w-full h-full overflow-hidden bg-surface">
        <button 
          onClick={() => navigate('/home')} 
          className="absolute top-4 left-4 z-20 w-12 h-12 rounded-full bg-surface-container-lowest text-on-surface shadow-md flex items-center justify-center hover:bg-surface-container-low transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="absolute inset-0 bg-surface-container">
          <Map
            defaultZoom={15}
            defaultCenter={{ lat: 31.25471, lng: 75.70434 }}
            mapId="DEMO_MAP_ID"
            disableDefaultUI={true}
            onClick={handleMapClick}
          >
            {filteredReports.map((issue) => (
              <Marker
                key={issue.id || issue.ticket_id}
                position={{ lat: issue.latitude, lng: issue.longitude }}
                onClick={() => { setSelectedIssue(issue); setDroppedPin(null); }}
                title={`${issue.ticket_id} - ${issue.category}`}
              />
            ))}
            {userLocation && (
              <Marker 
                position={userLocation} 
                icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
                title="Your Location"
                zIndex={100}
              />
            )}
            {droppedPin && (
              <Marker
                position={droppedPin}
                icon="https://maps.google.com/mapfiles/ms/icons/green-dot.png"
                title="Dropped Pin"
                zIndex={99}
                draggable={true}
                onDragEnd={(e: google.maps.MapMouseEvent) => {
                  if (e.latLng) {
                    setDroppedPin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                  }
                }}
              />
            )}
          </Map>
        </div>

        <div className="absolute top-20 left-4 right-4 md:left-4 md:right-auto z-10 flex flex-col gap-3 pointer-events-none">
          <div className="pointer-events-auto bg-surface-container-lowest/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-outline-variant/30 p-2.5 flex items-center gap-3 w-full md:w-96 transition-all focus-within:bg-surface-container-lowest focus-within:shadow-[0_8px_32px_rgba(0,55,176,0.15)] focus-within:border-primary/30">
            <span className="material-symbols-outlined text-on-surface-variant pl-2">search</span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Supabase issues or ID..." 
              className="bg-transparent border-none outline-none font-body-md text-body-md text-on-surface w-full placeholder:text-on-surface-variant/60" 
            />
          </div>
          <div className="pointer-events-auto flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {['All', 'Pothole', 'Streetlight', 'Water'].map((cat) => (
              <button 
                key={cat}
                onClick={() => setFilter(cat)}
                className={`shrink-0 px-4 py-2 rounded-xl font-label-md text-label-md transition-all ${
                  filter === cat
                    ? 'bg-primary text-on-primary font-bold shadow-[0_4px_12px_rgba(0,55,176,0.25)]'
                    : 'bg-surface-container-lowest/90 backdrop-blur-md text-on-surface-variant font-medium shadow-sm border border-outline-variant/30 hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                {cat === 'All' ? 'All Issues' : `${cat}s`}
              </button>
            ))}
          </div>
        </div>
        
        <div className={`absolute bottom-8 left-4 right-4 md:left-8 md:w-96 z-10 bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-outline-variant/30 p-space-md flex flex-col gap-3 transition-all duration-300 pointer-events-auto ${selectedIssue ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-48 opacity-0 scale-95 pointer-events-none'}`}>
          {selectedIssue && (
            <>
              <div className="flex gap-4">
                <div className="w-20 h-20 shrink-0 rounded-2xl bg-surface-container overflow-hidden shadow-inner relative">
                  <img src={selectedIssue.image_url || '/pothole.jpg'} className="w-full h-full object-cover" alt="Issue thumbnail" />
                  {selectedIssue.priority === 'High' && <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-error shadow-[0_0_12px_rgba(186,26,26,0.9)] animate-pulse border border-surface-container-lowest"></div>}
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-sm text-[11px] font-bold uppercase tracking-widest text-primary">{selectedIssue.ticket_id}</span>
                    <span className={`font-label-sm text-[10px] px-2 py-0.5 rounded-md font-bold shadow-sm ${selectedIssue.priority === 'High' ? 'bg-error text-on-error' : 'bg-secondary text-on-secondary'}`}>
                      {selectedIssue.priority} Priority
                    </span>
                  </div>
                  <h4 className="font-title-md text-title-md text-on-surface font-bold truncate tracking-tight">{selectedIssue.category}</h4>
                  <span className="font-body-sm text-body-sm text-on-surface-variant truncate flex items-center gap-1.5 mt-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                    {selectedIssue.location_address}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/tracking?id=${encodeURIComponent(selectedIssue.ticket_id)}`)}
                  className="flex-1 py-2 rounded-xl bg-primary text-on-primary font-title-sm text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors"
                >
                  <span>Track Issue Live</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
              <button onClick={() => setSelectedIssue(null)} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-surface-container-lowest shadow-lg flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error/10 transition-all border border-outline-variant/20">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </>
          )}
        </div>
        
        {/* Dropped Pin Card */}
        <div className={`absolute bottom-8 left-4 right-4 md:left-8 md:w-96 z-10 bg-surface-container-lowest/95 backdrop-blur-2xl rounded-3xl shadow-[0_16px_40px_rgba(0,0,0,0.12)] border border-outline-variant/30 p-space-md flex flex-col gap-3 transition-all duration-300 pointer-events-auto ${droppedPin && !selectedIssue ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-48 opacity-0 scale-95 pointer-events-none'}`}>
          {droppedPin && (
            <>
              <div className="flex gap-4">
                <div className="w-14 h-14 shrink-0 rounded-2xl bg-tertiary-container/30 flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-[28px] text-tertiary">location_on</span>
                </div>
                <div className="flex-1 flex flex-col justify-center min-w-0 py-1">
                  <span className="font-label-sm text-[11px] font-bold uppercase tracking-widest text-tertiary">Dropped Pin</span>
                  <span className="font-mono text-[12px] text-on-surface-variant mt-1">
                    {droppedPin.lat.toFixed(5)}, {droppedPin.lng.toFixed(5)}
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant/70 mt-0.5">
                    Drag the green pin to adjust position
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/report?lat=${droppedPin.lat}&lng=${droppedPin.lng}`)}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-title-sm text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  <span>Report Issue Here</span>
                </button>
                <button 
                  onClick={() => setDroppedPin(null)}
                  className="py-2.5 px-4 rounded-xl bg-surface-container-low text-on-surface-variant font-title-sm text-xs font-bold flex items-center justify-center gap-1 hover:bg-surface-container transition-colors border border-outline-variant/20"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                  Clear
                </button>
              </div>
            </>
          )}
        </div>
        
        <button onClick={() => locateUser(false)} className="absolute bottom-8 right-4 md:right-8 z-10 w-12 h-12 rounded-full bg-surface-container-lowest text-primary shadow-lg border border-outline-variant/20 flex items-center justify-center hover:bg-surface-container-low transition-colors active:scale-95 pointer-events-auto" type="button" aria-label="Recenter map">
          <span className="material-symbols-outlined">my_location</span>
        </button>
      </main>
    </div>
  );
}
