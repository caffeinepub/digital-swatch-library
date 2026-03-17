import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  RefreshCw,
  ShieldOff,
  UserCheck,
  UserX,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import { getStoredPin, setStoredPin, useAuth } from "../contexts/AuthContext";

interface UserRecord {
  principal: { toString: () => string };
  firstLoginTime: bigint;
  lastLoginTime: bigint;
  loginCount: bigint;
  isBlocked: boolean;
}

interface AdminPanelProps {
  navigate: (v: View) => void;
}

function abbreviate(p: { toString: () => string } | string): string {
  const s = typeof p === "string" ? p : p.toString();
  if (s.length <= 12) return s;
  return `${s.slice(0, 6)}\u2026${s.slice(-4)}`;
}

function formatTime(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPanel({ navigate }: AdminPanelProps) {
  const { getActor, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPin, setNewPin] = useState("");
  const [currentPin, setCurrentPin] = useState(getStoredPin());
  const [savingPin, setSavingPin] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const actor = getActor();
      if (!actor) throw new Error("Not authenticated");
      const history: UserRecord[] = await actor.getLoginHistory();
      setUsers(history);
    } catch {
      // User list may not be available depending on backend version
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [getActor]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  async function handleBlock(principal: { toString: () => string }) {
    try {
      const actor = getActor();
      if (!actor) return;
      await actor.blockUser(principal);
      toast.success("User blocked");
      void fetchUsers();
    } catch {
      toast.error("Failed to block user");
    }
  }

  async function handleUnblock(principal: { toString: () => string }) {
    try {
      const actor = getActor();
      if (!actor) return;
      await actor.unblockUser(principal);
      toast.success("User unblocked");
      void fetchUsers();
    } catch {
      toast.error("Failed to unblock user");
    }
  }

  function handleSavePin() {
    if (newPin.length < 4) {
      toast.error("PIN must be at least 4 characters");
      return;
    }
    setSavingPin(true);
    setStoredPin(newPin);
    setCurrentPin(newPin);
    setNewPin("");
    setSavingPin(false);
    toast.success("PIN updated successfully");
  }

  if (!isAdmin) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShieldOff className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="font-display text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">Admin access required.</p>
        <Button
          onClick={() => navigate({ page: "dashboard" })}
          className="mt-6 bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          data-ocid="admin.secondary_button"
          variant="outline"
          size="sm"
          onClick={() => navigate({ page: "dashboard" })}
          className="border-2 border-foreground rounded-xl font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">
            Manage users and settings
          </p>
        </div>
        <Button
          data-ocid="admin.secondary_button"
          variant="outline"
          size="sm"
          onClick={() => void fetchUsers()}
          className="ml-auto border-2 border-border rounded-xl"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users table */}
        <div className="lg:col-span-2 bg-white border-2 border-border rounded-2xl overflow-hidden">
          <div className="bg-primary px-5 py-4 border-b-2 border-foreground">
            <h2 className="font-display font-bold text-lg">User Activity</h2>
          </div>
          {loading ? (
            <div
              data-ocid="admin.loading_state"
              className="flex items-center justify-center py-16"
            >
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div
              data-ocid="admin.empty_state"
              className="py-16 text-center text-muted-foreground"
            >
              No users recorded yet.
            </div>
          ) : (
            <Table data-ocid="admin.table">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Principal
                  </TableHead>
                  <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider">
                    First Login
                  </TableHead>
                  <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Last Login
                  </TableHead>
                  <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Logins
                  </TableHead>
                  <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Status
                  </TableHead>
                  <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, idx) => (
                  <TableRow
                    key={user.principal.toString()}
                    data-ocid={`admin.row.${idx + 1}`}
                  >
                    <TableCell className="font-mono text-xs">
                      {abbreviate(user.principal)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTime(user.firstLoginTime)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTime(user.lastLoginTime)}
                    </TableCell>
                    <TableCell className="text-xs font-bold">
                      {user.loginCount.toString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-xs font-bold rounded-full ${
                          user.isBlocked
                            ? "bg-destructive/10 text-destructive"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {user.isBlocked ? "Blocked" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Button
                          data-ocid={`admin.secondary_button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={() => void handleUnblock(user.principal)}
                          className="border border-green-300 text-green-700 hover:bg-green-50 rounded-lg text-xs h-7"
                        >
                          <UserCheck className="w-3 h-3 mr-1" />
                          Unblock
                        </Button>
                      ) : (
                        <Button
                          data-ocid={`admin.delete_button.${idx + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={() => void handleBlock(user.principal)}
                          className="border border-destructive/30 text-destructive hover:bg-destructive/5 rounded-lg text-xs h-7"
                        >
                          <UserX className="w-3 h-3 mr-1" />
                          Block
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* PIN management */}
        <div className="space-y-4">
          <div className="bg-white border-2 border-border rounded-2xl overflow-hidden">
            <div className="bg-primary px-5 py-4 border-b-2 border-foreground">
              <h2 className="font-display font-bold text-lg flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Edit PIN
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Current PIN
                </Label>
                <p className="text-2xl font-mono tracking-[0.5em] mt-1">
                  {"\u2022".repeat(currentPin.length)}
                </p>
              </div>
              <div>
                <Label
                  htmlFor="new-pin"
                  className="text-sm font-semibold mb-1.5 block"
                >
                  New PIN
                </Label>
                <Input
                  id="new-pin"
                  data-ocid="admin.input"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter new PIN"
                  value={newPin}
                  onChange={(e) =>
                    setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  className="border-2 border-border rounded-xl"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum 4 digits
                </p>
              </div>
              <Button
                data-ocid="admin.save_button"
                onClick={handleSavePin}
                disabled={newPin.length < 4 || savingPin}
                className="w-full bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:bg-primary/90"
              >
                {savingPin ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4 mr-2" />
                )}
                Save PIN
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 border border-border rounded-2xl p-4 text-xs text-muted-foreground space-y-1">
            <p className="font-bold text-foreground">Access Levels</p>
            <p>
              \ud83d\udd10 <strong>PIN</strong> \u2014 Session-only editing
              access
            </p>
            <p>
              \ud83d\udc51 <strong>Admin</strong> \u2014 Full access via
              Internet Identity login
            </p>
            <p>
              \ud83c\udf10 <strong>Public</strong> \u2014 View-only access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
