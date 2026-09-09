import { useState, useEffect, useCallback } from 'react';
import { SpatialMotionController } from '../lib/motion';

export const SPATIAL_DISTRICTS = [
  { index: 0, id: 'void', label: 'VOID', phase: '00', title: 'The Void', progressTarget: 0.0 },
  { index: 1, id: 'signal', label: 'SIGNAL', phase: '01', title: 'Active Signal', progressTarget: 0.1 },
  { index: 2, id: 'core', label: 'NEXUS CORE', phase: '02', title: 'Nexus Core', progressTarget: 0.2 },
  { index: 3, id: 'world', label: 'WORLD REVEAL', phase: '03', title: 'World Systems', progressTarget: 0.3 },
  { index: 4, id: 'design', label: 'DESIGN', phase: '04', title: 'Design District', progressTarget: 0.4 },
  { index: 5, id: 'dev', label: 'DEVELOPMENT', phase: '05', title: 'Development District', progressTarget: 0.5 },
  { index: 6, id: 'ai', label: 'AI & COGNITIVE', phase: '06', title: 'AI District', progressTarget: 0.6 },
  { index: 7, id: 'automation', label: 'AUTOMATION', phase: '07', title: 'Automation District', progressTarget: 0.7 },
  { index: 8, id: 'lab', label: 'THE LAB', phase: '08', title: 'The Lab (Real Work)', progressTarget: 0.8 },
  { index: 9, id: 'philosophy', label: 'PHILOSOPHY', phase: '09', title: 'First Principles', progressTarget: 0.9 },
  { index: 10, id: 'contact', label: 'CONTACT', phase: '10', title: 'Direct Founder Desk', progressTarget: 1.0 },
];

export function useSpatialScroll() {
  const [progress, setProgress] = useState<number>(0);
  const [activeDistrictIndex, setActiveDistrictIndex] = useState<number>(0);

  useEffect(() => {
    const motion = SpatialMotionController.getInstance();
    const unsubscribe = motion.subscribe((currProgress) => {
      setProgress(currProgress);
      const idx = Math.min(
        Math.floor(currProgress * SPATIAL_DISTRICTS.length),
        SPATIAL_DISTRICTS.length - 1
      );
      setActiveDistrictIndex(idx);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const scrollToDistrict = useCallback((targetIndex: number) => {
    const motion = SpatialMotionController.getInstance();
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const target = SPATIAL_DISTRICTS[targetIndex];
    if (target && maxScroll > 0) {
      motion.scrollTo(target.progressTarget * maxScroll);
    }
  }, []);

  return {
    progress,
    activeDistrict: SPATIAL_DISTRICTS[activeDistrictIndex] || SPATIAL_DISTRICTS[0],
    activeDistrictIndex,
    districts: SPATIAL_DISTRICTS,
    scrollToDistrict,
  };
}
