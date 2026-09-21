import React, { useEffect, useRef, useState } from 'react';

interface CapabilityPixelVisualizerProps {
  capabilityId: string;
  category: string;
  isSelected?: boolean;
  className?: string;
}

export const CapabilityPixelVisualizer: React.FC<CapabilityPixelVisualizerProps> = ({
  capabilityId,
  category,
  isSelected = false,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isStrategy = capabilityId === 'product-strategy' || capabilityId === 'saas-products';
  const isAI = capabilityId === 'ai-experiences';
  const isExpanded = isStrategy || isAI;
  const [logIndex, setLogIndex] = useState(0);

  // Live animated telemetry logs for Strategy & AI sections
  const strategyLogs = [
    "STRATEGY ENGINE // AMBIGUITY DECAY: -94.2%",
    "ROADMAP PROGRESS // DISCOVERY ➔ ARCH ➔ SCALE",
    "CAPITAL EFFICIENCY // ZERO DIVERGENCE LOCK",
    "SURVEYOR SCAN // MARKET VIABILITY VERIFIED"
  ];

  const saasLogs = [
    "CLUSTER TELEMETRY // 99.99% UPTIME · MULTI-REGION",
    "TRAFFIC INGEST // 14.8k REQ/S · P99 < 18ms",
    "CONTAINER MESH // 24/24 HEALTHY PODS",
    "DATA BUS FLUX // SUB-2ms SYNC REPLICATION"
  ];

  const aiLogs = [
    "FRONTIER TRANSFORMER // 32-HEAD MULTI-HEAD ATTENTION",
    "LATENT EMBEDDINGS // 1536-DIM SPACE SYNCHRONIZED",
    "AGENTIC REASONING // TREE-OF-THOUGHT CHAIN OPTIMAL",
    "STREAMING INFERENCE // TTFT: 54ms · 142 TOKENS/SEC",
    "SAFETY GUARDRAIL // HALLUCINATION PROBABILITY: 0.00%"
  ];

  const activeLogs = capabilityId === 'product-strategy'
    ? strategyLogs
    : capabilityId === 'saas-products'
    ? saasLogs
    : aiLogs;

  useEffect(() => {
    if (!isExpanded) return;
    const interval = setInterval(() => {
      setLogIndex((prev) => (prev + 1) % activeLogs.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [isExpanded, activeLogs.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let frame = 0;
    
    // Taller pixel grid for Strategy & AI (40x24) to create a rich landscape scenery
    const cols = isExpanded ? 40 : 38;
    const rows = isExpanded ? 24 : 13;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const render = () => {
      frame++;
      const rect = canvas.getBoundingClientRect();
      const pixelSize = Math.max(3, Math.floor(rect.width / cols));
      const targetWidth = cols * pixelSize;
      const targetHeight = rows * pixelSize;

      if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
        canvas.width = targetWidth;
        canvas.height = targetHeight;
      }

      ctx.imageSmoothingEnabled = false;

      // Dark Void background
      ctx.fillStyle = '#07080D';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle background grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.fillRect(x * pixelSize + 1, y * pixelSize + 1, 1, 1);
        }
      }

      const t = frame * (prefersReducedMotion ? 0.01 : (isSelected ? 0.05 : 0.03));

      // Draw helper function for crisp pixel rendering with 1px margin
      const drawPixel = (x: number, y: number, color: string) => {
        if (x < 0 || x >= cols || y < 0 || y >= rows) return;
        ctx.fillStyle = color;
        ctx.fillRect(x * pixelSize + 1, y * pixelSize + 1, pixelSize - 2, pixelSize - 2);
      };

      // =========================================================================
      // DISCIPLINE-SPECIFIC PIXEL SCENERY & ANIMATIONS
      // =========================================================================

      switch (capabilityId) {
        // -----------------------------------------------------------------------
        // 1. PRODUCT STRATEGY: Rich Ambiguity Horizon & Mountain Roadmap Scenery (40x24)
        // -----------------------------------------------------------------------
        case 'product-strategy': {
          // SKY ZONE: Twinkling Constellations & Strategic Stars (Rows 1-6)
          const stars = [
            [3, 2], [8, 1], [14, 3], [19, 2], [26, 1], [32, 3], [37, 2],
            [6, 5], [11, 4], [23, 5], [29, 4], [35, 6]
          ];
          stars.forEach(([sx, sy], idx) => {
            const twinkle = Math.sin(t * 3 + idx) > 0.2;
            if (twinkle) {
              drawPixel(sx, sy, idx % 3 === 0 ? '#38BDF8' : '#64748B');
            }
          });

          // SURVEYOR DRONE / RADAR SCANNER in the Sky
          const droneProgress = (Math.sin(t * 0.8) + 1) / 2;
          const droneX = Math.floor(4 + droneProgress * 31);
          const droneY = 3;
          // Drone body
          drawPixel(droneX, droneY, '#FFFFFF');
          drawPixel(droneX - 1, droneY, '#38BDF8');
          drawPixel(droneX + 1, droneY, '#38BDF8');
          drawPixel(droneX, droneY - 1, Math.sin(t * 4) > 0 ? '#D7FF3F' : '#059669'); // Beacon

          // Sweeping Radar Cone from Drone downwards
          for (let by = droneY + 1; by <= droneY + 5; by++) {
            const spread = by - droneY;
            for (let bx = droneX - spread; bx <= droneX + spread; bx += 2) {
              if (Math.sin(t * 3 + by) > 0.1) {
                drawPixel(bx, by, 'rgba(56, 189, 248, 0.18)');
              }
            }
          }

          // CYBERNETIC MOUNTAIN HORIZON (Peak of Execution) (Rows 7-15)
          // Draw ridge slopes
          for (let x = 2; x <= 38; x++) {
            let ridgeY = 15;
            if (x <= 9) {
              ridgeY = Math.floor(15 - ((x - 2) / 7) * 4);
            } else if (x <= 15) {
              ridgeY = Math.floor(11 + ((x - 9) / 6) * 2);
            } else if (x <= 22) {
              ridgeY = Math.floor(13 - ((x - 15) / 7) * 6);
            } else if (x <= 30) {
              ridgeY = Math.floor(7 + ((x - 22) / 8) * 5);
            } else {
              ridgeY = Math.floor(12 + ((x - 30) / 8) * 4);
            }

            // Mountain Ridge Glow
            drawPixel(x, ridgeY, x === 22 ? '#D7FF3F' : '#2563EB');
            
            // Mountain Fill & shading
            for (let fy = ridgeY + 1; fy <= 16; fy++) {
              const isWireline = (x + fy) % 3 === 0;
              drawPixel(x, fy, isWireline ? 'rgba(37, 99, 235, 0.25)' : '#090D1A');
            }
          }

          // Flag / Launch Beacon planted on Highest Peak (22, 7)
          drawPixel(22, 6, '#FFFFFF');
          drawPixel(22, 5, '#FFFFFF');
          drawPixel(23, 5, '#D7FF3F');
          drawPixel(24, 5, '#D7FF3F');
          drawPixel(23, 6, '#D7FF3F');

          // ROADMAP GROUND PERSPECTIVE GRID (Rows 17-23)
          // Horizontal perspective grid lines
          [17, 19, 21, 23].forEach((gy) => {
            const isPulse = (gy + Math.floor(frame * 0.2)) % 2 === 0;
            for (let x = 1; x < cols - 1; x++) {
              drawPixel(x, gy, isPulse ? 'rgba(56, 189, 248, 0.3)' : 'rgba(30, 41, 59, 0.5)');
            }
          });

          // Moving perspective road milestones (Q1, Q2, Q3, SCALE)
          const milestones = [
            { x: 5, y: 19, label: 'Q1' },
            { x: 15, y: 19, label: 'Q2' },
            { x: 26, y: 19, label: 'Q3' },
            { x: 35, y: 19, label: 'SCALE' }
          ];

          milestones.forEach((m, idx) => {
            const isPassed = ((frame * 0.05) % 4) >= idx;
            const col = idx === 3 ? '#D7FF3F' : isPassed ? '#38BDF8' : '#1E3A8A';
            drawPixel(m.x, m.y - 1, col);
            drawPixel(m.x + 1, m.y - 1, col);
            drawPixel(m.x, m.y, col);
            drawPixel(m.x + 1, m.y, col);
          });

          // Moving telemetry packet across ground grid
          const packetX = Math.floor(3 + ((frame * 0.25) % 35));
          drawPixel(packetX, 19, '#FFFFFF');
          drawPixel(packetX - 1, 19, '#38BDF8');
          break;
        }

        // -----------------------------------------------------------------------
        // 2. SAAS PRODUCTS: Rich Multi-Tier Cloud Infrastructure Scenery (40x24)
        // -----------------------------------------------------------------------
        case 'saas-products': {
          // TOP TIER: Global Edge Satellites & Region Nodes (Rows 1-5)
          const regions = [
            { x: 7, label: 'US-EAST' },
            { x: 20, label: 'EU-CENT' },
            { x: 33, label: 'AP-SOUTH' }
          ];

          regions.forEach((reg, idx) => {
            const pulse = Math.sin(t * 3 + idx) > 0;
            // Satellite / Edge Node
            drawPixel(reg.x, 2, pulse ? '#D7FF3F' : '#059669');
            drawPixel(reg.x - 1, 2, '#38BDF8');
            drawPixel(reg.x + 1, 2, '#38BDF8');
            drawPixel(reg.x, 1, '#FFFFFF');

            // Solar panels
            drawPixel(reg.x - 2, 2, '#1E40AF');
            drawPixel(reg.x + 2, 2, '#1E40AF');
          });

          // Global Data Beam Arcs connecting regions
          for (let x = 7; x <= 33; x++) {
            const arcY = Math.floor(3 - Math.sin(((x - 7) / 26) * Math.PI) * 2);
            const isBit = (x + Math.floor(frame * 0.4)) % 4 === 0;
            drawPixel(x, Math.max(1, arcY), isBit ? '#60A5FA' : 'rgba(37, 99, 235, 0.25)');
          }

          // MIDDLE TIER: Multi-Tenant Microservice Clusters (Rows 6-16)
          // 3 Advanced Enterprise Server Towers
          const serverTowers = [6, 19, 32];
          serverTowers.forEach((stX, sIdx) => {
            // Chassis Frame
            for (let y = 6; y <= 16; y++) {
              for (let x = stX - 3; x <= stX + 3; x++) {
                const isEdge = x === stX - 3 || x === stX + 3 || y === 6 || y === 16;
                drawPixel(x, y, isEdge ? '#1E293B' : '#0B1120');
              }
            }

            // Blinking Blade Units & Drive LEDs
            for (let by = 8; by <= 14; by += 2) {
              const driveActive = Math.sin(t * 4 + sIdx * 2 + by) > 0.1;
              const driveCol = driveActive ? (sIdx === 1 ? '#D7FF3F' : '#38BDF8') : '#1E3A8A';
              
              drawPixel(stX - 2, by, driveCol);
              drawPixel(stX - 1, by, '#475569');
              drawPixel(stX, by, '#475569');
              drawPixel(stX + 1, by, '#334155');
              drawPixel(stX + 2, by, driveActive ? '#60A5FA' : '#1E293B');
            }

            // Active Cooling Fan spinning matrix at base of rack
            const fanPhase = (Math.floor(frame * 0.3) + sIdx) % 2 === 0;
            drawPixel(stX - 1, 15, fanPhase ? '#38BDF8' : '#1E40AF');
            drawPixel(stX + 1, 15, fanPhase ? '#1E40AF' : '#38BDF8');
          });

          // Neon Data Pipe Interconnects between Server Towers
          for (let px = 10; px <= 15; px++) {
            const isFlow = (px + Math.floor(frame * 0.5)) % 3 === 0;
            drawPixel(px, 11, isFlow ? '#38BDF8' : 'rgba(56, 189, 248, 0.2)');
          }
          for (let px = 23; px <= 28; px++) {
            const isFlow = (px + Math.floor(frame * 0.5)) % 3 === 0;
            drawPixel(px, 11, isFlow ? '#D7FF3F' : 'rgba(215, 255, 63, 0.2)');
          }

          // BOTTOM TIER: Real-time Throughput Waveform & Telemetry Bus (Rows 18-23)
          for (let x = 2; x < cols - 2; x++) {
            const waveY = Math.floor(20 + Math.sin(x * 0.5 + t * 4) * 2.2);
            drawPixel(x, waveY, '#10B981');
            drawPixel(x, Math.min(23, waveY + 1), 'rgba(16, 185, 129, 0.2)');
          }

          // Status Beacon Ticks
          drawPixel(3, 18, '#D7FF3F');
          drawPixel(5, 18, '#38BDF8');
          drawPixel(35, 18, '#10B981');
          drawPixel(37, 18, '#10B981');
          break;
        }

        // -----------------------------------------------------------------------
        // 3. UI/UX DESIGN: Dynamic wireframe & interactive cursor click (38x13)
        // -----------------------------------------------------------------------
        case 'ui-ux-design': {
          for (let y = 1; y <= 11; y++) {
            for (let x = 3; x <= 34; x++) {
              const isWinEdge = x === 3 || x === 34 || y === 1 || y === 11;
              if (isWinEdge) {
                drawPixel(x, y, '#1E293B');
              }
            }
          }

          drawPixel(5, 2, '#EF4444');
          drawPixel(7, 2, '#F59E0B');
          drawPixel(9, 2, '#10B981');

          for (let ny = 4; ny <= 9; ny++) {
            drawPixel(6, ny, '#334155');
          }

          for (let cx = 10; cx <= 20; cx++) {
            drawPixel(cx, 4, '#475569');
            drawPixel(cx, 5, 'rgba(100, 116, 139, 0.4)');
          }
          for (let cx = 10; cx <= 18; cx++) {
            drawPixel(cx, 7, '#475569');
            drawPixel(cx, 8, 'rgba(100, 116, 139, 0.4)');
          }

          const btnX = 23;
          const btnY = 6;
          const isPressed = Math.sin(t * 2) > 0.6;
          for (let bx = btnX; bx <= btnX + 7; bx++) {
            drawPixel(bx, btnY, isPressed ? '#38BDF8' : '#2563EB');
            drawPixel(bx, btnY + 1, isPressed ? '#60A5FA' : '#1D4ED8');
          }

          const cursorProgress = (Math.sin(t * 1.5) + 1) / 2;
          const curX = Math.floor(12 + cursorProgress * 14);
          const curY = Math.floor(8 - cursorProgress * 2);

          drawPixel(curX, curY, '#FFFFFF');
          drawPixel(curX, curY + 1, '#FFFFFF');
          drawPixel(curX + 1, curY + 1, '#CBD5E1');
          drawPixel(curX, curY + 2, '#FFFFFF');
          drawPixel(curX + 2, curY + 2, '#94A3B8');

          if (isPressed) {
            drawPixel(btnX + 4, btnY - 1, 'rgba(56, 189, 248, 0.6)');
            drawPixel(btnX + 4, btnY + 2, 'rgba(56, 189, 248, 0.6)');
            drawPixel(btnX + 1, btnY, 'rgba(56, 189, 248, 0.6)');
            drawPixel(btnX + 7, btnY, 'rgba(56, 189, 248, 0.6)');
          }
          break;
        }

        // -----------------------------------------------------------------------
        // 4. DESIGN SYSTEMS: Atomic tokens, color swatches & scale ruler
        // -----------------------------------------------------------------------
        case 'design-systems': {
          const swatches = [
            { x: 3, y: 3, c: '#2563EB' },
            { x: 7, y: 3, c: '#38BDF8' },
            { x: 11, y: 3, c: '#D7FF3F' },
            { x: 3, y: 7, c: '#10B981' },
            { x: 7, y: 7, c: '#8B5CF6' },
            { x: 11, y: 7, c: '#64748B' },
          ];

          swatches.forEach((sw, idx) => {
            const activePulse = (Math.floor(frame * 0.08) % 6 === idx);
            const color = activePulse ? '#FFFFFF' : sw.c;
            for (let dx = 0; dx < 3; dx++) {
              for (let dy = 0; dy < 3; dy++) {
                drawPixel(sw.x + dx, sw.y + dy, color);
              }
            }
          });

          for (let y = 1; y < rows - 1; y++) {
            drawPixel(17, y, y % 2 === 0 ? '#475569' : '#1E293B');
          }

          const scaleLengths = [6, 9, 13, 16];
          scaleLengths.forEach((len, idx) => {
            const sy = 2 + idx * 2;
            for (let bx = 20; bx < 20 + len; bx++) {
              const isHighlight = (idx + Math.floor(frame * 0.08)) % 4 === 0;
              drawPixel(bx, sy, isHighlight ? '#38BDF8' : '#334155');
            }
          });

          for (let bx = 20; bx <= 33; bx++) {
            drawPixel(bx, 10, Math.sin(t * 3) > 0 ? '#2563EB' : 'rgba(37, 99, 235, 0.4)');
          }
          break;
        }

        // -----------------------------------------------------------------------
        // 5. FRONTEND ENGINEERING: 60 FPS DOM pipeline & code syntax flux
        // -----------------------------------------------------------------------
        case 'frontend-development': {
          drawPixel(4, 2, '#38BDF8');
          drawPixel(3, 3, '#38BDF8');
          drawPixel(3, 4, '#38BDF8');
          drawPixel(4, 5, '#38BDF8');
          drawPixel(3, 6, '#38BDF8');
          drawPixel(3, 7, '#38BDF8');
          drawPixel(4, 8, '#38BDF8');

          for (let y = 3; y <= 7; y++) {
            const len = 4 + ((y * 3 + Math.floor(frame * 0.1)) % 6);
            for (let sx = 6; sx < 6 + len; sx++) {
              drawPixel(sx, y, y % 2 === 0 ? '#D7FF3F' : '#60A5FA');
            }
          }

          for (let cx = 17; cx <= 21; cx++) {
            drawPixel(cx, 5, (cx + Math.floor(frame * 0.4)) % 3 === 0 ? '#FFFFFF' : '#1E40AF');
          }

          for (let x = 23; x <= 35; x++) {
            const waveY = Math.floor(6 + Math.sin((x * 0.6) + t * 4) * 3);
            drawPixel(x, waveY, '#10B981');
            drawPixel(x, Math.min(rows - 2, waveY + 1), 'rgba(16, 185, 129, 0.2)');
          }

          drawPixel(34, 2, Math.sin(t * 4) > 0 ? '#D7FF3F' : '#047857');
          drawPixel(35, 2, '#FFFFFF');
          break;
        }

        // -----------------------------------------------------------------------
        // 6. AI EXPERIENCES: FRONTIER COGNITIVE ENGINE & RADIANT NEURAL REACTOR (40x24)
        // (Inspired by Anthropic Claude, Google Gemini, OpenAI, & Agentic Systems)
        // -----------------------------------------------------------------------
        case 'ai-experiences': {
          // ZONE 1: Multimodal Token Ingestion & 1536-Dim Embedding Matrix (Cols 2-9, Rows 2-17)
          // Ingestion capsules: Text, Vision, Audio tokens
          const tokenTypes = [
            { y: 3, label: 'T', col: '#38BDF8' },
            { y: 6, label: 'V', col: '#A78BFA' },
            { y: 9, label: 'A', col: '#34D399' },
            { y: 12, label: 'C', col: '#F59E0B' }
          ];

          tokenTypes.forEach((tok, idx) => {
            const active = Math.sin(t * 3 + idx * 1.5) > 0;
            // Token icon box
            drawPixel(3, tok.y, active ? '#FFFFFF' : tok.col);
            drawPixel(4, tok.y, tok.col);
            drawPixel(3, tok.y + 1, tok.col);
            drawPixel(4, tok.y + 1, active ? '#FFFFFF' : tok.col);
            // Conduit link to embedding matrix
            drawPixel(5, tok.y, 'rgba(56, 189, 248, 0.4)');
            drawPixel(6, tok.y, active ? '#38BDF8' : 'rgba(56, 189, 248, 0.15)');
          });

          // 1536-dim High-density Latent Vector Stream (Cols 7-9, Rows 2-16)
          for (let vy = 2; vy <= 16; vy++) {
            const vPhase = (vy + Math.floor(frame * 0.4)) % 4;
            const vCol = vPhase === 0 ? '#FFFFFF' : vPhase === 1 ? '#38BDF8' : vPhase === 2 ? '#818CF8' : 'rgba(129, 140, 248, 0.2)';
            drawPixel(8, vy, vCol);
            drawPixel(9, vy, (vy % 2 === 0) ? '#A78BFA' : 'rgba(167, 139, 250, 0.3)');
          }

          // Ingestion Funnel directing into central Transformer
          drawPixel(10, 8, '#38BDF8');
          drawPixel(11, 9, '#60A5FA');
          drawPixel(12, 10, '#FFFFFF');

          // ZONE 2: Central Multi-Head Attention Core & Radiant AI Star (Cols 13-27, Rows 2-18)
          const coreX = 20;
          const coreY = 10;

          // 8 Multi-Head Attention modules (A1..A8) orbiting the radiant star
          const numHeads = 8;
          for (let i = 0; i < numHeads; i++) {
            const headAngle = (i / numHeads) * Math.PI * 2 + t * 0.6;
            const orbitRx = 6.8;
            const orbitRy = 5.2;
            const hx = Math.floor(coreX + Math.cos(headAngle) * orbitRx);
            const hy = Math.floor(coreY + Math.sin(headAngle) * orbitRy);

            const isFiring = Math.sin(t * 4 + i) > 0.2;
            drawPixel(hx, hy, isFiring ? '#D7FF3F' : '#3B82F6');

            // Attention Synaptic Vector Beam connecting head to central star
            if (isFiring) {
              const midBx = Math.floor((hx + coreX) / 2);
              const midBy = Math.floor((hy + coreY) / 2);
              drawPixel(midBx, midBy, 'rgba(215, 255, 63, 0.4)');
            }
          }

          // GEMINI / CLAUDE INSPIRED RADIANT 4-POINTED PIXEL STAR CORE (Center at 20, 10)
          // 1. Hot Diamond Center
          drawPixel(coreX, coreY, '#FFFFFF');
          drawPixel(coreX - 1, coreY, '#FFFFFF');
          drawPixel(coreX + 1, coreY, '#FFFFFF');
          drawPixel(coreX, coreY - 1, '#FFFFFF');
          drawPixel(coreX, coreY + 1, '#FFFFFF');

          // 2. Pulsing Cardinal Radiant Rays (North, South, East, West)
          const rayPulse = Math.floor(Math.sin(t * 3) * 1.5 + 2.5); // 1 to 4 pixels
          for (let r = 2; r <= 2 + rayPulse; r++) {
            const rayColor = r === 2 ? '#38BDF8' : r === 3 ? '#818CF8' : '#C084FC';
            drawPixel(coreX + r, coreY, rayColor); // East
            drawPixel(coreX - r, coreY, rayColor); // West
            drawPixel(coreX, coreY + r, rayColor); // South
            drawPixel(coreX, coreY - r, rayColor); // North
          }

          // 3. Rotating Diagonal Sparks (Signal Lime & Cyan)
          const diagAngle = t * 1.8;
          for (let d = 0; d < 4; d++) {
            const da = diagAngle + (d * Math.PI) / 2;
            const dx = Math.floor(coreX + Math.cos(da) * 3);
            const dy = Math.floor(coreY + Math.sin(da) * 2.5);
            drawPixel(dx, dy, d % 2 === 0 ? '#D7FF3F' : '#38BDF8');
          }

          // Output Conduit to Agentic Engine
          drawPixel(27, 9, '#FFFFFF');
          drawPixel(28, 10, '#38BDF8');
          drawPixel(29, 10, '#60A5FA');

          // ZONE 3: Agentic Chain-of-Thought Tree & Streaming Output Buffer (Cols 30-38, Rows 2-18)
          // Tree-of-Thought (ToT) Reasoning Graph
          // Root prompt node
          drawPixel(31, 5, '#FFFFFF');
          drawPixel(32, 5, '#38BDF8');

          // Thought branch 1 (Hypothesis A)
          drawPixel(33, 4, 'rgba(56, 189, 248, 0.5)');
          drawPixel(34, 3, '#A78BFA');
          drawPixel(35, 3, '#818CF8');

          // Thought branch 2 (Verified Optimal Solution Path)
          drawPixel(33, 6, 'rgba(56, 189, 248, 0.5)');
          drawPixel(34, 7, '#38BDF8');
          drawPixel(35, 7, '#D7FF3F');

          // Verified Solution Checkmark badge at (37, 7)
          drawPixel(37, 7, '#D7FF3F');
          drawPixel(38, 6, '#D7FF3F');
          drawPixel(36, 8, '#D7FF3F');

          // Real-time Streaming Output Buffer (Letter-by-letter synthesis)
          // Line 1: Header tokens
          for (let ox = 31; ox <= 37; ox++) {
            drawPixel(ox, 11, '#CBD5E1');
          }
          // Line 2: Output tokens
          for (let ox = 31; ox <= 38; ox++) {
            drawPixel(ox, 13, '#94A3B8');
          }
          // Line 3: Active generating token line with blinking cursor
          const streamLen = Math.floor(((frame * 0.15) % 7) + 1);
          for (let ox = 31; ox < 31 + streamLen; ox++) {
            drawPixel(ox, 15, '#38BDF8');
          }
          // Blinking Cursor Block
          if (Math.sin(t * 4) > 0) {
            drawPixel(31 + streamLen, 15, '#FFFFFF');
          }

          // ZONE 4: Real-time Transformer Self-Attention Heatmap (Rows 19-23, Cols 2-38)
          // Heatmap border frame
          for (let x = 2; x <= 38; x++) {
            drawPixel(x, 18, 'rgba(255, 255, 255, 0.08)');
          }

          // 18-cell attention matrix cells
          for (let hx = 3; hx <= 37; hx += 2) {
            for (let hy = 20; hy <= 22; hy++) {
              // Attention weight formula simulation
              const attnVal = Math.sin((hx * 0.4) + (hy * 0.8) + t * 2.5);
              let attnColor = '#1E1B4B'; // Dim latent
              if (attnVal > 0.6) attnColor = '#D7FF3F'; // Peak attention lock
              else if (attnVal > 0.2) attnColor = '#38BDF8'; // High attention weight
              else if (attnVal > -0.2) attnColor = '#6366F1'; // Medium weight
              else if (attnVal > -0.6) attnColor = '#312E81';

              drawPixel(hx, hy, attnColor);
            }
          }
          break;
        }

        // -----------------------------------------------------------------------
        // 7. BRANDING & DIGITAL IDENTITY: Golden ratio geometry & monogram synthesis
        // -----------------------------------------------------------------------
        case 'branding-digital-identity': {
          const centerX = 19;
          const centerY = 6;

          for (let x = 7; x <= 31; x++) {
            if (x % 3 === 0) drawPixel(x, centerY, 'rgba(255, 255, 255, 0.08)');
          }
          for (let y = 1; y <= 11; y++) {
            if (y % 2 === 0) drawPixel(centerX, y, 'rgba(255, 255, 255, 0.08)');
          }

          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const rad = 4.2 + Math.sin(t * 2) * 0.6;
            const curAngle = angle + t * 0.8;
            const px = Math.floor(centerX + Math.cos(curAngle) * rad * 1.6);
            const py = Math.floor(centerY + Math.sin(curAngle) * rad);
            drawPixel(px, py, '#C084FC');
          }

          const nPixels = [
            [-2, -2], [-2, -1], [-2, 0], [-2, 1], [-2, 2],
            [-1, -1], [0, 0], [1, 1],
            [2, -2], [2, -1], [2, 0], [2, 1], [2, 2]
          ];
          nPixels.forEach(([dx, dy]) => {
            drawPixel(centerX + dx, centerY + dy, '#FFFFFF');
          });

          drawPixel(7, 2, '#38BDF8');
          drawPixel(31, 2, '#38BDF8');
          drawPixel(7, 10, '#38BDF8');
          drawPixel(31, 10, '#38BDF8');
          break;
        }

        // -----------------------------------------------------------------------
        // 8. MOBILE APPLICATIONS: Smartphone viewport & touch gestures
        // -----------------------------------------------------------------------
        case 'mobile-applications': {
          const phoneX = 14;

          for (let y = 1; y <= 11; y++) {
            for (let x = phoneX; x <= phoneX + 9; x++) {
              const isBezel = x === phoneX || x === phoneX + 9 || y === 1 || y === 11;
              if (isBezel) {
                drawPixel(x, y, '#334155');
              } else {
                drawPixel(x, y, '#0B0F19');
              }
            }
          }

          drawPixel(phoneX + 4, 1, '#64748B');
          drawPixel(phoneX + 5, 1, '#64748B');

          const swipeOffset = Math.sin(t * 2) * 2;
          const cardX = Math.floor(phoneX + 2 + swipeOffset);
          for (let cy = 3; cy <= 7; cy++) {
            for (let cx = cardX; cx <= cardX + 5; cx++) {
              if (cx > phoneX && cx < phoneX + 9) {
                drawPixel(cx, cy, cy === 3 ? '#2563EB' : '#1E293B');
              }
            }
          }

          drawPixel(phoneX + 3, 10, '#CBD5E1');
          drawPixel(phoneX + 4, 10, '#CBD5E1');
          drawPixel(phoneX + 5, 10, '#CBD5E1');
          drawPixel(phoneX + 6, 10, '#CBD5E1');

          const isTap = Math.sin(t * 2) > 0.4;
          if (isTap) {
            drawPixel(phoneX + 4, 5, '#D7FF3F');
            drawPixel(phoneX + 5, 5, '#D7FF3F');
            drawPixel(phoneX + 4, 4, 'rgba(215, 255, 63, 0.4)');
            drawPixel(phoneX + 5, 6, 'rgba(215, 255, 63, 0.4)');
          }

          for (let i = 0; i < 4; i++) {
            const barH = i + 1;
            for (let by = 0; by < barH; by++) {
              drawPixel(4 + i * 2, 8 - by, '#38BDF8');
            }
          }

          drawPixel(32, 3, '#10B981');
          drawPixel(33, 3, '#10B981');
          break;
        }

        default: {
          const waveY = Math.floor(rows / 2 + Math.sin(t * 2) * 3);
          for (let x = 0; x < cols; x++) {
            drawPixel(x, waveY, '#2563EB');
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [capabilityId, isSelected, isExpanded]);

  return (
    <div className={`relative w-full rounded-lg bg-[#07080D] border border-white/[0.06] p-2 overflow-hidden my-3 group-hover:border-white/20 transition-all ${className}`}>
      <canvas
        ref={canvasRef}
        className={`w-full ${isExpanded ? 'h-48 sm:h-56' : 'h-24 sm:h-28'} block rounded`}
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Subtle CRT Scanline overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-15 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"
      />
      
      {/* Animated Live Text Terminal readout for Strategy & AI Scenery */}
      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-white/[0.06] bg-black/40 rounded px-2.5 py-1.5 font-mono text-[10px] text-blue-300 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-zinc-400 text-[9px] shrink-0">{`>`}</span>
            <span className="truncate tracking-wide font-medium text-blue-200">
              {activeLogs[logIndex]}
            </span>
          </div>
          <span className="text-[9px] text-emerald-400 font-semibold shrink-0 ml-2 animate-pulse">
            LIVE
          </span>
        </div>
      )}

      {/* Calculated Engineering Telemetry Strip for AI Experiences */}
      {isAI && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-2 pt-2 border-t border-white/[0.06] text-[9px] font-mono text-zinc-400">
          <div className="bg-black/50 border border-white/[0.04] p-1.5 rounded text-center">
            <span className="text-zinc-500 block text-[8px]">EMBEDDING</span>
            <span className="text-blue-300 font-bold">1536-DIM</span>
          </div>
          <div className="bg-black/50 border border-white/[0.04] p-1.5 rounded text-center">
            <span className="text-zinc-500 block text-[8px]">TTFT SPEED</span>
            <span className="text-emerald-400 font-bold">&lt; 54ms</span>
          </div>
          <div className="bg-black/50 border border-white/[0.04] p-1.5 rounded text-center">
            <span className="text-zinc-500 block text-[8px]">REASONING</span>
            <span className="text-purple-300 font-bold">AGENTIC CoT</span>
          </div>
          <div className="bg-black/50 border border-white/[0.04] p-1.5 rounded text-center">
            <span className="text-zinc-500 block text-[8px]">THROUGHPUT</span>
            <span className="text-cyan-300 font-bold">142 T/S</span>
          </div>
        </div>
      )}

      {/* Subtle bottom status indicator */}
      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500 pt-1.5 px-1 border-t border-white/[0.04]">
        <span className="flex items-center gap-1">
          <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-signal' : 'bg-zinc-600'}`} />
          <span>{category.toUpperCase()} MATRIX</span>
        </span>
        <span className="text-[8px] text-zinc-600">60FPS // CRT // COGNITIVE ENGINE</span>
      </div>
    </div>
  );
};
