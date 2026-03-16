import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Principal } from "@icp-sdk/core/principal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle,
  ChevronLeft,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { View } from "../App";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface UserRecord {
  principal: Principal;
  firstLoginTime: bigint;
  lastLoginTime: bigint;
  loginCount: bigint;
  isBlocked: boolean;
}

interface AdminPanelProps {
  navigate: (v: View) => void;
}

function formatDate(ns: bigint): string {
  const ms = Number(ns / BigInt(1_000_000));
  return new Date(ms).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function truncatePrincipal(p: Principal): string {
  const s = p.toString();
  if (s.length <= 16) return s;
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

export default function AdminPanel({ navigate }: AdminPanelProps) {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const myPrincipal = identity?.getPrincipal().toString();

  const {
    data: users,
    isLoading,
    isError,
  } = useQuery<UserRecord[]>({
    queryKey: ["loginHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getLoginHistory();
    },
    enabled: !!actor,
  });

  const handleBlock = async (principal: Principal, idx: number) => {
    if (!actor) return;
    const key = `block-${idx}`;
    setPendingAction(key);
    try {
      await (actor as any).blockUser(principal);
      await queryClient.invalidateQueries({ queryKey: ["loginHistory"] });
      toast.success("User blocked successfully");
    } catch {
      toast.error("Failed to block user");
    } finally {
      setPendingAction(null);
    }
  };

  const handleUnblock = async (principal: Principal, idx: number) => {
    if (!actor) return;
    const key = `unblock-${idx}`;
    setPendingAction(key);
    try {
      await (actor as any).unblockUser(principal);
      await queryClient.invalidateQueries({ queryKey: ["loginHistory"] });
      toast.success("User unblocked successfully");
    } catch {
      toast.error("Failed to unblock user");
    } finally {
      setPendingAction(null);
    }
  };

  const totalUsers = users?.length ?? 0;
  const blockedCount = users?.filter((u) => u.isBlocked).length ?? 0;
  const activeCount = totalUsers - blockedCount;

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="mb-8">
          <button
            type="button"
            data-ocid="admin.link"
            onClick={() => navigate({ page: "dashboard" })}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Library
          </button>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-foreground" />
                </div>
                <h1 className="font-display font-bold text-3xl tracking-tight text-foreground">
                  Admin Panel
                </h1>
              </div>
              <p className="text-muted-foreground text-sm ml-[52px]">
                Manage user access and monitor login activity
              </p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-primary border-2 border-foreground rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-foreground" />
              <span className="text-sm font-semibold text-foreground/70">
                Total Users
              </span>
            </div>
            <p className="font-display font-bold text-4xl text-foreground mt-2">
              {totalUsers}
            </p>
          </div>
          <div className="bg-white border-2 border-foreground rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-foreground/70">
                Active
              </span>
            </div>
            <p className="font-display font-bold text-4xl text-foreground mt-2">
              {activeCount}
            </p>
          </div>
          <div className="bg-white border-2 border-foreground rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <Ban className="w-5 h-5 text-red-600" />
              <span className="text-sm font-semibold text-foreground/70">
                Blocked
              </span>
            </div>
            <p className="font-display font-bold text-4xl text-foreground mt-2">
              {blockedCount}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="border-2 border-foreground rounded-2xl overflow-hidden bg-white">
          <div className="px-6 py-4 border-b-2 border-foreground bg-foreground">
            <h2 className="font-display font-bold text-lg text-primary">
              Login History
            </h2>
            <p className="text-xs text-primary/60 mt-0.5">
              All users who have accessed the library
            </p>
          </div>

          {isLoading && (
            <div data-ocid="admin.loading_state" className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          )}

          {isError && (
            <div
              data-ocid="admin.error_state"
              className="p-8 text-center text-sm text-red-600"
            >
              Failed to load login history. Make sure you have admin privileges.
            </div>
          )}

          {!isLoading && !isError && users && users.length === 0 && (
            <div
              data-ocid="admin.empty_state"
              className="p-12 text-center text-muted-foreground text-sm"
            >
              No login records yet.
            </div>
          )}

          {!isLoading && !isError && users && users.length > 0 && (
            <div className="overflow-x-auto">
              <Table data-ocid="admin.table">
                <TableHeader>
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">
                      Principal ID
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">
                      First Login
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">
                      Last Login
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">
                      Logins
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">
                      Status
                    </TableHead>
                    <TableHead className="font-semibold text-foreground text-xs uppercase tracking-wide">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, idx) => {
                    const principalStr = user.principal.toString();
                    const isMe = principalStr === myPrincipal;
                    const rowNum = idx + 1;
                    const blockKey = `block-${idx}`;
                    const unblockKey = `unblock-${idx}`;

                    return (
                      <TableRow
                        key={principalStr}
                        data-ocid={`admin.row.${rowNum}`}
                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <TableCell className="font-mono text-xs">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help border-b border-dashed border-foreground/30">
                                {truncatePrincipal(user.principal)}
                                {isMe && (
                                  <span className="ml-1.5 text-[10px] font-sans font-bold bg-primary text-foreground px-1.5 py-0.5 rounded">
                                    YOU
                                  </span>
                                )}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              data-ocid={`admin.tooltip.${rowNum}`}
                              className="font-mono text-xs max-w-[300px] break-all"
                            >
                              {principalStr}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.firstLoginTime)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(user.lastLoginTime)}
                        </TableCell>
                        <TableCell className="text-sm font-semibold">
                          {user.loginCount.toString()}
                        </TableCell>
                        <TableCell>
                          {user.isBlocked ? (
                            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs font-semibold">
                              Blocked
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs font-semibold">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {!isMe &&
                            (user.isBlocked ? (
                              <Button
                                data-ocid={`admin.unblock_button.${rowNum}`}
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUnblock(user.principal, idx)
                                }
                                disabled={pendingAction === unblockKey}
                                className="h-7 text-xs border-green-400 text-green-700 hover:bg-green-50 font-semibold gap-1.5"
                              >
                                <CheckCircle className="w-3 h-3" />
                                {pendingAction === unblockKey ? "…" : "Unblock"}
                              </Button>
                            ) : (
                              <Button
                                data-ocid={`admin.block_button.${rowNum}`}
                                size="sm"
                                variant="outline"
                                onClick={() => handleBlock(user.principal, idx)}
                                disabled={pendingAction === blockKey}
                                className="h-7 text-xs border-red-400 text-red-600 hover:bg-red-50 font-semibold gap-1.5"
                              >
                                <Ban className="w-3 h-3" />
                                {pendingAction === blockKey ? "…" : "Block"}
                              </Button>
                            ))}
                          {isMe && (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
