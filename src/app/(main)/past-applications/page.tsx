// File: /app/(your‐folder)/PastApplicationsPage.tsx
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
      <div className="w-full max-w-[1000px] px-5 mx-auto mt-2 md:mt-4">
        {/* Sticky search bar */}
        <div className="sticky top-0 z-10 w-full py-3 bg-background">
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
        <div className="mt-4 min-h-[70vh] flex flex-col">
          {loading ? (
            <div className="flex-grow flex items-center justify-center">
              <Spinner />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center space-y-2">
              <p className="text-muted-foreground text-base">
                {applications.length === 0
                  ? "You have no applications yet."
                  : "No applications found."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 md:gap-5">
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
