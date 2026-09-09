import React from 'react';
import { SPATIAL_DISTRICTS } from '../../hooks/useSpatialScroll';

interface SpatialMinimapProps {
  activeIndex: number;
  onSelectDistrict: (index: number) => void;
}

export const SpatialMinimap: React.FC<SpatialMinimapProps> = ({ activeIndex, onSelectDistrict }) => {
  return (
    <aside
      className="fixed right-6 top-1/2 -translate-y-1/2 z-40 hidden xl:flex flex-col items-end gap-1.5 pointer-events-auto"
      aria-label="Spatial district navigation"
    >
      <div className="telemetry-tag text-zinc-600 mb-2 mr-1 text-[9px]">
        SPATIAL WAYPOINTS
      </div>

      {SPATIAL_DISTRICTS.map((d) => {
        const isActive = activeIndex === d.index;
        return (
          <button
            key={d.id}
            onClick={() => onSelectDistrict(d.index)}
            className={`group flex items-center gap-2.5 py-1 px-2 rounded transition-all text-right focus:outline-none ${
              isActive
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span
              className={`text-[10px] font-mono tracking-wider transition-opacity duration-200 ${
                isActive ? 'opacity-100 font-semibold text-signal-bright' : 'opacity-40 group-hover:opacity-80'
              }`}
            >
              {d.phase} {d.label}
            </span>

            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isActive
                  ? 'bg-signal w-2.5 h-2.5 shadow-[0_0_8px_rgba(37,99,235,0.8)]'
                  : 'bg-white/20 group-hover:bg-white/40'
              }`}
            />
          </button>
        );
      })}
    </aside>
  );
};
