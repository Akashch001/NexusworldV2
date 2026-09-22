import React, { useState, useRef, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Globe } from 'lucide-react';
import type { VisitorSession } from '../warm-theme/tokens';

// Fallback coordinate mapping for world countries and major tech cities
const CITY_GEO_LOOKUP: Record<string, [number, number]> = {
  // India
  kolkata: [22.5726, 88.3639],
  calcutta: [22.5726, 88.3639],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  mumbai: [19.0760, 72.8777],
  delhi: [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  hyderabad: [17.3850, 78.4867],
  chennai: [13.0827, 80.2707],
  pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714],
  // US & Americas
  'new york': [40.7128, -74.0060],
  'san francisco': [37.7749, -122.4194],
  los_angeles: [34.0522, -118.2437],
  seattle: [47.6062, -122.3321],
  austin: [30.2672, -97.7431],
  chicago: [41.8781, -87.6298],
  boston: [42.3601, -71.0589],
  toronto: [43.6532, -79.3832],
  vancouver: [49.2827, -123.1207],
  montreal: [45.5017, -73.5673],
  'sao paulo': [-23.5505, -46.6333],
  // Europe
  london: [51.5074, -0.1278],
  berlin: [52.5200, 13.4050],
  paris: [48.8566, 2.3522],
  amsterdam: [52.3676, 4.9041],
  dublin: [53.3498, -6.2603],
  frankfurt: [50.1109, 8.6821],
  stockholm: [59.3293, 18.0686],
  zurich: [47.3769, 8.5417],
  madrid: [40.4168, -3.7038],
  // Asia-Pacific & Middle East
  singapore: [1.3521, 103.8198],
  tokyo: [35.6762, 139.6503],
  sydney: [ -33.8688, 151.2093],
  melbourne: [-37.8136, 144.9631],
  dubai: [25.2048, 55.2708],
  'tel aviv': [32.0853, 34.7818],
  seoul: [37.5665, 126.9780],
  hong_kong: [22.3193, 114.1694],
};

const COUNTRY_GEO_LOOKUP: Record<string, [number, number]> = {
  in: [20.5937, 78.9629],
  india: [20.5937, 78.9629],
  us: [37.0902, -95.7129],
  usa: [37.0902, -95.7129],
  'united states': [37.0902, -95.7129],
  gb: [55.3781, -3.4360],
  uk: [55.3781, -3.4360],
  'united kingdom': [55.3781, -3.4360],
  de: [51.1657, 10.4515],
  germany: [51.1657, 10.4515],
  ca: [56.1304, -106.3468],
  canada: [56.1304, -106.3468],
  au: [-25.2744, 133.7751],
  australia: [-25.2744, 133.7751],
  fr: [46.2276, 2.2137],
  france: [46.2276, 2.2137],
  nl: [52.1326, 5.2913],
  netherlands: [52.1326, 5.2913],
  sg: [1.3521, 103.8198],
  singapore: [1.3521, 103.8198],
  jp: [36.2048, 138.2529],
  japan: [36.2048, 138.2529],
  ae: [23.4241, 53.8478],
  uae: [23.4241, 53.8478],
};

// Simplified SVG Landmass paths in equirectangular projection (viewBox 0 0 1000 500)
const WORLD_CONTINENTS = [
  // North America
  "M 150 70 L 260 70 L 310 110 L 290 190 L 240 210 L 190 280 L 170 250 L 150 200 L 110 170 L 90 100 Z",
  // Greenland
  "M 330 30 L 400 30 L 390 90 L 340 100 Z",
  // South America
  "M 260 280 L 340 280 L 370 340 L 330 460 L 290 470 L 270 380 L 240 310 Z",
  // Europe
  "M 470 80 L 580 80 L 600 130 L 570 170 L 510 180 L 460 160 L 460 110 Z",
  // Africa
  "M 470 190 L 590 190 L 620 280 L 570 410 L 510 420 L 460 300 L 450 220 Z",
  // Asia & Middle East
  "M 580 80 L 870 80 L 890 170 L 830 250 L 780 230 L 730 300 L 670 270 L 640 230 L 590 180 Z",
  // Australia
  "M 790 330 L 890 330 L 900 420 L 830 430 L 780 390 Z",
  // Major Islands (UK, Japan, Indonesia/NZ)
  "M 450 110 L 470 110 L 465 140 L 445 135 Z", // UK/Ireland
  "M 890 160 L 915 180 L 900 220 L 880 190 Z", // Japan
  "M 750 280 L 820 280 L 840 310 L 760 305 Z", // Indonesia
];

