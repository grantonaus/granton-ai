// File: /app/(your‐folder)/PastApplicationsPage.tsx
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, PackageOpen } from "lucide-react";
import { ContentLayout } from "@/components/ContentLayout";
import ApplicationCard from "@/components/ApplicationCard";
import Spinner from "@/components/Spinner";

interface PastApplication {
  id: string;
  title: string;
  fileUrl: string;
  createdAt: string; // formatted as "DD.MM.YYYY"
}

const PastApplicationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [applications, setApplications] = useState<PastApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApplications() {
      try {
        const response = await fetch("/api/applications");
        const json = await response.json();
        if (response.ok && Array.isArray(json.applications)) {
          setApplications(json.applications);
        } else {
          console.error("Failed to fetch applications:", json.error || json);
        }
      } catch (err) {
        console.error("Error fetching applications:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchApplications();
  }, []);

  const filteredApplications = applications.filter((app) =>
    app.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ContentLayout title="Past Applications">
      {/* Outer wrapper: max‐width + centering */}
      <div className="w-full max-w-[1000px] px-5 mx-auto mt-2 md:mt-4">
        {/* Sticky search bar */}
        <div className="sticky top-0 z-10 w-full py-3 bg-background">
          <div className="relative flex items-center w-full">
            <Search
              strokeWidth={2}
              className="absolute right-5 size-5 text-[#3A3A3A]"
            />
            <Input
              className="w-full"
              placeholder="Search applications by title"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          {loading ? (
            // Loading spinner, centered both ways
            <div className="flex flex-col items-center justify-center">
              <Spinner />
            </div>
          ) : filteredApplications.length === 0 ? (
            // No results — centered both ways, with a bit of space for the icon + text
            <div className="flex flex-col items-center justify-center space-y-4">
              <p className="text-muted-foreground text-base">
                {applications.length === 0
                  ? "You have no applications yet."
                  : "No applications found."}
              </p>
            </div>
          ) : (
            // If we do have results, show the grid
            <div className="w-full mt-4 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 md:gap-5">
              {filteredApplications.map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  );
};

export default PastApplicationsPage;
