import { useState, useEffect, useCallback } from 'react';
import { SpatialMotionController } from '../lib/motion';

export const SPATIAL_DISTRICTS = [
  { index: 0, id: 'hero', label: 'HERO', phase: '00', title: 'The Void & Signal', progressTarget: 0.0 },
  { index: 1, id: 'core', label: 'CORE', phase: '01', title: 'Nexus Core Architecture', progressTarget: 0.14 },
  { index: 2, id: 'capabilities', label: 'CAPABILITIES', phase: '02', title: 'End-to-End Capabilities', progressTarget: 0.28 },
  { index: 3, id: 'process', label: 'PROCESS', phase: '03', title: 'Connected Pipeline', progressTarget: 0.45 },
  { index: 4, id: 'lab', label: 'THE LAB', phase: '04', title: 'Real Work & Product Proofs', progressTarget: 0.60 },
  { index: 5, id: 'philosophy', label: 'PHILOSOPHY', phase: '05', title: 'First Principles', progressTarget: 0.76 },
  { index: 6, id: 'problems', label: 'PROBLEMS', phase: '06', title: 'Problems We Solve', progressTarget: 0.88 },
  { index: 7, id: 'contact', label: 'CONTACT', phase: '07', title: 'Direct Founder Desk', progressTarget: 1.0 },
];

export function useSpatialScroll() {
  const [progress, setProgress] = useState<number>(0);
  const [activeDistrictIndex, setActiveDistrictIndex] = useState<number>(0);

  useEffect(() => {
    const motion = SpatialMotionController.getInstance();
    const unsubscribe = motion.subscribe((currProgress) => {
      setProgress(currProgress);
      
      // Determine active district based on real section visibility
      let activeIdx = 0;
      const threshold = window.innerHeight * 0.35;
      
      for (let i = 0; i < SPATIAL_DISTRICTS.length; i++) {
        const el = document.getElementById(SPATIAL_DISTRICTS[i].id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold) {
            activeIdx = i;
          }
        }
      }
      setActiveDistrictIndex(activeIdx);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const scrollToDistrict = useCallback((targetIndex: number) => {
    const target = SPATIAL_DISTRICTS[targetIndex];
    if (!target) return;

    const el = document.getElementById(target.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      const motion = SpatialMotionController.getInstance();
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        motion.scrollTo(target.progressTarget * maxScroll);
      }
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
