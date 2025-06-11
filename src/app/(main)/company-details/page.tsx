"use client";

import { useState } from "react";
import useSWR from "swr";
import { ContentLayout } from "@/components/ContentLayout";
import { toast } from "sonner";
import CompanyDetails, { CompanyDetailsData } from "@/components/CompanyDetails";
import Spinner from "@/components/Spinner";
import { useCurrentUser } from "@/hooks/user";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error || "Failed to fetch company details");
    }
    return res.json();
  });

export default function CompanyDetailsPage() {
  const { session } = useCurrentUser();
  const [isSaving, setIsSaving] = useState(false);

  const { data, error, mutate } = useSWR<CompanyDetailsData>("/api/company", fetcher);

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
        throw new Error(payload.error || "Failed to save. Check your fields.");
      }

      toast.success("Company details saved successfully!");
      await mutate(); 
    } catch (err: any) {
      console.error("Error saving company data:", err);
      toast.error(err?.message || "Unexpected error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!data && !error) {
    return (
      <ContentLayout title="Company Details">
        <div className="flex h-full items-center justify-center text-gray-400">
          <div role="status">
            <Spinner />
          </div>
        </div>
      </ContentLayout>
    );
  }

  if (error) {
    return (
      <ContentLayout title="Company Details">
        <div className="flex h-full items-center justify-center">
          <p className="text-red-500">Error loading company details: {error.message}</p>
        </div>
      </ContentLayout>
    );
  }

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
