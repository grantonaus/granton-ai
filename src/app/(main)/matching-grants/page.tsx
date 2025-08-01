"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ContentLayout } from "@/components/ContentLayout";
import Spinner from "@/components/Spinner";
import GrantCard from "@/components/GrantCard";

type GrantSuggestion = {
  id: string;
  name: string;
  company: string;
  pdfUrl?: string;
  date?: string;
};

const MatchingGrantsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [grants, setGrants] = useState<GrantSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   async function fetchGrants() {
  //     try {
  //       const response = await fetch("/api/grants");
  //       const json = await response.json();
  //       if (response.ok && Array.isArray(json)) {
  //         setGrants(json);
  //       } else {
  //         console.error("Failed to fetch grants:", json.error || json);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching grants:", err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  //   fetchGrants();
  // }, []);

  const [subscribed, setSubscribed] = useState(true); // assume true initially

  useEffect(() => {
    async function fetchGrants() {
      try {
        const response = await fetch("/api/grants");
        const json = await response.json();

        if (response.ok) {
          setSubscribed(json.subscribed ?? true);
          setGrants(json.grants ?? []);
        } else {
          console.error("Failed to fetch grants:", json.error || json);
        }
      } catch (err) {
        console.error("Error fetching grants:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchGrants();
  }, []);


  return (
    <ContentLayout title="Matching Grants">
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
              placeholder="Search grants by name"
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
            // ) : grants.length === 0 ? (
            //   <div className="flex-grow flex flex-col items-center justify-center space-y-2">
            //     <p className="text-muted-foreground text-base">
            //       {grants.length === 0
            //         ? "No matching grants found for your company."
            //         : "No grants match your search."}
            //     </p>
            //   </div>
            // ) : (
            // <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 md:gap-5">
            //   {grants.map((grant) => (
            //     <GrantCard key={grant.id} grant={grant} />
            //   ))}
            // </div>
            // )}

          ) : subscribed === false ? (
            <p className="text-muted-foreground text-base">
              You need a subscription to view matching grants.
            </p>
          ) : grants.length === 0 ? (
            <p className="text-muted-foreground text-base">
              No matching grants found for your company.
            </p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 md:gap-5">
              {grants.map((grant) => (
                <GrantCard key={grant.id} grant={grant} />
              ))}
            </div>
          )}
        </div>
      </div>
    </ContentLayout>
  );
};

export default MatchingGrantsPage;
