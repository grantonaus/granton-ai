"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import CompanyDetails, { CompanyDetailsData } from "@/components/CompanyDetails";
import { useCurrentUser } from "@/hooks/user";

interface CompanyDetailsClientProps {
  initialData: CompanyDetailsData | null;
}

export default function CompanyDetailsClient({
  initialData,
}: CompanyDetailsClientProps) {
  const { session } = useCurrentUser();
  const router = useRouter();

  const handleSave = useCallback(
    async (formData: CompanyDetailsData) => {
      if (!session?.user?.id) {
        toast.error("You must be logged in");
        return;
      }

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
        router.refresh();
      } catch (err: any) {
        console.error("Error saving company data:", err);
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
          <p className="text-red-500">Failed to load company details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-[#0F0F0F] overscroll-none">
      <div className="flex flex-col h-full">
        <CompanyDetails defaultValues={initialData} onSave={handleSave} />
      </div>
    </div>
  );
}

