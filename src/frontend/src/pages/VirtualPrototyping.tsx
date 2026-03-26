import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Download,
  Shirt,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { View } from "../App";
import type { ColourVariant, Fabric } from "../data/swatchData";

interface VirtualPrototypingProps {
  fabrics: Fabric[];
  navigate: (v: View) => void;
}

interface SelectedSwatch {
  fabric: Fabric;
  colour: ColourVariant;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "");
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
}

function drawFabricTexture(
  ctx: CanvasRenderingContext2D,
  hex: string,
  width: number,
  height: number,
) {
  const { r, g, b } = hexToRgb(hex);

  // Base fill
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillRect(0, 0, width, height);

  // Warp threads (vertical)
  const threadSpacing = 8;
  ctx.lineWidth = 1.5;
  for (let x = 0; x < width; x += threadSpacing) {
    const shade = x % (threadSpacing * 2) === 0 ? 0.12 : 0.06;
    ctx.strokeStyle = `rgba(0,0,0,${shade})`;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Weft threads (horizontal)
  for (let y = 0; y < height; y += threadSpacing) {
    const shade = y % (threadSpacing * 2) === 0 ? 0.12 : 0.06;
    ctx.strokeStyle = `rgba(255,255,255,${shade})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Crosshatch highlights at intersections
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  for (let x = 0; x < width; x += threadSpacing * 2) {
    for (let y = 0; y < height; y += threadSpacing * 2) {
      ctx.fillRect(x, y, threadSpacing, threadSpacing);
    }
  }

  // Subtle noise grain
  for (let i = 0; i < width * height * 0.08; i++) {
    const nx = Math.random() * width;
    const ny = Math.random() * height;
    const alpha = Math.random() * 0.06;
    ctx.fillStyle = `rgba(0,0,0,${alpha})`;
    ctx.fillRect(nx, ny, 1, 1);
  }

  // Slight vignette
  const vignette = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.3,
    width / 2,
    height / 2,
    width * 0.75,
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

export default function VirtualPrototyping({
  fabrics,
  navigate: _navigate,
}: VirtualPrototypingProps) {
  const [sketchUrl, setSketchUrl] = useState<string | null>(null);
  const [selectedSwatch, setSelectedSwatch] = useState<SelectedSwatch | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const sketchCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSketch = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setSketchUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadSketch(file);
    },
    [loadSketch],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
        loadSketch(file);
      }
    },
    [loadSketch],
  );

  // Draw original sketch canvas
  useEffect(() => {
    const canvas = sketchCanvasRef.current;
    if (!canvas || !sketchUrl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = sketchUrl;
  }, [sketchUrl]);

  // Draw fabric preview canvas
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    if (!sketchUrl || !selectedSwatch) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw fabric texture as background
      drawFabricTexture(
        ctx,
        selectedSwatch.colour.hex,
        canvas.width,
        canvas.height,
      );

      // Draw sketch on top with multiply blend — lines show through fabric
      ctx.globalCompositeOperation = "multiply";
      ctx.drawImage(img, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    };
    img.src = sketchUrl;
  }, [sketchUrl, selectedSwatch]);

  const handleDownload = () => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `fabric-preview-${selectedSwatch?.colour.name ?? "result"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const canPreview = !!sketchUrl && !!selectedSwatch;

  const steps = [
    { n: 1, label: "Upload Sketch", done: !!sketchUrl },
    { n: 2, label: "Select Fabric", done: !!selectedSwatch },
    { n: 3, label: "Preview", done: canPreview },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Shirt className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold leading-tight">
              Virtual Prototyping
            </h1>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              Upload a garment sketch, apply a fabric swatch, and preview the
              result — no physical samples needed.
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mt-6">
          {steps.map((step, i) => (
            <div key={step.n} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold transition-all ${
                  step.done
                    ? "bg-foreground text-primary"
                    : "bg-border text-muted-foreground"
                }`}
              >
                {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.n}
              </div>
              <span
                className={`text-xs font-semibold hidden sm:inline ${
                  step.done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div className="w-8 h-px bg-border mx-1" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Upload + Swatch Select */}
        <div className="space-y-6">
          {/* Step 1: Upload */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white border-2 border-border rounded-2xl p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center">
                1
              </span>
              <h2 className="font-display text-base font-bold">
                Upload Garment Sketch
              </h2>
            </div>

            {sketchUrl ? (
              <div className="relative rounded-xl overflow-hidden border-2 border-primary/30">
                <img
                  src={sketchUrl}
                  alt="Garment sketch"
                  className="w-full object-contain max-h-64"
                />
                <button
                  type="button"
                  data-ocid="prototyping.close_button"
                  onClick={() => setSketchUrl(null)}
                  className="absolute top-2 right-2 w-7 h-7 bg-foreground text-primary rounded-full flex items-center justify-center hover:bg-foreground/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="prototyping.dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-all cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-secondary/50"
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-sm text-foreground">
                    Drop your garment sketch here
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    PNG or JPG — flat sketches work best
                  </p>
                </div>
                <Button
                  data-ocid="prototyping.upload_button"
                  size="sm"
                  className="bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Browse File
                </Button>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </motion.div>

          {/* Step 2: Select Swatch */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white border-2 border-border rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center">
                  2
                </span>
                <h2 className="font-display text-base font-bold">
                  Select Fabric Swatch
                </h2>
              </div>
              {selectedSwatch && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-foreground/20"
                    style={{ backgroundColor: selectedSwatch.colour.hex }}
                  />
                  <span className="text-xs font-semibold text-foreground">
                    {selectedSwatch.fabric.name} — {selectedSwatch.colour.name}
                  </span>
                </div>
              )}
            </div>

            {fabrics.length === 0 ? (
              <div
                data-ocid="prototyping.empty_state"
                className="py-12 text-center border-2 border-dashed border-border rounded-xl"
              >
                <p className="text-sm text-muted-foreground font-medium">
                  No fabrics in library yet.
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Add fabrics in the Library first.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-72 pr-3">
                <div className="space-y-3">
                  {fabrics.map((fabric, fi) => (
                    <div key={fabric.id} className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {fabric.name}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {fabric.colours.map((colour, ci) => {
                          const isSelected =
                            selectedSwatch?.colour.id === colour.id;
                          return (
                            <button
                              type="button"
                              key={colour.id}
                              data-ocid={`prototyping.swatch.item.${fi * 10 + ci + 1}`}
                              title={`${colour.name} (${colour.hex})`}
                              onClick={() =>
                                setSelectedSwatch({ fabric, colour })
                              }
                              className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 ${
                                isSelected
                                  ? "border-foreground ring-2 ring-primary ring-offset-1 scale-110"
                                  : "border-border"
                              }`}
                              style={{ backgroundColor: colour.hex }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        </div>

        {/* Right column: Preview */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-white border-2 border-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center">
                3
              </span>
              <h2 className="font-display text-base font-bold">Preview</h2>
            </div>
            {canPreview && (
              <Button
                data-ocid="prototyping.button"
                size="sm"
                onClick={handleDownload}
                className="bg-foreground text-primary font-bold rounded-xl hover:bg-foreground/90"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Download
              </Button>
            )}
          </div>

          {!canPreview ? (
            <div
              data-ocid="prototyping.empty_state"
              className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl gap-4"
            >
              <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm text-foreground">
                  {!sketchUrl
                    ? "Upload a garment sketch to get started"
                    : "Select a fabric swatch to preview"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {!sketchUrl
                    ? "Step 1: Upload a flat sketch of your garment"
                    : "Step 2: Choose a colour from your fabric library"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Original */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Original Sketch
                  </p>
                  <div className="rounded-xl overflow-hidden border-2 border-border bg-secondary">
                    <canvas
                      ref={sketchCanvasRef}
                      data-ocid="prototyping.canvas_target"
                      className="w-full object-contain max-h-64"
                      style={{ imageRendering: "auto" }}
                    />
                  </div>
                </div>
                {/* Fabric Preview */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Fabric Preview
                  </p>
                  <div className="rounded-xl overflow-hidden border-2 border-primary/40 bg-secondary">
                    <canvas
                      ref={previewCanvasRef}
                      data-ocid="prototyping.canvas_target"
                      className="w-full object-contain max-h-64"
                      style={{ imageRendering: "auto" }}
                    />
                  </div>
                </div>
              </div>

              {/* Swatch info strip */}
              {selectedSwatch && (
                <div className="flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-xl px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-lg border-2 border-foreground/20 flex-shrink-0"
                    style={{ backgroundColor: selectedSwatch.colour.hex }}
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {selectedSwatch.colour.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {selectedSwatch.fabric.name} ·{" "}
                      {selectedSwatch.colour.pantone ||
                        selectedSwatch.colour.hex}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Info strip */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.45 }}
        className="mt-8 bg-foreground text-primary rounded-2xl px-6 py-5"
      >
        <div className="flex items-start gap-4">
          <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold mb-1">
              Virtual prototyping reduces dependency on physical sampling
            </p>
            <p className="text-xs opacity-70 leading-relaxed">
              Upload any flat garment sketch, apply fabric colour swatches from
              your library, and evaluate the result visually. Faster design
              decisions, fewer physical samples, quicker sign-off.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
