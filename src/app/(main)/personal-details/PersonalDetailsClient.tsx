"use client";

import PersonalDetails from "@/components/PersonalDetails";
import type { PersonalDetailsData } from "@/components/PersonalDetails";

interface PersonalDetailsClientProps {
  initialData: PersonalDetailsData | null;
}

export default function PersonalDetailsClient({
  initialData,
}: PersonalDetailsClientProps) {
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
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overscroll-none bg-[#0F0F0F]">
      <PersonalDetails defaultValues={defaultValues} />
    </div>
  );
}
