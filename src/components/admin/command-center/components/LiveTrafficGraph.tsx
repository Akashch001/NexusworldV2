import React, { useState, useMemo, useRef } from 'react';
import { Radio, Activity } from 'lucide-react';
import type { VisitorSession, VisitorEvent } from '../types';
import { generateTrafficBuckets, type TrafficBucket } from '../utils/trafficAggregation';

interface LiveTrafficGraphProps {
  sessions: VisitorSession[];
  events: VisitorEvent[];
  isRealtimeConnected?: boolean;
}

export const LiveTrafficGraph: React.FC<LiveTrafficGraphProps> = ({
  sessions,
  events,
  isRealtimeConnected = true,
}) => {
  const [rangeMinutes, setRangeMinutes] = useState<15 | 30 | 60>(30);
  const [hoveredBucket, setHoveredBucket] = useState<{
    bucket: TrafficBucket;
    x: number;
    y: number;
    index: number;
  } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Re-aggregate buckets whenever sessions, events, or time range change
  const aggregation = useMemo(() => {
    return generateTrafficBuckets(sessions, events, rangeMinutes);
  }, [sessions, events, rangeMinutes]);

  const { buckets, currentActive, peakActive, hasActivity } = aggregation;

  // Chart Dimensions & Scales
  const viewBoxWidth = 600;
  const viewBoxHeight = 160;
  const padLeft = 32;
  const padRight = 18;
  const padTop = 16;
  const padBottom = 26;

  const chartWidth = viewBoxWidth - padLeft - padRight;
  const chartHeight = viewBoxHeight - padTop - padBottom;

  // Dynamic Y scale with minimum upper bound of 4 for clean baseline
  const maxY = Math.max(4, Math.ceil(peakActive * 1.25));

  // Compute X and Y coordinates for each bucket
  const points = useMemo(() => {
    if (buckets.length === 0) return [];
    return buckets.map((bucket, index) => {
      const x = padLeft + (index / (buckets.length - 1)) * chartWidth;
      const y = padTop + chartHeight - (bucket.activeVisitors / maxY) * chartHeight;
      return { x, y, bucket, index };
    });
  }, [buckets, chartWidth, chartHeight, padLeft, padTop, maxY]);

  // Construct SVG Path String (smooth curve using cubic beziers)
  const { linePath, areaPath } = useMemo(() => {
    if (points.length < 2) return { linePath: '', areaPath: '' };

    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      line += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }

    const baselineY = padTop + chartHeight;
    const area = `${line} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

    return { linePath: line, areaPath: area };
  }, [points, chartHeight, padTop]);

  // Y-axis grid ticks (0, mid, max)
  const yTicks = [0, Math.round(maxY / 2), maxY];

  // X-axis label indices (e.g. show ~5 labels evenly spaced)
  const xLabelIndices = useMemo(() => {
    if (buckets.length === 0) return [];
    const step = Math.ceil(buckets.length / 5);
    const indices: number[] = [];
    for (let i = 0; i < buckets.length; i += step) {
      indices.push(i);
    }
    if (!indices.includes(buckets.length - 1)) {
      indices.push(buckets.length - 1);
    }
    return indices;
  }, [buckets]);

  // Handle Mouse Move for Hover Tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = viewBoxWidth / rect.width;
    const svgX = clientX * scaleX;

    // Find closest point by X distance
    let closest = points[0];
    let minDiff = Math.abs(svgX - points[0].x);

    for (let i = 1; i < points.length; i++) {
      const diff = Math.abs(svgX - points[i].x);
      if (diff < minDiff) {
        minDiff = diff;
        closest = points[i];
      }
    }

    setHoveredBucket({
      bucket: closest.bucket,
      x: closest.x,
      y: closest.y,
      index: closest.index,
    });
  };

  const handleMouseLeave = () => {
    setHoveredBucket(null);
  };

  const lastPoint = points.length > 0 ? points[points.length - 1] : null;

  return (
    <div className="p-5 rounded-2xl bg-[#0A0A0F] border border-white/[0.08] space-y-4 font-mono select-none">
      
      {/* Header: Title, Live Status, Active Metric, and Time Range Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <Radio className={`w-3.5 h-3.5 ${isRealtimeConnected ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
            <span>LIVE TRAFFIC</span>
            <span
              className={`px-1.5 py-0.2 rounded text-[9px] font-bold border uppercase flex items-center gap-1 ${
                isRealtimeConnected
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-zinc-800 text-zinc-400 border-zinc-700'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isRealtimeConnected ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
              <span>{isRealtimeConnected ? 'LIVE' : 'OFFLINE'}</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-1">
            <span className="font-bold text-zinc-200">
              {currentActive} active visitor{currentActive === 1 ? '' : 's'}
            </span>
            <span>•</span>
            <span>Peak: {peakActive}</span>
            <span>•</span>
            <span>{aggregation.totalEvents} events in window</span>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5 self-start sm:self-auto">
          {([15, 30, 60] as const).map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setRangeMinutes(mins)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                rangeMinutes === mins
                  ? 'bg-[#2563EB] text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {mins}M
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-[180px] overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Area Fill Gradient */}
            <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="80%" stopColor="#2563EB" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </linearGradient>

            {/* Glowing filter for line */}
            <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#3B82F6" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Horizontal Grid Lines and Y-Axis Labels */}
          {yTicks.map((val) => {
            const y = padTop + chartHeight - (val / maxY) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartWidth}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="2 2"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-zinc-500 font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X-Axis Time Labels */}
          {xLabelIndices.map((idx) => {
            const pt = points[idx];
            if (!pt) return null;
            return (
              <text
                key={idx}
                x={pt.x}
                y={padTop + chartHeight + 16}
                textAnchor="middle"
                className="text-[9px] fill-zinc-500 font-mono"
              >
                {pt.bucket.label}
              </text>
            );
          })}

          {/* Area Fill */}
          {hasActivity && areaPath && (
            <path d={areaPath} fill="url(#trafficGradient)" />
          )}

          {/* Main Traffic Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#subtleGlow)"
            />
          )}

          {/* Live Edge Point Pulse (on latest bucket) */}
          {lastPoint && (
            <g transform={`translate(${lastPoint.x}, ${lastPoint.y})`}>
              <circle r="6" fill="#3B82F6" opacity="0.3" className="animate-ping" />
              <circle r="3.5" fill="#60A5FA" stroke="#0A0A0F" strokeWidth="1.5" />
            </g>
          )}

          {/* Hover Crosshair & Point */}
          {hoveredBucket && (
            <g>
              {/* Vertical hairline */}
              <line
                x1={hoveredBucket.x}
                y1={padTop}
                x2={hoveredBucket.x}
                y2={padTop + chartHeight}
                stroke="#60A5FA"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.6"
              />

              {/* Data circle at hovered point */}
              <circle
                cx={hoveredBucket.x}
                cy={hoveredBucket.y}
                r="4"
                fill="#FFFFFF"
                stroke="#2563EB"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Zero Activity Authentic State Overlay (if 0 visitors throughout whole range) */}
        {!hasActivity && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="px-3 py-1.5 rounded-lg bg-[#07070A]/80 border border-white/[0.06] text-[11px] text-zinc-400 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              <span>Zero traffic recorded in past {rangeMinutes}m • Telemetry online</span>
            </div>
          </div>
        )}

        {/* Hover Precision Tooltip */}
        {hoveredBucket && (
          <div
            className="absolute top-2 pointer-events-none transition-all duration-75 z-20"
            style={{
              left: `${(hoveredBucket.x / viewBoxWidth) * 100}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-[#12121A]/95 border border-white/[0.12] rounded-lg px-2.5 py-1.5 shadow-2xl shadow-black text-[10px] space-y-0.5 whitespace-nowrap">
              <div className="text-zinc-400 font-bold border-b border-white/[0.08] pb-0.5">
                {hoveredBucket.bucket.label} ({hoveredBucket.bucket.bucketStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
              </div>
              <div className="text-white font-bold flex items-center gap-1.5 pt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{hoveredBucket.bucket.activeVisitors} Active Visitor{hoveredBucket.bucket.activeVisitors === 1 ? '' : 's'}</span>
              </div>
              <div className="text-zinc-400 text-[9px]">
                {hoveredBucket.bucket.eventCount} Event{hoveredBucket.bucket.eventCount === 1 ? '' : 's'} Logged
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
