import React, { useEffect, useRef } from 'react';
import { NexusWorldScene } from './NexusWorldScene';
import { SpatialMotionController } from '../../lib/motion';

interface WorldCanvasViewProps {
  onStateUpdate?: (progress: number, stateIndex: number, stateName: string) => void;
}

export const WorldCanvasView: React.FC<WorldCanvasViewProps> = ({ onStateUpdate }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<NexusWorldScene | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Instantiate Three.js Spatial Scene
    const scene = new NexusWorldScene(containerRef.current, {
      onProgressUpdate: (progress, stateIndex, stateName) => {
        if (onStateUpdate) {
          onStateUpdate(progress, stateIndex, stateName);
        }
      },
    });
    sceneRef.current = scene;

    // Subscribe to Lenis motion stream
    const motion = SpatialMotionController.getInstance();
    const unsubscribe = motion.subscribe((progress) => {
      scene.setScrollProgress(progress);
    });

    return () => {
      unsubscribe();
      scene.destroy();
      sceneRef.current = null;
    };
  }, [onStateUpdate]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-void"
      aria-hidden="true"
    />
  );
};
