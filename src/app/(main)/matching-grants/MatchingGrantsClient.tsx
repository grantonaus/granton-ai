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
      <div className="mt-0 flex min-h-0 w-full flex-1 flex-col items-center justify-center overscroll-none bg-[#0F0F0F]">
        <UpgradePrompt
          title="Unlock AI-Powered Grant Matching"
          description="Upgrade to Pro to access intelligent grant matching tailored to your business profile and funding goals."
        />
      </div>
    );
  }

  return (
    <div className="mt-0 flex h-full min-h-0 w-full flex-1 flex-col overscroll-none bg-[#0F0F0F]">
      <div className="z-10 w-full shrink-0 bg-[#0d0d0d] px-5 pb-3 pt-0 lg:py-3">
        <div className="relative flex items-center">
          <Search
            strokeWidth={2}
            className="absolute right-5 size-5 text-[#3A3A3A]"
          />
          <Input
            className="w-full"
            placeholder="Search matched grants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2 lg:py-4">
        {/* Info message */}
        {initialData.message && (
          <div
            className="
           cursor-pointer
            w-full
            mx-auto
            max-w-[1200px]
            bg-[#24231F]
            hover:bg-[#24231F]/90
            text-[#F8EFC1]
            rounded-md
            px-6
            py-3
            flex
            items-center
            justify-between
            transition-colors
            duration-150
            ease-in-out
          "
          >
            <div className="flex w-full space-x-2 items-center justify-center">

              <span className="text-sm font-bold">{initialData.message}</span>
            </div>

          </div>
        )}

        {/* Error message */}
        {initialData.error && initialData.error !== "Subscription required" && initialData.error !== "Company profile incomplete" && (
          <div
          className="
           cursor-pointer
            w-full
            mx-auto
            max-w-[1200px]
            bg-[#24231F]
            hover:bg-[#24231F]/90
            text-[#F8EFC1]
            rounded-md
            px-6
            py-3
            flex
            items-center
            justify-between
            transition-colors
            duration-150
            ease-in-out
          "
        >
          <div className="flex w-full space-x-2 items-center justify-center">

            <span className="text-sm font-bold">{initialData.error}</span>
          </div>

        </div>
        )}

        {/* Results */}
        <div className="flex flex-col">
          {filteredGrants.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center space-y-2 py-16">
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
