import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import MapGL, { Marker as RMGMarker, Source, Layer, MapRef, ViewStateChangeEvent } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || '';
// OpenStreetMap style for MapLibre
const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap Contributors'
    }
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

// --- Types ---
export interface TilerMapProps {
  id?: string;
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  center?: { lat: number; lng: number };
  zoom?: number;
  onClick?: (e: { lat: number; lng: number }) => void;
  style?: React.CSSProperties;
  cursor?: string;
  children?: React.ReactNode;
  gestureHandling?: string;
  interactive?: boolean;
}

export interface TilerMapHandle {
  panTo: (pos: { lat: number; lng: number }) => void;
  setZoom: (z: number) => void;
  flyTo: (pos: { lat: number; lng: number }, zoom?: number) => void;
  getMap: () => maplibregl.Map | undefined;
}

export interface TilerMarkerProps {
  position: { lat: number; lng: number };
  icon?: string;
  emoji?: string;
  color?: string;
  draggable?: boolean;
  zIndex?: number;
  title?: string;
  onClick?: () => void;
  onDragEnd?: (pos: { lat: number; lng: number }) => void;
  children?: React.ReactNode;
}

export interface TilerCircleProps {
  center: { lat: number; lng: number };
  radius: number; // in meters
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
}

// --- Helper: Generate circle GeoJSON ---
function createCircleGeoJSON(center: { lat: number; lng: number }, radiusMeters: number, points = 64) {
  const coords: [number, number][] = [];
  const distRad = radiusMeters / 6378137; // Earth radius in meters
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const lat = Math.asin(
      Math.sin(center.lat * Math.PI / 180) * Math.cos(distRad) +
      Math.cos(center.lat * Math.PI / 180) * Math.sin(distRad) * Math.cos(angle)
    );
    const lng = (center.lng * Math.PI / 180) + Math.atan2(
      Math.sin(angle) * Math.sin(distRad) * Math.cos(center.lat * Math.PI / 180),
      Math.cos(distRad) - Math.sin(center.lat * Math.PI / 180) * Math.sin(lat)
    );
    coords.push([lng * 180 / Math.PI, lat * 180 / Math.PI]);
  }
  return {
    type: 'Feature' as const,
    geometry: { type: 'Polygon' as const, coordinates: [coords] },
    properties: {}
  };
}

// --- TilerMap Component ---
export const TilerMap = forwardRef<TilerMapHandle, TilerMapProps>(
  ({ id, defaultCenter, defaultZoom = 11, center, zoom, onClick, style, cursor, children, interactive = true }, ref) => {
    const mapRef = useRef<MapRef>(null);

    useImperativeHandle(ref, () => ({
      panTo: (pos) => {
        mapRef.current?.easeTo({ center: [pos.lng, pos.lat], duration: 500 });
      },
      setZoom: (z) => {
        mapRef.current?.easeTo({ zoom: z, duration: 500 });
      },
      flyTo: (pos, z) => {
        mapRef.current?.flyTo({ center: [pos.lng, pos.lat], zoom: z, duration: 800 });
      },
      getMap: () => mapRef.current?.getMap(),
    }));

    // Sync controlled center/zoom
    useEffect(() => {
      if (center && mapRef.current) {
        mapRef.current.easeTo({ center: [center.lng, center.lat], duration: 300 });
      }
    }, [center?.lat, center?.lng]);

    useEffect(() => {
      if (zoom !== undefined && mapRef.current) {
        mapRef.current.easeTo({ zoom, duration: 300 });
      }
    }, [zoom]);

    const handleClick = useCallback((e: maplibregl.MapMouseEvent) => {
      if (onClick) {
        onClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    }, [onClick]);

    const initCenter = center || defaultCenter || { lat: 31.25471, lng: 75.70434 };

    return (
      <MapGL
        ref={mapRef}
        mapLib={maplibregl}
        mapStyle={MAP_STYLE}
        initialViewState={{
          longitude: initCenter.lng,
          latitude: initCenter.lat,
          zoom: zoom ?? defaultZoom,
        }}
        style={{ width: '100%', height: '100%', ...style }}
        onClick={handleClick}
        cursor={cursor}
        interactive={interactive}
        attributionControl={false}
      >
        {children}
      </MapGL>
    );
  }
);

TilerMap.displayName = 'TilerMap';


// --- TilerMarker Component ---
export function TilerMarker({
  position, icon, emoji, color = '#3b82f6', draggable = false,
  zIndex, title, onClick, onDragEnd, children
}: TilerMarkerProps) {

  const handleDragEnd = useCallback((e: { lngLat: maplibregl.LngLat }) => {
    if (onDragEnd) {
      onDragEnd({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    }
  }, [onDragEnd]);

  // If custom icon URL is given, render an img-based marker
  if (icon) {
    return (
      <RMGMarker
        longitude={position.lng}
        latitude={position.lat}
        draggable={draggable}
        onDragEnd={handleDragEnd}
        onClick={(e) => { e.originalEvent.stopPropagation(); onClick?.(); }}
        style={{ zIndex: zIndex ?? 1 }}
      >
        <img
          src={icon}
          alt={title || 'marker'}
          style={{ width: 32, height: 32, cursor: onClick ? 'pointer' : 'default' }}
          title={title}
        />
      </RMGMarker>
    );
  }

  // Emoji marker
  if (emoji) {
    return (
      <RMGMarker
        longitude={position.lng}
        latitude={position.lat}
        draggable={draggable}
        onDragEnd={handleDragEnd}
        onClick={(e) => { e.originalEvent.stopPropagation(); onClick?.(); }}
        style={{ zIndex: zIndex ?? 1 }}
      >
        <div
          title={title}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'white', border: '2px solid #333',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, cursor: onClick ? 'pointer' : 'default',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
          }}
        >
          {emoji}
        </div>
      </RMGMarker>
    );
  }

  // Default colored dot marker
  if (children) {
    return (
      <RMGMarker
        longitude={position.lng}
        latitude={position.lat}
        draggable={draggable}
        onDragEnd={handleDragEnd}
        onClick={(e) => { e.originalEvent.stopPropagation(); onClick?.(); }}
        style={{ zIndex: zIndex ?? 1 }}
      >
        {children}
      </RMGMarker>
    );
  }

  return (
    <RMGMarker
      longitude={position.lng}
      latitude={position.lat}
      draggable={draggable}
      onDragEnd={handleDragEnd}
      onClick={(e) => { e.originalEvent.stopPropagation(); onClick?.(); }}
      color={color}
      style={{ zIndex: zIndex ?? 1 }}
    />
  );
}


// --- TilerCircle Component (GeoJSON-based) ---
let circleCounter = 0;
export function TilerCircle({
  center, radius, fillColor = '#3b82f6', fillOpacity = 0.08,
  strokeColor = '#3b82f6', strokeOpacity = 0.5, strokeWeight = 2
}: TilerCircleProps) {
  const idRef = useRef(`tiler-circle-${++circleCounter}`);
  const geojson = createCircleGeoJSON(center, radius);

  return (
    <Source id={idRef.current} type="geojson" data={geojson as any}>
      <Layer
        id={`${idRef.current}-fill`}
        type="fill"
        paint={{
          'fill-color': fillColor,
          'fill-opacity': fillOpacity,
        }}
      />
      <Layer
        id={`${idRef.current}-stroke`}
        type="line"
        paint={{
          'line-color': strokeColor,
          'line-opacity': strokeOpacity,
          'line-width': strokeWeight,
        }}
      />
    </Source>
  );
}
