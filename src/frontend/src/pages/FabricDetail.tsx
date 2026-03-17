import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Building2,
  CalendarDays,
  ChevronRight,
  Hash,
  Layers,
  Palette,
  Pencil,
  Plus,
  Ruler,
  Trash2,
  Weight,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import type { ColourVariant, Fabric } from "../data/swatchData";
import { useEditGuard } from "../hooks/useEditGuard";

interface FabricDetailProps {
  fabric: Fabric;
  fabrics: Fabric[];
  setFabrics: (f: Fabric[]) => void;
  navigate: (v: View) => void;
}

function getContrastText(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
}

function computeInsights(fabric: Fabric) {
  const styleIds = new Set<string>();
  const departments = new Set<string>();
  const seasons: string[] = [];

  for (const colour of fabric.colours) {
    for (const style of colour.styles) {
      styleIds.add(style.id);
      departments.add(style.department);
      seasons.push(style.season);
    }
  }

  // Most recent season lexicographically (e.g. "SS 2025" > "AW 2024")
  const mostRecentSeason =
    seasons.length > 0 ? seasons.reduce((a, b) => (b > a ? b : a)) : null;

  return {
    totalStyles: styleIds.size,
    departments: Array.from(departments).sort(),
    mostRecentSeason,
    colourVariants: fabric.colours.length,
  };
}

