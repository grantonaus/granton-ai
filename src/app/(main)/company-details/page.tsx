import { Suspense } from "react";
import { getCompanyDetails } from "@/app/actions/company-details";
import CompanyDetailsClient from "./CompanyDetailsClient";
import Spinner from "@/components/Spinner";

async function CompanyDetailsContent() {
  const data = await getCompanyDetails();

  return <CompanyDetailsClient initialData={data} />;
}

export default function CompanyDetailsPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full min-h-screen bg-[#0F0F0F] overscroll-none">
          <div className="flex min-h-[100vh] items-center justify-center text-gray-400">
            <div role="status" aria-label="Loading company details">
              <Spinner />
            </div>
          </div>
        </div>
      }
    >
      <CompanyDetailsContent />
    </Suspense>
  );
}
