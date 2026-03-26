import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Calculator, RefreshCw } from "lucide-react";
import { useState } from "react";
import type { View } from "../App";

type FabricType = "knits" | "woven";
type GarmentType = "top" | "bottom";
type Department =
  | "infants"
  | "junior-boys"
  | "senior-boys"
  | "junior-girls"
  | "senior-girls"
  | "mens";

interface SizeRow {
  size: string;
  isBase: boolean;
  chest: number;
  bodyLength: number;
  consumption: number;
}

interface GradingConfig {
  sizes: string[];
  baseIndex: number;
  /** Returns the chest grading increment for one step. step > 0 = above base, step < 0 = below base */
  chestGrading: (step: number) => number;
  lengthGrading: number;
}

function getGradingConfig(dept: Department): GradingConfig {
  switch (dept) {
    case "infants":
      return {
        sizes: ["0-3m", "3-6m", "6-9m", "9-12m", "12-18m"],
        baseIndex: 3,
        chestGrading: () => 0.75,
        lengthGrading: 0.75,
      };
    case "junior-boys":
      return {
        sizes: ["1-2y", "2-3y", "3-4y", "5-6y", "7-8y"],
        baseIndex: 3,
        // above base (+): 2 cm; below base (-): 1.5 cm
        chestGrading: (step) => (step > 0 ? 2 : 1.5),
        lengthGrading: 1.5,
      };
    case "senior-boys":
      return {
        sizes: ["9-10y", "11-12y", "13-14y"],
        baseIndex: 0,
        chestGrading: () => 2,
        lengthGrading: 1.75,
      };
    case "junior-girls":
      return {
        sizes: ["1-2y", "2-3y", "3-4y", "5-6y", "7-8y"],
        baseIndex: 3,
        // above base (+): 1.5 cm; below base (-): 1.25 cm
        chestGrading: (step) => (step > 0 ? 1.5 : 1.25),
        lengthGrading: 1.0,
      };
    case "senior-girls":
      return {
        sizes: ["9-10y", "11-12y", "13-14y"],
        baseIndex: 0,
        chestGrading: () => 2,
        lengthGrading: 1.0,
      };
    case "mens":
      return {
        sizes: ["XS", "S", "M", "L", "XL", "XXL"],
        baseIndex: 2,
        // Handled inline for XXL (index 5 gets 3 cm, others get 2 cm)
        chestGrading: () => 2,
        lengthGrading: 0.5,
      };
  }
}

/**
 * Compute graded measurements from base index toward targetIndex.
 * For Men's Wear, XXL (index 5) has a 3 cm chest step instead of 2 cm.
 */
function computeGrading(
  config: GradingConfig,
  targetIndex: number,
  baseChest: number,
  baseLength: number,
): { chest: number; bodyLength: number } {
  const base = config.baseIndex;
  let chest = baseChest;
  let bodyLength = baseLength;

  if (targetIndex === base) return { chest, bodyLength };

  const isMens = config.sizes[base] === "M";

  if (targetIndex > base) {
    for (let i = base + 1; i <= targetIndex; i++) {
      // Men's wear XXL is at absolute index 5
      const chestStep = isMens && i === 5 ? 3 : config.chestGrading(1);
      chest += chestStep;
      bodyLength += config.lengthGrading;
    }
  } else {
    for (let i = base - 1; i >= targetIndex; i--) {
      chest -= config.chestGrading(-1);
      bodyLength -= config.lengthGrading;
    }
  }

  return { chest, bodyLength };
}

