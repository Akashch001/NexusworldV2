# NEXUSWORLD MASTER PLAN

**Agent 00: Lead / Orchestrator**

## Vision
Create a digital world that serves as the website for NexusWorld. The website must feel like a spatial system, communicating digital design, web development, AI, automation, and premium craftsmanship through environment and interaction.

**Core Mantra: YOU DON'T SCROLL NEXUSWORLD. YOU ENTER IT.**

## Source of Truth Documents
1. `REPOSITORY_AUDIT.md` - Current state and proposed tech stack.
2. `VISUAL_DIRECTION.md` - Colors, typography, lighting, material language.
3. `EXPERIENCE_FLOW.md` - Visitor journey and camera states.
4. `WORLD_ARCHITECTURE.md` - 3D hierarchy, performance, and structure.

## Technical Architecture
- React + TypeScript + Vite
- Tailwind CSS
- Three.js + React Three Fiber + Drei
- GSAP + ScrollTrigger + Lenis

## Implementation Phases

### Phase 1: Foundation
- Initialize project with React, TS, Vite, Tailwind.
- Install Three.js, R3F, GSAP, Lenis.
- Setup directory structure (`src/components/world`, `src/components/ui`, etc.).
- Setup global styles, typography (`Inter`), and routing/state management.
- Establish the WebGL Canvas and HTML overlay structure.

### Phase 2: The Void & Base Camera
- Implement black environment with `WorldParticles.tsx`.
- Setup Lenis smooth scroll and a normalized scroll progress state (`0` to `1`).
- Setup `CameraRig.tsx` that moves the camera based on scroll progress.
- Implement subtle pointer parallax.

### Phase 3: The Nexus Core
- Build the central geometric `N` (`NexusCore.tsx`).
- Implement its assembly animation tied to early scroll progress.
- Establish the core lighting (cinematic, matte black, emissive blue).

### Phase 4: World Formation & Districts
- Lay out the physical districts radially or linearly.
- `DesignDistrict.tsx`, `DevelopmentDistrict.tsx`, `AIDistrict.tsx`, `AutomationDistrict.tsx`.
- Connect them with `SignalNetwork.tsx` (electric blue energy paths).

### Phase 5: UI & Content Integration
- Build the HTML HUD (`src/components/ui`).
- Synchronize UI visibility with camera states (e.g., showing Design Services text only when the camera is at the Design District).

### Phase 6: Physics & Polish
- Refine camera inertia.
- Add proximity responses to objects.
- Adjust lighting, typography, and spacing to hit the "Premium" requirement.

### Phase 7: Optimization & QA
- Profile WebGL performance.
- Implement responsive breakpoints (Desktop, Tablet, Mobile).
- Setup accessibility (reduced-motion, keyboard nav).

## Rules of Engagement
- **NO Generic SaaS tropes:** No template layouts, generic cards, or massive gradients.
- **Physicality:** Scrolling moves the camera, objects have mass, light behaves cinematically.
- **The Signal:** Electric blue (`#2563EB`) is functional—used for active/connected states only.
- **Autonomy & Documentation:** Make architectural decisions carefully and document them in `DECISIONS.md`.

*End of Master Plan.*