export function resolveCoordinates(
  lat?: number | null,
  lon?: number | null,
  city?: string | null,
  country?: string | null
): [number, number] | null {
  if (typeof lat === 'number' && typeof lon === 'number' && !isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0)) {
    return [lat, lon];
  }

  if (city) {
    const cleanCity = city.toLowerCase().trim();
    if (CITY_GEO_LOOKUP[cleanCity]) return CITY_GEO_LOOKUP[cleanCity];
    for (const [k, v] of Object.entries(CITY_GEO_LOOKUP)) {
      if (cleanCity.includes(k) || k.includes(cleanCity)) return v;
    }
  }

  if (country) {
    const cleanCountry = country.toLowerCase().split('|')[0].trim();
    if (COUNTRY_GEO_LOOKUP[cleanCountry]) return COUNTRY_GEO_LOOKUP[cleanCountry];
    const fullCountry = (country.split('|')[1] || country).toLowerCase().trim();
    if (COUNTRY_GEO_LOOKUP[fullCountry]) return COUNTRY_GEO_LOOKUP[fullCountry];
  }

  return null;
}

// Convert [lat, lon] to SVG coordinate [x, y] on a 1000x500 map
function projectToSvg(lat: number, lon: number): [number, number] {
  // Clamping
  const clampedLat = Math.max(-80, Math.min(84, lat));
  const clampedLon = Math.max(-180, Math.min(180, lon));

  const x = ((clampedLon + 180) / 360) * 1000;
  const y = ((90 - clampedLat) / 180) * 500;
  return [x, y];
}

interface GlobalVisitorMapProps {
  visitors: VisitorSession[];
  humanRequestTokens?: Set<string>;
  onSelectVisitor?: (visitor: VisitorSession) => void;
  height?: string | number;
}

