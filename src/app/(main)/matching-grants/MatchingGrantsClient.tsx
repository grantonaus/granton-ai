"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Sparkles } from "lucide-react";
import GrantMatchCard from "@/components/GrantMatchCard";
import type { MatchingGrantsData, MatchedGrant } from "@/app/actions/matching-grants";
import { useCurrentUser } from "@/hooks/user";

interface MatchingGrantsClientProps {
  initialData: MatchingGrantsData;
}

export default function MatchingGrantsClient({
  initialData,
}: MatchingGrantsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const { session } = useCurrentUser();

  const isSubscriptionRequired = initialData.error === "Subscription required";

  const handleUpgrade = async () => {
    if (!session?.user) {
      sessionStorage.setItem("pendingPaymentLink", "/api/stripe/checkout");
      sessionStorage.setItem("pendingIsAnnual", "false");
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAnnual: false }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to start checkout. Please try again.";
        try {
          const error = await response.json();
          errorMessage = error.details || error.error || errorMessage;
        } catch (e) {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
        alert(`Error: ${errorMessage}`);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        alert("Failed to get checkout URL. Please try again.");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Normalize grants with fallbacks
  const normalizedGrants = useMemo(
    () =>
      (initialData.grants ?? []).map((g: any) => ({
        ...g,
        matchScore: typeof g.matchScore === "number" ? g.matchScore : 0,
        matchReasons: Array.isArray(g.matchReasons) ? g.matchReasons : [],
      })),
    [initialData.grants]
  );

  // Filter by title/agency/description and exclude weak matches
  const filteredGrants = useMemo(
    () =>
      normalizedGrants
        .filter((grant) => {
          // Exclude weak matches
          if (
            grant.matchQuality === "Weak match" ||
            grant.matchQualityColor === "gray"
          ) {
            return false;
          }
          return true;
        })
        .filter((grant) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            grant.title.toLowerCase().includes(q) ||
            grant.agency.toLowerCase().includes(q) ||
            grant.shortDescription.toLowerCase().includes(q)
          );
        }),
    [normalizedGrants, searchQuery]
  );

  return (
    <div className="w-full min-h-full bg-[#0F0F0F] overscroll-none mt-0">
      {/* Sticky search bar - only show if not subscription required */}
      {!isSubscriptionRequired && (
        <div className="sticky top-0 z-10 w-full pt-0 pb-3 lg:py-3 px-5 bg-[#0d0d0d] overscroll-none">
          <div className="relative flex items-center">
            <Search
              strokeWidth={2}
              className="absolute right-5 text-[#3A3A3A] size-5"
            />
            <Input
              className="w-full"
              placeholder="Search matched grants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="w-full px-5 py-2 lg:py-4">
        {/* Subscription required message */}
        {isSubscriptionRequired && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-6">
            <div className="flex flex-col items-center space-y-4 max-w-md text-center">
              <div className="w-16 h-16 rounded-full bg-[#143735] flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#77F7CF]" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Unlock AI-Powered Grant Matching</h2>
                <p className="text-muted-foreground">
                  {initialData.message || "You need an active subscription to view matching grants."}
                </p>
              </div>
              <Button
                onClick={handleUpgrade}
                disabled={loading}
                className="w-full bg-[#77F7CF] hover:bg-[#77F7CF]/80 text-black font-semibold h-11 rounded-lg"
              >
                {loading ? "Loading..." : "Upgrade"}
              </Button>
            </div>
          </div>
        )}

        {/* Info message */}
        {!isSubscriptionRequired && initialData.message && (
          <div className="mb-4 p-3 bg-[#24231F] hover:bg-[#24231F]/90 text-[#F8EFC1] rounded-md text-sm">
            {initialData.message}
          </div>
        )}

        {/* Error message (non-subscription errors) */}
        {!isSubscriptionRequired && initialData.error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400">
            {initialData.error}
          </div>
        )}

        {/* Results - only show if subscription is not required */}
        {!isSubscriptionRequired && (
          <div className="flex flex-col">
            {initialData.error && initialData.error !== "Subscription required" ? (
              <div className="flex-grow flex flex-col items-center justify-center space-y-2 min-h-[70vh]">
                <p className="text-muted-foreground text-base">{initialData.error}</p>
              </div>
            ) : filteredGrants.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center space-y-2 min-h-[70vh]">
                <p className="text-muted-foreground text-base">
                  {searchQuery
                    ? "No grants match your search."
                    : "No matching grants found for your company."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-5 pb-8">
                {/* Title showing match count */}
                <h2 className="text-lg md:text-xl font-bold text-white mt-2">
                  {filteredGrants.length}{" "}
                  {filteredGrants.length === 1 ? "Match" : "Matches"} found for you
                </h2>
                {filteredGrants.map((grant) => (
                  <GrantMatchCard
                    key={grant.id}
                    grant={grant}
                    matchScore={grant.matchScore}
                    matchQuality={grant.matchQuality}
                    matchQualityColor={grant.matchQualityColor}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

