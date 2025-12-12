import { Suspense } from "react";
import { getPersonalDetails } from "@/app/actions/personal-details-fetch";
import PersonalDetailsClient from "./PersonalDetailsClient";
import Spinner from "@/components/Spinner";

export const dynamic = 'force-dynamic';

async function PersonalDetailsContent() {
  const data = await getPersonalDetails();

  return <PersonalDetailsClient initialData={data} />;
}

export default function PersonalDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#0F0F0F] overscroll-none">
          <div className="flex min-h-[100vh] items-center justify-center text-gray-400">
            <div role="status" aria-label="Loading personal details">
              <Spinner />
            </div>
          </div>
        </div>
      }
    >
      <PersonalDetailsContent />
    </Suspense>
  );
}
