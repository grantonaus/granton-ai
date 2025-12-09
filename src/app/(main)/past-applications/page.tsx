import { Suspense } from "react";
import { getPastApplications } from "@/app/actions/past-applications";
import PastApplicationsClient from "./PastApplicationsClient";
import Spinner from "@/components/Spinner";

async function PastApplicationsContent() {
  const applications = await getPastApplications();

  return <PastApplicationsClient initialApplications={applications} />;
}

export default function PastApplicationsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#0F0F0F] overscroll-none mt-0 flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center">
            <Spinner />
          </div>
        </div>
      }
    >
      <PastApplicationsContent />
    </Suspense>
  );
}
