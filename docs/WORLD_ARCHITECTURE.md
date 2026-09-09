# WORLD ARCHITECTURE

**Agent 04: 3D World Architect**

## 1. Technical Stack
- `three`
- `@react-three/fiber` (R3F)
- `@react-three/drei` (Helpers, Loaders, Controls)
- `gsap` (Timeline and ScrollTrigger for camera manipulation)

## 2. Coordinate System & Scale
- **Center `[0,0,0]`:** The Nexus Core.
- **Scale:** 1 unit = 1 meter.
- **Layout Strategy:** Districts are positioned radially or linearly along a designed camera spline.

## 3. Core Components

### `World.tsx`
The main R3F Canvas container. Manages the global scene state, lighting, and post-processing.

### `CameraRig.tsx`
Handles the cinematic camera movement. Subscribes to a normalized scroll value (`0` to `1`) and maps it to a predefined path (using `CatmullRomCurve3` or GSAP timelines).

### `NexusCore.tsx`
The central geometric `N` structure. Composed of modular fragments that can animate into place. Uses custom shaders for emissive pulsing.

### Districts
Each district is a separate React component, lazy-loaded if necessary:
- `DesignDistrict.tsx`
- `DevelopmentDistrict.tsx`
- `AIDistrict.tsx`
- `AutomationDistrict.tsx`

### `SignalNetwork.tsx`
Handles the electric blue connections between districts and the core. Rendered using `Line` or `TubeGeometry` with flowing emissive textures or shaders.

### `WorldParticles.tsx`
InstancedMesh for performance. Particles react to the camera velocity and pointer position.

## 4. Performance Strategy
- **Instancing:** Extensive use of `InstancedMesh` for particles, structural identical blocks, and data nodes.
- **Geometry:** Low-poly models where possible. Baked bevels via normal maps instead of high-poly geometry.
- **Materials:** Reusing `MeshStandardMaterial` or `MeshBasicMaterial` instances across the scene.
- **Post-Processing:** Use sparingly. If Bloom is needed for the blue signals, use `SelectiveBloom` or limit the resolution of the effect.
- **Drei's `<BakeShadows />` / `<SoftShadows />`:** Used intelligently. Static shadows baked where possible; dynamic shadows restricted to essential moving parts (like the camera light).
- **Asset Loading:** Use `useGLTF` with Draco compression. Preload core assets, lazy load others.

## 5. Interaction Model
- **Scroll Controller:** Lenis captures scroll, normalizes to `0-1`, feeds into a global Zustand store or directly into the R3F useFrame loop.
- **Pointer Controller:** Modulates a subtle rotation offset on the camera rig to create parallax without moving the main camera origin.
