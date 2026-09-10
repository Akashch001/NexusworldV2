import React, { useState } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { WorldCanvasView } from './components/world/WorldCanvasView';
import { WorldHUD } from './components/world/WorldHUD';
import { SpatialMinimap } from './components/world/SpatialMinimap';
import { useSpatialScroll } from './hooks/useSpatialScroll';
import { NexusConcierge } from './components/concierge/NexusConcierge';
import { ConciergeTrigger } from './components/concierge/ConciergeTrigger';
import { NeuralAccessLogin } from './components/ui/neural-access-login';
import { AuthRecovery } from './components/auth/AuthRecovery';
import { AdminChangePassword } from './components/admin/AdminChangePassword';
import { useVisitorTelemetry } from './hooks/useVisitorTelemetry';

export const App: React.FC = () => {
  const { progress, activeDistrictIndex, scrollToDistrict } = useSpatialScroll();
  useVisitorTelemetry(activeDistrictIndex);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState<string>(() => window.location.hash);

  React.useEffect(() => {
    const handleHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auth Recovery Route
  if (window.location.pathname === '/auth/recovery') {
    return <AuthRecovery />;
  }

  // Force Change Password Route
  if (window.location.pathname === '/admin/change-password') {
    return <AdminChangePassword onSuccess={() => window.location.href = '/admin'} />;
  }

  // Admin Neural Access Route
  const isRouteAdmin = 
    window.location.pathname === '/admin' || 
    window.location.pathname === '/admin/login' || 
    currentHash === '#/admin' || 
    currentHash === '#admin';

  if (isRouteAdmin) {
    return <NeuralAccessLogin onExit={() => { 
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/';
      } else {
        window.location.hash = ''; 
      }
    }} />;
  }

  const handleHeaderNavigate = (sectionId: string) => {
    switch (sectionId) {
      case 'hero':
        scrollToDistrict(0);
        break;
      case 'capabilities':
        scrollToDistrict(4);
        break;
      case 'lab':
        scrollToDistrict(8);
        break;
      case 'process':
        scrollToDistrict(6);
        break;
      case 'philosophy':
        scrollToDistrict(9);
        break;
      case 'impact':
        scrollToDistrict(9);
        break;
      case 'contact':
        scrollToDistrict(10);
        break;
      default:
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-void text-[#F4F4F6] selection:bg-signal selection:text-white overflow-x-clip">
      {/* 3D WebGL Spatial World Background */}
      <WorldCanvasView />

      {/* Spatial Minimap Waypoint Strip */}
      <SpatialMinimap
        activeIndex={activeDistrictIndex}
        onSelectDistrict={scrollToDistrict}
      />

      {/* Persistent Telemetry Header */}
      <Header
        onNavigate={handleHeaderNavigate}
        onOpenConcierge={() => setIsConciergeOpen(true)}
        isConciergeOpen={isConciergeOpen}
      />

      {/* Spatial HUD Content Panels */}
      <main className="relative z-10">
        <WorldHUD
          activeDistrictIndex={activeDistrictIndex}
          progress={progress}
          onJumpToDistrict={scrollToDistrict}
        />
      </main>

      {/* Verified Footer with Founder Attribution */}
      <div className="relative z-20">
        <Footer onNavigate={handleHeaderNavigate} />
      </div>

      {/* Floating Ambient Concierge Presence Beacon */}
      <ConciergeTrigger
        isOpen={isConciergeOpen}
        onClick={() => setIsConciergeOpen(true)}
      />

      {/* Master Pixel AI Concierge Experience */}
      <NexusConcierge
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
      />
    </div>
  );
};

export default App;

