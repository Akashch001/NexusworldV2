import Lenis from 'lenis';
import gsap from 'gsap';

export class SpatialMotionController {
  private static instance: SpatialMotionController | null = null;
  public lenis: Lenis | null = null;
  private rafId: number = 0;
  private listeners: ((progress: number, scrollY: number) => void)[] = [];

  private constructor() {
    this.initLenis();
  }

  public static getInstance(): SpatialMotionController {
    if (!SpatialMotionController.instance) {
      SpatialMotionController.instance = new SpatialMotionController();
    }
    return SpatialMotionController.instance;
  }

  private initLenis() {
    if (typeof window === 'undefined') return;

    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    const raf = (time: number) => {
      this.lenis?.raf(time);
      this.rafId = requestAnimationFrame(raf);
    };
    this.rafId = requestAnimationFrame(raf);

    this.lenis.on('scroll', (e: { progress: number; scroll: number }) => {
      this.listeners.forEach((fn) => fn(e.progress, e.scroll));
    });
  }

  public subscribe(fn: (progress: number, scrollY: number) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  public scrollTo(target: string | number | HTMLElement, offset: number = 0) {
    if (!this.lenis) return;
    this.lenis.scrollTo(target, { offset, duration: 1.5 });
  }

  public destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lenis?.destroy();
    this.listeners = [];
    SpatialMotionController.instance = null;
  }
}

export { gsap };
