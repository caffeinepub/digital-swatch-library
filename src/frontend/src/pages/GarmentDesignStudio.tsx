import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Environment, OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import {
  ChevronDown,
  ChevronRight,
  Download,
  Layers,
  Search,
  Sparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Suspense, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import type { View } from "../App";
import type { Fabric } from "../data/swatchData";

type GarmentType = "tshirt" | "hoodie" | "jacket" | "trousers" | "dress";

interface ActiveColour {
  hex: string;
  imageUrl?: string;
  fabricName: string;
  colourName: string;
}

interface GarmentDesignStudioProps {
  fabrics: Fabric[];
  navigate: (v: View) => void;
}

// ── Garment icons (SVG paths) ──────────────────────────────────────────────
const garmentConfig: {
  id: GarmentType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "tshirt",
    label: "T-Shirt",
    icon: (
      <svg
        role="img"
        aria-label="T-Shirt"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-8 h-8"
      >
        <path d="M2 7l4-3h4l2 3 2-3h4l4 3-3 3-1-1v9H6V9L5 10z" />
      </svg>
    ),
  },
  {
    id: "hoodie",
    label: "Hoodie",
    icon: (
      <svg
        role="img"
        aria-label="Hoodie"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-8 h-8"
      >
        <path d="M2 8l4-4c1 2 2 3 6 3s5-1 6-3l4 4-3 2-1-1v10H6V9L5 10z" />
        <path d="M10 4c0 2 4 2 4 0" />
      </svg>
    ),
  },
  {
    id: "jacket",
    label: "Jacket",
    icon: (
      <svg
        role="img"
        aria-label="Jacket"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-8 h-8"
      >
        <path d="M3 7l3-3 3 4V20H5V9L3 7z" />
        <path d="M21 7l-3-3-3 4V20h4V9l2-2z" />
        <path d="M9 8l3 2 3-2" />
        <path d="M12 10v10" />
      </svg>
    ),
  },
  {
    id: "trousers",
    label: "Trousers",
    icon: (
      <svg
        role="img"
        aria-label="Trousers"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-8 h-8"
      >
        <path d="M5 3h14v4l-3 14h-4l-2-8-2 8H4L1 7z" />
      </svg>
    ),
  },
  {
    id: "dress",
    label: "Dress",
    icon: (
      <svg
        role="img"
        aria-label="Dress"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="w-8 h-8"
      >
        <path d="M9 2h6l1 5 3 13H5L8 7z" />
        <path d="M8 7c1 2 7 2 8 0" />
      </svg>
    ),
  },
];

