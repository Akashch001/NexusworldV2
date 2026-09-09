import React, { useEffect, useRef } from 'react';
import { type ConciergeVisualState } from '../../data/conciergeData';

interface PixelAgentProps {
  state: ConciergeVisualState;
  size?: number;
  className?: string;
  showLabel?: boolean;
}

export const PixelAgent: React.FC<PixelAgentProps> = ({
  state,
  size = 64,
  className = '',
  showLabel = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    const gridSize = 10;
    const pixelSize = size / gridSize;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, size, size);

      // Background subtle circular bounds
      ctx.fillStyle = '#09090D';
      ctx.fillRect(0, 0, size, size);

      // Determine pixel color map based on state
      const t = frame * 0.05;

      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const dx = x - 4.5;
          const dy = y - 4.5;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let active = false;
          let color = '#2563EB'; // Signal Blue default

          switch (state) {
            case 'IDLE':
              // Subtle circular core with gentle breathing
              const breathingRadius = 2.2 + Math.sin(t * 1.5) * 0.4;
              active = dist <= breathingRadius;
              color = dist < 1.2 ? '#60A5FA' : '#2563EB';
              break;

            case 'OBSERVING':
              // Scanning eye matrix shifting left and right
              const eyeOffset = Math.sin(t * 2) * 1.5;
              const isEye = Math.abs(x - (4.5 + eyeOffset)) < 1.4 && Math.abs(y - 4.5) < 1.2;
              active = isEye || (dist > 3.2 && dist < 4.4 && (x + y) % 2 === 0);
              color = isEye ? '#38BDF8' : '#1E40AF';
              break;

            case 'LISTENING':
              // Focused aperture with pulsing outer antenna dots
              active = dist < 2.0 || (dist > 3.5 && dist < 4.4 && Math.sin(t * 4 + x) > 0);
              color = dist < 2.0 ? '#93C5FD' : '#2563EB';
              break;

            case 'THINKING':
              // Concentric rotating matrix flux
              const angle = Math.atan2(dy, dx);
              const spin = (angle + t * 4) % (Math.PI * 2);
              active = dist > 1.2 && dist < 4.2 && spin > 0 && spin < Math.PI * 1.2;
              color = '#3B82F6';
              break;

            case 'RESPONDING':
              // Horizontal waveform frequency pulses
              const wave = Math.abs(Math.sin(x * 0.8 + t * 5) * 3);
              active = Math.abs(y - 4.5) <= wave;
              color = x === 4 || x === 5 ? '#93C5FD' : '#2563EB';
              break;

            case 'SUCCESS':
              // Signal Lime geometric diamond check lock
              const diamond = Math.abs(dx) + Math.abs(dy);
              active = diamond <= 3.2 && diamond >= 1.0;
              color = '#D7FF3F'; // Signal Lime
              break;

            case 'BOOKING':
              // Precise scheduling cross / clock aperture
              active = (x === 4 || x === 5) || (y === 4 || y === 5) || dist > 3.8;
              color = '#38BDF8';
              break;

            case 'ERROR':
              // Amber jitter matrix
              active = Math.random() > 0.6 && dist < 4;
              color = '#F59E0B'; // Amber
              break;

            case 'OFFLINE':
              // Single dim blinking center pixel
              active = x === 4 && y === 4 && Math.sin(t * 2) > 0;
              color = '#52525B';
              break;
          }

          if (active) {
            ctx.fillStyle = color;
            // Draw pixel with 1px margin for authentic retro-futuristic grid look
            ctx.fillRect(
              x * pixelSize + 1,
              y * pixelSize + 1,
              pixelSize - 2,
              pixelSize - 2
            );
          } else {
            // Faint grid guide
            ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
            ctx.fillRect(
              x * pixelSize + 1,
              y * pixelSize + 1,
              pixelSize - 2,
              pixelSize - 2
            );
          }
        }
      }

      if (!prefersReducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [state, size]);

  const getStateTagColor = () => {
    switch (state) {
      case 'SUCCESS': return 'text-lime-400 border-lime-500/30 bg-lime-500/10';
      case 'ERROR': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'BOOKING': return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      case 'OFFLINE': return 'text-zinc-500 border-zinc-700 bg-zinc-800/20';
      default: return 'text-signal-bright border-signal/30 bg-signal/10';
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative rounded-lg overflow-hidden border border-white/10 shadow-[0_0_15px_rgba(37,99,235,0.2)] bg-void-surface"
        style={{ width: size, height: size }}
      >
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="w-full h-full block"
          role="img"
          aria-label={`Nexus Intelligence state: ${state}`}
        />
        <div className="absolute inset-0 pointer-events-none border border-white/[0.08] rounded-lg" />
      </div>

      {showLabel && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-white text-xs tracking-wider">
              NEXUS // AI
            </span>
            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-semibold ${getStateTagColor()}`}>
              {state}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-0.5">
            INTELLIGENT INTERFACE
          </span>
        </div>
      )}
    </div>
  );
};
