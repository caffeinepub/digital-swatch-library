import { Toaster } from "@/components/ui/sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Layout from "./components/Layout";
import {
  type ColourVariant,
  type Fabric,
  sampleFabrics,
} from "./data/swatchData";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import AdminPanel from "./pages/AdminPanel";
import ColourDetail from "./pages/ColourDetail";
import Dashboard from "./pages/Dashboard";
import FabricDetail from "./pages/FabricDetail";
import LoginPage from "./pages/LoginPage";

export type View =
  | { page: "dashboard" }
  | { page: "fabric"; fabricId: string }
  | { page: "colour"; fabricId: string; colourId: string }
  | { page: "admin" };

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { actor, isFetching: isActorFetching } = useActor();
  const [view, setView] = useState<View>({ page: "dashboard" });
  const [fabrics, setFabrics] = useState<Fabric[]>(sampleFabrics);
  const [isBlocked, setIsBlocked] = useState(false);
  const queryClient = useQueryClient();

  const navigate = (v: View) => setView(v);

  // Check admin status
  const { data: isAdmin = false } = useQuery<boolean>({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) return false;
      return (actor as any).isAdmin();
    },
    enabled: !!actor && !isActorFetching && !!identity,
  });

  // Record login and check if blocked, then refetch admin status
  useEffect(() => {
    if (!actor || !identity || isActorFetching) return;
    (async () => {
      try {
        const result = await (actor as any).recordLogin();
        if (result?.__kind__ === "blocked") {
          setIsBlocked(true);
        } else {
          // Refetch admin status after login is recorded (in case this is the first login)
          queryClient.invalidateQueries({
            queryKey: ["isAdmin", identity.getPrincipal().toString()],
          });
        }
      } catch {
        // ignore
      }
    })();
  }, [actor, identity, isActorFetching, queryClient]);

  const currentFabric =
    view.page !== "dashboard" && view.page !== "admin"
      ? (fabrics.find((f) => f.id === (view as any).fabricId) ?? null)
      : null;

  const currentColour =
    view.page === "colour" && currentFabric
      ? (currentFabric.colours.find((c) => c.id === (view as any).colourId) ??
        null)
      : null;

  // Show login page if not authenticated
  if (!isInitializing && !identity) {
    return (
      <>
        <LoginPage />
        <Toaster richColors position="top-right" />
      </>
    );
  }

  // While initialising, show a minimal loading screen
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div
          data-ocid="app.loading_state"
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 bg-primary rounded-xl animate-pulse" />
          <p className="text-sm text-muted-foreground font-sans">Loading…</p>
        </div>
      </div>
    );
  }

  // Blocked screen
  if (isBlocked) {
    return (
      <div
        data-ocid="app.error_state"
        className="min-h-screen bg-white flex items-center justify-center px-4"
      >
        <div className="flex flex-col items-center gap-6 text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center">
            <span className="text-3xl">🚫</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-foreground mb-2">
              Access Denied
            </h1>
            <p className="text-muted-foreground text-sm">
              Your account has been blocked by an administrator. Please contact
              support if you believe this is a mistake.
            </p>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    );
  }

  return (
    <Layout view={view} navigate={navigate} isAdmin={isAdmin}>
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
      <Toaster richColors position="top-right" />
    </Layout>
  );
}
