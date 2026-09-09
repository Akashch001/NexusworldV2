import React, { useRef, useEffect, useCallback } from 'react';
import { PixelAgent } from './PixelAgent';
import { type ConciergeVisualState } from '../../data/conciergeData';

interface ConciergeTriggerProps {
  onClick: () => void;
  state?: ConciergeVisualState;
  isOpen?: boolean;
}

export const ConciergeTrigger: React.FC<ConciergeTriggerProps> = ({
  onClick,
  state = 'IDLE',
  isOpen = false,
}) => {
  const triggerRef = useRef<HTMLButtonElement>(null);
  
  // Drag state using refs to prevent React re-renders on every pixel move
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const position = useRef({ x: 0, y: 0 });

  // Load initial position and attach resize listener
  useEffect(() => {
    const savedPos = sessionStorage.getItem('nexus_agent_position');
    if (savedPos && triggerRef.current) {
      try {
        const parsed = JSON.parse(savedPos);
        position.current = parsed;
        triggerRef.current.style.transform = `translate3d(${parsed.x}px, ${parsed.y}px, 0)`;
      } catch (e) {
        // ignore invalid JSON
      }
    }

    const handleResize = () => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const margin = 16;
      
      const baseX = rect.left - position.current.x;
      const baseY = rect.top - position.current.y;
      
      const minX = margin - baseX;
      const maxX = window.innerWidth - margin - rect.width - baseX;
      
      const minY = margin - baseY;
      const maxY = window.innerHeight - margin - rect.height - baseY;
      
      let newX = position.current.x;
      let newY = position.current.y;
      
      if (newX > maxX) newX = maxX;
      if (newX < minX) newX = minX;
      if (newY > maxY) newY = maxY;
      if (newY < minY) newY = minY;
      
      if (newX !== position.current.x || newY !== position.current.y) {
        position.current = { x: newX, y: newY };
        triggerRef.current.style.transform = `translate3d(${newX}px, ${newY}px, 0)`;
        sessionStorage.setItem('nexus_agent_position', JSON.stringify(position.current));
      }
    };

    window.addEventListener('resize', handleResize);
    // Initial clamp just in case screen size changed between sessions
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDragging.current || !triggerRef.current) return;
    
    e.preventDefault(); // Prevent default scroll on touch
    
    const rawX = e.clientX - dragStart.current.x;
    const rawY = e.clientY - dragStart.current.y;
    
    // Threshold to distinguish click from drag
    if (Math.abs(rawX - position.current.x) > 4 || Math.abs(rawY - position.current.y) > 4) {
      hasDragged.current = true;
      triggerRef.current.classList.add('cursor-grabbing');
      triggerRef.current.classList.remove('cursor-grab');
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const margin = 16;
    
    const baseX = rect.left - position.current.x;
    const baseY = rect.top - position.current.y;
    
    const minX = margin - baseX;
    const maxX = window.innerWidth - margin - rect.width - baseX;
    
    const minY = margin - baseY;
    const maxY = window.innerHeight - margin - rect.height - baseY;
    
    const clampedX = Math.max(minX, Math.min(maxX, rawX));
    const clampedY = Math.max(minY, Math.min(maxY, rawY));
    
    position.current = { x: clampedX, y: clampedY };
    triggerRef.current.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (isDragging.current) {
      isDragging.current = false;
      if (triggerRef.current) {
        triggerRef.current.classList.remove('cursor-grabbing');
        triggerRef.current.classList.add('cursor-grab');
        triggerRef.current.releasePointerCapture(1); // Safely clear capture if applied
      }
      
      sessionStorage.setItem('nexus_agent_position', JSON.stringify(position.current));
      
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    }
  }, [handlePointerMove]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    
    if (triggerRef.current) {
      triggerRef.current.setPointerCapture(e.pointerId);
    }
    
    isDragging.current = true;
    hasDragged.current = false;
    
    dragStart.current = {
      x: e.clientX - position.current.x,
      y: e.clientY - position.current.y
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  if (isOpen) return null;

  return (
    <button 
      ref={triggerRef}
      className="fixed bottom-6 right-6 z-50 pointer-events-auto touch-none cursor-grab group flex items-center gap-3 p-2 pr-4 rounded-full bg-void-card/90 hover:bg-void-surface border border-white/10 hover:border-signal/50 backdrop-blur-xl shadow-2xl transition-colors duration-300 hover:shadow-[0_0_25px_rgba(37,99,235,0.4)] focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-void-bg"
      aria-label="Open Nexus Intelligence"
      onPointerDown={handlePointerDown}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        transform: `translate3d(0px, 0px, 0)`,
      }}
    >
      {/* Micro Pixel Agent Icon */}
      <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-void-deep pointer-events-none">
        <PixelAgent state={state} size={36} showLabel={false} />
      </div>

      {/* Status Text & Beacon */}
      <div className="text-left flex flex-col select-none pointer-events-none">
        <div className="flex items-center gap-1.5">
          <span className="font-display font-bold text-xs tracking-wider text-white group-hover:text-signal-bright transition-colors motion-reduce:transition-none">
            NORA
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse motion-reduce:animate-none" />
        </div>
        <span className="text-[10px] font-mono text-zinc-400 group-hover:text-zinc-300 transition-colors motion-reduce:transition-none">
          NEXUS INTELLIGENCE · READY
        </span>
      </div>
    </button>
  );
};