// ── Woven canvas texture generator ─────────────────────────────────────────
function createWovenTexture(hex: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, size, size);

  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);

  const darkFactor = 0.75;
  const lightFactor = 1.15;
  const dark = `rgb(${Math.round(r * darkFactor)},${Math.round(g * darkFactor)},${Math.round(b * darkFactor)})`;
  const light = `rgba(${Math.min(255, Math.round(r * lightFactor))},${Math.min(255, Math.round(g * lightFactor))},${Math.min(255, Math.round(b * lightFactor))},0.6)`;

  const threadW = 10;
  const gap = 2;

  for (let y = 0; y < size; y += threadW + gap) {
    ctx.fillStyle = dark;
    ctx.fillRect(0, y, size, threadW);
  }
  for (let x = 0; x < size; x += threadW + gap) {
    ctx.fillStyle = light;
    ctx.fillRect(x, 0, threadW, size);
  }

  for (let i = 0; i < 3000; i++) {
    const px = Math.random() * size;
    const py = Math.random() * size;
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`;
    ctx.fillRect(px, py, 1, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// ── Extrude settings helper ─────────────────────────────────────────────────
const extrudeSettings = {
  depth: 0.16,
  bevelEnabled: true,
  bevelThickness: 0.025,
  bevelSize: 0.025,
  bevelSegments: 3,
};

const extrudeSettingsThin = {
  depth: 0.06,
  bevelEnabled: true,
  bevelThickness: 0.01,
  bevelSize: 0.01,
  bevelSegments: 2,
};

// ── T-Shirt ─────────────────────────────────────────────────────────────────
function TShirtMesh({ material }: { material: THREE.Material }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Trace clockwise from bottom-left hem
    shape.moveTo(-0.62, -1.2);
    shape.lineTo(-0.62, 0.38);
    // Left armhole underarm curve
    shape.quadraticCurveTo(-0.68, 0.58, -0.92, 0.54);
    shape.lineTo(-1.52, 0.52); // left sleeve body
    shape.lineTo(-1.68, 0.74); // left sleeve tip low
    shape.lineTo(-1.62, 0.94); // left sleeve tip high
    shape.lineTo(-1.12, 0.96); // left sleeve inner top
    // Left shoulder slope
    shape.quadraticCurveTo(-0.82, 0.88, -0.54, 1.08);
    // Neck — smooth bezier curve
    shape.bezierCurveTo(-0.34, 1.22, -0.18, 1.32, 0.0, 1.32);
    shape.bezierCurveTo(0.18, 1.32, 0.34, 1.22, 0.54, 1.08);
    // Right shoulder slope
    shape.quadraticCurveTo(0.82, 0.88, 1.12, 0.96);
    shape.lineTo(1.62, 0.94); // right sleeve tip high
    shape.lineTo(1.68, 0.74); // right sleeve tip low
    shape.lineTo(1.52, 0.52); // right sleeve body
    // Right armhole underarm curve
    shape.quadraticCurveTo(0.68, 0.58, 0.62, 0.38);
    shape.lineTo(0.62, -1.2); // right side
    shape.lineTo(-0.62, -1.2); // bottom hem

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} material={material} castShadow receiveShadow />
  );
}

// ── Hoodie ──────────────────────────────────────────────────────────────────
function HoodieMesh({ material }: { material: THREE.Material }) {
  // Main body (similar to t-shirt but with narrower neck for hood)
  const bodyGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.66, -1.22);
    shape.lineTo(-0.66, 0.36);
    shape.quadraticCurveTo(-0.72, 0.56, -0.96, 0.52);
    shape.lineTo(-1.56, 0.5);
    shape.lineTo(-1.72, 0.72);
    shape.lineTo(-1.65, 0.94);
    shape.lineTo(-1.14, 0.94);
    shape.quadraticCurveTo(-0.88, 0.86, -0.58, 1.04);
    // Tighter neck for hoodie
    shape.bezierCurveTo(-0.4, 1.16, -0.22, 1.22, 0.0, 1.22);
    shape.bezierCurveTo(0.22, 1.22, 0.4, 1.16, 0.58, 1.04);
    shape.quadraticCurveTo(0.88, 0.86, 1.14, 0.94);
    shape.lineTo(1.65, 0.94);
    shape.lineTo(1.72, 0.72);
    shape.lineTo(1.56, 0.5);
    shape.quadraticCurveTo(0.72, 0.56, 0.66, 0.36);
    shape.lineTo(0.66, -1.22);
    shape.lineTo(-0.66, -1.22);

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Hood — an arch sitting on top of the body
  const hoodGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Hood base from left to right, arch up in the middle
    shape.moveTo(-0.46, 0.0);
    shape.lineTo(-0.52, 0.18);
    // Left hood side curves up
    shape.bezierCurveTo(-0.62, 0.5, -0.58, 0.88, -0.38, 1.08);
    // Top of hood — arch
    shape.bezierCurveTo(-0.18, 1.28, 0.18, 1.28, 0.38, 1.08);
    // Right hood side comes down
    shape.bezierCurveTo(0.58, 0.88, 0.62, 0.5, 0.52, 0.18);
    shape.lineTo(0.46, 0.0);
    // Hood opening (inner cutout)
    const hole = new THREE.Path();
    hole.moveTo(-0.3, 0.08);
    hole.bezierCurveTo(-0.34, 0.34, -0.3, 0.68, -0.14, 0.82);
    hole.bezierCurveTo(-0.04, 0.92, 0.04, 0.92, 0.14, 0.82);
    hole.bezierCurveTo(0.3, 0.68, 0.34, 0.34, 0.3, 0.08);
    hole.lineTo(-0.3, 0.08);
    shape.holes.push(hole);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.015,
      bevelSegments: 2,
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Front pocket
  const pocketGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.32, -0.28);
    shape.lineTo(-0.32, 0.1);
    shape.bezierCurveTo(-0.32, 0.14, -0.28, 0.16, -0.24, 0.16);
    shape.lineTo(0.24, 0.16);
    shape.bezierCurveTo(0.28, 0.16, 0.32, 0.14, 0.32, 0.1);
    shape.lineTo(0.32, -0.28);
    shape.lineTo(-0.32, -0.28);
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettingsThin);
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      <mesh geometry={bodyGeo} material={material} castShadow receiveShadow />
      {/* Hood positioned above body neck */}
      <mesh
        geometry={hoodGeo}
        material={material}
        castShadow
        receiveShadow
        position={[0, 1.44, 0.0]}
      />
      {/* Pocket on front lower body */}
      <mesh
        geometry={pocketGeo}
        material={material}
        castShadow
        receiveShadow
        position={[0, -0.5, 0.12]}
      />
    </group>
  );
}

// ── Jacket ──────────────────────────────────────────────────────────────────
function JacketMesh({ material }: { material: THREE.Material }) {
  // Body — wider and longer than t-shirt, V-neck opening for lapels
  const bodyGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.72, -1.45);
    shape.lineTo(-0.72, 0.4);
    shape.quadraticCurveTo(-0.78, 0.62, -1.06, 0.58);
    shape.lineTo(-1.72, 0.54);
    shape.lineTo(-1.88, 0.78);
    shape.lineTo(-1.8, 1.02);
    shape.lineTo(-1.22, 1.0);
    shape.quadraticCurveTo(-0.92, 0.9, -0.6, 1.08);
    // V-neck collar opening — left side goes to center-top
    shape.lineTo(-0.22, 1.36);
    shape.lineTo(0.0, 1.44);
    shape.lineTo(0.22, 1.36);
    shape.quadraticCurveTo(0.6, 1.08, 0.92, 0.9);
    shape.lineTo(1.22, 1.0);
    shape.lineTo(1.8, 1.02);
    shape.lineTo(1.88, 0.78);
    shape.lineTo(1.72, 0.54);
    shape.quadraticCurveTo(0.78, 0.62, 0.72, 0.4);
    shape.lineTo(0.72, -1.45);
    shape.lineTo(-0.72, -1.45);

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Left lapel
  const leftLapelGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.0, 0.0);
    shape.lineTo(-0.38, -0.22);
    shape.lineTo(-0.42, 0.52);
    shape.lineTo(-0.08, 0.68);
    shape.lineTo(0.0, 0.0);
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettingsThin);
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Right lapel
  const rightLapelGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0.0, 0.0);
    shape.lineTo(0.38, -0.22);
    shape.lineTo(0.42, 0.52);
    shape.lineTo(0.08, 0.68);
    shape.lineTo(0.0, 0.0);
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettingsThin);
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Collar band
  const collarGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.55, 0.0);
    shape.lineTo(-0.55, 0.18);
    shape.bezierCurveTo(-0.4, 0.28, -0.2, 0.32, 0.0, 0.32);
    shape.bezierCurveTo(0.2, 0.32, 0.4, 0.28, 0.55, 0.18);
    shape.lineTo(0.55, 0.0);
    shape.bezierCurveTo(0.38, 0.1, 0.2, 0.14, 0.0, 0.14);
    shape.bezierCurveTo(-0.2, 0.14, -0.38, 0.1, -0.55, 0.0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.08,
      bevelEnabled: false,
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      <mesh geometry={bodyGeo} material={material} castShadow receiveShadow />
      <mesh
        geometry={leftLapelGeo}
        material={material}
        castShadow
        position={[-0.18, 0.88, 0.12]}
      />
      <mesh
        geometry={rightLapelGeo}
        material={material}
        castShadow
        position={[0.18, 0.88, 0.12]}
      />
      <mesh
        geometry={collarGeo}
        material={material}
        castShadow
        position={[0, 1.32, 0.1]}
      />
    </group>
  );
}

// ── Trousers ─────────────────────────────────────────────────────────────────
function TrousersMesh({ material }: { material: THREE.Material }) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    // Waistband top-left
    shape.moveTo(-0.72, 1.28);
    shape.lineTo(0.72, 1.28); // waistband top-right
    shape.lineTo(0.72, 0.96); // right waistband bottom
    // Right leg outer seam
    shape.lineTo(0.68, 0.52);
    shape.lineTo(0.62, -1.28); // right leg bottom-right
    shape.lineTo(0.1, -1.28); // right leg bottom-left (inseam)
    // Crotch curve between legs
    shape.quadraticCurveTo(0.0, -0.68, -0.1, -1.28);
    shape.lineTo(-0.62, -1.28); // left leg bottom-right (inseam)
    shape.lineTo(-0.68, 0.52);
    shape.lineTo(-0.72, 0.96); // left waistband bottom
    shape.lineTo(-0.72, 1.28); // back to start

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Waistband highlight strip
  const waistGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.7, 0.0);
    shape.lineTo(0.7, 0.0);
    shape.lineTo(0.7, 0.24);
    shape.lineTo(-0.7, 0.24);
    shape.lineTo(-0.7, 0.0);
    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettingsThin);
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      <mesh geometry={geometry} material={material} castShadow receiveShadow />
      <mesh
        geometry={waistGeo}
        material={material}
        castShadow
        position={[0, 1.04, 0.1]}
      />
    </group>
  );
}

// ── Dress ────────────────────────────────────────────────────────────────────
function DressMesh({ material }: { material: THREE.Material }) {
  // Full dress silhouette — fitted bodice flaring into A-line skirt
  const dressGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Start at bottom-left of skirt hem
    shape.moveTo(-1.22, -1.35);
    // Skirt left seam curves in to waist
    shape.bezierCurveTo(-1.1, -0.8, -0.72, -0.4, -0.46, -0.1);
    // Bodice left side (fitted)
    shape.lineTo(-0.42, 0.72);
    // Left shoulder strap
    shape.lineTo(-0.44, 0.94);
    shape.lineTo(-0.28, 1.04);
    // Neckline — slightly curved
    shape.bezierCurveTo(-0.16, 1.18, -0.08, 1.24, 0.0, 1.24);
    shape.bezierCurveTo(0.08, 1.24, 0.16, 1.18, 0.28, 1.04);
    // Right shoulder strap
    shape.lineTo(0.44, 0.94);
    shape.lineTo(0.42, 0.72);
    // Bodice right side
    shape.lineTo(0.46, -0.1);
    // Skirt right seam flares out
    shape.bezierCurveTo(0.72, -0.4, 1.1, -0.8, 1.22, -1.35);
    // Hem at bottom
    shape.lineTo(-1.22, -1.35);

    const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Waist seam line (horizontal band where bodice meets skirt)
  const waistSeamGeo = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.48, 0.0);
    shape.lineTo(0.48, 0.0);
    shape.lineTo(0.48, 0.1);
    shape.lineTo(-0.48, 0.1);
    shape.lineTo(-0.48, 0.0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.04,
      bevelEnabled: false,
    });
    geo.center();
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <group>
      <mesh geometry={dressGeo} material={material} castShadow receiveShadow />
      {/* Waist seam accent */}
      <mesh
        geometry={waistSeamGeo}
        material={material}
        castShadow
        position={[0, -0.12, 0.12]}
      />
    </group>
  );
}

// ── Download helper (inner component to access gl) ──────────────────────────
function DownloadHelper({ onReady }: { onReady: (fn: () => void) => void }) {
  const { gl } = useThree();

  useEffect(() => {
    onReady(() => {
      const url = gl.domElement.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "garment-design.png";
      a.click();
    });
  }, [gl, onReady]);

  return null;
}

// ── Scene ────────────────────────────────────────────────────────────────────
function GarmentScene({
  garmentType,
  activeColour,
  onDownloadReady,
}: {
  garmentType: GarmentType;
  activeColour: ActiveColour | null;
  onDownloadReady: (fn: () => void) => void;
}) {
  const hex = activeColour?.hex ?? "#CCCCCC";

  const texture = useMemo(() => createWovenTexture(hex), [hex]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0,
        side: THREE.DoubleSide,
      }),
    [texture],
  );

  useEffect(() => {
    return () => {
      texture.dispose();
      material.dispose();
    };
  }, [texture, material]);

  return (
    <>
      {/* Ambient — soft fill */}
      <ambientLight intensity={0.45} />
      {/* Key light — front-top */}
      <directionalLight
        position={[3, 5, 4]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      {/* Fill light — left side */}
      <directionalLight position={[-3, 2, 1]} intensity={0.5} />
      {/* Rim light — behind for silhouette depth */}
      <directionalLight position={[0, 1, -4]} intensity={0.7} color="#ffe8c0" />
      {/* Under fill */}
      <pointLight position={[0, -3, 3]} intensity={0.25} />
      <Environment preset="studio" />
      <OrbitControls
        enablePan={false}
        minDistance={2.5}
        maxDistance={8}
        autoRotate
        autoRotateSpeed={0.7}
      />
      <Suspense fallback={null}>
        {garmentType === "tshirt" && <TShirtMesh material={material} />}
        {garmentType === "hoodie" && <HoodieMesh material={material} />}
        {garmentType === "jacket" && <JacketMesh material={material} />}
        {garmentType === "trousers" && <TrousersMesh material={material} />}
        {garmentType === "dress" && <DressMesh material={material} />}
      </Suspense>
      <DownloadHelper onReady={onDownloadReady} />
    </>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function GarmentDesignStudio({
  fabrics,
  navigate,
}: GarmentDesignStudioProps) {
  const [garmentType, setGarmentType] = useState<GarmentType>("tshirt");
  const [activeColour, setActiveColour] = useState<ActiveColour | null>(
    fabrics[0]?.colours[0]
      ? {
          hex: fabrics[0].colours[0].hex,
          imageUrl: fabrics[0].imageUrl,
          fabricName: fabrics[0].name,
          colourName: fabrics[0].colours[0].name,
        }
      : null,
  );
  const [search, setSearch] = useState("");
  const [expandedFabrics, setExpandedFabrics] = useState<Set<string>>(
    new Set([fabrics[0]?.id].filter(Boolean) as string[]),
  );
  const [downloadFn, setDownloadFn] = useState<(() => void) | null>(null);

  const filteredFabrics = useMemo(() => {
    const q = search.toLowerCase();
    return fabrics.filter(
      (f) =>
        f.name.toLowerCase().includes(q) || f.code.toLowerCase().includes(q),
    );
  }, [fabrics, search]);

  function toggleFabric(id: string) {
    setExpandedFabrics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleDownloadReady = useMemo(
    () => (fn: () => void) => setDownloadFn(() => fn),
    [],
  );

  function handleDownload() {
    downloadFn?.();
  }

  // Count colour swatches for stable indexing
  let colourIndex = 0;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-slate-950">
      {/* ── Left Panel: Garment Selector */}
      <div
        data-ocid="studio.garment_selector.panel"
        className="w-24 lg:w-32 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-6 gap-3 overflow-y-auto"
      >
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-2 text-center leading-tight px-2">
          Garment
        </p>
        {garmentConfig.map(({ id, label, icon }) => (
          <motion.button
            key={id}
            type="button"
            data-ocid={`studio.${id}.button`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setGarmentType(id)}
            className={`w-[4.5rem] lg:w-20 aspect-square rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition-all ${
              garmentType === id
                ? "border-yellow-400 bg-yellow-400/10 text-yellow-400"
                : "border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200 bg-slate-800/50"
            }`}
          >
            {icon}
            <span className="text-[9px] font-bold uppercase tracking-wide leading-none">
              {label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* ── Centre Panel: 3D Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-12 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="font-display font-bold text-sm text-white tracking-wide">
              Design Studio
            </span>
            {activeColour && (
              <span className="text-xs text-slate-400">
                {activeColour.fabricName} &middot; {activeColour.colourName}
              </span>
            )}
          </div>
          <Button
            data-ocid="studio.download.button"
            onClick={handleDownload}
            size="sm"
            className="bg-yellow-400 text-slate-900 font-bold rounded-xl border-0 hover:bg-yellow-300 text-xs h-8 px-3"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export PNG
          </Button>
        </div>

        {/* Canvas */}
        <div data-ocid="studio.canvas_target" className="flex-1 relative">
          <Canvas
            shadows
            camera={{ position: [0, 0.2, 5.2], fov: 35 }}
            gl={{ preserveDrawingBuffer: true, antialias: true }}
            style={{ background: "transparent" }}
          >
            <GarmentScene
              garmentType={garmentType}
              activeColour={activeColour}
              onDownloadReady={handleDownloadReady}
            />
          </Canvas>

          {/* Active colour overlay */}
          {activeColour && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-full px-4 py-2">
              <div
                className="w-4 h-4 rounded-full border border-white/30 flex-shrink-0"
                style={{ backgroundColor: activeColour.hex }}
              />
              <span className="text-xs font-semibold text-white">
                {activeColour.colourName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {activeColour.hex.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Instruction hint */}
        <div className="h-9 bg-slate-900/60 border-t border-slate-800 flex items-center justify-center">
          <p className="text-[10px] text-slate-500 font-medium">
            Drag to rotate &middot; Scroll to zoom &middot; Select a colour
            swatch to apply fabric
          </p>
        </div>
      </div>

      {/* ── Right Panel: Fabric/Colour Picker */}
      <div
        data-ocid="studio.fabric_picker.panel"
        className="w-72 flex-shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col"
      >
        {/* Header */}
        <div className="px-4 pt-5 pb-3 border-b border-slate-800">
          <h2 className="font-display font-bold text-sm text-white mb-3 uppercase tracking-widest">
            Fabric Swatches
          </h2>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              data-ocid="studio.fabric_search.search_input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fabrics..."
              className="pl-8 h-8 text-xs bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-yellow-400 focus:ring-yellow-400/20"
            />
          </div>
        </div>

        {/* Fabric list */}
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1.5">
            {filteredFabrics.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs text-slate-500">
                  No fabrics match your search.
                </p>
              </div>
            ) : (
              filteredFabrics.map((fabric, fabricIdx) => {
                const isExpanded = expandedFabrics.has(fabric.id);
                return (
                  <div
                    key={fabric.id}
                    data-ocid={`studio.fabric.item.${fabricIdx + 1}`}
                    className="rounded-xl overflow-hidden border border-slate-800"
                  >
                    {/* Fabric header row */}
                    <button
                      type="button"
                      onClick={() => toggleFabric(fabric.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800/60 hover:bg-slate-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-md flex-shrink-0 border border-slate-600"
                          style={{
                            background: fabric.colours[0]?.hex
                              ? `linear-gradient(135deg, ${fabric.colours
                                  .slice(0, 3)
                                  .map((c, i) => `${c.hex} ${i * 40}%`)
                                  .join(", ")})`
                              : "#334155",
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate leading-tight">
                            {fabric.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono leading-tight">
                            {fabric.code}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[9px] text-slate-500 font-bold uppercase">
                          {fabric.colours.length} col
                        </span>
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Colour swatches */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 py-2.5 bg-slate-950/40 flex flex-wrap gap-2">
                            {fabric.colours.map((colour) => {
                              colourIndex++;
                              const localIndex = colourIndex;
                              const isActive =
                                activeColour?.hex === colour.hex &&
                                activeColour?.colourName === colour.name;
                              return (
                                <motion.button
                                  key={colour.id}
                                  type="button"
                                  data-ocid={`studio.colour.item.${localIndex}`}
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    setActiveColour({
                                      hex: colour.hex,
                                      imageUrl: fabric.imageUrl,
                                      fabricName: fabric.name,
                                      colourName: colour.name,
                                    })
                                  }
                                  title={`${colour.name} - ${colour.hex}`}
                                  className={`relative w-9 h-9 rounded-lg border-2 transition-all ${
                                    isActive
                                      ? "border-yellow-400 shadow-[0_0_0_3px_rgba(250,204,21,0.3)]"
                                      : "border-slate-700 hover:border-slate-500"
                                  }`}
                                  style={{ backgroundColor: colour.hex }}
                                >
                                  {isActive && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                      <span className="w-2 h-2 rounded-full bg-white/80 shadow" />
                                    </span>
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                          {/* Selected colour label */}
                          {fabric.colours.map((colour) => {
                            const isActive =
                              activeColour?.hex === colour.hex &&
                              activeColour?.colourName === colour.name;
                            if (!isActive) return null;
                            return (
                              <div
                                key={colour.id}
                                className="px-3 pb-2.5 bg-slate-950/40"
                              >
                                <p className="text-[10px] text-yellow-400 font-bold">
                                  {colour.name}
                                  <span className="text-slate-500 font-mono ml-1.5">
                                    {colour.hex.toUpperCase()}
                                  </span>
                                </p>
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        {/* Bottom nav */}
        <div className="px-4 py-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => navigate({ page: "dashboard" })}
            className="w-full text-xs text-slate-500 hover:text-yellow-400 transition-colors font-medium flex items-center justify-center gap-1.5"
          >
            <Layers className="w-3 h-3" />
            Back to Library
          </button>
        </div>
      </div>
    </div>
  );
}