export default function FabricDetail({
  fabric,
  fabrics,
  setFabrics,
  navigate,
}: FabricDetailProps) {
  const { requireEdit } = useEditGuard();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addColourOpen, setAddColourOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    name: fabric.name,
    code: fabric.code,
    type: fabric.type,
    composition: fabric.composition,
    gsm: String(fabric.gsm),
    width: String(fabric.width),
  });

  const [colourForm, setColourForm] = useState({
    name: "",
    pantone: "",
    hex: "#FFCE06",
  });

  const insights = computeInsights(fabric);

  function updateFabric(updated: Partial<Fabric>) {
    setFabrics(
      fabrics.map((f) => (f.id === fabric.id ? { ...f, ...updated } : f)),
    );
  }

  function handleEditSave() {
    if (!editForm.name || !editForm.code) {
      toast.error("Fabric name and code are required.");
      return;
    }
    updateFabric({
      name: editForm.name.trim(),
      code: editForm.code.trim(),
      type: editForm.type.trim(),
      composition: editForm.composition.trim(),
      gsm: Number(editForm.gsm) || fabric.gsm,
      width: Number(editForm.width) || fabric.width,
    });
    setEditOpen(false);
    toast.success("Fabric updated.");
  }

  function handleDelete() {
    setFabrics(fabrics.filter((f) => f.id !== fabric.id));
    navigate({ page: "dashboard" });
    toast.success(`"${fabric.name}" deleted.`);
  }

  function handleAddColour() {
    if (!colourForm.name || !colourForm.hex) {
      toast.error("Colour name and hex are required.");
      return;
    }
    const newColour: ColourVariant = {
      id: `col-${Date.now()}`,
      name: colourForm.name.trim(),
      pantone: colourForm.pantone.trim(),
      hex: colourForm.hex,
      vendors: [],
      styles: [],
    };
    updateFabric({ colours: [...fabric.colours, newColour] });
    setColourForm({ name: "", pantone: "", hex: "#FFCE06" });
    setAddColourOpen(false);
    toast.success(`Colour "${newColour.name}" added.`);
  }

  const infoFields = [
    { label: "Fabric Code", value: fabric.code, icon: Hash },
    { label: "Type", value: fabric.type, icon: Layers },
    { label: "GSM", value: `${fabric.gsm} g/m²`, icon: Weight },
    { label: "Width", value: `${fabric.width} cm`, icon: Ruler },
    { label: "Composition", value: fabric.composition, icon: null, wide: true },
  ];

  const insightTiles = [
    {
      id: "styles",
      label: "Total Styles Used",
      value: insights.totalStyles === 0 ? "0" : String(insights.totalStyles),
      icon: BarChart2,
      ocid: "insights.styles.card",
    },
    {
      id: "departments",
      label: "Departments",
      value:
        insights.departments.length > 0 ? insights.departments.join(", ") : "—",
      icon: Building2,
      ocid: "insights.departments.card",
    },
    {
      id: "season",
      label: "Most Recent Season",
      value: insights.mostRecentSeason ?? "—",
      icon: CalendarDays,
      ocid: "insights.season.card",
    },
    {
      id: "colours",
      label: "Colour Variants",
      value: String(insights.colourVariants),
      icon: Palette,
      ocid: "insights.colours.card",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Back ── */}
      <button
        type="button"
        data-ocid="fabric.link"
        onClick={() => navigate({ page: "dashboard" })}
        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Library
      </button>

      {/* ── Interconnection Workflow Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-primary/10 border-2 border-primary/20 rounded-2xl px-5 py-4 mb-8"
      >
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-0.5">
            <Layers className="w-5 h-5 text-foreground opacity-70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
              How to build a complete fabric record
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Step 1 */}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                  1
                </span>
                <span className="text-xs font-bold bg-primary/20 text-foreground rounded-md px-2 py-0.5 whitespace-nowrap">
                  Fabric Details
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {/* Step 2 */}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-border text-foreground text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                  2
                </span>
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Colour Variants
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {/* Step 3 */}
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-border text-foreground text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                  3
                </span>
                <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                  Garment Styles
                </span>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Open a colour variant below to add vendors and link garment
              styles.
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Fabric Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="bg-foreground text-primary rounded-2xl p-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-60 mb-2">
              {fabric.code}
            </p>
            <h1 className="font-display text-4xl font-extrabold leading-tight">
              {fabric.name}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <Badge className="bg-primary text-primary-foreground font-bold rounded-lg">
                {fabric.type}
              </Badge>
              <span className="text-sm opacity-70">
                {fabric.colours.length} colour variant
                {fabric.colours.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              data-ocid="fabric.edit_button"
              onClick={() => requireEdit(() => setEditOpen(true))}
              className="bg-primary text-primary-foreground font-bold rounded-xl border-2 border-primary hover:bg-primary/90"
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
            <Button
              data-ocid="fabric.delete_button"
              variant="outline"
              onClick={() => requireEdit(() => setDeleteOpen(true))}
              className="border-2 border-primary/30 text-primary font-bold rounded-xl hover:bg-primary/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Info Grid ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="bg-white border-2 border-border rounded-2xl p-6 mb-8"
      >
        <h2 className="font-display text-lg font-bold mb-4">
          Technical Specifications
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {infoFields.map((field) => (
            <div
              key={field.label}
              className={`${
                field.wide ? "col-span-2 sm:col-span-4" : ""
              } bg-secondary rounded-xl p-4`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                {field.label}
              </p>
              <p className="font-semibold text-sm text-foreground">
                {field.value || "—"}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Fabric Usage Insights ── */}
      <motion.div
        data-ocid="insights.section"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-white border-2 border-border rounded-2xl p-6 mb-8"
      >
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg font-bold">
            Fabric Usage Insights
          </h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {insightTiles.map((tile) => (
            <div
              key={tile.id}
              data-ocid={tile.ocid}
              className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex flex-col gap-2"
            >
              <div className="flex items-center gap-1.5">
                <tile.icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none">
                  {tile.label}
                </p>
              </div>
              <p className="font-display font-bold text-foreground text-sm leading-snug break-words">
                {tile.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Colour Variants ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Colour Variants</h2>
          <Button
            data-ocid="colour.open_modal_button"
            onClick={() => requireEdit(() => setAddColourOpen(true))}
            className="bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
            size="sm"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Colour
          </Button>
        </div>

        {fabric.colours.length === 0 ? (
          <div
            data-ocid="colour.empty_state"
            className="border-2 border-dashed border-border rounded-2xl py-16 text-center"
          >
            <p className="text-muted-foreground font-medium">
              No colour variants yet.
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Add the first colour variant above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {fabric.colours.map((colour, idx) => {
              const contrastText = getContrastText(colour.hex);
              return (
                <motion.button
                  type="button"
                  key={colour.id}
                  data-ocid={`colour.item.${idx + 1}`}
                  whileHover={{ y: -2 }}
                  onClick={() =>
                    navigate({
                      page: "colour",
                      fabricId: fabric.id,
                      colourId: colour.id,
                    })
                  }
                  className="group text-left cursor-pointer border-2 border-border hover:border-primary rounded-2xl overflow-hidden transition-all hover:shadow-card-hover w-full"
                >
                  {/* Swatch block */}
                  <div
                    className="h-28 w-full relative flex items-end p-4"
                    style={{ backgroundColor: colour.hex }}
                  >
                    <div className="text-right absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight
                        className="w-5 h-5"
                        style={{ color: contrastText }}
                      />
                    </div>
                  </div>
                  {/* Details */}
                  <div className="bg-white p-4">
                    <h3 className="font-display font-bold text-sm text-foreground">
                      {colour.name}
                    </h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {colour.pantone || "No Pantone"}
                      </p>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {colour.hex.toUpperCase()}
                      </span>
                    </div>
                    <Separator className="my-2.5" />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {colour.vendors.length} vendor
                        {colour.vendors.length !== 1 ? "s" : ""}
                      </span>
                      <span>
                        {colour.styles.length} style
                        {colour.styles.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ── Edit Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent
          data-ocid="fabric.modal"
          className="max-w-md rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Edit Fabric
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Fabric Code
                </Label>
                <Input
                  data-ocid="fabric.input"
                  value={editForm.code}
                  onChange={(e) =>
                    setEditForm({ ...editForm, code: e.target.value })
                  }
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Type
                </Label>
                <Input
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({ ...editForm, type: e.target.value })
                  }
                  className="rounded-xl border-2"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Fabric Name
              </Label>
              <Input
                data-ocid="fabric.input"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                className="rounded-xl border-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Composition
              </Label>
              <Input
                value={editForm.composition}
                onChange={(e) =>
                  setEditForm({ ...editForm, composition: e.target.value })
                }
                className="rounded-xl border-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  GSM
                </Label>
                <Input
                  type="number"
                  value={editForm.gsm}
                  onChange={(e) =>
                    setEditForm({ ...editForm, gsm: e.target.value })
                  }
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Width (cm)
                </Label>
                <Input
                  value={editForm.width}
                  onChange={(e) =>
                    setEditForm({ ...editForm, width: e.target.value })
                  }
                  className="rounded-xl border-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              data-ocid="fabric.cancel_button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              className="rounded-xl border-2 font-semibold"
            >
              Cancel
            </Button>
            <Button
              data-ocid="fabric.save_button"
              onClick={handleEditSave}
              className="bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Colour Dialog ── */}
      <Dialog open={addColourOpen} onOpenChange={setAddColourOpen}>
        <DialogContent
          data-ocid="colour.modal"
          className="max-w-sm rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Add Colour Variant
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Colour Name *
              </Label>
              <Input
                data-ocid="colour.input"
                placeholder="e.g. Ivory Cloud"
                value={colourForm.name}
                onChange={(e) =>
                  setColourForm({ ...colourForm, name: e.target.value })
                }
                className="rounded-xl border-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Pantone Code
              </Label>
              <Input
                placeholder="e.g. 11-0601 TCX"
                value={colourForm.pantone}
                onChange={(e) =>
                  setColourForm({ ...colourForm, pantone: e.target.value })
                }
                className="rounded-xl border-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                HEX Colour *
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colourForm.hex}
                  onChange={(e) =>
                    setColourForm({ ...colourForm, hex: e.target.value })
                  }
                  className="w-10 h-10 rounded-lg border-2 border-border cursor-pointer p-0.5"
                />
                <Input
                  placeholder="#FFCE06"
                  value={colourForm.hex}
                  onChange={(e) =>
                    setColourForm({ ...colourForm, hex: e.target.value })
                  }
                  className="rounded-xl border-2 font-mono"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              data-ocid="colour.cancel_button"
              variant="outline"
              onClick={() => setAddColourOpen(false)}
              className="rounded-xl border-2 font-semibold"
            >
              Cancel
            </Button>
            <Button
              data-ocid="colour.submit_button"
              onClick={handleAddColour}
              className="bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
            >
              Add Colour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Alert ── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-ocid="fabric.dialog" className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-lg font-bold">
              Delete Fabric?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{fabric.name}</strong> and
              all its colour variants from the library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              data-ocid="fabric.cancel_button"
              className="rounded-xl border-2 font-semibold"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="fabric.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground font-bold rounded-xl hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
