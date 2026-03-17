import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { AccessGateModal } from "./components/AccessGateModal";
import Layout from "./components/Layout";
import { AuthProvider } from "./contexts/AuthContext";
import {
  type ColourVariant,
  type Fabric,
  sampleFabrics,
} from "./data/swatchData";
import AdminPanel from "./pages/AdminPanel";
import ColourDetail from "./pages/ColourDetail";
import Dashboard from "./pages/Dashboard";
import FabricDetail from "./pages/FabricDetail";

export type View =
  | { page: "dashboard" }
  | { page: "fabric"; fabricId: string }
  | { page: "colour"; fabricId: string; colourId: string }
  | { page: "admin" };

export default function App() {
  const [view, setView] = useState<View>({ page: "dashboard" });
  const [fabrics, setFabrics] = useState<Fabric[]>(sampleFabrics);

  const navigate = (v: View) => setView(v);

  const currentFabric =
    view.page !== "dashboard" && view.page !== "admin"
      ? (fabrics.find((f) => f.id === (view as any).fabricId) ?? null)
      : null;

  const currentColour =
    view.page === "colour" && currentFabric
      ? (currentFabric.colours.find((c) => c.id === (view as any).colourId) ??
        null)
      : null;

  return (
    <AuthProvider>
      <Layout view={view} navigate={navigate}>
        {view.page === "dashboard" && (
          <Dashboard
            fabrics={fabrics}
            setFabrics={setFabrics}
            navigate={navigate}
          />
        )}
        {view.page === "fabric" && currentFabric && (
          <FabricDetail
            fabric={currentFabric}
            fabrics={fabrics}
            setFabrics={setFabrics}
            navigate={navigate}
          />
        )}
        {view.page === "colour" && currentFabric && currentColour && (
          <ColourDetail
            fabric={currentFabric}
            colour={currentColour}
            fabrics={fabrics}
            setFabrics={setFabrics}
            navigate={navigate}
          />
        )}
        {view.page === "admin" && <AdminPanel navigate={navigate} />}
        <AccessGateModal />
        <Toaster richColors position="top-right" />
      </Layout>
    </AuthProvider>
  );
}
