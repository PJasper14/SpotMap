'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';
import Legend from '@/components/Legend';
import Toolbar from '@/components/Toolbar';
import StatsPanel from '@/components/StatsPanel';
import TitleCard from '@/components/TitleCard';

export type NutritionCategory = 'normal' | 'underweight' | 'severe' | 'overweight';

export interface Spot {
  id: string;
  lng: number;
  lat: number;
  category: NutritionCategory;
}

export const CATEGORY_COLORS: Record<NutritionCategory, string> = {
  normal: '#4ade80',
  underweight: '#fde047',
  severe: '#ef4444',
  overweight: '#f97316',
};

export type MapStyle = 'osm' | 'satellite' | 'minimal';

const MAP_STYLES: Record<MapStyle, object> = {
  osm: {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxzoom: 19,
      },
    },
    layers: [{ id: 'osm-tiles', type: 'raster', source: 'osm' }],
  },
  satellite: {
    version: 8,
    sources: {
      satellite: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        attribution: 'Tiles &copy; Esri',
        maxzoom: 19,
      },
    },
    layers: [{ id: 'satellite-tiles', type: 'raster', source: 'satellite' }],
  },
  minimal: {
    version: 8,
    sources: {
      minimal: {
        type: 'raster',
        tiles: ['https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png'],
        tileSize: 256,
        attribution: '&copy; Stadia Maps',
        maxzoom: 20,
      },
    },
    layers: [{ id: 'minimal-tiles', type: 'raster', source: 'minimal' }],
  },
};

const STORAGE_KEY = 'nutrition-spots-v1';

