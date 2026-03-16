export interface Vendor {
  id: string;
  name: string;
  pricePerMeter: number;
  moq: number;
  leadTime: string;
  country?: string;
}

export interface Style {
  id: string;
  styleNumber: string;
  styleName: string;
  season: string;
  department: string;
  zone: string;
  imageUrl?: string;
}

export interface ColourVariant {
  id: string;
  name: string;
  pantone: string;
  hex: string;
  vendors: Vendor[];
  styles: Style[];
}

export interface Fabric {
  id: string;
  code: string;
  name: string;
  type: string;
  composition: string;
  gsm: number;
  width: number;
  imageUrl?: string;
  colours: ColourVariant[];
}

export const sampleFabrics: Fabric[] = [
  {
    id: "fab-001",
    code: "LX-2240",
    name: "Milano Stretch Crepe",
    type: "Woven",
    composition: "68% Polyester, 27% Viscose, 5% Elastane",
    gsm: 220,
    width: 148,
    imageUrl: undefined,
    colours: [
      {
        id: "col-001",
        name: "Ivory Cloud",
        pantone: "11-0601 TCX",
        hex: "#F5F0E8",
        vendors: [
          {
            id: "v1",
            name: "Textil Milano SRL",
            pricePerMeter: 12.5,
            moq: 200,
            leadTime: "3–4 weeks",
            country: "Italy",
          },
          {
            id: "v2",
            name: "Weavecraft Ltd",
            pricePerMeter: 11.8,
            moq: 300,
            leadTime: "5–6 weeks",
            country: "UK",
          },
        ],
        styles: [
          {
            id: "s1",
            styleNumber: "AW24-001",
            styleName: "Tailored Wide-Leg Trouser",
            season: "AW 2024",
            department: "Womenswear",
            zone: "Premium",
          },
          {
            id: "s2",
            styleNumber: "SS25-012",
            styleName: "Relaxed Blazer",
            season: "SS 2025",
            department: "Womenswear",
            zone: "Core",
          },
        ],
      },
      {
        id: "col-002",
        name: "Midnight Noir",
        pantone: "19-4005 TCX",
        hex: "#1C1C1E",
        vendors: [
          {
            id: "v3",
            name: "Textil Milano SRL",
            pricePerMeter: 12.5,
            moq: 200,
            leadTime: "3–4 weeks",
            country: "Italy",
          },
        ],
        styles: [
          {
            id: "s3",
            styleNumber: "AW24-018",
            styleName: "Straight-Cut Suit Jacket",
            season: "AW 2024",
            department: "Womenswear",
            zone: "Premium",
          },
        ],
      },
      {
        id: "col-003",
        name: "Supernova",
        pantone: "13-0858 TCX",
        hex: "#FFCE06",
        vendors: [
          {
            id: "v4",
            name: "ColorTex Barcelona",
            pricePerMeter: 13.2,
            moq: 150,
            leadTime: "4–5 weeks",
            country: "Spain",
          },
          {
            id: "v5",
            name: "Weavecraft Ltd",
            pricePerMeter: 12.9,
            moq: 250,
            leadTime: "5–6 weeks",
            country: "UK",
          },
        ],
        styles: [
          {
            id: "s4",
            styleNumber: "SS25-034",
            styleName: "Statement Skirt",
            season: "SS 2025",
            department: "Womenswear",
            zone: "Premium",
          },
        ],
      },
    ],
  },
  {
    id: "fab-002",
    code: "CT-4410",
    name: "Japanese Cotton Twill",
    type: "Woven",
    composition: "100% Cotton",
    gsm: 180,
    width: 150,
    imageUrl: undefined,
    colours: [
      {
        id: "col-004",
        name: "Chalk White",
        pantone: "11-0601 TCX",
        hex: "#FAFAF8",
        vendors: [
          {
            id: "v6",
            name: "Osaka Textile Co.",
            pricePerMeter: 9.8,
            moq: 500,
            leadTime: "6–8 weeks",
            country: "Japan",
          },
        ],
        styles: [
          {
            id: "s5",
            styleNumber: "SS25-007",
            styleName: "Utility Cargo Pant",
            season: "SS 2025",
            department: "Menswear",
            zone: "Core",
          },
          {
            id: "s6",
            styleNumber: "SS25-021",
            styleName: "Boxy Shirt",
            season: "SS 2025",
            department: "Menswear",
            zone: "Core",
          },
        ],
      },
      {
        id: "col-005",
        name: "Cobalt Strike",
        pantone: "18-4051 TCX",
        hex: "#2150A0",
        vendors: [
          {
            id: "v7",
            name: "Osaka Textile Co.",
            pricePerMeter: 10.2,
            moq: 500,
            leadTime: "6–8 weeks",
            country: "Japan",
          },
          {
            id: "v8",
            name: "Euro Fabric House",
            pricePerMeter: 9.5,
            moq: 400,
            leadTime: "4–5 weeks",
            country: "Portugal",
          },
        ],
        styles: [
          {
            id: "s7",
            styleNumber: "AW24-032",
            styleName: "Workwear Jacket",
            season: "AW 2024",
            department: "Menswear",
            zone: "Premium",
          },
        ],
      },
    ],
  },
  {
    id: "fab-003",
    code: "SL-7780",
    name: "Duchess Satin",
    type: "Woven",
    composition: "100% Polyester",
    gsm: 130,
    width: 140,
    imageUrl: undefined,
    colours: [
      {
        id: "col-006",
        name: "Blush Petal",
        pantone: "12-1708 TCX",
        hex: "#F2C4B0",
        vendors: [
          {
            id: "v9",
            name: "Satin House Paris",
            pricePerMeter: 16.5,
            moq: 100,
            leadTime: "3–4 weeks",
            country: "France",
          },
        ],
        styles: [
          {
            id: "s8",
            styleNumber: "SS25-045",
            styleName: "Slip Dress",
            season: "SS 2025",
            department: "Womenswear",
            zone: "Premium",
          },
        ],
      },
      {
        id: "col-007",
        name: "Emerald Forest",
        pantone: "17-0145 TCX",
        hex: "#2D6A4F",
        vendors: [
          {
            id: "v10",
            name: "Satin House Paris",
            pricePerMeter: 16.5,
            moq: 100,
            leadTime: "3–4 weeks",
            country: "France",
          },
          {
            id: "v11",
            name: "Euro Fabric House",
            pricePerMeter: 15.8,
            moq: 150,
            leadTime: "4–5 weeks",
            country: "Portugal",
          },
        ],
        styles: [
          {
            id: "s9",
            styleNumber: "AW24-067",
            styleName: "Evening Gown",
            season: "AW 2024",
            department: "Womenswear",
            zone: "Couture",
          },
        ],
      },
    ],
  },
  {
    id: "fab-004",
    code: "KN-1150",
    name: "Merino Rib Knit",
    type: "Knit",
    composition: "85% Merino Wool, 15% Nylon",
    gsm: 260,
    width: 160,
    imageUrl: undefined,
    colours: [
      {
        id: "col-008",
        name: "Oatmeal",
        pantone: "12-0712 TCX",
        hex: "#D4C5A9",
        vendors: [
          {
            id: "v12",
            name: "Merino Masters NZ",
            pricePerMeter: 22.0,
            moq: 100,
            leadTime: "8–10 weeks",
            country: "New Zealand",
          },
        ],
        styles: [
          {
            id: "s10",
            styleNumber: "AW24-091",
            styleName: "Oversized Turtleneck",
            season: "AW 2024",
            department: "Womenswear",
            zone: "Core",
          },
          {
            id: "s11",
            styleNumber: "AW24-095",
            styleName: "Knitted Midi Skirt",
            season: "AW 2024",
            department: "Womenswear",
            zone: "Core",
          },
        ],
      },
      {
        id: "col-009",
        name: "Charcoal Smoke",
        pantone: "18-0306 TCX",
        hex: "#4A4A4A",
        vendors: [
          {
            id: "v13",
            name: "Merino Masters NZ",
            pricePerMeter: 22.0,
            moq: 100,
            leadTime: "8–10 weeks",
            country: "New Zealand",
          },
          {
            id: "v14",
            name: "Nordic Knits AS",
            pricePerMeter: 20.5,
            moq: 200,
            leadTime: "6–7 weeks",
            country: "Denmark",
          },
        ],
        styles: [
          {
            id: "s12",
            styleNumber: "AW24-102",
            styleName: "Crew Neck Pullover",
            season: "AW 2024",
            department: "Menswear",
            zone: "Core",
          },
        ],
      },
    ],
  },
  {
    id: "fab-005",
    code: "LN-3320",
    name: "Belgian Linen Plain",
    type: "Woven",
    composition: "100% Linen",
    gsm: 155,
    width: 155,
    imageUrl: undefined,
    colours: [
      {
        id: "col-010",
        name: "Natural Sand",
        pantone: "13-1015 TCX",
        hex: "#C8B89A",
        vendors: [
          {
            id: "v15",
            name: "Libeco Home",
            pricePerMeter: 14.5,
            moq: 200,
            leadTime: "4–6 weeks",
            country: "Belgium",
          },
          {
            id: "v16",
            name: "Baltic Linen Co.",
            pricePerMeter: 13.2,
            moq: 300,
            leadTime: "5–7 weeks",
            country: "Lithuania",
          },
        ],
        styles: [
          {
            id: "s13",
            styleNumber: "SS25-058",
            styleName: "Linen Shirt Dress",
            season: "SS 2025",
            department: "Womenswear",
            zone: "Core",
          },
          {
            id: "s14",
            styleNumber: "SS25-063",
            styleName: "Pleated Summer Trouser",
            season: "SS 2025",
            department: "Menswear",
            zone: "Core",
          },
        ],
      },
    ],
  },
  {
    id: "fab-006",
    code: "VL-5590",
    name: "Crushed Velvet",
    type: "Knit",
    composition: "80% Polyester, 20% Elastane",
    gsm: 300,
    width: 145,
    imageUrl: undefined,
    colours: [
      {
        id: "col-011",
        name: "Royal Plum",
        pantone: "19-3748 TCX",
        hex: "#4B2C6B",
        vendors: [
          {
            id: "v17",
            name: "Velvet Factory NL",
            pricePerMeter: 18.9,
            moq: 150,
            leadTime: "4–5 weeks",
            country: "Netherlands",
          },
        ],
        styles: [
          {
            id: "s15",
            styleNumber: "AW24-120",
            styleName: "Velvet Blazer",
            season: "AW 2024",
            department: "Womenswear",
            zone: "Premium",
          },
        ],
      },
    ],
  },
];

export function getTotalVendors(fabrics: Fabric[]): number {
  const vendorNames = new Set<string>();
  for (const fabric of fabrics) {
    for (const colour of fabric.colours) {
      for (const vendor of colour.vendors) {
        vendorNames.add(vendor.name);
      }
    }
  }
  return vendorNames.size;
}

export function getTotalStyles(fabrics: Fabric[]): number {
  const styleIds = new Set<string>();
  for (const fabric of fabrics) {
    for (const colour of fabric.colours) {
      for (const style of colour.styles) {
        styleIds.add(style.id);
      }
    }
  }
  return styleIds.size;
}
