"use client";

import CompanyDetails, { CompanyDetailsData } from "@/components/CompanyDetails";

interface CompanyDetailsClientProps {
  initialData: CompanyDetailsData | null;
}

export default function CompanyDetailsClient({
  initialData,
}: CompanyDetailsClientProps) {
  if (!initialData) {
    return (
      <div className="w-full min-h-screen bg-[#0F0F0F] overscroll-none">
        <div className="flex min-h-[100vh] items-center justify-center text-gray-400">
          <p className="text-red-500">Failed to load company details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overscroll-none bg-[#0F0F0F]">
      <CompanyDetails defaultValues={initialData} />
    </div>
  );
}