function loadSpots(): Spot[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveSpots(spots: Spot[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(spots));
}

export default function SpotMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import('maplibre-gl').Map | null>(null);
  const markersRef = useRef<Map<string, import('maplibre-gl').Marker>>(new Map());

  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [bearing, setBearing] = useState(0);
  const [legendCollapsed, setLegendCollapsed] = useState(false);
  const [plotMode, setPlotMode] = useState(false);
  const [activeCategory, setActiveCategory] = useState<NutritionCategory>('normal');
  const [spots, setSpots] = useState<Spot[]>([]);
  const [mapStyle, setMapStyle] = useState<MapStyle>('osm');
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);

  const handleToolbarCollapse = () => {
    setToolbarCollapsed((v) => !v);
    // Let the DOM update then resize the map to fill new space
    setTimeout(() => mapInstanceRef.current?.resize(), 50);
  };

  // Keep refs in sync for use inside event handlers
  const plotModeRef = useRef(plotMode);
  const activeCategoryRef = useRef(activeCategory);
  const spotsRef = useRef(spots);
  plotModeRef.current = plotMode;
  activeCategoryRef.current = activeCategory;
  spotsRef.current = spots;

  // Add a marker to the map
  const addMarker = useCallback(async (spot: Spot) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const maplibre = await import('maplibre-gl');

    const el = document.createElement('div');
    el.className = 'spot-marker';
    el.title = spot.category;
    el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${CATEGORY_COLORS[spot.category]}" stroke="white" stroke-width="1.5" stroke-linejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
      <path d="M9 21V12h6v9" stroke="white" stroke-width="1.5"/>
    </svg>`;

    const marker = new maplibre.default.Marker({ element: el, draggable: true })
      .setLngLat([spot.lng, spot.lat])
      .addTo(map);

    // Update position in state after drag
    marker.on('dragend', () => {
      const { lng, lat } = marker.getLngLat();
      const next = spotsRef.current.map((s) =>
        s.id === spot.id ? { ...s, lng, lat } : s
      );
      spotsRef.current = next;
      setSpots(next);
      saveSpots(next);
    });

    // Left-click → cycle category
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const order: NutritionCategory[] = ['normal', 'underweight', 'severe', 'overweight'];
      const current = spotsRef.current.find((s) => s.id === spot.id);
      if (!current) return;
      const nextCat = order[(order.indexOf(current.category) + 1) % order.length];
      const svgEl = el.querySelector('svg');
      if (svgEl) svgEl.setAttribute('fill', CATEGORY_COLORS[nextCat]);
      el.title = nextCat;
      spot.category = nextCat;
      const next = spotsRef.current.map((s) =>
        s.id === spot.id ? { ...s, category: nextCat } : s
      );
      spotsRef.current = next;
      setSpots(next);
      saveSpots(next);
    });

    // Right-click → remove
    el.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      marker.remove();
      markersRef.current.delete(spot.id);
      const next = spotsRef.current.filter((s) => s.id !== spot.id);
      spotsRef.current = next;
      setSpots(next);
      saveSpots(next);
    });

    markersRef.current.set(spot.id, marker);
  }, []);

  useEffect(() => {
    const saved = loadSpots();
    setSpots(saved);
    spotsRef.current = saved;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const maplibre = await import('maplibre-gl');
      const maplibregl = maplibre.default;

      if (cancelled || !mapRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = new maplibregl.Map({
        container: mapRef.current,
        style: MAP_STYLES[mapStyle] as any,
        center: [121.125, 14.277],
        zoom: 13,
        pitch: 0,
        bearing: 0,
        pitchWithRotate: true,
        canvasContextAttributes: { preserveDrawingBuffer: true },
      });

      mapInstanceRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
      map.on('pitchend', () => setPitch(Math.round(map.getPitch())));
      map.on('rotateend', () => setBearing(Math.round(map.getBearing())));

      // Click to plot spots
      map.on('click', (e) => {
        if (!plotModeRef.current) return;
        const spot: Spot = {
          id: crypto.randomUUID(),
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          category: activeCategoryRef.current,
        };
        const next = [...spotsRef.current, spot];
        spotsRef.current = next;
        setSpots(next);
        saveSpots(next);
        addMarker(spot);
      });

      map.on('load', async () => {
        // Re-add saved markers
        for (const spot of spotsRef.current) {
          await addMarker(spot);
        }

        try {
          const res = await fetch(
            'https://nominatim.openstreetmap.org/search?q=Sala,Cabuyao,Laguna,Philippines&format=json&polygon_geojson=1'
          );
          const data = await res.json();

          if (data?.length > 0) {
            const boundaryData = data.find(
              (item: any) =>
                item.geojson &&
                (item.geojson.type === 'Polygon' || item.geojson.type === 'MultiPolygon')
            );

            if (boundaryData) {
              const worldRing = [[-180, 90], [180, 90], [180, -90], [-180, -90], [-180, 90]];
              let barangayRings: number[][][] = [];
              if (boundaryData.geojson.type === 'Polygon') {
                barangayRings = boundaryData.geojson.coordinates;
              } else {
                boundaryData.geojson.coordinates.forEach((poly: number[][][]) => {
                  barangayRings.push(...poly);
                });
              }

              map.addSource('mask', {
                type: 'geojson',
                data: {
                  type: 'Feature',
                  properties: {},
                  geometry: { type: 'Polygon', coordinates: [worldRing, ...barangayRings] },
                } as GeoJSON.Feature,
              });
              map.addLayer({
                id: 'mask-fill', type: 'fill', source: 'mask',
                paint: { 'fill-color': '#f1f5f9', 'fill-opacity': 0.85 },
              });

              map.addSource('boundary', { type: 'geojson', data: boundaryData.geojson });
              map.addLayer({
                id: 'boundary-line', type: 'line', source: 'boundary',
                paint: { 'line-color': '#3b82f6', 'line-width': 3 },
              });

              const coords: number[][] =
                boundaryData.geojson.type === 'Polygon'
                  ? boundaryData.geojson.coordinates[0]
                  : boundaryData.geojson.coordinates[0][0];
              const lngs = coords.map((c: number[]) => c[0]);
              const lats = coords.map((c: number[]) => c[1]);
              map.fitBounds(
                [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                { padding: 40, duration: 800 }
              );
            }
          }
        } catch (err) {
          console.error('Boundary fetch error:', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      });
    })();

    return () => {
      cancelled = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyle]);

  const handlePitchChange = (val: number) => {
    setPitch(val);
    mapInstanceRef.current?.easeTo({ pitch: val, duration: 300 });
  };

  const handleBearingChange = (val: number) => {
    setBearing(val);
    mapInstanceRef.current?.easeTo({ bearing: val, duration: 300 });
  };

  const handleClearSpots = () => {
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();
    setSpots([]);
    spotsRef.current = [];
    saveSpots([]);
  };

  const handleDownloadPdf = async () => {
    const map = mapInstanceRef.current;
    const mapContainer = mapRef.current;
    if (!map || !mapContainer || pdfLoading) return;
    setPdfLoading(true);

    const PAGE_W = 1587; // A3 landscape width in px at 96dpi
    const PAGE_H = 1123; // A3 landscape height

    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // --- Capture overlay panels and record their screen positions BEFORE any resize ---
    type PanelCapture = {
      dataUrl: string;
      w: number; h: number;
      // position relative to the map container (0..1 normalized)
      nx: number; ny: number;
    };

    const capturePanel = async (selector: string): Promise<PanelCapture | null> => {
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return null;
      const elRect = el.getBoundingClientRect();
      const mapRect = mapContainer.getBoundingClientRect();
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      return {
        dataUrl: canvas.toDataURL('image/png'),
        w: canvas.width / 2,
        h: canvas.height / 2,
        // normalized position of the panel's top-left corner within the map container
        nx: (elRect.left - mapRect.left) / mapRect.width,
        ny: (elRect.top - mapRect.top) / mapRect.height,
      };
    };

    const [legendCapture, statsCapture, titleCapture] = await Promise.all([
      capturePanel('.legend-panel'),
      capturePanel('.stats-panel'),
      capturePanel('.title-card'),
    ]);

    // --- Resize map canvas to PDF dimensions and capture ---
    const origW = mapContainer.style.width;
    const origH = mapContainer.style.height;

    try {
      mapContainer.style.width = `${PAGE_W}px`;
      mapContainer.style.height = `${PAGE_H}px`;
      map.resize();

      await new Promise<void>((resolve) => {
        const doCapture = () => {
          map.once('render', () => {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          });
          map.triggerRepaint();
        };
        if (map.loaded()) {
          doCapture();
        } else {
          map.once('idle', doCapture);
        }
      });

      const mapDataUrl = map.getCanvas().toDataURL('image/jpeg', 0.95);

      // --- Compose PDF ---
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [PAGE_W, PAGE_H], putOnlyUsedFonts: true });

      // Map fills the entire page
      pdf.addImage(mapDataUrl, 'JPEG', 0, 0, PAGE_W, PAGE_H);

      // Place each panel at its normalized screen position, scaled to PDF dimensions
      const placePanel = (cap: PanelCapture) => {
        const x = cap.nx * PAGE_W;
        const y = cap.ny * PAGE_H;
        // clamp so panels don't bleed off the edge
        const px = Math.max(0, Math.min(x, PAGE_W - cap.w));
        const py = Math.max(0, Math.min(y, PAGE_H - cap.h));
        pdf.addImage(cap.dataUrl, 'PNG', px, py, cap.w, cap.h);
      };

      if (legendCapture) placePanel(legendCapture);
      if (statsCapture) placePanel(statsCapture);
      if (titleCapture) placePanel(titleCapture);

      // Footer strip
      pdf.setFillColor(30, 41, 59);
      pdf.rect(0, PAGE_H - 18, PAGE_W, 18, 'F');
      pdf.setTextColor(140, 165, 200);
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'normal');
      const now = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
      pdf.text(`Generated: ${now}`, 14, PAGE_H - 6);
      pdf.text('© OpenStreetMap contributors', PAGE_W - 14, PAGE_H - 6, { align: 'right' });

      pdf.save('Nutrition_Spot_Map_Barangay_Sala.pdf');
    } catch (err) {
      console.error('PDF error:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      mapContainer.style.width = origW;
      mapContainer.style.height = origH;
      map.resize();
      setPdfLoading(false);
    }
  };

  return (
    <main
      className={`map-container${plotMode ? ' plot-mode' : ''}`}
      id="printable-area"
    >
      {loading && (
        <div className="map-loader">
          <div className="spinner" />
          <p>Loading map data…</p>
        </div>
      )}

      <TitleCard />

      <Legend collapsed={legendCollapsed} onToggle={() => setLegendCollapsed((v) => !v)} />

      <StatsPanel spots={spots} />

      <Toolbar
        pitch={pitch}
        bearing={bearing}
        onPitchChange={handlePitchChange}
        onBearingChange={handleBearingChange}
        onReset={() => { handlePitchChange(0); handleBearingChange(0); }}
        plotMode={plotMode}
        onTogglePlot={() => setPlotMode((v) => !v)}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        onClearSpots={handleClearSpots}
        mapStyle={mapStyle}
        onMapStyleChange={setMapStyle}
        onDownloadPdf={handleDownloadPdf}
        onPrint={() => window.print()}
        pdfLoading={pdfLoading}
        collapsed={toolbarCollapsed}
        onToggleCollapse={handleToolbarCollapse}
      />

      <div
        id="map"
        ref={mapRef}
        style={{ bottom: toolbarCollapsed ? 0 : 'var(--toolbar-h)' }}
      />
    </main>
  );
}
