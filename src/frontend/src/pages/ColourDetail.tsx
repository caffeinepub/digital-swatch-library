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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ImageIcon,
  Layers,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import type { ColourVariant, Fabric, Style, Vendor } from "../data/swatchData";

interface ColourDetailProps {
  fabric: Fabric;
  colour: ColourVariant;
  fabrics: Fabric[];
  setFabrics: (f: Fabric[]) => void;
  navigate: (v: View) => void;
}

const DEPARTMENT_OPTIONS = [
  "Mens Wear",
  "Boys",
  "Girls",
  "Indian Wear",
  "Western Wear",
  "Infants",
];

const ZONE_OPTIONS: Record<string, string[]> = {
  "Mens Wear": ["Urban", "Classy", "Comfort", "Trendy"],
  Boys: ["1-8 Years", "9-14 Years"],
  Girls: ["1-8 Years", "9-14 Years"],
  "Indian Wear": ["Classy", "Trendy", "Dressy"],
  "Western Wear": ["Trendy", "Lounge"],
  Infants: ["Infants Boys", "Infants Girls"],
};

function getContrastText(hex: string): string {
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#1a1a1a" : "#ffffff";
}

export default function ColourDetail({
  fabric,
  colour,
  fabrics,
  setFabrics,
  navigate,
}: ColourDetailProps) {
  const [addVendorOpen, setAddVendorOpen] = useState(false);
  const [addStyleOpen, setAddStyleOpen] = useState(false);

  const [vendorForm, setVendorForm] = useState({
    name: "",
    pricePerMeter: "",
    moq: "",
    leadTime: "",
  });
  const [vendorNameMode, setVendorNameMode] = useState<"select" | "custom">(
    "select",
  );
  const [customVendorName, setCustomVendorName] = useState("");

  const [styleForm, setStyleForm] = useState({
    styleNumber: "",
    styleName: "",
    season: "",
    department: "",
    zone: "",
    imageUrl: "",
  });

  const styleImageRef = useRef<HTMLInputElement>(null);

  // Collect all unique vendor names across all fabrics
  const allVendorNames = Array.from(
    new Set(
      fabrics.flatMap((f) =>
        f.colours.flatMap((c) => c.vendors.map((v) => v.name)),
      ),
    ),
  ).sort();

  const zoneOptions = styleForm.department
    ? (ZONE_OPTIONS[styleForm.department] ?? [])
    : [];

  function updateColour(updated: Partial<ColourVariant>) {
    setFabrics(
      fabrics.map((f) =>
        f.id === fabric.id
          ? {
              ...f,
              colours: f.colours.map((c) =>
                c.id === colour.id ? { ...c, ...updated } : c,
              ),
            }
          : f,
      ),
    );
  }

  function handleAddVendor() {
    const resolvedName =
      vendorNameMode === "custom"
        ? customVendorName.trim()
        : vendorForm.name.trim();
    if (!resolvedName || !vendorForm.pricePerMeter) {
      toast.error("Vendor name and price are required.");
      return;
    }
    const newVendor: Vendor = {
      id: `v-${Date.now()}`,
      name: resolvedName,
      pricePerMeter: Number(vendorForm.pricePerMeter),
      moq: Number(vendorForm.moq) || 0,
      leadTime: vendorForm.leadTime.trim(),
    };
    updateColour({ vendors: [...colour.vendors, newVendor] });
    setVendorForm({ name: "", pricePerMeter: "", moq: "", leadTime: "" });
    setVendorNameMode("select");
    setCustomVendorName("");
    setAddVendorOpen(false);
    toast.success(`"${newVendor.name}" added.`);
  }

  function handleDeleteVendor(vendorId: string) {
    updateColour({ vendors: colour.vendors.filter((v) => v.id !== vendorId) });
    toast.success("Vendor removed.");
  }

  function handleAddStyle() {
    if (!styleForm.styleNumber || !styleForm.styleName) {
      toast.error("Style number and name are required.");
      return;
    }
    const newStyle: Style = {
      id: `s-${Date.now()}`,
      styleNumber: styleForm.styleNumber.trim(),
      styleName: styleForm.styleName.trim(),
      season: styleForm.season.trim(),
      department: styleForm.department.trim(),
      zone: styleForm.zone.trim(),
      imageUrl: styleForm.imageUrl,
    };
    updateColour({ styles: [...colour.styles, newStyle] });
    setStyleForm({
      styleNumber: "",
      styleName: "",
      season: "",
      department: "",
      zone: "",
      imageUrl: "",
    });
    setAddStyleOpen(false);
    toast.success(`Style "${newStyle.styleName}" added.`);
  }

  function handleDeleteStyle(styleId: string) {
    updateColour({ styles: colour.styles.filter((s) => s.id !== styleId) });
    toast.success("Style removed.");
  }

  function handleStyleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") {
        setStyleForm((prev) => ({ ...prev, imageUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  }

  const contrastText = getContrastText(colour.hex);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Back ── */}
      <button
        type="button"
        data-ocid="colour.link"
        onClick={() => navigate({ page: "fabric", fabricId: fabric.id })}
        className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-8 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to {fabric.name}
      </button>

      {/* ── Colour Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 rounded-2xl overflow-hidden border-2 border-border"
      >
        {/* Large swatch */}
        <div
          className="h-48 sm:h-64 w-full flex items-end"
          style={{ backgroundColor: colour.hex }}
        >
          <div className="p-8 w-full" style={{ color: contrastText }}>
            <p className="text-xs font-bold tracking-widest uppercase opacity-60 mb-1">
              {fabric.code} — {fabric.name}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold leading-tight">
              {colour.name}
            </h1>
          </div>
        </div>
        {/* Meta bar */}
        <div className="bg-white px-8 py-4 flex items-center gap-6 flex-wrap border-t-2 border-border">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Pantone
            </p>
            <p className="font-semibold text-sm text-foreground">
              {colour.pantone || "—"}
            </p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              HEX
            </p>
            <p className="font-mono font-semibold text-sm text-foreground">
              {colour.hex.toUpperCase()}
            </p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Vendors
            </p>
            <p className="font-semibold text-sm text-foreground">
              {colour.vendors.length}
            </p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Styles
            </p>
            <p className="font-semibold text-sm text-foreground">
              {colour.styles.length}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Interconnection Workflow Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-6 flex items-center gap-3"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Layers className="w-4 h-4 text-foreground" />
        </div>
        <p className="text-sm text-foreground leading-snug">
          This colour is part of{" "}
          <strong className="font-bold">{fabric.name}</strong> — Add vendors to
          compare pricing, then link garment styles below to complete the
          connection.
        </p>
      </motion.div>

      {/* ── Vendors ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Vendors</h2>
          <Button
            data-ocid="vendor.open_modal_button"
            onClick={() => setAddVendorOpen(true)}
            size="sm"
            className="bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Vendor
          </Button>
        </div>

        {colour.vendors.length === 0 ? (
          <div
            data-ocid="vendor.empty_state"
            className="border-2 border-dashed border-border rounded-2xl py-12 text-center"
          >
            <p className="text-muted-foreground font-medium">
              No vendors yet for this colour.
            </p>
          </div>
        ) : (
          <div className="bg-white border-2 border-border rounded-2xl overflow-hidden">
            <Table data-ocid="vendor.table">
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="font-bold text-[11px] uppercase tracking-widest text-foreground">
                    Vendor
                  </TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-widest text-foreground">
                    Price / m
                  </TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-widest text-foreground">
                    MOQ
                  </TableHead>
                  <TableHead className="font-bold text-[11px] uppercase tracking-widest text-foreground">
                    Lead Time
                  </TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {colour.vendors.map((vendor, idx) => (
                  <TableRow
                    key={vendor.id}
                    data-ocid={`vendor.row.${idx + 1}`}
                    className="hover:bg-secondary/50 transition-colors"
                  >
                    <TableCell className="font-semibold text-sm">
                      {vendor.name}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center bg-primary/15 text-primary-foreground font-bold text-xs px-2 py-0.5 rounded-md">
                        ₹{vendor.pricePerMeter.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {vendor.moq} m
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {vendor.leadTime || "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        data-ocid={`vendor.delete_button.${idx + 1}`}
                        onClick={() => handleDeleteVendor(vendor.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove vendor"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* ── Styles ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold">Garment Styles</h2>
          <Button
            data-ocid="style.open_modal_button"
            onClick={() => setAddStyleOpen(true)}
            size="sm"
            className="bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Add Style
          </Button>
        </div>

        {colour.styles.length === 0 ? (
          <div
            data-ocid="style.empty_state"
            className="border-2 border-dashed border-border rounded-2xl py-12 text-center"
          >
            <p className="text-muted-foreground font-medium">
              No garment styles linked to this colour yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {colour.styles.map((style, idx) => (
              <motion.div
                key={style.id}
                data-ocid={`style.item.${idx + 1}`}
                whileHover={{ y: -2 }}
                className="bg-white border-2 border-border hover:border-primary rounded-2xl overflow-hidden transition-all hover:shadow-card-hover"
              >
                {style.imageUrl && (
                  <img
                    src={style.imageUrl}
                    alt={style.styleName}
                    className="h-32 w-full object-cover border-b border-border"
                  />
                )}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
                        {style.styleNumber}
                      </p>
                      <h3 className="font-display font-bold text-sm text-foreground leading-snug">
                        {style.styleName}
                      </h3>
                    </div>
                    <button
                      type="button"
                      data-ocid={`style.delete_button.${idx + 1}`}
                      onClick={() => handleDeleteStyle(style.id)}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                      aria-label="Remove style"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {style.season && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] font-bold rounded-md px-2 py-0">
                        {style.season}
                      </Badge>
                    )}
                    {style.department && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] font-semibold rounded-md px-2 py-0"
                      >
                        {style.department}
                      </Badge>
                    )}
                    {style.zone && (
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold rounded-md px-2 py-0 border"
                      >
                        {style.zone}
                      </Badge>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Add Vendor Dialog ── */}
      <Dialog
        open={addVendorOpen}
        onOpenChange={(open) => {
          setAddVendorOpen(open);
          if (!open) {
            setVendorNameMode("select");
            setCustomVendorName("");
            setVendorForm({
              name: "",
              pricePerMeter: "",
              moq: "",
              leadTime: "",
            });
          }
        }}
      >
        <DialogContent
          data-ocid="vendor.modal"
          className="max-w-md rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Add Vendor
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Vendor Name *
              </Label>
              <Select
                value={
                  vendorNameMode === "custom" ? "__custom__" : vendorForm.name
                }
                onValueChange={(val) => {
                  if (val === "__custom__") {
                    setVendorNameMode("custom");
                    setVendorForm((prev) => ({ ...prev, name: "" }));
                  } else {
                    setVendorNameMode("select");
                    setVendorForm((prev) => ({ ...prev, name: val }));
                  }
                }}
              >
                <SelectTrigger
                  data-ocid="vendor.select"
                  className="rounded-xl border-2"
                >
                  <SelectValue placeholder="Select or add a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {allVendorNames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value="__custom__"
                    className="text-primary font-semibold"
                  >
                    + Add new vendor
                  </SelectItem>
                </SelectContent>
              </Select>
              {vendorNameMode === "custom" && (
                <Input
                  data-ocid="vendor.input"
                  placeholder="e.g. Textil Milano SRL"
                  value={customVendorName}
                  onChange={(e) => setCustomVendorName(e.target.value)}
                  className="rounded-xl border-2 mt-2"
                  autoFocus
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Price / m (₹) *
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="12.50"
                  value={vendorForm.pricePerMeter}
                  onChange={(e) =>
                    setVendorForm({
                      ...vendorForm,
                      pricePerMeter: e.target.value,
                    })
                  }
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  MOQ (m)
                </Label>
                <Input
                  type="number"
                  placeholder="200"
                  value={vendorForm.moq}
                  onChange={(e) =>
                    setVendorForm({ ...vendorForm, moq: e.target.value })
                  }
                  className="rounded-xl border-2"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Lead Time
              </Label>
              <Input
                placeholder="3–4 weeks"
                value={vendorForm.leadTime}
                onChange={(e) =>
                  setVendorForm({ ...vendorForm, leadTime: e.target.value })
                }
                className="rounded-xl border-2"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              data-ocid="vendor.cancel_button"
              variant="outline"
              onClick={() => setAddVendorOpen(false)}
              className="rounded-xl border-2 font-semibold"
            >
              Cancel
            </Button>
            <Button
              data-ocid="vendor.submit_button"
              onClick={handleAddVendor}
              className="bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
            >
              Add Vendor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Style Dialog ── */}
      <Dialog open={addStyleOpen} onOpenChange={setAddStyleOpen}>
        <DialogContent data-ocid="style.modal" className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Add Garment Style
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Style Number *
                </Label>
                <Input
                  data-ocid="style.input"
                  placeholder="AW24-001"
                  value={styleForm.styleNumber}
                  onChange={(e) =>
                    setStyleForm({ ...styleForm, styleNumber: e.target.value })
                  }
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Season
                </Label>
                <Input
                  placeholder="AW 2024"
                  value={styleForm.season}
                  onChange={(e) =>
                    setStyleForm({ ...styleForm, season: e.target.value })
                  }
                  className="rounded-xl border-2"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Style Name *
              </Label>
              <Input
                data-ocid="style.input"
                placeholder="e.g. Tailored Wide-Leg Trouser"
                value={styleForm.styleName}
                onChange={(e) =>
                  setStyleForm({ ...styleForm, styleName: e.target.value })
                }
                className="rounded-xl border-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Department
                </Label>
                <Select
                  value={styleForm.department}
                  onValueChange={(val) =>
                    setStyleForm({ ...styleForm, department: val, zone: "" })
                  }
                >
                  <SelectTrigger
                    data-ocid="style.department.select"
                    className="rounded-xl border-2"
                  >
                    <SelectValue placeholder="Select dept." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENT_OPTIONS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide">
                  Zone
                </Label>
                {zoneOptions.length > 0 ? (
                  <Select
                    value={styleForm.zone}
                    onValueChange={(val) =>
                      setStyleForm({ ...styleForm, zone: val })
                    }
                    disabled={!styleForm.department}
                  >
                    <SelectTrigger
                      data-ocid="style.zone.select"
                      className="rounded-xl border-2"
                    >
                      <SelectValue placeholder="Select zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zoneOptions.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    data-ocid="style.zone.input"
                    placeholder={
                      styleForm.department ? "Enter zone" : "Select dept. first"
                    }
                    value={styleForm.zone}
                    onChange={(e) =>
                      setStyleForm({ ...styleForm, zone: e.target.value })
                    }
                    className="rounded-xl border-2"
                    disabled={!styleForm.department}
                  />
                )}
              </div>
            </div>
            {/* Style Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide">
                Style Image
              </Label>
              {styleForm.imageUrl ? (
                <div className="relative inline-block">
                  <img
                    src={styleForm.imageUrl}
                    alt="Style preview"
                    className="h-20 w-auto object-cover rounded-lg border-2 border-border"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setStyleForm((prev) => ({ ...prev, imageUrl: "" }))
                    }
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center hover:bg-destructive/80 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  data-ocid="style.upload_button"
                  onClick={() => styleImageRef.current?.click()}
                  className="w-full border-2 border-dashed border-border rounded-xl py-6 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Upload className="w-3.5 h-3.5" />
                    <span className="font-medium">Upload style image</span>
                  </div>
                </button>
              )}
              <input
                type="file"
                accept="image/*"
                ref={styleImageRef}
                onChange={handleStyleImageChange}
                className="hidden"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              data-ocid="style.cancel_button"
              variant="outline"
              onClick={() => setAddStyleOpen(false)}
              className="rounded-xl border-2 font-semibold"
            >
              Cancel
            </Button>
            <Button
              data-ocid="style.submit_button"
              onClick={handleAddStyle}
              className="bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
            >
              Add Style
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
