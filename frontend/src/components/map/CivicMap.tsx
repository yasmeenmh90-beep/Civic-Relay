import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import { IssueCluster } from '../../types/issue';
import { StatusBadge, SeverityBadge } from '../ui/Badge';
import { ZoomIn, ZoomOut, Compass } from 'lucide-react';

export interface CivicMapProps {
  clusters: IssueCluster[];
  selectedCategory?: string;
  onSelectCluster?: (cluster: IssueCluster) => void;
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  interactive?: boolean;
  className?: string;
}

export const CivicMap: React.FC<CivicMapProps> = ({
  clusters,
  selectedCategory = 'all',
  onSelectCluster,
  center = [-122.4194, 37.7749],
  zoom = 12.5,
  interactive = true,
  className = 'h-[550px] w-full',
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<IssueCluster | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const getTileUrls = () => {
    return [
      'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
    ];
  };

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const tiles = getTileUrls();

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: tiles,
            tileSize: 256,
            attribution: '© OpenStreetMap contributors, © CARTO',
          },
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: center,
      zoom: zoom,
      attributionControl: false,
    });

    map.on('load', () => {
      setMapLoaded(true);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers when clusters or category filter change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = clusters.filter((c) => {
      if (selectedCategory === 'all') return true;
      return c.category.toLowerCase().includes(selectedCategory.toLowerCase());
    });

    filtered.forEach((cluster) => {
      // Create custom HTML DOM element for Neon Glowing Marker
      const el = document.createElement('div');
      el.className = 'custom-map-marker group cursor-pointer';

      const isHighSeverity = cluster.severity === 'high' || cluster.severity === 'emergency';
      const isResolved = cluster.status === 'resolved';

      let bgGlow = 'bg-neon-cyan text-slate-950 border-white dark:border-slate-900 shadow-glow-cyan';
      if (isHighSeverity) {
        bgGlow = 'bg-amber-500 text-slate-950 border-white dark:border-slate-900 shadow-glow-warning';
      }
      if (isResolved) {
        bgGlow = 'bg-emerald-500 text-white border-white dark:border-slate-900 shadow-glow-mint';
      }

      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <div class="w-9 h-9 rounded-full border-2 ${bgGlow} flex items-center justify-center font-bold text-xs font-mono transition-transform duration-200 transform group-hover:scale-125">
            ${cluster.count}
          </div>
          <div class="absolute -bottom-1 w-2 h-2 rotate-45 ${isHighSeverity ? 'bg-amber-500' : isResolved ? 'bg-emerald-500' : 'bg-cyan-500'}"></div>
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedCluster(cluster);
        if (onSelectCluster) onSelectCluster(cluster);

        // Pan map smoothly to marker
        mapRef.current?.flyTo({
          center: [cluster.longitude, cluster.latitude],
          zoom: Math.min((mapRef.current.getZoom() || 12) + 2, 16),
          essential: true,
          duration: 1000,
        });
      });

      if (mapRef.current) {
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([cluster.longitude, cluster.latitude])
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      }
    });
  }, [clusters, selectedCategory, onSelectCluster, mapLoaded]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleReset = () => {
    mapRef.current?.flyTo({ center: center, zoom: zoom, essential: true });
    setSelectedCluster(null);
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-border shadow-card bg-surface ${className}`}>
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Map Control Buttons */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-surface/90 backdrop-blur-md p-1.5 rounded-2xl border border-border shadow-subtle">
        <button
          onClick={handleZoomIn}
          title="Zoom in"
          className="p-2 rounded-xl text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom out"
          className="p-2 rounded-xl text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset orientation"
          className="p-2 rounded-xl text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Cluster Detail Popover */}
      {selectedCluster && (
        <div className="absolute bottom-6 left-6 right-6 sm:right-auto sm:max-w-sm z-20 bg-surface/95 backdrop-blur-md border border-neon-cyan/40 p-5 rounded-3xl shadow-2xl text-left animate-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">
                COMMUNITY HOTSPOT
              </span>
              <h4 className="text-base font-bold text-foreground">{selectedCluster.area_name}</h4>
            </div>
            <button
              onClick={() => setSelectedCluster(null)}
              className="text-foreground-muted hover:text-foreground text-xs px-2 py-1 rounded-lg hover:bg-surface-raised cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-3 text-xs">
            <div className="bg-surface-raised p-2 rounded-xl border border-border/60">
              <span className="text-[10px] font-bold text-foreground-muted block">CATEGORY</span>
              <span className="font-bold text-foreground capitalize">{selectedCluster.category}</span>
            </div>
            <div className="bg-surface-raised p-2 rounded-xl border border-border/60">
              <span className="text-[10px] font-bold text-foreground-muted block">TOTAL REPORTS</span>
              <span className="font-bold text-neon-cyan font-mono">{selectedCluster.count} Incidents</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/80">
            <SeverityBadge severity={selectedCluster.severity} size="sm" />
            <StatusBadge status={selectedCluster.status} size="sm" />
          </div>
        </div>
      )}
    </div>
  );
};
