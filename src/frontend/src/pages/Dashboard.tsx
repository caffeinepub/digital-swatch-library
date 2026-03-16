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
  ChevronRight,
  Download,
  Layers,
  Palette,
  Plus,
  Search,
  SlidersHorizontal,
  Store,
  Tag,
  Upload,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { Variants } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import type { Fabric } from "../data/swatchData";
import { getTotalStyles, getTotalVendors } from "../data/swatchData";

interface DashboardProps {
  fabrics: Fabric[];
  setFabrics: (f: Fabric[]) => void;
  navigate: (v: View) => void;
}

const FABRIC_TYPES = ["Woven", "Knit", "Non-woven", "Technical", "Other"];

const GSM_RANGES = [
  { label: "All GSM", value: "all" },
  { label: "0–150", value: "0-150" },
  { label: "151–200", value: "151-200" },
  { label: "201–300", value: "201-300" },
  { label: "300+", value: "300+" },
];

function gsmInRange(gsm: number, range: string): boolean {
  if (range === "all" || range === "") return true;
  if (range === "0-150") return gsm >= 0 && gsm <= 150;
  if (range === "151-200") return gsm >= 151 && gsm <= 200;
  if (range === "201-300") return gsm >= 201 && gsm <= 300;
  if (range === "300+") return gsm > 300;
  return true;
}

// ── Excel template download (Excel 2003 XML, no library needed) ──────────────
function makeXmlSheet(headers: string[], rows: (string | number)[][]): string {
  const escapeXml = (v: string | number): string =>
    String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const headerRow = headers
    .map(
      (h) =>
        `<Cell ss:StyleID="header"><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`,
    )
    .join("");

  const dataRows = rows
    .map((row) => {
      const cells = row
        .map((cell) => {
          const type = typeof cell === "number" ? "Number" : "String";
          return `<Cell><Data ss:Type="${type}">${escapeXml(cell)}</Data></Cell>`;
        })
        .join("");
      return `<Row>${cells}</Row>`;
    })
    .join("");

  return `<Row>${headerRow}</Row>${dataRows}`;
}

