"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ApplicationCard from "@/components/ApplicationCard";
import type { PastApplication } from "@/app/actions/past-applications";

interface PastApplicationsClientProps {
  initialApplications: PastApplication[];
}

export default function PastApplicationsClient({
  initialApplications,
}: PastApplicationsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredApplications = useMemo(
    () =>
      initialApplications.filter((app) =>
        app.title.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [initialApplications, searchQuery]
  );

  return (
    <div className="w-full min-h-screen bg-[#0F0F0F] overscroll-none mt-0 flex flex-col">
      {/* Sticky search bar - full width */}
      <div className="sticky top-0 z-10 w-full pt-0 pb-3 lg:py-3 px-5 bg-[#0d0d0d] overscroll-none flex-shrink-0">
        <div className="relative flex items-center">
          <Search
            strokeWidth={2}
            className="absolute right-5 text-[#3A3A3A] size-5"
          />
          <Input
            className="w-full"
            placeholder="Search applications by title"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Results area */}
      <div className="w-full px-5 py-2 lg:py-4 flex-1 flex flex-col">
        {filteredApplications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <p className="text-muted-foreground text-base">
              {initialApplications.length === 0
                ? "You have no applications yet."
                : "No applications found."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 md:gap-5 pb-8">
            {filteredApplications.map((app) => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

