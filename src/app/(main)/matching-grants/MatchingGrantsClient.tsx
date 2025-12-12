"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import GrantMatchCard from "@/components/GrantMatchCard";
import UpgradePrompt from "@/components/UpgradePrompt";
import type { MatchingGrantsData, MatchedGrant } from "@/app/actions/matching-grants";

interface MatchingGrantsClientProps {
  initialData: MatchingGrantsData;
}

export default function MatchingGrantsClient({
  initialData,
}: MatchingGrantsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Check if subscription is required
  const isSubscriptionRequired = initialData.error === "Subscription required";

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

  // If subscription required, show upgrade prompt
  if (isSubscriptionRequired) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#0F0F0F] overscroll-none mt-0">
        <UpgradePrompt
          title="Unlock AI-Powered Grant Matching"
          description="Upgrade to Pro to access intelligent grant matching tailored to your business profile and funding goals."
        />
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-[#0F0F0F] overscroll-none mt-0">
      {/* Sticky search bar */}
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

      <div className="w-full px-5 py-2 lg:py-4">
        {/* Info message */}
        {initialData.message && (
          <div className="mb-4 p-3 bg-[#24231F] hover:bg-[#24231F]/90 text-[#F8EFC1] rounded-md text-sm">
            {initialData.message}
          </div>
        )}

        {/* Error message */}
        {initialData.error && initialData.error !== "Subscription required" && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md text-sm text-red-400">
            {initialData.error}
          </div>
        )}

        {/* Results */}
        <div className="flex flex-col">
          {filteredGrants.length === 0 ? (
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
      </div>
    </div>
  );
}