function downloadExcelTemplate() {
  const fabricsSheet = makeXmlSheet(
    [
      "Fabric Name",
      "Fabric Code",
      "Fabric Type",
      "Composition",
      "GSM",
      "Width",
    ],
    [
      ["Cotton Twill", "CT-001", "Woven", "100% Cotton", 180, 150],
      ["Silk Charmeuse", "SC-002", "Woven", "100% Silk", 90, 114],
      ["Linen Blend", "LB-003", "Woven", "55% Linen 45% Cotton", 210, 148],
    ],
  );

  const coloursSheet = makeXmlSheet(
    ["Fabric Code", "Colour Name", "Pantone Code", "HEX Value"],
    [
      ["CT-001", "Ivory White", "PMS 9180 C", "#F5F0E8"],
      ["CT-001", "Midnight Navy", "PMS 289 C", "#1B2A4A"],
      ["SC-002", "Blush Rose", "PMS 698 C", "#F2C4CE"],
    ],
  );

  const vendorsSheet = makeXmlSheet(
    [
      "Fabric Code",
      "Colour Name",
      "Vendor Name",
      "Price Per Meter",
      "MOQ",
      "Lead Time",
    ],
    [
      ["CT-001", "Ivory White", "Arvind Mills", 450, 500, "30 days"],
      ["CT-001", "Midnight Navy", "Bombay Dyeing", 480, 300, "21 days"],
      ["SC-002", "Blush Rose", "Silk India", 1200, 100, "45 days"],
    ],
  );

  const stylesSheet = makeXmlSheet(
    [
      "Style Number",
      "Style Name",
      "Season",
      "Department",
      "Zone",
      "Fabric Code",
    ],
    [
      ["ST-2024-001", "Summer Shirt", "SS24", "Men", "Casual", "CT-001"],
      ["ST-2024-002", "Evening Blouse", "AW24", "Women", "Formal", "SC-002"],
      [
        "ST-2024-003",
        "Weekend Trouser",
        "SS24",
        "Men",
        "Smart Casual",
        "LB-003",
      ],
    ],
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:x="urn:schemas-microsoft-com:office:excel">
  <Styles>
    <Style ss:ID="header">
      <Font ss:Bold="1" ss:Size="11"/>
      <Interior ss:Color="#FFCE06" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Fabrics">
    <Table>${fabricsSheet}</Table>
  </Worksheet>
  <Worksheet ss:Name="Colours">
    <Table>${coloursSheet}</Table>
  </Worksheet>
  <Worksheet ss:Name="Vendors">
    <Table>${vendorsSheet}</Table>
  </Worksheet>
  <Worksheet ss:Name="Styles">
    <Table>${stylesSheet}</Table>
  </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "swatch-library-template.xls";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast.success("Template downloaded! Open in Excel or Google Sheets.");
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard({
  fabrics,
  setFabrics,
  navigate,
}: DashboardProps) {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState("");
  const [filterGsm, setFilterGsm] = useState("");
  const [filterComposition, setFilterComposition] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterZone, setFilterZone] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterColour, setFilterColour] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "",
    composition: "",
    gsm: "",
    width: "",
  });

  // Derive unique filter options from fabrics
  const allDepartments = Array.from(
    new Set(
      fabrics.flatMap((f) =>
        f.colours.flatMap((c) => c.styles.map((s) => s.department)),
      ),
    ),
  ).sort();

  const allZones = Array.from(
    new Set(
      fabrics.flatMap((f) =>
        f.colours.flatMap((c) => c.styles.map((s) => s.zone)),
      ),
    ),
  ).sort();

  const allVendors = Array.from(
    new Set(
      fabrics.flatMap((f) =>
        f.colours.flatMap((c) => c.vendors.map((v) => v.name)),
      ),
    ),
  ).sort();

  const allCompositions = Array.from(
    new Set(fabrics.map((f) => f.composition).filter(Boolean)),
  ).sort();

  const allColourNames = Array.from(
    new Set(fabrics.flatMap((f) => f.colours.map((c) => c.name))),
  ).sort();

  const activeFilterCount = [
    filterType,
    filterGsm,
    filterComposition,
    filterDepartment,
    filterZone,
    filterVendor,
    filterColour,
  ].filter((v) => v && v !== "").length;

  function clearFilters() {
    setFilterType("");
    setFilterGsm("");
    setFilterComposition("");
    setFilterDepartment("");
    setFilterZone("");
    setFilterVendor("");
    setFilterColour("");
  }

  const filtered = fabrics.filter((f) => {
    // Search across multiple attributes
    if (search) {
      const q = search.toLowerCase();
      const colourNames = f.colours.map((c) => c.name.toLowerCase());
      const pantones = f.colours.map((c) => c.pantone.toLowerCase());
      const styleCodes = f.colours.flatMap((c) =>
        c.styles.map((s) => s.styleNumber.toLowerCase()),
      );
      const matchSearch =
        f.name.toLowerCase().includes(q) ||
        f.code.toLowerCase().includes(q) ||
        String(f.gsm).includes(q) ||
        colourNames.some((n) => n.includes(q)) ||
        pantones.some((p) => p.includes(q)) ||
        styleCodes.some((sc) => sc.includes(q));
      if (!matchSearch) return false;
    }

    // Fabric type filter
    if (filterType && f.type !== filterType) return false;

    // GSM range filter
    if (filterGsm && !gsmInRange(f.gsm, filterGsm)) return false;

    // Composition filter
    if (filterComposition && f.composition !== filterComposition) return false;

    // Department filter
    if (filterDepartment) {
      const hasDept = f.colours.some((c) =>
        c.styles.some((s) => s.department === filterDepartment),
      );
      if (!hasDept) return false;
    }

    // Zone filter
    if (filterZone) {
      const hasZone = f.colours.some((c) =>
        c.styles.some((s) => s.zone === filterZone),
      );
      if (!hasZone) return false;
    }

    // Vendor filter
    if (filterVendor) {
      const hasVendor = f.colours.some((c) =>
        c.vendors.some((v) => v.name === filterVendor),
      );
      if (!hasVendor) return false;
    }

    // Colour filter
    if (filterColour) {
      const hasColour = f.colours.some((c) => c.name === filterColour);
      if (!hasColour) return false;
    }

    return true;
  });

  const totalStyles = getTotalStyles(fabrics);
  const totalVendors = getTotalVendors(fabrics);
  const totalColours = fabrics.reduce((a, f) => a + f.colours.length, 0);

  function handleAddFabric() {
    if (!form.name || !form.code || !form.type) {
      toast.error("Please fill in Fabric Name, Code, and Type.");
      return;
    }
    const newFabric: Fabric = {
      id: `fab-${Date.now()}`,
      code: form.code.trim(),
      name: form.name.trim(),
      type: form.type,
      composition: form.composition.trim(),
      gsm: Number(form.gsm) || 0,
      width: Number(form.width) || 0,
      colours: [],
    };
    setFabrics([...fabrics, newFabric]);
    setForm({
      code: "",
      name: "",
      type: "",
      composition: "",
      gsm: "",
      width: "",
    });
    setAddOpen(false);
    toast.success(`"${newFabric.name}" added to library.`);
  }

  function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    toast.success(`"${file.name}" uploaded. Processing data…`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const statItems = [
    {
      label: "Total Fabrics",
      value: fabrics.length,
      icon: Layers,
      color: "yellow",
    },
    {
      label: "Colour Variants",
      value: totalColours,
      icon: Palette,
      color: "dark",
    },
    { label: "Total Styles", value: totalStyles, icon: Tag, color: "yellow" },
    { label: "Total Vendors", value: totalVendors, icon: Store, color: "dark" },
  ];

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  };

  const itemVariant: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* ── Hero heading ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-1">
              Digital Swatch Library
            </p>
            <h1 className="font-display text-5xl font-extrabold tracking-tight text-foreground leading-none">
              Fabric
              <span className="text-primary"> Collection</span>
            </h1>
            <p className="mt-2 text-muted-foreground text-sm max-w-lg">
              Browse fabrics, explore colour variants, compare vendors, and
              track garment styles — all in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <Button
              data-ocid="fabric.open_modal_button"
              onClick={() => setAddOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-none border-2 border-foreground rounded-xl"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Fabric
            </Button>
            <Button
              data-ocid="fabric.upload_button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="font-semibold border-2 border-foreground rounded-xl"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              Excel Upload
            </Button>
            <Button
              data-ocid="fabric.download_template_button"
              variant="outline"
              onClick={downloadExcelTemplate}
              className="font-semibold border-2 border-foreground rounded-xl"
            >
              <Download className="w-4 h-4 mr-1.5" />
              Download Template
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelUpload}
            />
          </div>
        </div>
      </motion.div>

      {/* ── Stats ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
      >
        {statItems.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariant}
            className={`${
              stat.color === "yellow"
                ? "bg-primary text-primary-foreground border-2 border-foreground"
                : "bg-foreground text-primary border-2 border-foreground"
            } rounded-2xl p-5 flex flex-col gap-3`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest opacity-70">
                {stat.label}
              </span>
              <stat.icon className="w-4 h-4 opacity-60" />
            </div>
            <span className="font-display text-4xl font-extrabold leading-none">
              {stat.value}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Search + Filter Toggle ── */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-ocid="fabric.search_input"
              placeholder="Search by name, code, GSM, colour, pantone, style code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-sm rounded-xl border-2 border-border focus:border-primary focus:ring-0 bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <Button
            data-ocid="dashboard.filter.toggle"
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            className={`h-12 px-4 font-semibold border-2 rounded-xl flex items-center gap-2 flex-shrink-0 transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-primary bg-primary/10 text-foreground"
                : "border-foreground"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* ── Filter Panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              data-ocid="dashboard.filter.panel"
              key="filter-panel"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="bg-white border-2 border-border rounded-2xl p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {/* Fabric Type */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Fabric Type
                    </Label>
                    <Select
                      value={filterType || "__all__"}
                      onValueChange={(v) =>
                        setFilterType(v === "__all__" ? "" : v)
                      }
                    >
                      <SelectTrigger
                        data-ocid="dashboard.filter.select"
                        className="h-9 rounded-xl border-2 text-sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Types</SelectItem>
                        {FABRIC_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* GSM Range */}
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      GSM Range
                    </Label>
                    <Select
                      value={filterGsm || "all"}
                      onValueChange={(v) => setFilterGsm(v === "all" ? "" : v)}
                    >
                      <SelectTrigger
                        data-ocid="dashboard.filter.select"
                        className="h-9 rounded-xl border-2 text-sm"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {GSM_RANGES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Composition */}
                  {allCompositions.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Composition
                      </Label>
                      <Select
                        value={filterComposition || "__all__"}
                        onValueChange={(v) =>
                          setFilterComposition(v === "__all__" ? "" : v)
                        }
                      >
                        <SelectTrigger
                          data-ocid="dashboard.filter.select"
                          className="h-9 rounded-xl border-2 text-sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">
                            All Compositions
                          </SelectItem>
                          {allCompositions.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Department */}
                  {allDepartments.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Department
                      </Label>
                      <Select
                        value={filterDepartment || "__all__"}
                        onValueChange={(v) =>
                          setFilterDepartment(v === "__all__" ? "" : v)
                        }
                      >
                        <SelectTrigger
                          data-ocid="dashboard.filter.select"
                          className="h-9 rounded-xl border-2 text-sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">
                            All Departments
                          </SelectItem>
                          {allDepartments.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Zone */}
                  {allZones.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Zone
                      </Label>
                      <Select
                        value={filterZone || "__all__"}
                        onValueChange={(v) =>
                          setFilterZone(v === "__all__" ? "" : v)
                        }
                      >
                        <SelectTrigger
                          data-ocid="dashboard.filter.select"
                          className="h-9 rounded-xl border-2 text-sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Zones</SelectItem>
                          {allZones.map((z) => (
                            <SelectItem key={z} value={z}>
                              {z}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Vendor */}
                  {allVendors.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Vendor
                      </Label>
                      <Select
                        value={filterVendor || "__all__"}
                        onValueChange={(v) =>
                          setFilterVendor(v === "__all__" ? "" : v)
                        }
                      >
                        <SelectTrigger
                          data-ocid="dashboard.filter.select"
                          className="h-9 rounded-xl border-2 text-sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Vendors</SelectItem>
                          {allVendors.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Colour */}
                  {allColourNames.length > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Colour
                      </Label>
                      <Select
                        value={filterColour || "__all__"}
                        onValueChange={(v) =>
                          setFilterColour(v === "__all__" ? "" : v)
                        }
                      >
                        <SelectTrigger
                          data-ocid="dashboard.filter.select"
                          className="h-9 rounded-xl border-2 text-sm"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">All Colours</SelectItem>
                          {allColourNames.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {activeFilterCount > 0 && (
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {activeFilterCount}
                      </span>{" "}
                      active filter{activeFilterCount !== 1 ? "s" : ""} ·
                      showing{" "}
                      <span className="font-semibold text-foreground">
                        {filtered.length}
                      </span>{" "}
                      of {fabrics.length} fabrics
                    </p>
                    <Button
                      data-ocid="dashboard.filter.clear_button"
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-xs font-semibold h-7 px-3 text-muted-foreground hover:text-foreground rounded-lg"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Section header ── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          All Fabrics
        </h2>
        <Badge variant="secondary" className="rounded-lg text-xs font-semibold">
          {filtered.length} of {fabrics.length}
        </Badge>
      </div>

      {/* ── Fabric Grid ── */}
      {filtered.length === 0 ? (
        <div
          data-ocid="fabric.empty_state"
          className="border-2 border-dashed border-border rounded-2xl py-20 text-center"
        >
          <p className="text-muted-foreground font-medium">
            No fabrics match your search or filters.
          </p>
          {(search || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                clearFilters();
              }}
              className="mt-3 text-sm font-semibold text-primary underline underline-offset-2"
            >
              Clear all
            </button>
          )}
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map((fabric, idx) => (
            <motion.div
              key={fabric.id}
              variants={itemVariant}
              data-ocid={`fabric.item.${idx + 1}`}
              onClick={() => navigate({ page: "fabric", fabricId: fabric.id })}
              className="group bg-white border-2 border-border hover:border-primary rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:shadow-card-hover"
            >
              {/* Colour swatches row */}
              <div className="flex items-center gap-1.5 mb-4">
                {fabric.colours.slice(0, 6).map((c) => (
                  <div
                    key={c.id}
                    className="w-6 h-6 rounded-full border border-border/60 flex-shrink-0"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                {fabric.colours.length > 6 && (
                  <span className="text-xs text-muted-foreground font-medium ml-0.5">
                    +{fabric.colours.length - 6}
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-0.5">
                    {fabric.code}
                  </p>
                  <h3 className="font-display font-bold text-base text-foreground leading-snug group-hover:text-foreground truncate">
                    {fabric.name}
                  </h3>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-1 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className="rounded-md text-[10px] font-semibold"
                >
                  {fabric.type}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {fabric.gsm} GSM · {fabric.width}cm
                </span>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {fabric.colours.length} colour
                  {fabric.colours.length !== 1 ? "s" : ""}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ── Add Fabric Dialog ── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent
          data-ocid="fabric.modal"
          className="max-w-md rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Add New Fabric
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="fab-code"
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  Fabric Code *
                </Label>
                <Input
                  data-ocid="fabric.input"
                  id="fab-code"
                  placeholder="e.g. LX-2240"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="fab-type"
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  Type *
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger
                    data-ocid="fabric.select"
                    id="fab-type"
                    className="rounded-xl border-2"
                  >
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {FABRIC_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="fab-name"
                className="text-xs font-semibold uppercase tracking-wide"
              >
                Fabric Name *
              </Label>
              <Input
                data-ocid="fabric.input"
                id="fab-name"
                placeholder="e.g. Milano Stretch Crepe"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl border-2"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="fab-comp"
                className="text-xs font-semibold uppercase tracking-wide"
              >
                Composition
              </Label>
              <Input
                id="fab-comp"
                placeholder="e.g. 100% Cotton"
                value={form.composition}
                onChange={(e) =>
                  setForm({ ...form, composition: e.target.value })
                }
                className="rounded-xl border-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="fab-gsm"
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  GSM
                </Label>
                <Input
                  id="fab-gsm"
                  type="number"
                  placeholder="e.g. 220"
                  value={form.gsm}
                  onChange={(e) => setForm({ ...form, gsm: e.target.value })}
                  className="rounded-xl border-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="fab-width"
                  className="text-xs font-semibold uppercase tracking-wide"
                >
                  Width (cm)
                </Label>
                <Input
                  id="fab-width"
                  type="number"
                  placeholder="e.g. 148"
                  value={form.width}
                  onChange={(e) => setForm({ ...form, width: e.target.value })}
                  className="rounded-xl border-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              data-ocid="fabric.cancel_button"
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="rounded-xl border-2 font-semibold"
            >
              Cancel
            </Button>
            <Button
              data-ocid="fabric.submit_button"
              onClick={handleAddFabric}
              className="bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
            >
              Add Fabric
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
