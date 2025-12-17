"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function GrantTestSubscriptionPage() {
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const router = useRouter();

  const handleGrantSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/grant-test-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ period }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to grant subscription");
      }

      toast.success("Test subscription granted successfully!");
      
      // Redirect to grant database after a short delay
      setTimeout(() => {
        router.push("/grant-database");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Failed to grant subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1A1A1A] rounded-lg border border-[#2A2A2A] p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white">
            Test Subscription
          </h1>
          <p className="text-gray-400 text-sm">
            This will grant you a test subscription without payment. For testing purposes only.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Subscription Period
            </label>
            <Select
              value={period}
              onValueChange={(value) => setPeriod(value as "MONTHLY" | "ANNUAL")}
            >
              <SelectTrigger className="w-full bg-[#0F0F0F] border-[#2A2A2A] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="ANNUAL">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGrantSubscription}
            disabled={loading}
            className="w-full bg-[#000000] cursor-pointer duration-300 transition-all py-3 h-11 hover:bg-[#272727] font-bold text-[15px] text-white"
          >
            {loading ? "Granting..." : "Grant Test Subscription"}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center">
          After granting, you&apos;ll be redirected to the Grant Database.
        </p>
      </div>
    </div>
  );
}
