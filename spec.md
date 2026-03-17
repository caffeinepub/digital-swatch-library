# Digital Swatch Library

## Current State
The FabricVisualiser component renders a single T-shirt shape using basic Three.js primitives (CylinderGeometry, TorusGeometry) with a flat MeshStandardMaterial that only accepts a solid hex colour. There is no garment type selector and no texture mapping.

## Requested Changes (Diff)

### Add
- Garment type selector: T-Shirt, Trousers, Jacket, Saree/Drape, Hoodie — switchable via tab/button row above the 3D canvas
- Each garment type has a distinct procedural 3D mesh built from Three.js primitives
- Realistic fabric texture mapping using a procedurally generated canvas texture that simulates woven fabric (crosshatch weave pattern) tinted to the selected colour, giving visible cloth grain
- Normal-map-like roughness variation via a second canvas texture for surface depth
- Fabric texture tiles across UV surface to simulate real textile repeat
- Ambient occlusion pass via hemisphereLight and pointLight fill to add depth

### Modify
- FabricVisualiser.tsx: replace single TshirtModel with a multi-garment system; replace flat MeshStandardMaterial with textured material using `THREE.CanvasTexture`
- Scene component receives both hexColor and garmentType props

### Remove
- Nothing removed from existing feature set

## Implementation Plan
1. Add garment type state and selector UI (T-Shirt, Trousers, Jacket, Saree/Drape, Hoodie)
2. Build procedural mesh components for each garment type
3. Create a `useFabricMaterial` hook that generates a woven-pattern CanvasTexture tinted to the hex colour, with a roughness map, returning a MeshStandardMaterial
4. Wire garment selector and texture material into the Canvas scene
5. Validate and deploy
