import * as THREE from 'three';

export interface SceneCallbacks {
  onProgressUpdate?: (progress: number, stateIndex: number, stateName: string) => void;
}

export class NexusWorldScene {
  public container: HTMLElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  
  private animationFrameId: number = 0;
  private spline: THREE.CatmullRomCurve3;
  private lookSpline: THREE.CatmullRomCurve3;
  
  // Objects
  private coreGroup: THREE.Group;
  private coreNParts: THREE.Mesh[] = [];
  private designDistrictGroup: THREE.Group;
  private devDistrictGroup: THREE.Group;
  private aiDistrictGroup: THREE.Group;
  private autoDistrictGroup: THREE.Group;
  private signalNetworkGroup: THREE.Group;
  private particles: THREE.Points | null = null;
  private pointLightCore: THREE.PointLight;

  // State
  private scrollProgress: number = 0;
  private targetScrollProgress: number = 0;
  private mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  private callbacks: SceneCallbacks;
  private isDestroyed: boolean = false;

  constructor(container: HTMLElement, callbacks: SceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Renderer Setup
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // 2. Scene & Camera Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050507);
    this.scene.fog = new THREE.FogExp2(0x050507, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      isMobile ? 62 : 48,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    // 3. Camera Spline Definition through the 3D World
    // State 0: Void [0, 20, 60] -> Core [0, 3, 14] -> Design [-18, 4, -12] -> Dev [18, 5, -28] -> AI [0, 8, -48] -> Auto [-16, 6, -68] -> Lab [16, 5, -88] -> Final [0, 15, -120]
    const cameraPoints = [
      new THREE.Vector3(0, 8, 45),     // 00. Void
      new THREE.Vector3(0, 3, 20),     // 01. Signal / Approach
      new THREE.Vector3(0, 1.5, 9),    // 02. Nexus Core
      new THREE.Vector3(-14, 3, -4),   // 03. World Reveal
      new THREE.Vector3(-22, 2, -18),  // 04. Design District
      new THREE.Vector3(18, 3, -34),   // 05. Dev District
      new THREE.Vector3(0, 5, -52),    // 06. AI District
      new THREE.Vector3(-18, 4, -70),  // 07. Automation District
      new THREE.Vector3(16, 3, -88),   // 08. The Lab
      new THREE.Vector3(0, 10, -106),  // 09. Philosophy
      new THREE.Vector3(0, 24, -135),  // 10. Final Nexus
    ];

    const lookPoints = [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-10, 0, -10),
      new THREE.Vector3(-22, 0, -22),
      new THREE.Vector3(18, 0, -38),
      new THREE.Vector3(0, 0, -56),
      new THREE.Vector3(-18, 0, -74),
      new THREE.Vector3(16, 0, -92),
      new THREE.Vector3(0, 0, -110),
      new THREE.Vector3(0, 0, -70),
    ];

    this.spline = new THREE.CatmullRomCurve3(cameraPoints);
    this.lookSpline = new THREE.CatmullRomCurve3(lookPoints);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xf4f4f6, 1.2);
    dirLight.position.set(20, 40, 30);
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x2563eb, 2.0);
    rimLight.position.set(-20, -10, -20);
    this.scene.add(rimLight);

    this.pointLightCore = new THREE.PointLight(0x2563eb, 3.5, 40);
    this.pointLightCore.position.set(0, 2, 0);
    this.scene.add(this.pointLightCore);

    // 5. Initialize World Geometries
    this.coreGroup = new THREE.Group();
    this.designDistrictGroup = new THREE.Group();
    this.devDistrictGroup = new THREE.Group();
    this.aiDistrictGroup = new THREE.Group();
    this.autoDistrictGroup = new THREE.Group();
    this.signalNetworkGroup = new THREE.Group();

    this.buildNexusCore();
    this.buildDesignDistrict();
    this.buildDevDistrict();
    this.buildAIDistrict();
    this.buildAutoDistrict();
    this.buildSignalNetwork();
    this.buildWorldParticles();

    this.scene.add(this.coreGroup);
    this.scene.add(this.designDistrictGroup);
    this.scene.add(this.devDistrictGroup);
    this.scene.add(this.aiDistrictGroup);
    this.scene.add(this.autoDistrictGroup);
    this.scene.add(this.signalNetworkGroup);

    // 6. Event Listeners
    window.addEventListener('resize', this.onWindowResize);
    window.addEventListener('mousemove', this.onMouseMove);

    // 7. Start Loop
    this.tick();
  }

  // --- NEXUS CORE BUILDER ---
  private buildNexusCore() {
    // Architectural geometric "N" composed of 3 monolithic pillars
    const matteBlackMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0e,
      roughness: 0.2,
      metalness: 0.8,
    });

    const emissiveEdgeMat = new THREE.MeshBasicMaterial({
      color: 0x2563eb,
    });

    // Left Vertical Bar
    const leftBarGeo = new THREE.BoxGeometry(0.8, 5.0, 0.8);
    const leftBar = new THREE.Mesh(leftBarGeo, matteBlackMat);
    leftBar.position.set(-1.8, 0, 0);
    this.coreNParts.push(leftBar);
    this.coreGroup.add(leftBar);

    // Right Vertical Bar
    const rightBarGeo = new THREE.BoxGeometry(0.8, 5.0, 0.8);
    const rightBar = new THREE.Mesh(rightBarGeo, matteBlackMat);
    rightBar.position.set(1.8, 0, 0);
    this.coreNParts.push(rightBar);
    this.coreGroup.add(rightBar);

    // Diagonal Bar
    const diagBarGeo = new THREE.BoxGeometry(0.8, 5.8, 0.8);
    const diagBar = new THREE.Mesh(diagBarGeo, matteBlackMat);
    diagBar.rotation.z = -0.66;
    diagBar.position.set(0, 0, 0.05);
    this.coreNParts.push(diagBar);
    this.coreGroup.add(diagBar);

    // Emissive Signal Core Crystal
    const coreCrystalGeo = new THREE.OctahedronGeometry(0.6, 0);
    const coreCrystal = new THREE.Mesh(coreCrystalGeo, emissiveEdgeMat);
    coreCrystal.position.set(0, 0, 0.6);
    this.coreGroup.add(coreCrystal);

    // Surrounding Floating Monolith Rings
    const ringGeo = new THREE.TorusGeometry(3.6, 0.04, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.4 });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 2.2;
    this.coreGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.y = Math.PI / 3;
    this.coreGroup.add(ring2);
  }

  // --- DESIGN DISTRICT BUILDER ---
  private buildDesignDistrict() {
    this.designDistrictGroup.position.set(-22, 0, -20);

    const frameMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });

    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x0e0e14,
      roughness: 0.3,
      metalness: 0.7,
    });

    // 3 Floating UI Layout Topographies
    for (let i = 0; i < 4; i++) {
      const w = 4 + (i % 2) * 2;
      const h = 2.5 + (i % 3);
      const panel = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), surfaceMat);
      panel.position.set((i - 1.5) * 2.5, i * 1.2, -i * 2);
      panel.rotation.y = 0.25 - i * 0.1;
      this.designDistrictGroup.add(panel);

      // Wireframe overlay
      const wire = new THREE.Mesh(new THREE.BoxGeometry(w + 0.05, h + 0.05, 0.12), frameMat);
      panel.add(wire);
    }
  }

  // --- DEV DISTRICT BUILDER ---
  private buildDevDistrict() {
    this.devDistrictGroup.position.set(18, 0, -36);

    const blockMat = new THREE.MeshStandardMaterial({
      color: 0x08080c,
      roughness: 0.15,
      metalness: 0.9,
    });

    const blueLineMat = new THREE.MeshBasicMaterial({ color: 0x2563eb });

    // Matrix of modular monolithic server blocks
    for (let x = 0; x < 5; x++) {
      for (let z = 0; z < 4; z++) {
        const height = 1.5 + Math.sin(x * 1.5 + z) * 1.2 + Math.random() * 1.5;
        const block = new THREE.Mesh(new THREE.BoxGeometry(1.2, height, 1.2), blockMat);
        block.position.set((x - 2) * 2.2, height / 2, (z - 2) * 2.2);
        this.devDistrictGroup.add(block);

        // Top indicator light
        const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), blueLineMat);
        indicator.position.set(0, height / 2 + 0.03, 0);
        block.add(indicator);
      }
    }
  }

  // --- AI DISTRICT BUILDER ---
  private buildAIDistrict() {
    this.aiDistrictGroup.position.set(0, 0, -56);

    const nodeMat = new THREE.MeshStandardMaterial({
      color: 0x181824,
      emissive: 0x2563eb,
      emissiveIntensity: 0.5,
      roughness: 0.1,
    });

    // 3D Neural Nodes & Tensor Ring
    for (let i = 0; i < 18; i++) {
      const angle = (i / 18) * Math.PI * 2;
      const radius = 4.5 + (i % 3) * 1.5;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), nodeMat);
      sphere.position.set(
        Math.cos(angle) * radius,
        Math.sin(i * 1.2) * 2.5 + 2,
        Math.sin(angle) * radius
      );
      this.aiDistrictGroup.add(sphere);
    }

    // Outer Cognitive Ring
    const cognitiveRing = new THREE.Mesh(
      new THREE.TorusGeometry(7.5, 0.05, 16, 120),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.5 })
    );
    cognitiveRing.rotation.x = Math.PI / 2;
    cognitiveRing.position.y = 2;
    this.aiDistrictGroup.add(cognitiveRing);
  }

  // --- AUTOMATION DISTRICT BUILDER ---
  private buildAutoDistrict() {
    this.autoDistrictGroup.position.set(-18, 0, -74);

    const stepMat = new THREE.MeshStandardMaterial({
      color: 0x0f0f15,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Sequential state pipeline cylinders
    for (let i = 0; i < 5; i++) {
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.4, 32), stepMat);
      cyl.position.set((i - 2) * 3.5, 0.5 + i * 0.4, 0);
      this.autoDistrictGroup.add(cyl);

      // Pulse ring
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.4, 0.03, 16, 32),
        new THREE.MeshBasicMaterial({ color: 0x2563eb })
      );
      ring.rotation.x = Math.PI / 2;
      cyl.add(ring);
    }
  }

  // --- SIGNAL NETWORK BUILDER ---
  private buildSignalNetwork() {
    // Flowing electric blue signal lines connecting the core to the districts
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.6,
    });

    const districtPoints = [
      new THREE.Vector3(-22, 0, -20),
      new THREE.Vector3(18, 0, -36),
      new THREE.Vector3(0, 0, -56),
      new THREE.Vector3(-18, 0, -74),
      new THREE.Vector3(16, 0, -92),
    ];

    districtPoints.forEach((dest) => {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(dest.x * 0.5, 6, dest.z * 0.5),
        dest
      );
      const points = curve.getPoints(50);
      const geo = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geo, lineMat);
      this.signalNetworkGroup.add(line);
    });
  }

  // --- WORLD PARTICLES BUILDER ---
  private buildWorldParticles() {
    const particleCount = 700;
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 120;
      positions[i + 1] = Math.random() * 40 - 5;
      positions[i + 2] = (Math.random() - 0.5) * 180 - 40;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0x8888aa,
      size: 0.15,
      transparent: true,
      opacity: 0.5,
    });

    this.particles = new THREE.Points(geo, mat);
    this.scene.add(this.particles);
  }

  // --- SCROLL PROGRESS INTERFACE ---
  public setScrollProgress(progress: number) {
    this.targetScrollProgress = THREE.MathUtils.clamp(progress, 0, 1);
  }

  private onMouseMove = (e: MouseEvent) => {
    this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  private onWindowResize = () => {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const isMobile = window.innerWidth < 768;
    this.camera.fov = isMobile ? 62 : 48;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2.0));
  };

  // --- RENDER LOOP ---
  private tick = () => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.tick);

    // Smooth scroll dampening
    this.scrollProgress += (this.targetScrollProgress - this.scrollProgress) * 0.06;

    // Smooth mouse parallax dampening
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Calculate camera position and lookTarget along spline
    const t = THREE.MathUtils.clamp(this.scrollProgress, 0, 1);
    const cameraPos = this.spline.getPointAt(t);
    const lookTarget = this.lookSpline.getPointAt(t);

    // Apply mouse parallax
    this.camera.position.set(
      cameraPos.x + this.mouse.x * 0.8,
      cameraPos.y + this.mouse.y * 0.6,
      cameraPos.z
    );
    this.camera.lookAt(lookTarget);

    // Core Assembly Animation (State 1 -> 2)
    const assemblyFactor = THREE.MathUtils.clamp(this.scrollProgress * 4, 0, 1);
    const disperse = 1 - assemblyFactor;

    if (this.coreNParts.length >= 3) {
      this.coreNParts[0].position.x = -1.8 - disperse * 4;
      this.coreNParts[1].position.x = 1.8 + disperse * 4;
      this.coreNParts[2].position.y = disperse * 6;
      this.coreNParts[2].rotation.z = -0.66 + disperse * 1.5;
    }

    // Rotations & dynamic energy
    this.coreGroup.rotation.y = this.scrollProgress * Math.PI * 0.5;
    this.aiDistrictGroup.rotation.y += 0.005;

    // Notify HUD callbacks of state index
    const stateCount = 11;
    const rawState = t * (stateCount - 1);
    const stateIndex = Math.round(rawState);
    const stateNames = [
      'VOID',
      'SIGNAL',
      'NEXUS CORE',
      'WORLD REVEAL',
      'DESIGN DISTRICT',
      'DEVELOPMENT DISTRICT',
      'AI DISTRICT',
      'AUTOMATION DISTRICT',
      'THE LAB',
      'PHILOSOPHY',
      'FINAL NEXUS',
    ];
    if (this.callbacks.onProgressUpdate) {
      this.callbacks.onProgressUpdate(t, stateIndex, stateNames[stateIndex] || 'NEXUS');
    }

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.animationFrameId);
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onMouseMove);
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer.dispose();
  }
}
