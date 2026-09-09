# REPOSITORY AUDIT

**Agent 01: Senior Software Architect**

## 1. Current State
- The directory `/Users/akashchakraborty/Desktop/NexusWorld V2` is currently **empty**.
- There is no existing code, configuration, or assets to audit.

## 2. Recommended Architecture
Given the requirements for a high-performance 3D spatial web experience with smooth scroll and physics, the following technology stack is recommended:

### Foundation
- **Framework:** React 18
- **Language:** TypeScript (Strict Mode)
- **Build Tool:** Vite (for fast HMR and optimized production builds)

### 3D & WebGL
- **Core 3D Engine:** Three.js
- **React Abstraction:** `@react-three/fiber`
- **Helpers & Components:** `@react-three/drei`
- **Shaders:** GLSL (RawShaderMaterial / ShaderMaterial)

### Animation & Physics
- **Animation Engine:** GSAP (GreenSock Animation Platform)
- **Scroll Hook:** GSAP ScrollTrigger
- **Smooth Scrolling:** `@studio-freight/lenis` (Provides inertia and smooth scrolling behavior)
- **Interaction/Physics:** Custom physics controllers mapping normalized scroll progress (`0` to `1`) to camera states and object properties.

### Styling & UI
- **CSS Architecture:** Tailwind CSS (for the UI overlay) combined with CSS Modules or global CSS for specialized needs. Tailwind is lightweight and enables fast UI iteration for the HUD layer.

### Code Quality & Formatting
- **Linter:** ESLint
- **Formatter:** Prettier

## 3. Action Items for Phase 1
- Initialize React + TypeScript + Vite project.
- Install dependencies (Three, R3F, Drei, GSAP, Lenis, Tailwind).
- Setup absolute path imports (`src/*`).
- Configure initial routing if necessary, although a single-page 3D canvas experience with overlaid HTML states is preferred.
- Establish the `/docs` folder as the source of truth.
