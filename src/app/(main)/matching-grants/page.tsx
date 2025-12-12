import { Suspense } from "react";
import { getMatchingGrants } from "@/app/actions/matching-grants";
import MatchingGrantsClient from "./MatchingGrantsClient";
import Spinner from "@/components/Spinner";

export const dynamic = 'force-dynamic';

async function MatchingGrantsContent() {
  const data = await getMatchingGrants();

  return <MatchingGrantsClient initialData={data} />;
}

export default function MatchingGrantsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#0F0F0F] overscroll-none mt-0 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-4">
              <Spinner />
              <p className="text-muted-foreground text-sm">
                Analyzing your profile & finding the best matches…
              </p>
            </div>
        </div>
      }
    >
      <MatchingGrantsContent />
    </Suspense>
  );
}

