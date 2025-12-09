"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import PersonalDetails, { PersonalDetailsData } from "@/components/PersonalDetails";
import { useCurrentUser } from "@/hooks/user";

interface PersonalDetailsClientProps {
  initialData: PersonalDetailsData | null;
}

export default function PersonalDetailsClient({
  initialData,
}: PersonalDetailsClientProps) {
  const { session } = useCurrentUser();
  const router = useRouter();

  const handleSave = useCallback(
    async (formData: PersonalDetailsData) => {
      if (!session?.user?.id) {
        toast.error("You must be logged in");
        return;
      }

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
        router.refresh();
      } catch (err: any) {
        console.error("Error saving personal details:", err);
        toast.error(err?.message || "Unexpected error");
        throw err;
      }
    },
    [session?.user?.id, router]
  );

  if (!initialData) {
    return (
      <div className="w-full min-h-screen bg-[#0F0F0F] overscroll-none">
        <div className="flex min-h-[100vh] items-center justify-center text-gray-400">
          <p className="text-red-500">Failed to load personal details</p>
        </div>
      </div>
    );
  }

  const defaultValues = {
    primary_first_name: initialData.primary_first_name ?? "",
    primary_last_name: initialData.primary_last_name ?? "",
    contact_salutation: initialData.contact_salutation ?? "",
    contact_job_title: initialData.contact_job_title ?? "",
    contact_first_name:
      initialData.contact_first_name || initialData.primary_first_name || "",
    contact_last_name:
      initialData.contact_last_name || initialData.primary_last_name || "",
    contact_email: initialData.contact_email ?? "",
    contact_mobile: initialData.contact_mobile ?? "",
  };

  return (
    <div className="w-full min-h-full bg-[#0F0F0F] overscroll-none">
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-hidden">
          <PersonalDetails defaultValues={defaultValues} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
}

