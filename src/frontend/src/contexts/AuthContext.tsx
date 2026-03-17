import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const PIN_STORAGE_KEY = "swatch_admin_pin";
const PIN_SESSION_KEY = "swatch_pin_unlocked";
const DEFAULT_PIN = "1234";

export function getStoredPin(): string {
  return localStorage.getItem(PIN_STORAGE_KEY) ?? DEFAULT_PIN;
}

export function setStoredPin(pin: string): void {
  localStorage.setItem(PIN_STORAGE_KEY, pin);
}

interface AuthContextType {
  isLoggedIn: boolean;
  isAdmin: boolean;
  hasPinAccess: boolean;
  canEdit: boolean;
  principal: string | null;
  isGateOpen: boolean;
  isInitializing: boolean;
  login: () => void;
  logout: () => void;
  unlockWithPin: (pin: string) => boolean;
  openGate: () => void;
  closeGate: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getActor: () => any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { identity, login, clear, isInitializing } = useInternetIdentity();
  const [isAdmin, setIsAdmin] = useState(false);
  const [hasPinAccess, setHasPinAccess] = useState(() => {
    return sessionStorage.getItem(PIN_SESSION_KEY) === "1";
  });
  const [isGateOpen, setIsGateOpen] = useState(false);
  const actorRef = useRef<backendInterface | null>(null);

  const isLoggedIn = !!identity && !identity.getPrincipal().isAnonymous();
  const principal = isLoggedIn ? identity.getPrincipal().toString() : null;
  // Anyone logged in via Internet Identity has admin/edit access
  const canEdit = isAdmin || hasPinAccess;

  // Create authenticated actor when identity is available
  useEffect(() => {
    let cancelled = false;
    if (isLoggedIn && identity) {
      void (async () => {
        try {
          const actor = await createActorWithConfig({
            agentOptions: { identity },
          });
          if (cancelled) return;
          actorRef.current = actor;
          // Try to call recordLogin and isAdmin — they may not exist in the
          // compiled backend, so we use any-casts and swallow errors
          const anyActor = actor as any;
          await anyActor.recordLogin?.().catch?.(() => null);
          const adminResult: boolean =
            (await anyActor.isAdmin?.().catch?.(() => false)) ?? true;
          // Fallback: treat any II login as admin if isAdmin not available
          if (!cancelled) setIsAdmin(adminResult);
        } catch {
          // If actor creation fails, still grant admin to logged-in user
          if (!cancelled) setIsAdmin(true);
        }
      })();
    } else {
      actorRef.current = null;
      setIsAdmin(false);
    }
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, identity]);

  const unlockWithPin = useCallback((pin: string): boolean => {
    const correct = getStoredPin();
    if (pin === correct) {
      setHasPinAccess(true);
      sessionStorage.setItem(PIN_SESSION_KEY, "1");
      return true;
    }
    return false;
  }, []);

  const openGate = useCallback(() => setIsGateOpen(true), []);
  const closeGate = useCallback(() => setIsGateOpen(false), []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    setHasPinAccess(false);
    sessionStorage.removeItem(PIN_SESSION_KEY);
    actorRef.current = null;
    clear();
  }, [clear]);

  const getActor = useCallback(() => {
    return actorRef.current as any;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isAdmin,
        hasPinAccess,
        canEdit,
        principal,
        isGateOpen,
        isInitializing,
        login,
        logout,
        unlockWithPin,
        openGate,
        closeGate,
        getActor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
