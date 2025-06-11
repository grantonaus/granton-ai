"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { ContentLayout } from "@/components/ContentLayout";
import PersonalDetails, { PersonalDetailsData } from "@/components/PersonalDetails";
import Spinner from "@/components/Spinner";
import { useCurrentUser } from "@/hooks/user";

const fetcher = (url: string) =>
  fetch(url).then(async (res) => {
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.error || "Failed to fetch profile data");
    }
    return res.json();
  });

export default function PersonalDetailsPage() {
  const { session } = useCurrentUser();
  const [isSaving, setIsSaving] = useState(false);

  const { data, error, mutate } = useSWR<PersonalDetailsData>("/api/profile", fetcher);

  const handleSave = async (formData: PersonalDetailsData) => {
    if (!session?.user?.id) {
      toast.error("You must be logged in");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/profile-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to save. Check your fields.");
      }

      toast.success("Personal details saved successfully!");
      await mutate(); 
    } catch (err: any) {
      console.error("Error saving personal details:", err);
      toast.error(err?.message || "Unexpected error");
    } finally {
      setIsSaving(false);
    }
  };

  if (!data && !error) {
    return (
      <ContentLayout title="Personal Details">
        <div className="h-full flex items-center justify-center text-gray-400">
          <Spinner />
        </div>
      </ContentLayout>
    );
  }

  if (error) {
    return (
      <ContentLayout title="Personal Details">
        <div className="flex-1 flex items-center justify-center text-red-400">
          Error loading personal details: {error.message}
        </div>
      </ContentLayout>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <ContentLayout title="Personal Details">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <PersonalDetails
            defaultValues={{
              primary_first_name: data.primary_first_name ?? "",
              primary_last_name: data.primary_last_name ?? "",
              contact_salutation: data.contact_salutation ?? "",
              contact_job_title: data.contact_job_title ?? "",
              contact_first_name:
                data.contact_first_name || data.primary_first_name || "",
              contact_last_name:
                data.contact_last_name || data.primary_last_name || "",
              contact_email: data.contact_email || data.contact_email || "",
              contact_mobile: data.contact_mobile ?? "",
            }}
            onSave={handleSave}
          />
        </div>
      </div>
    </ContentLayout>
  );
}