export const GlobalVisitorMap: React.FC<GlobalVisitorMapProps> = ({
  visitors,
  humanRequestTokens = new Set(),
  onSelectVisitor,
  height = 360,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeTooltip, setActiveTooltip] = useState<{
    visitor: VisitorSession;
    x: number;
    y: number;
    hasHumanRequest: boolean;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Filter only real active visitors with resolvable coordinates
  const activeMappedPoints = useMemo(() => {
    return visitors
      .map((v) => {
        const coords = resolveCoordinates(
          (v as any).latitude,
          (v as any).longitude,
          v.city,
          v.country
        );
        if (!coords) return null;
        const [x, y] = projectToSvg(coords[0], coords[1]);
        const hasHumanRequest = humanRequestTokens.has(v.visitor_token);
        return {
          visitor: v,
          x,
          y,
          coords,
          hasHumanRequest,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [visitors, humanRequestTokens]);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.35, 3.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.35, 0.9));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl bg-[#FBF9F4] border border-[#D9D4CA] overflow-hidden select-none"
      style={{ height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsDragging(false);
        setActiveTooltip(null);
      }}
    >
      {/* Map Surface Background Grid */}
      <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#D9D4CA_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Interactive Map Header Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <div className="px-2.5 py-1 rounded-md bg-[#FBF9F4]/90 backdrop-blur-xs border border-[#D9D4CA] flex items-center gap-2 shadow-xs">
          <Globe className="w-3.5 h-3.5 text-[#716D65]" />
          <span className="text-[11px] font-mono font-medium text-[#242321]">
            LIVE GLOBAL TELEMETRY
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#EEEAE1] text-[#716D65]">
            {activeMappedPoints.length} ON MAP
          </span>
        </div>
      </div>

      {/* Map Zoom Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-[#FBF9F4]/90 backdrop-blur-xs border border-[#D9D4CA] rounded-md p-0.5 shadow-xs">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 text-[#716D65] hover:text-[#242321] hover:bg-[#EEEAE1] rounded transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 text-[#716D65] hover:text-[#242321] hover:bg-[#EEEAE1] rounded transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleReset}
          title="Reset Map View"
          className="p-1.5 text-[#716D65] hover:text-[#242321] hover:bg-[#EEEAE1] rounded transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main SVG Vector Canvas */}
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full cursor-grab active:cursor-grabbing transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Ocean Background / Bounding Box */}
        <rect width="1000" height="500" fill="transparent" />

        {/* Equatorial & Tropic Guideline Grid (Editorial warm style) */}
        <g stroke="#D9D4CA" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.6">
          <line x1="0" y1="250" x2="1000" y2="250" /> {/* Equator */}
          <line x1="0" y1="175" x2="1000" y2="175" /> {/* Tropic of Cancer */}
          <line x1="0" y1="325" x2="1000" y2="325" /> {/* Tropic of Capricorn */}
          <line x1="500" y1="0" x2="500" y2="500" /> {/* Prime Meridian */}
        </g>

        {/* Landmass Paths */}
        <g fill="#EEEAE1" stroke="#D9D4CA" strokeWidth="1" strokeLinejoin="round">
          {WORLD_CONTINENTS.map((d, i) => (
            <path key={i} d={d} className="hover:fill-[#E6E0D5] transition-colors" />
          ))}
        </g>

        {/* Real Active Visitor Markers */}
        <g>
          {activeMappedPoints.map(({ visitor, x, y, hasHumanRequest }) => {
            const markerColor = hasHumanRequest ? '#B56A45' : '#4F8A5B';

            return (
              <g
                key={visitor.id}
                className="cursor-pointer group"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectVisitor) onSelectVisitor(visitor);
                }}
                onMouseEnter={() => {
                  setActiveTooltip({
                    visitor,
                    x,
                    y,
                    hasHumanRequest,
                  });
                }}
              >
                {/* Subtle Pulse Halo */}
                <circle
                  cx={x}
                  cy={y}
                  r="7"
                  fill={markerColor}
                  opacity="0.25"
                  className="animate-ping origin-center"
                />
                {/* Secondary Ring */}
                <circle
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill={markerColor}
                  opacity="0.4"
                />
                {/* Core Dot (Tiny and crisp) */}
                <circle
                  cx={x}
                  cy={y}
                  r="2.5"
                  fill={markerColor}
                  stroke="#FBF9F4"
                  strokeWidth="0.75"
                />
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Active Visitor Tooltip */}
      {activeTooltip && (
        <div
          className="absolute z-20 pointer-events-auto bg-[#FBF9F4] border border-[#D9D4CA] rounded-lg p-2.5 shadow-md text-xs min-w-[180px] -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: `calc(50% + ${pan.x + (activeTooltip.x - 500) * zoom}px)`,
            top: `calc(50% + ${pan.y + (activeTooltip.y - 250) * zoom}px - 10px)`,
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#D9D4CA] pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 font-mono font-medium text-[#242321]">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  activeTooltip.hasHumanRequest ? 'bg-[#B56A45]' : 'bg-[#4F8A5B]'
                }`}
              />
              <span>{activeTooltip.visitor.ip_masked || 'Visitor'}</span>
            </div>
            {activeTooltip.hasHumanRequest && (
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#B56A45] text-white">
                HUMAN REQ
              </span>
            )}
          </div>

          <div className="space-y-1 text-[11px] text-[#716D65]">
            <div className="flex items-center gap-1 text-[#242321]">
              <MapPin className="w-3 h-3 text-[#716D65]" />
              <span>
                {activeTooltip.visitor.city ? `${activeTooltip.visitor.city}, ` : ''}
                {activeTooltip.visitor.country?.split('|')[1] || activeTooltip.visitor.country || 'Approximate location'}
              </span>
            </div>
            <div className="font-mono text-[10px]">
              Page: <span className="text-[#242321]">{activeTooltip.visitor.current_url || '/'}</span>
            </div>
            <div className="text-[10px] text-[#716D65]">
              Device: {activeTooltip.visitor.device_type} · {activeTooltip.visitor.browser}
            </div>
          </div>

          {onSelectVisitor && (
            <button
              onClick={() => onSelectVisitor(activeTooltip.visitor)}
              className="mt-2 w-full text-center text-[10px] font-medium text-[#242321] hover:bg-[#EEEAE1] py-1 rounded transition-colors border border-[#D9D4CA]"
            >
              View Visitor Story
            </button>
          )}
        </div>
      )}

      {/* Honest Empty State when 0 active points */}
      {activeMappedPoints.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#FBF9F4]/75 pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-[#EEEAE1] flex items-center justify-center text-[#716D65] mb-2">
            <Globe className="w-4 h-4" />
          </div>
          <div className="text-xs font-semibold text-[#242321]">No active visitors on the map</div>
          <div className="text-[11px] text-[#716D65] max-w-xs mt-0.5">
            When visitors explore nexusworld.in, their approximate locations will appear here in real time.
          </div>
        </div>
      )}
    </div>
  );
};
