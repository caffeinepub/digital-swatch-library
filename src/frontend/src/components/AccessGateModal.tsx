import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export function AccessGateModal() {
  const { isGateOpen, closeGate, unlockWithPin, login, isLoggedIn } = useAuth();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [tab, setTab] = useState<"pin" | "login">("pin");

  function handlePinSubmit() {
    const ok = unlockWithPin(pin);
    if (ok) {
      toast.success("Edit mode unlocked!");
      closeGate();
      setPin("");
      setPinError(false);
    } else {
      setPinError(true);
      toast.error("Incorrect PIN");
    }
  }

  function handleLogin() {
    login();
    closeGate();
  }

  return (
    <Dialog open={isGateOpen} onOpenChange={(o) => !o && closeGate()}>
      <DialogContent
        data-ocid="access_gate.dialog"
        className="sm:max-w-md border-2 border-foreground rounded-2xl p-0 overflow-hidden"
      >
        <div className="bg-primary px-6 py-5">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                Edit Access Required
              </DialogTitle>
            </div>
            <p className="text-sm text-foreground/70 mt-1">
              Choose how to unlock editing
            </p>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Tab selector */}
          <div className="flex gap-2 bg-muted rounded-xl p-1">
            <button
              type="button"
              data-ocid="access_gate.tab"
              onClick={() => setTab("pin")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                tab === "pin"
                  ? "bg-primary text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 inline mr-1.5" />
              Enter PIN
            </button>
            <button
              type="button"
              data-ocid="access_gate.tab"
              onClick={() => setTab("login")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                tab === "login"
                  ? "bg-primary text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LogIn className="w-3.5 h-3.5 inline mr-1.5" />
              Login
            </button>
          </div>

          {tab === "pin" && (
            <div className="space-y-3">
              <div>
                <Label
                  htmlFor="pin-input"
                  className="text-sm font-semibold mb-1.5 block"
                >
                  4-digit PIN
                </Label>
                <Input
                  id="pin-input"
                  data-ocid="access_gate.input"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="••••"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                    setPinError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                  className={`text-center text-2xl tracking-[0.5em] border-2 rounded-xl h-12 ${
                    pinError ? "border-destructive" : "border-border"
                  }`}
                />
                {pinError && (
                  <p
                    data-ocid="access_gate.error_state"
                    className="text-xs text-destructive mt-1 font-medium"
                  >
                    Incorrect PIN. Try again.
                  </p>
                )}
              </div>
              <Button
                data-ocid="access_gate.submit_button"
                onClick={handlePinSubmit}
                disabled={pin.length < 4}
                className="w-full bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
              >
                Unlock Editing
              </Button>
            </div>
          )}

          {tab === "login" && (
            <div className="space-y-3">
              {isLoggedIn ? (
                <p className="text-sm text-center text-muted-foreground py-4">
                  You&apos;re logged in but don&apos;t have admin access yet.
                  Contact the administrator.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Login with Internet Identity to access the full admin panel.
                  </p>
                  <Button
                    data-ocid="access_gate.primary_button"
                    onClick={handleLogin}
                    className="w-full bg-foreground text-background font-bold rounded-xl border-2 border-foreground hover:bg-foreground/90"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Login with Internet Identity
                  </Button>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            data-ocid="access_gate.cancel_button"
            onClick={closeGate}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            Cancel
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
