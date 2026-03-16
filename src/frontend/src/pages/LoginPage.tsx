import { Button } from "@/components/ui/button";
import { Layers, Loader2 } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn, isInitializing } = useInternetIdentity();

  return (
    <div
      data-ocid="login.page"
      className="min-h-screen bg-white flex items-center justify-center px-4"
    >
      <div className="flex flex-col items-center gap-8 w-full max-w-sm">
        {/* Logo block */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Layers className="w-10 h-10 text-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display font-bold text-3xl tracking-tight text-foreground leading-none">
              SWATCH LIBRARY
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              Your digital fabric management platform
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="w-12 h-0.5 bg-primary" />

        {/* Login card */}
        <div className="w-full bg-white border-2 border-foreground rounded-2xl p-8 shadow-card flex flex-col gap-5">
          <div>
            <h2 className="font-display font-bold text-xl text-foreground">
              Sign in to continue
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Secure access powered by Internet Identity
            </p>
          </div>

          <Button
            data-ocid="login.primary_button"
            onClick={login}
            disabled={isLoggingIn || isInitializing}
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold text-sm rounded-xl h-12 transition-all"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting…
              </>
            ) : (
              "Login with Internet Identity"
            )}
          </Button>

          {isInitializing && (
            <div
              data-ocid="login.loading_state"
              className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Initialising…
            </div>
          )}
        </div>

        {/* Footer note */}
        <p className="text-xs text-muted-foreground text-center">
          No password required — authenticate with your Internet Identity
        </p>
      </div>
    </div>
  );
}
