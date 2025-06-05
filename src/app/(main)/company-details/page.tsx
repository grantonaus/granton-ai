// pages/CompanyDetailsPage.tsx
"use client";

import { useState } from "react";
import useSWR from "swr";
import { ContentLayout } from "@/components/ContentLayout";
import { toast } from "sonner";
import CompanyDetails, { CompanyDetailsData } from "@/components/CompanyDetails";
import { useSession } from "next-auth/react";

// 1) Simple SWR fetcher:  
const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error || "Failed to fetch company details");
    }
    return res.json();
  });

export default function CompanyDetailsPage() {
  const { data: session, status } = useSession();
  const [isSaving, setIsSaving] = useState(false);

  // 2) Only fetch once session is authenticated
  const { data, error, mutate } = useSWR<CompanyDetailsData>(
    () => (status === "authenticated" ? "/api/company" : null),
    fetcher
  );

  console.log("data: ", data);

  // 3) Save handler: POST to /api/company-data
  const handleSave = async (formData: CompanyDetailsData) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in");
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch("/api/company-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          payload.error || "Failed to save. Check your fields."
        );
      }

      toast.success("Company details saved successfully!");
      // 4) Revalidate SWR so that the UI updates
      await mutate();
    } catch (err: any) {
      console.error("Error saving company data:", err);
      toast.error(err?.message || "Unexpected error");
    } finally {
      setIsSaving(false);
    }
  };

  // 5) Show a spinner while NextAuth is determining status
  if (status === "loading") {
    return (
      <ContentLayout title="Company Details">
        <div className="flex h-full items-center justify-center text-gray-400">
          <div role="status">
            <svg
              aria-hidden="true"
              className="w-6 h-6 text-[#1c1c1c] animate-spin fill-[#68FCF2]"
              viewBox="0 0 100 101"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                fill="currentColor"
              />
              <path
                d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                fill="currentFill"
              />
            </svg>
          </div>
        </div>
      </ContentLayout>
    );
  }


  // 8) If we have data, render the form
  return (
    <ContentLayout title="Company Details">
      <div className="flex flex-col h-full">
        <CompanyDetails
          defaultValues={data}
          onSave={handleSave}
        />
      </div>
    </ContentLayout>
  );
}