export default function FabricConsumption({
  navigate: _navigate,
}: {
  navigate: (v: View) => void;
}) {
  const [fabricType, setFabricType] = useState<FabricType>("knits");
  const [garmentType, setGarmentType] = useState<GarmentType>("top");
  const [department, setDepartment] = useState<Department | "">("");

  const [bodyLength, setBodyLength] = useState("");
  const [sleeveLength, setSleeveLength] = useState("");
  const [halfChest, setHalfChest] = useState(""); // also used for woven "chest"
  const [hipSeat, setHipSeat] = useState("");
  const [fabricWidth, setFabricWidth] = useState("");
  const [allowance, setAllowance] = useState("5");
  const [gsm, setGsm] = useState("");

  const [results, setResults] = useState<SizeRow[] | null>(null);
  const [error, setError] = useState("");

  const isTopWear = garmentType === "top";

  function reset() {
    setBodyLength("");
    setSleeveLength("");
    setHalfChest("");
    setHipSeat("");
    setFabricWidth("");
    setAllowance("5");
    setGsm("");
    setResults(null);
    setError("");
    setDepartment("");
  }

  function calculate() {
    setError("");

    if (!department) {
      setError("Please select a department.");
      return;
    }

    const bl = Number.parseFloat(bodyLength);
    const sl = Number.parseFloat(sleeveLength);
    const hc = Number.parseFloat(halfChest);
    const hip = Number.parseFloat(hipSeat);
    const fw = Number.parseFloat(fabricWidth);
    const allow = Number.parseFloat(allowance);
    const g = Number.parseFloat(gsm);

    if (Number.isNaN(bl) || Number.isNaN(allow)) {
      setError("Body Length and Allowance are required.");
      return;
    }

    if (fabricType === "knits") {
      if (Number.isNaN(g)) {
        setError("GSM is required for knits.");
        return;
      }
      if (isTopWear && Number.isNaN(hc)) {
        setError("Half Chest is required.");
        return;
      }
      if (isTopWear && Number.isNaN(sl)) {
        setError("Sleeve Length is required.");
        return;
      }
      if (!isTopWear && Number.isNaN(hip)) {
        setError("Hip/Seat is required.");
        return;
      }
    } else {
      if (Number.isNaN(sl)) {
        setError("Sleeve Length is required.");
        return;
      }
      if (Number.isNaN(hc)) {
        setError("Chest is required.");
        return;
      }
      if (Number.isNaN(fw) || fw <= 0) {
        setError("Fabric Width is required.");
        return;
      }
    }

    const config = getGradingConfig(department as Department);
    // Base measurement for the "width" dimension depends on garment
    const baseWidthMeasure = !isTopWear && fabricType === "knits" ? hip : hc;

    const rows: SizeRow[] = config.sizes.map((size, idx) => {
      const graded = computeGrading(config, idx, baseWidthMeasure, bl);

      let consumption: number;
      if (fabricType === "knits") {
        if (isTopWear) {
          // Formula: (bodyLength + sleeveLength + allowance) × (halfChest + allowance) × 2 × GSM ÷ 10000 ÷ 1000
          consumption =
            ((graded.bodyLength + sl + allow) *
              (graded.chest + allow) *
              2 *
              g) /
            10000 /
            1000;
        } else {
          // Formula: (bodyLength + allowance) × (hip/seat + allowance) × 2 × GSM ÷ 10000 ÷ 1000
          consumption =
            ((graded.bodyLength + allow) * (graded.chest + allow) * 2 * g) /
            10000 /
            1000;
        }
      } else {
        // Woven formula (result in meters/piece):
        // ((bodyLength + sleeveLength + allowance) × 2 × (chest + allowance)) ÷ 10000 ÷ fabricWidth(m)
        const widthM = fw / 100;
        consumption =
          ((graded.bodyLength + sl + allow) * 2 * (graded.chest + allow)) /
          10000 /
          widthM;
      }

      return {
        size,
        isBase: idx === config.baseIndex,
        chest: graded.chest,
        bodyLength: graded.bodyLength,
        consumption,
      };
    });

    setResults(rows);
  }

  const baseRow = results?.find((r) => r.isBase);
  const unit = fabricType === "knits" ? "kg/piece" : "m/piece";
  const chestLabel =
    fabricType === "knits" && isTopWear
      ? "Half Chest (cm)"
      : fabricType === "knits" && !isTopWear
        ? "Hip/Seat (cm)"
        : "Chest (cm)";

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-primary border-b-2 border-foreground py-6 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-foreground rounded flex items-center justify-center shrink-0">
            <Calculator className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground tracking-tight">
              Fabric Consumption Calculator
            </h1>
            <p className="text-foreground/70 text-sm mt-0.5">
              Calculate consumption per size with automatic grading
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Step 1 — Fabric Type */}
        <Card className="border-2 border-foreground">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-foreground text-xs font-bold flex items-center justify-center">
                1
              </span>
              Fabric Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(["knits", "woven"] as FabricType[]).map((ft) => (
                <button
                  key={ft}
                  type="button"
                  data-ocid={`calc.${ft}.toggle`}
                  onClick={() => {
                    setFabricType(ft);
                    setResults(null);
                  }}
                  className={`px-5 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${
                    fabricType === ft
                      ? "bg-primary border-foreground text-foreground"
                      : "bg-background border-foreground/30 text-foreground/60 hover:border-foreground hover:text-foreground"
                  }`}
                >
                  {ft === "knits" ? "Knits" : "Woven"}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 2 — Department */}
        <Card className="border-2 border-foreground">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-foreground text-xs font-bold flex items-center justify-center">
                2
              </span>
              Department &amp; Garment Type
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dept">Department</Label>
                <Select
                  value={department}
                  onValueChange={(v) => {
                    setDepartment(v as Department);
                    setResults(null);
                  }}
                >
                  <SelectTrigger id="dept" data-ocid="calc.department.select">
                    <SelectValue placeholder="Select department…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="infants">Infants</SelectItem>
                    <SelectItem value="junior-boys">Junior Boys</SelectItem>
                    <SelectItem value="senior-boys">Senior Boys</SelectItem>
                    <SelectItem value="junior-girls">Junior Girls</SelectItem>
                    <SelectItem value="senior-girls">Senior Girls</SelectItem>
                    <SelectItem value="mens">Men&apos;s Wear</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {fabricType === "knits" && (
                <div className="space-y-1.5">
                  <Label>Garment Type</Label>
                  <div className="flex gap-3 pt-0.5">
                    {(["top", "bottom"] as GarmentType[]).map((gt) => (
                      <button
                        key={gt}
                        type="button"
                        data-ocid={`calc.${gt}wear.toggle`}
                        onClick={() => {
                          setGarmentType(gt);
                          setResults(null);
                        }}
                        className={`px-4 py-2 rounded-lg border-2 font-semibold text-sm transition-all ${
                          garmentType === gt
                            ? "bg-primary border-foreground text-foreground"
                            : "bg-background border-foreground/30 text-foreground/60 hover:border-foreground hover:text-foreground"
                        }`}
                      >
                        {gt === "top" ? "Top Wear" : "Bottom Wear"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 3 — Measurements */}
        <Card className="border-2 border-foreground">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-primary text-foreground text-xs font-bold flex items-center justify-center">
                3
              </span>
              Base Size Measurements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="bodyLength">Body Length (cm)</Label>
                <Input
                  id="bodyLength"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="e.g. 65"
                  value={bodyLength}
                  onChange={(e) => setBodyLength(e.target.value)}
                  data-ocid="calc.body_length.input"
                />
              </div>

              {(isTopWear || fabricType === "woven") && (
                <div className="space-y-1.5">
                  <Label htmlFor="sleeveLength">Sleeve Length (cm)</Label>
                  <Input
                    id="sleeveLength"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 22"
                    value={sleeveLength}
                    onChange={(e) => setSleeveLength(e.target.value)}
                    data-ocid="calc.sleeve_length.input"
                  />
                </div>
              )}

              {fabricType === "knits" && isTopWear && (
                <div className="space-y-1.5">
                  <Label htmlFor="halfChest">Half Chest (cm)</Label>
                  <Input
                    id="halfChest"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 45"
                    value={halfChest}
                    onChange={(e) => setHalfChest(e.target.value)}
                    data-ocid="calc.half_chest.input"
                  />
                </div>
              )}

              {fabricType === "knits" && !isTopWear && (
                <div className="space-y-1.5">
                  <Label htmlFor="hipSeat">Hip / Seat (cm)</Label>
                  <Input
                    id="hipSeat"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 50"
                    value={hipSeat}
                    onChange={(e) => setHipSeat(e.target.value)}
                    data-ocid="calc.hip_seat.input"
                  />
                </div>
              )}

              {fabricType === "woven" && (
                <div className="space-y-1.5">
                  <Label htmlFor="chest">Chest (cm)</Label>
                  <Input
                    id="chest"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 90"
                    value={halfChest}
                    onChange={(e) => setHalfChest(e.target.value)}
                    data-ocid="calc.chest.input"
                  />
                </div>
              )}

              {fabricType === "woven" && (
                <div className="space-y-1.5">
                  <Label htmlFor="fabricWidth">Fabric Width (cm)</Label>
                  <Input
                    id="fabricWidth"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="e.g. 150"
                    value={fabricWidth}
                    onChange={(e) => setFabricWidth(e.target.value)}
                    data-ocid="calc.fabric_width.input"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="allowance">Allowance (cm)</Label>
                <Input
                  id="allowance"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="5"
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  data-ocid="calc.allowance.input"
                />
              </div>

              {fabricType === "knits" && (
                <div className="space-y-1.5">
                  <Label htmlFor="gsm">GSM (g/m²)</Label>
                  <Input
                    id="gsm"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 180"
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                    data-ocid="calc.gsm.input"
                  />
                </div>
              )}
            </div>

            {error && (
              <p
                className="mt-4 text-destructive text-sm font-medium"
                data-ocid="calc.error_state"
              >
                {error}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                data-ocid="calc.submit_button"
                onClick={calculate}
                className="bg-primary hover:bg-primary/90 text-foreground font-bold border-2 border-foreground px-6"
              >
                <Calculator className="w-4 h-4 mr-2" />
                Calculate
              </Button>
              <Button
                variant="outline"
                data-ocid="calc.reset.button"
                onClick={reset}
                className="border-2 border-foreground/40"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Step 4 — Results */}
        {results && (
          <Card
            className="border-2 border-foreground"
            data-ocid="calc.results.card"
          >
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-base flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary text-foreground text-xs font-bold flex items-center justify-center">
                  4
                </span>
                Results — Consumption per Size
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-foreground">
                      <TableHead className="font-bold text-foreground">
                        Size
                      </TableHead>
                      <TableHead className="font-bold text-foreground">
                        {chestLabel}
                      </TableHead>
                      <TableHead className="font-bold text-foreground">
                        Body Length (cm)
                      </TableHead>
                      <TableHead className="font-bold text-foreground text-right">
                        Consumption ({unit})
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, i) => (
                      <TableRow
                        key={row.size}
                        data-ocid={`calc.results.item.${i + 1}`}
                        className={row.isBase ? "font-semibold" : ""}
                        style={row.isBase ? { backgroundColor: "#FFCE06" } : {}}
                      >
                        <TableCell className="font-medium">
                          {row.size}
                          {row.isBase && (
                            <span className="ml-2 text-xs bg-foreground text-primary px-1.5 py-0.5 rounded font-bold">
                              BASE
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{row.chest.toFixed(2)}</TableCell>
                        <TableCell>{row.bodyLength.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">
                          {row.consumption.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {baseRow && (
                <div className="mt-4 p-3 bg-primary/20 border border-primary rounded-lg">
                  <p className="text-sm font-semibold text-foreground">
                    Base size consumption:{" "}
                    <span className="font-mono">
                      {baseRow.consumption.toFixed(4)}
                    </span>{" "}
                    {unit}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
