import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Layers, LogOut, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { View } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface LayoutProps {
  children: ReactNode;
  view: View;
  navigate: (v: View) => void;
  isAdmin?: boolean;
}

export default function Layout({
  children,
  view,
  navigate,
  isAdmin = false,
}: LayoutProps) {
  const currentYear = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);
  const { identity, clear } = useInternetIdentity();
  const queryClient = useQueryClient();

  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 8)}…`
    : null;

  const handleLogout = () => {
    clear();
    queryClient.clear();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Header ── */}
      <header className="bg-primary sticky top-0 z-50 border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            type="button"
            data-ocid="nav.link"
            onClick={() => navigate({ page: "dashboard" })}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-foreground">
              SWATCH LIBRARY
            </span>
          </button>

          {/* Breadcrumb */}
          <nav
            aria-label="breadcrumb"
            className="hidden sm:flex items-center gap-1 text-sm font-medium"
          >
            <button
              type="button"
              data-ocid="nav.link"
              onClick={() => navigate({ page: "dashboard" })}
              className="text-foreground/70 hover:text-foreground transition-colors"
            >
              Library
            </button>
            {view.page === "admin" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-foreground/50" />
                <span className="text-foreground font-semibold">Admin</span>
              </>
            )}
            {view.page !== "dashboard" && view.page !== "admin" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-foreground/50" />
                <button
                  type="button"
                  className={`${
                    view.page === "fabric"
                      ? "text-foreground font-semibold cursor-default"
                      : "text-foreground/70 hover:text-foreground cursor-pointer transition-colors"
                  }`}
                  onClick={() =>
                    view.page !== "fabric" &&
                    navigate({
                      page: "fabric",
                      fabricId: (view as any).fabricId,
                    })
                  }
                >
                  Fabric
                </button>
              </>
            )}
            {view.page === "colour" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-foreground/50" />
                <span className="text-foreground font-semibold">Colour</span>
              </>
            )}
          </nav>

          {/* User + Admin + Logout */}
          {identity && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:block text-xs font-mono text-foreground/70 truncate max-w-[120px]">
                {principalShort}
              </span>
              {isAdmin && (
                <Button
                  data-ocid="admin.link"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate({ page: "admin" })}
                  className="border-foreground text-foreground hover:bg-foreground hover:text-primary gap-1.5 font-semibold text-xs h-8"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </Button>
              )}
              <Button
                data-ocid="nav.button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-foreground text-foreground hover:bg-foreground hover:text-primary gap-1.5 font-semibold text-xs h-8"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-secondary mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {currentYear} Digital Swatch Library. All rights reserved.
          </p>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
