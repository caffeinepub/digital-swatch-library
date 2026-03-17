import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface FabricVisualiserProps {
  fabricName: string;
  colours: Array<{ id: string; name: string; hex: string }>;
}

type GarmentType = "tshirt" | "trousers" | "jacket" | "saree" | "hoodie";

const GARMENT_TYPES: { key: GarmentType; label: string }[] = [
  { key: "tshirt", label: "T-Shirt" },
  { key: "trousers", label: "Trousers" },
  { key: "jacket", label: "Jacket" },
  { key: "saree", label: "Saree / Drape" },
  { key: "hoodie", label: "Hoodie" },
];

function useFabricMaterial(hexColor: string) {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    const base = new THREE.Color(hexColor);
    const r = Math.round(base.r * 255);
    const g = Math.round(base.g * 255);
    const b = Math.round(base.b * 255);

    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, size, size);

    // Warp threads (vertical)
    const threadW = 6;
    for (let x = 0; x < size; x += threadW * 2) {
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(x, 0, threadW, size);
      ctx.fillStyle = "rgba(255,255,255,0.07)";
      ctx.fillRect(x + threadW, 0, threadW, size);
    }
    // Weft threads (horizontal)
    for (let y = 0; y < size; y += threadW * 2) {
      ctx.fillStyle = "rgba(0,0,0,0.08)";
      ctx.fillRect(0, y, size, threadW);
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      ctx.fillRect(0, y + threadW, size, threadW);
    }
    // Subtle noise grain
    for (let i = 0; i < 2000; i++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const alpha = Math.random() * 0.06;
      ctx.fillStyle = `rgba(0,0,0,${alpha})`;
      ctx.fillRect(px, py, 1.5, 1.5);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);

    // Roughness map
    const rCanvas = document.createElement("canvas");
    rCanvas.width = 128;
    rCanvas.height = 128;
    const rCtx = rCanvas.getContext("2d")!;
    rCtx.fillStyle = "#aaaaaa";
    rCtx.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 500; i++) {
      const v = Math.floor(Math.random() * 40 + 140);
      rCtx.fillStyle = `rgb(${v},${v},${v})`;
      rCtx.fillRect(Math.random() * 128, Math.random() * 128, 3, 3);
    }
    const roughTex = new THREE.CanvasTexture(rCanvas);
    roughTex.wrapS = THREE.RepeatWrapping;
    roughTex.wrapT = THREE.RepeatWrapping;
    roughTex.repeat.set(4, 4);

    return new THREE.MeshStandardMaterial({
      map: tex,
      roughnessMap: roughTex,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });
  }, [hexColor]);
}

