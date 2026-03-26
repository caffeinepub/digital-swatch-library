import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Layers,
  Lock,
  LogIn,
  LogOut,
  ShieldCheck,
  Unlock,
} from "lucide-react";
import type { ReactNode } from "react";
import type { View } from "../App";
import { useAuth } from "../contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
  view: View;
  navigate: (v: View) => void;
}

export default function Layout({ children, view, navigate }: LayoutProps) {
  const currentYear = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);
  const { canEdit, isLoggedIn, isAdmin, principal, login, logout, openGate } =
    useAuth();
  const queryClient = useQueryClient();

  void queryClient;

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
            {view.page === "admin" && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-foreground/50" />
                <span className="text-foreground font-semibold">Admin</span>
              </>
            )}
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Edit mode indicator */}
            <button
              type="button"
              data-ocid="nav.toggle"
              onClick={() => !canEdit && openGate()}
              title={canEdit ? "Editing unlocked" : "Click to unlock editing"}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${
                canEdit
                  ? "border-green-600 text-green-700 bg-green-50 cursor-default"
                  : "border-foreground/40 text-foreground/60 hover:border-foreground hover:text-foreground cursor-pointer"
              }`}
            >
              {canEdit ? (
                <Unlock className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {canEdit ? "Editing" : "Locked"}
              </span>
            </button>

            {/* Admin button */}
            {isAdmin && (
              <button
                type="button"
                data-ocid="nav.link"
                onClick={() => navigate({ page: "admin" })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-foreground bg-foreground text-primary text-xs font-bold transition-all hover:bg-foreground/90"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Login/Logout */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                {principal && (
                  <span className="hidden md:inline text-xs text-foreground/60 font-mono">
                    {principal.slice(0, 6)}&hellip;
                  </span>
                )}
                <button
                  type="button"
                  data-ocid="nav.button"
                  onClick={logout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-foreground/30 text-foreground/70 text-xs font-bold hover:border-foreground hover:text-foreground transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-ocid="nav.button"
                onClick={login}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 border-foreground/30 text-foreground/70 text-xs font-bold hover:border-foreground hover:text-foreground transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="border-t border-border bg-secondary mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Digital Swatch Library. All rights reserved.
          </p>
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Built with &hearts; using caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}
