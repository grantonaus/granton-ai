import { Suspense } from "react";
import { getGrantDatabase } from "@/app/actions/grant-database";
import GrantDatabaseClient from "./GrantDatabaseClient";
import Spinner from "@/components/Spinner";

export const dynamic = 'force-dynamic';

async function GrantDatabaseContent() {
  const data = await getGrantDatabase();

  return <GrantDatabaseClient initialData={data} />;
}

export default function GrantDatabasePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#0F0F0F] overscroll-none mt-0 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Spinner />
          </div>
            </div>
      }
    >
      <GrantDatabaseContent />
    </Suspense>
  );
}
