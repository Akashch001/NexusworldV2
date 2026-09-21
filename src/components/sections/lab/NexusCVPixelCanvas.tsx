import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface NexusCVPixelCanvasProps {
  accentColor?: string;
  className?: string;
}

export const NexusCVPixelCanvas: React.FC<NexusCVPixelCanvasProps> = ({
  accentColor = '#2563EB',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isCompiling, setIsCompiling] = useState(false);
  const [, setPulseCount] = useState(1);
  const [fps, setFps] = useState(60);

  // Manual resynthesize trigger
  const triggerSynthesis = useCallback(() => {
    setIsCompiling(true);
    setPulseCount((prev) => prev + 1);
    setTimeout(() => setIsCompiling(false), 1200);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Grid configuration: 64 columns x 22 rows
    const cols = 64;
    const rows = 22;

    let animId: number;
    let frame = 0;
    let frameCounter = 0;
    let fpsTimer = performance.now();

    // Data packets floating from Left to Center
    interface Packet {
      x: number;
      y: number;
      speed: number;
      color: string;
      label: string;
    }

    const packets: Packet[] = [
      { x: 4, y: 7, speed: 0.18, color: '#38BDF8', label: 'EXP' },
      { x: 10, y: 11, speed: 0.22, color: '#60A5FA', label: 'SKL' },
      { x: 2, y: 15, speed: 0.16, color: '#818CF8', label: 'EDU' },
      { x: 7, y: 5, speed: 0.24, color: '#34D399', label: 'ATS' },
    ];

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = (currentTime: number) => {
      frame++;
      frameCounter++;

      if (currentTime - fpsTimer >= 1000) {
        setFps(Math.round((frameCounter * 1000) / (currentTime - fpsTimer)));
        frameCounter = 0;
        fpsTimer = currentTime;
      }

      // Responsive pixel sizing
      const rect = canvas.getBoundingClientRect();
      const pixelSize = Math.max(4, Math.floor(rect.width / cols));
      const targetWidth = cols * pixelSize;
      const targetHeight = rows * pixelSize;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.imageSmoothingEnabled = false;

      // Dark Void Background
      ctx.fillStyle = '#07080D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle background dot grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.fillRect(x * pixelSize + 1, y * pixelSize + 1, 1, 1);
        }
      }

      const t = frame * (prefersReducedMotion ? 0.01 : 0.04);

      // =======================================================
      // 1. LEFT ZONE: RAW CAREER DATA INGESTION HOPPER (Cols 2-15)
      // =======================================================
      // Ingestion terminal frame
      for (let y = 3; y <= 18; y++) {
        for (let x = 2; x <= 14; x++) {
          const isBorder = x === 2 || x === 14 || y === 3 || y === 18;
          if (isBorder) {
            ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.fillRect(x * pixelSize + 1, y * pixelSize + 1, pixelSize - 2, pixelSize - 2);
          }
        }
      }

      // Ingestion label icon & pulse bars inside hopper
      for (let i = 0; i < 4; i++) {
        const barY = 6 + i * 3;
        const fillLength = 4 + Math.floor(Math.sin(t * 1.5 + i) * 2 + 2);
        for (let bx = 4; bx < 4 + fillLength; bx++) {
          ctx.fillStyle = i === 0 ? '#38BDF8' : i === 1 ? '#60A5FA' : i === 2 ? '#34D399' : '#A78BFA';
          ctx.fillRect(bx * pixelSize + 1, barY * pixelSize + 1, pixelSize - 2, pixelSize - 2);
        }
      }

      // =======================================================
      // 2. DATA PACKET STREAMS (Traveling Left -> Center)
      // =======================================================
      packets.forEach((pkt) => {
        if (!prefersReducedMotion) {
          pkt.x += pkt.speed;
          if (pkt.x >= 24) {
            pkt.x = 2 + (frame % 3);
          }
        }

        const px = Math.floor(pkt.x);
        const py = pkt.y;
        if (px >= 2 && px < 27) {
          ctx.fillStyle = pkt.color;
          ctx.fillRect(px * pixelSize + 1, py * pixelSize + 1, pixelSize - 2, pixelSize - 2);
          // Trail pixel
          ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.fillRect((px - 1) * pixelSize + 1, py * pixelSize + 1, pixelSize - 2, pixelSize - 2);
        }
      });

      // Data transfer conduit lines between Left and Center
      for (let cx = 15; cx <= 24; cx++) {
        const conduitY = 10;
        const isPulse = (cx + Math.floor(frame * 0.3)) % 4 === 0;
        ctx.fillStyle = isPulse ? '#60A5FA' : 'rgba(37, 99, 235, 0.2)';
        ctx.fillRect(cx * pixelSize + 1, conduitY * pixelSize + 1, pixelSize - 2, pixelSize - 2);
      }

      // =======================================================
      // 3. CENTER ZONE: NEXUS COMPILER CPU & CYBER-ARCHITECT (Cols 25-38)
      // =======================================================
      const cpuCenterX = 31;
      const cpuCenterY = 11;

      // Outer CPU bracket
      for (let y = 4; y <= 17; y++) {
        for (let x = 25; x <= 37; x++) {
          const isCorner =
            (x === 25 || x === 37) && (y === 4 || y === 17);
          const isEdge = x === 25 || x === 37 || y === 4 || y === 17;
          if (isEdge && !isCorner) {
            ctx.fillStyle = isCompiling ? '#38BDF8' : 'rgba(37, 99, 235, 0.5)';
            ctx.fillRect(x * pixelSize + 1, y * pixelSize + 1, pixelSize - 2, pixelSize - 2);
          }
        }
      }

      // Pixel CPU Pins (top, bottom, left, right)
      for (let p = 27; p <= 35; p += 2) {
        ctx.fillStyle = 'rgba(96, 165, 250, 0.7)';
        ctx.fillRect(p * pixelSize + 1, 3 * pixelSize + 1, pixelSize - 2, pixelSize - 2);
        ctx.fillRect(p * pixelSize + 1, 18 * pixelSize + 1, pixelSize - 2, pixelSize - 2);
      }

      // Animated Cyber-Architect Sprite inside CPU
      // Head/Visor
      const headY = 6;
      for (let hx = 29; hx <= 33; hx++) {
        ctx.fillStyle = '#1E293B';
        ctx.fillRect(hx * pixelSize + 1, headY * pixelSize + 1, pixelSize - 2, pixelSize - 2);
      }
      // Glowing Visor / Eyes (scanning)
      const eyeOffset = Math.sin(t * 2) > 0 ? 1 : 0;
      ctx.fillStyle = '#38BDF8';
      ctx.fillRect((30 + eyeOffset) * pixelSize + 1, (headY + 1) * pixelSize + 1, pixelSize - 2, pixelSize - 2);
      ctx.fillRect((32 + eyeOffset) * pixelSize + 1, (headY + 1) * pixelSize + 1, pixelSize - 2, pixelSize - 2);

      // Antenna beacon
      const antennaBlink = Math.sin(t * 4) > 0.3;
      ctx.fillStyle = antennaBlink ? '#D7FF3F' : '#059669';
      ctx.fillRect(31 * pixelSize + 1, 5 * pixelSize + 1, pixelSize - 2, pixelSize - 2);

      // Core Reactor (Pulsing token energy)
      const corePulse = Math.sin(t * 3);
      for (let cy = 9; cy <= 14; cy++) {
        for (let cx = 28; cx <= 34; cx++) {
          const dx = cx - cpuCenterX;
          const dy = cy - cpuCenterY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist <= 2.2 + (isCompiling ? 0.8 : corePulse * 0.4)) {
            if (dist < 1.0) {
              ctx.fillStyle = '#FFFFFF'; // Hot core
            } else if (dist < 1.8) {
              ctx.fillStyle = '#38BDF8'; // High energy cyan
            } else {
              ctx.fillStyle = accentColor; // Primary signal accent
            }
            ctx.fillRect(cx * pixelSize + 1, cy * pixelSize + 1, pixelSize - 2, pixelSize - 2);
          }
        }
      }

      // Compiler beam emitters (Center -> Right)
      for (let bx = 38; bx <= 45; bx++) {
        const beamY = 11;
        const beamPhase = (bx - 38 + Math.floor(frame * 0.5)) % 3 === 0;
        ctx.fillStyle = beamPhase || isCompiling ? '#D7FF3F' : 'rgba(34, 197, 94, 0.3)';
        ctx.fillRect(bx * pixelSize + 1, beamY * pixelSize + 1, pixelSize - 2, pixelSize - 2);
      }

      // =======================================================
      // 4. RIGHT ZONE: ATS RESUME BLUEPRINT MATRIX (Cols 46-61)
      // =======================================================
      // Document border
      for (let y = 2; y <= 19; y++) {
        for (let x = 46; x <= 61; x++) {
          const isDocEdge = x === 46 || x === 61 || y === 2 || y === 19;
          if (isDocEdge) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
            ctx.fillRect(x * pixelSize + 1, y * pixelSize + 1, pixelSize - 2, pixelSize - 2);
          } else {
            // Subtle document paper background
            ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
            ctx.fillRect(x * pixelSize + 1, y * pixelSize + 1, pixelSize - 2, pixelSize - 2);
          }
        }
      }

      // Document Header: Avatar square & Title lines
      // Avatar
      for (let ay = 4; ay <= 6; ay++) {
        for (let ax = 48; ax <= 50; ax++) {
          ctx.fillStyle = '#38BDF8';
          ctx.fillRect(ax * pixelSize + 1, ay * pixelSize + 1, pixelSize - 2, pixelSize - 2);
        }
      }
      // Name & Title bars
      for (let nx = 52; nx <= 59; nx++) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(nx * pixelSize + 1, 4 * pixelSize + 1, pixelSize - 2, pixelSize - 2);
      }
      for (let tx = 52; tx <= 57; tx++) {
        ctx.fillStyle = accentColor;
        ctx.fillRect(tx * pixelSize + 1, 6 * pixelSize + 1, pixelSize - 2, pixelSize - 2);
      }

      // Divider line
      for (let dx = 48; dx <= 59; dx++) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(dx * pixelSize + 1, 8 * pixelSize + 1, pixelSize - 2, pixelSize - 2);
      }

      // Experience Section blocks (structured token bars)
      const expRows = [10, 12, 14];
      expRows.forEach((ey, idx) => {
        const rowLength = 10 - idx * 2 + Math.floor(Math.sin(t + idx) * 1.5);
        for (let ex = 48; ex < 48 + rowLength; ex++) {
          ctx.fillStyle = '#CBD5E1';
          ctx.fillRect(ex * pixelSize + 1, ey * pixelSize + 1, pixelSize - 2, pixelSize - 2);
        }
      });

      // Skill chips matrix (Col 48 to 58, Row 16-17)
      const skillChips = [
        { x: 48, y: 16, c: '#34D399' }, // Emerald
        { x: 51, y: 16, c: '#60A5FA' }, // Blue
        { x: 54, y: 16, c: '#C084FC' }, // Purple
        { x: 48, y: 17, c: '#FBBF24' }, // Amber
        { x: 51, y: 17, c: '#38BDF8' }, // Cyan
        { x: 54, y: 17, c: '#A3E635' }, // Lime
      ];
      skillChips.forEach((chip) => {
        ctx.fillStyle = chip.c;
        ctx.fillRect(chip.x * pixelSize + 1, chip.y * pixelSize + 1, pixelSize * 2 - 2, pixelSize - 2);
      });

      // Animated Vertical Laser Scanline traversing the document
      const scanProgress = (Math.sin(t * 1.8) + 1) / 2; // 0.0 to 1.0
      const scanY = Math.floor(3 + scanProgress * 15);

      for (let sx = 47; sx <= 60; sx++) {
        // Laser Core
        ctx.fillStyle = '#D7FF3F';
        ctx.fillRect(sx * pixelSize + 1, scanY * pixelSize + 1, pixelSize - 2, pixelSize - 2);
        // Laser phosphor trail
        if (scanY > 3) {
          ctx.fillStyle = 'rgba(215, 255, 63, 0.2)';
          ctx.fillRect(sx * pixelSize + 1, (scanY - 1) * pixelSize + 1, pixelSize - 2, pixelSize - 2);
        }
      }

      // Verified ATS Checkmark Seal (stamped on Document)
      const checkPixels = [
        [58, 5],
        [59, 6],
        [60, 5],
        [60, 4],
      ];
      checkPixels.forEach(([cx, cy]) => {
        ctx.fillStyle = '#D7FF3F';
        ctx.fillRect(cx * pixelSize + 1, cy * pixelSize + 1, pixelSize - 2, pixelSize - 2);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [accentColor, isCompiling]);

  return (
    <div ref={containerRef} className={`rounded-lg bg-[#07080D] border border-white/[0.08] p-4 overflow-hidden relative ${className}`}>
      
      {/* Top telemetry bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.06] text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>PIXEL PARSER ENGINE // ACTIVE</span>
          </div>
          <span className="text-zinc-500 hidden sm:inline">64x22 CELL MATRIX</span>
        </div>

        <div className="flex items-center gap-3 text-zinc-400">
          <span className="text-zinc-500">FPS: <strong className="text-zinc-300">{fps}</strong></span>
          <span className="text-zinc-500">LATENCY: <strong className="text-emerald-400">3.8ms</strong></span>
          <button
            onClick={triggerSynthesis}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white border border-white/[0.08] transition-all text-[10px]"
            title="Trigger manual re-synthesis burst"
          >
            <RefreshCw className={`w-2.5 h-2.5 ${isCompiling ? 'animate-spin text-signal' : ''}`} />
            <span>{isCompiling ? 'COMPILING...' : 'RE-COMPILE'}</span>
          </button>
        </div>
      </div>

      {/* Main Pixel Canvas */}
      <div className="relative flex items-center justify-center bg-black/40 rounded p-1 border border-white/[0.04]">
        <canvas
          ref={canvasRef}
          onClick={triggerSynthesis}
          className="w-full max-w-full h-auto cursor-pointer block rounded"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Scanline CRT overlay effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px]"
        />
      </div>

      {/* Concept Architecture Legend */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono text-zinc-400">
        <div className="flex items-center gap-2 p-2 rounded bg-void-surface border border-white/[0.04]">
          <div className="w-2 h-2 rounded-sm bg-sky-400 shrink-0" />
          <div>
            <span className="text-zinc-300 font-semibold block">1. INGESTION HOPPER</span>
            <span className="text-zinc-500 text-[9px]">Unstructured career credentials parsed into discrete nodes</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded bg-void-surface border border-white/[0.04]">
          <div className="w-2 h-2 rounded-sm bg-blue-500 shrink-0" />
          <div>
            <span className="text-zinc-300 font-semibold block">2. AST TOKEN CORE</span>
            <span className="text-zinc-500 text-[9px]">Cyber-architect binds typography tokens & vertical rhythm</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded bg-void-surface border border-white/[0.04]">
          <div className="w-2 h-2 rounded-sm bg-[#D7FF3F] shrink-0" />
          <div>
            <span className="text-zinc-300 font-semibold block">3. ATS BLUEPRINT</span>
            <span className="text-zinc-500 text-[9px]">Laser-scanned verified layout with zero parsing entropy</span>
          </div>
        </div>
      </div>

    </div>
  );
};