function TshirtModel({ hexColor }: { hexColor: string }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useFabricMaterial(hexColor);
  const DEG = Math.PI / 180;

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });

  const { bodyGeo, sleeveGeo, collarGeo } = useMemo(() => {
    return {
      bodyGeo: new THREE.CylinderGeometry(0.85, 1.05, 2.2, 32),
      sleeveGeo: new THREE.CylinderGeometry(0.3, 0.4, 1.1, 16),
      collarGeo: new THREE.TorusGeometry(0.35, 0.09, 12, 32),
    };
  }, []);

  return (
    <group ref={ref}>
      <mesh
        geometry={bodyGeo}
        material={mat}
        scale={[1, 1, 0.48]}
        position={[0, -0.1, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={sleeveGeo}
        material={mat}
        scale={[1, 1, 0.42]}
        position={[-1.1, 0.65, 0]}
        rotation={[0, 0, 50 * DEG]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={sleeveGeo}
        material={mat}
        scale={[1, 1, 0.42]}
        position={[1.1, 0.65, 0]}
        rotation={[0, 0, -50 * DEG]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={collarGeo}
        material={mat}
        scale={[1, 0.4, 0.5]}
        position={[0, 1.12, 0]}
        castShadow
      />
    </group>
  );
}

function TrousersModel({ hexColor }: { hexColor: string }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useFabricMaterial(hexColor);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });

  const { waistGeo, legGeo } = useMemo(
    () => ({
      waistGeo: new THREE.CylinderGeometry(0.85, 0.85, 0.28, 32),
      legGeo: new THREE.CylinderGeometry(0.38, 0.28, 1.8, 16),
    }),
    [],
  );

  return (
    <group ref={ref}>
      <mesh
        geometry={waistGeo}
        material={mat}
        scale={[1, 1, 0.5]}
        position={[0, 0.8, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={legGeo}
        material={mat}
        scale={[1, 1, 0.5]}
        position={[-0.38, -0.2, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={legGeo}
        material={mat}
        scale={[1, 1, 0.5]}
        position={[0.38, -0.2, 0]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

function JacketModel({ hexColor }: { hexColor: string }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useFabricMaterial(hexColor);
  const DEG = Math.PI / 180;

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });

  const { bodyGeo, sleeveGeo, lapelGeo, collarGeo } = useMemo(
    () => ({
      bodyGeo: new THREE.CylinderGeometry(0.95, 1.1, 2.3, 32),
      sleeveGeo: new THREE.CylinderGeometry(0.32, 0.28, 1.5, 16),
      lapelGeo: new THREE.BoxGeometry(0.22, 0.6, 0.05),
      collarGeo: new THREE.BoxGeometry(0.8, 0.15, 0.08),
    }),
    [],
  );

  return (
    <group ref={ref}>
      <mesh
        geometry={bodyGeo}
        material={mat}
        scale={[1, 1, 0.5]}
        position={[0, -0.1, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={sleeveGeo}
        material={mat}
        scale={[1, 1, 0.45]}
        position={[-1.2, 0.6, 0]}
        rotation={[0, 0, 55 * DEG]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={sleeveGeo}
        material={mat}
        scale={[1, 1, 0.45]}
        position={[1.2, 0.6, 0]}
        rotation={[0, 0, -55 * DEG]}
        castShadow
        receiveShadow
      />
      {/* Lapels */}
      <mesh
        geometry={lapelGeo}
        material={mat}
        position={[-0.28, 0.65, 0.26]}
        rotation={[0, 0, 12 * DEG]}
        castShadow
      />
      <mesh
        geometry={lapelGeo}
        material={mat}
        position={[0.28, 0.65, 0.26]}
        rotation={[0, 0, -12 * DEG]}
        castShadow
      />
      {/* Collar */}
      <mesh
        geometry={collarGeo}
        material={mat}
        position={[0, 1.2, 0.18]}
        castShadow
      />
    </group>
  );
}

function SareeModel({ hexColor }: { hexColor: string }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useFabricMaterial(hexColor);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });

  const { drapeGeo, palluGeo } = useMemo(() => {
    const drape = new THREE.PlaneGeometry(2.2, 3.5, 16, 20);
    const pos = drape.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = Math.sin(x * 2.5) * 0.12 + Math.sin(y * 1.8) * 0.08;
      pos.setZ(i, z);
    }
    drape.computeVertexNormals();

    const pallu = new THREE.PlaneGeometry(0.9, 1.6, 8, 12);
    const pPos = pallu.attributes.position;
    for (let i = 0; i < pPos.count; i++) {
      const x = pPos.getX(i);
      const y = pPos.getY(i);
      const z = Math.sin(x * 3.0) * 0.09 + Math.sin(y * 2.2) * 0.06;
      pPos.setZ(i, z);
    }
    pallu.computeVertexNormals();

    return { drapeGeo: drape, palluGeo: pallu };
  }, []);

  return (
    <group ref={ref}>
      <mesh
        geometry={drapeGeo}
        material={mat}
        position={[0, -0.2, 0]}
        castShadow
        receiveShadow
      />
      {/* Pallu draped over shoulder */}
      <mesh
        geometry={palluGeo}
        material={mat}
        position={[-0.85, 0.8, 0.15]}
        rotation={[0.2, -0.3, 0.5]}
        castShadow
        receiveShadow
      />
    </group>
  );
}

function HoodieModel({ hexColor }: { hexColor: string }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useFabricMaterial(hexColor);
  const DEG = Math.PI / 180;

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.06;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
  });

  const { bodyGeo, sleeveGeo, hoodGeo, pocketGeo } = useMemo(
    () => ({
      bodyGeo: new THREE.CylinderGeometry(0.95, 1.15, 2.3, 32),
      sleeveGeo: new THREE.CylinderGeometry(0.38, 0.32, 1.4, 16),
      hoodGeo: new THREE.SphereGeometry(
        0.55,
        16,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.55,
      ),
      pocketGeo: new THREE.BoxGeometry(0.7, 0.3, 0.06),
    }),
    [],
  );

  return (
    <group ref={ref}>
      <mesh
        geometry={bodyGeo}
        material={mat}
        scale={[1, 1, 0.48]}
        position={[0, -0.1, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={sleeveGeo}
        material={mat}
        scale={[1, 1, 0.44]}
        position={[-1.2, 0.62, 0]}
        rotation={[0, 0, 55 * DEG]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={sleeveGeo}
        material={mat}
        scale={[1, 1, 0.44]}
        position={[1.2, 0.62, 0]}
        rotation={[0, 0, -55 * DEG]}
        castShadow
        receiveShadow
      />
      {/* Hood */}
      <mesh
        geometry={hoodGeo}
        material={mat}
        position={[0, 1.35, -0.1]}
        rotation={[0.15, 0, 0]}
        castShadow
      />
      {/* Pocket */}
      <mesh
        geometry={pocketGeo}
        material={mat}
        position={[0, -0.42, 0.53]}
        castShadow
      />
    </group>
  );
}

function Scene({
  hexColor,
  garmentType,
}: { hexColor: string; garmentType: GarmentType }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={["#fffaf0", "#2a2a2a", 0.6]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048] as [number, number]}
      />
      <directionalLight
        position={[-3, 2, -2]}
        intensity={0.4}
        color="#c8e0ff"
      />
      <pointLight position={[0, -2, 3]} intensity={0.3} color="#fff8e0" />

      {garmentType === "tshirt" && <TshirtModel hexColor={hexColor} />}
      {garmentType === "trousers" && <TrousersModel hexColor={hexColor} />}
      {garmentType === "jacket" && <JacketModel hexColor={hexColor} />}
      {garmentType === "saree" && <SareeModel hexColor={hexColor} />}
      {garmentType === "hoodie" && <HoodieModel hexColor={hexColor} />}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={(Math.PI * 2) / 3}
        dampingFactor={0.08}
        enableDamping
        minDistance={3}
        maxDistance={9}
      />
    </>
  );
}

export default function FabricVisualiser({
  fabricName,
  colours,
}: FabricVisualiserProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [garmentType, setGarmentType] = useState<GarmentType>("tshirt");

  const activeColour = colours[selectedIdx] ?? null;
  const hexColor = activeColour?.hex ?? "#cccccc";

  return (
    <div data-ocid="visualiser.section" className="w-full">
      {/* Header */}
      <div className="mb-3">
        <p className="font-display font-bold text-foreground">{fabricName}</p>
        {activeColour && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Viewing:{" "}
            <span className="font-semibold text-foreground">
              {activeColour.name}
            </span>
          </p>
        )}
      </div>

      {/* Garment type selector */}
      <div className="flex flex-wrap gap-2 mb-3">
        {GARMENT_TYPES.map((g) => (
          <button
            key={g.key}
            type="button"
            data-ocid="visualiser.garment_type.tab"
            onClick={() => setGarmentType(g.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              background: garmentType === g.key ? "#1a1a1a" : "#ffffff",
              color: garmentType === g.key ? "#ffffff" : "#1a1a1a",
              border:
                garmentType === g.key
                  ? "2px solid #1a1a1a"
                  : "2px solid #d1d5db",
              cursor: "pointer",
            }}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div
        data-ocid="visualiser.canvas_target"
        className="rounded-xl overflow-hidden border border-border"
        style={{ height: 320, background: "#f5f5f5" }}
      >
        <Suspense
          fallback={
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Loading 3D viewer…
            </div>
          }
        >
          <Canvas
            camera={{ position: [0, 0.5, 5], fov: 42 }}
            shadows
            style={{ width: "100%", height: "100%" }}
          >
            <Scene hexColor={hexColor} garmentType={garmentType} />
          </Canvas>
        </Suspense>
      </div>

      {/* Colour swatches */}
      {colours.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
            Select Colour
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {colours.map((colour, idx) => (
              <button
                key={colour.id}
                type="button"
                data-ocid={`visualiser.swatch.${idx + 1}`}
                onClick={() => setSelectedIdx(idx)}
                title={colour.name}
                className="transition-transform hover:scale-110 focus:outline-none"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  backgroundColor: colour.hex,
                  border:
                    selectedIdx === idx
                      ? "3px solid #1a1a1a"
                      : "3px solid transparent",
                  boxShadow:
                    selectedIdx === idx
                      ? "0 0 0 2px #fff, 0 0 0 4px #1a1a1a"
                      : "0 1px 3px rgba(0,0,0,0.18)",
                }}
              />
            ))}
          </div>
          {activeColour && (
            <p className="text-xs text-muted-foreground mt-2">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle"
                style={{ backgroundColor: activeColour.hex }}
              />
              {activeColour.name}
              <span className="ml-2 font-mono text-[11px]">
                {activeColour.hex.toUpperCase()}
              </span>
            </p>
          )}
        </div>
      )}

      {colours.length === 0 && (
        <p className="text-xs text-muted-foreground mt-3 italic">
          Add colour variants to preview them on the 3D garment.
        </p>
      )}
    </div>
  );
}
