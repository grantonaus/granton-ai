"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import GrantDatabaseCard from "@/components/GrantDatabaseCard";
import { cn } from "@/lib/utils";
import type {
  GrantDatabaseData,
  Grant,
} from "@/app/actions/grant-database";
import { getSession } from "next-auth/react";
import { useCurrentUser } from "@/hooks/user";
import { toast } from "sonner";

interface GrantDatabaseClientProps {
  initialData: GrantDatabaseData;
}

export default function GrantDatabaseClient({
  initialData,
}: GrantDatabaseClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session } = useCurrentUser();

  const [tab, setTab] = useState("available");
  const [grants, setGrants] = useState<Grant[]>(initialData.grants);
  const [saved, setSaved] = useState<string[]>(initialData.savedGrantIds);
  const [newCount, setNewCount] = useState(initialData.newCount);
  const [pendingSaves, setPendingSaves] = useState<Set<string>>(new Set());
  const saveAbortControllers = useRef<Map<string, AbortController>>(new Map());
  const [isNavigating, setIsNavigating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Handle subscription success
  useEffect(() => {
    const subscriptionSuccess = searchParams.get("subscription");
    if (subscriptionSuccess === "success") {
      setShowSuccessMessage(true);
      toast.success("Payment successful! Activating your subscription...", {
        duration: 5000,
      });
      
      // Remove query param from URL
      router.replace("/grant-database", { scroll: false });
      
      // Poll for subscription status update (webhook might be delayed)
      let pollCount = 0;
      const maxPolls = 15; // 30 seconds total (15 * 2 seconds)
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        try {
          // Refresh session to get updated subscription status
          const updatedSession = await getSession();
          
          // Check subscription status via API
          const response = await fetch("/api/stripe/subscription");
          if (response.ok) {
            const data = await response.json();
            if (data.hasActiveSubscription || updatedSession?.user?.hasPaid) {
              clearInterval(pollInterval);
              setShowSuccessMessage(false);
              toast.success("Subscription activated! Welcome to Pro!", {
                duration: 4000,
              });
              // Force page refresh to update UI
              setTimeout(() => {
                window.location.reload();
              }, 1000);
              return;
            }
          }
          
          // If we've polled max times, stop and refresh
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setShowSuccessMessage(false);
            toast.info("Subscription is being processed. Please refresh the page in a moment.", {
              duration: 5000,
            });
            router.refresh();
          }
        } catch (error) {
          console.error("Error checking subscription status:", error);
          if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setShowSuccessMessage(false);
          }
        }
      }, 2000); // Poll every 2 seconds

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [searchParams, router]);

  // Prefetch all grant pages on mount for instant navigation
  useEffect(() => {
    if (grants.length > 0) {
      grants.forEach((grant) => {
        router.prefetch(`/grants/${grant.id}`);
      });
    }
  }, [grants, router]);

  // Filter logic
  const filtered = useMemo(
    () =>
      (tab === "available"
        ? grants
        : grants.filter((g) => saved.includes(g.id)))
        .filter(
          (g) =>
            g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.agency.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .filter((g) => (stateFilter === "all" ? true : g.state === stateFilter))
        .filter((g) =>
          statusFilter === "all" ? true : g.status === statusFilter
        ),
    [grants, saved, tab, searchQuery, stateFilter, statusFilter]
  );

  // Save / Unsave (Optimistic UI)
  const toggleSave = async (id: string, save: boolean) => {
    const existingController = saveAbortControllers.current.get(id);
    if (existingController) {
      existingController.abort();
    }

    const abortController = new AbortController();
    saveAbortControllers.current.set(id, abortController);

    const previousSaved = [...saved];
    setSaved((prev) => {
      if (save) {
        return prev.includes(id) ? prev : [...prev, id];
      } else {
        return prev.filter((x) => x !== id);
      }
    });

    setPendingSaves((prev) => new Set(prev).add(id));

    fetch(save ? "/api/grants/save" : "/api/grants/unsave", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grantId: id }),
      signal: abortController.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to update save status");
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Failed to toggle save:", error);
          setSaved(previousSaved);
        }
      })
      .finally(() => {
        setPendingSaves((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        saveAbortControllers.current.delete(id);
      });
  };

  // Handle navigation
  const handleCardClick = (grantId: string) => {
    if (isNavigating) return;

    setIsNavigating(true);

    setGrants((prev) => {
      const clickedGrant = prev.find((g) => g.id === grantId);
      if (clickedGrant?.isNew) {
        setNewCount((count) => Math.max(0, count - 1));
        return prev.map((g) =>
          g.id === grantId ? { ...g, isNew: false } : g
        );
      }
      return prev;
    });

    setTimeout(() => setIsNavigating(false), 1000);
  };

  return (
    <div className="w-full min-h-full bg-[#0F0F0F] overscroll-none mt-0">
      {/* Success Message */}
      {/* {showSuccessMessage && (
        <div className="sticky top-0 z-40 bg-[#0d0d0d] px-5 py-4">
          <div className="w-full mx-auto max-w-[1200px] bg-[#143735] text-[#77F7CF] rounded-md px-6 py-3 flex items-center justify-between transition-colors duration-150 ease-in-out">
            <div className="flex items-center gap-3 w-full">
              <span className="text-sm font-bold">
                Payment successful! Your subscription is being activated. This may take a few seconds...
              </span>
            </div>
            <button
              onClick={() => setShowSuccessMessage(false)}
              className="text-[#77F7CF]/60 hover:text-[#77F7CF] transition-colors ml-4 flex-shrink-0"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )} */}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        {/* Tabs + Filters */}
        <div className="sticky top-0 z-30 bg-[#0d0d0d] pt-0 pb-4 lg:pt-4 px-5 overscroll-none">
          <TabsList className="w-full border mb-4">
            <TabsTrigger value="available" className="flex-1 relative">
              Available Grants
              {newCount > 0 && (
                <span
                  className={cn(
                    "ml-2 flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold",
                    tab === "available"
                      ? "bg-[#68FCF2] text-[#186161]"
                      : "bg-white/10 text-white/60"
                  )}
                >
                  {newCount} New
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1">
              Saved ({saved.length})
            </TabsTrigger>
          </TabsList>

          {/* Search + Filters */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground size-5" />
                <Input
                  placeholder="Search grants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Filters */}
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  <SelectItem value="NSW">NSW</SelectItem>
                  <SelectItem value="VIC">VIC</SelectItem>
                  <SelectItem value="QLD">QLD</SelectItem>
                  <SelectItem value="WA">WA</SelectItem>
                  <SelectItem value="National">National</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results */}
        <TabsContent value="available" className="mt-1 px-5 pt-2">
          {filtered.length === 0 ? (
            <p className="text-muted-foreground">No grants found.</p>
          ) : (
            <div className="flex flex-col gap-5 pb-8">
              {filtered.map((grant) => (
                <GrantDatabaseCard
                  key={grant.id}
                  grant={grant}
                  isSaved={saved.includes(grant.id)}
                  isNew={grant.isNew}
                  isPending={pendingSaves.has(grant.id)}
                  isNavigating={isNavigating}
                  onToggleSave={(save: boolean) => toggleSave(grant.id, save)}
                  onCardClick={() => handleCardClick(grant.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved" className="mt-4 px-5 pt-2 lg:pt-4">
          {saved.length === 0 ? (
            <p className="text-muted-foreground">You haven't saved anything yet.</p>
          ) : (
            <div className="flex flex-col gap-3 pb-8">
              {grants
                .filter((g) => saved.includes(g.id))
                .map((grant) => (
                  <GrantDatabaseCard
                    key={grant.id}
                    grant={grant}
                    isSaved={true}
                    isNew={grant.isNew}
                    isPending={pendingSaves.has(grant.id)}
                    isNavigating={isNavigating}
                    onToggleSave={(save) => toggleSave(grant.id, save)}
                    onCardClick={() => handleCardClick(grant.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

