"use client";

import Link from "next/link";
import React from "react";
import { ChevronsRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession, getSession } from "next-auth/react";

interface PlanCardProps {
  title: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  highlight?: boolean;
  href: string;
  paymentLink?: string;
  isAnnual: boolean;

  /** shape style: "free-left" | "pro-right" | "default" */
  shape?: "free-left" | "pro-right" | "default";
}

const PlanCard: React.FC<PlanCardProps> = ({
  title,
  description,
  monthlyPrice,
  annualPrice,
  features,
  highlight,
  href,
  paymentLink,
  isAnnual,
  shape = "default",
}) => {
  const router = useRouter();
  const session = useSession();
  const isFreePlan = monthlyPrice === 0;

  const monthlyEquivalent = (annualPrice / 12).toFixed(2);

  // shape-specific rounding
  const shapeClass = {
    "default": "rounded-3xl",
    "free-left": "rounded-3xl sm:rounded-r-none sm:rounded-l-3xl",
    "pro-right": "rounded-3xl",
  }[shape];

  const handleSubscription = async () => {
    if (!paymentLink) return;

    // Get fresh session to ensure we have the latest auth state
    const currentSession = await getSession();

    // Check if user is authenticated - redirect to login if not
    if (!currentSession?.user?.id) {
      sessionStorage.setItem("pendingPaymentLink", paymentLink);
      sessionStorage.setItem("pendingIsAnnual", String(isAnnual));
      router.push("/login");
      return;
    }

    try {
      // Call the subscription checkout API
      const response = await fetch(paymentLink, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isAnnual }),
      });

      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        sessionStorage.setItem("pendingPaymentLink", paymentLink);
        sessionStorage.setItem("pendingIsAnnual", String(isAnnual));
        router.push("/login");
        return;
      }

      if (!response.ok) {
        let errorMessage = "Failed to start checkout. Please try again.";
        try {
          const error = await response.json();
          console.error("Failed to create checkout session:", error);
          errorMessage = error.details || error.error || errorMessage;
        } catch (e) {
          const text = await response.text();
          console.error("Failed to parse error response:", text);
          errorMessage = text || errorMessage;
        }
        alert(`Error: ${errorMessage}`);
        return;
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        console.error("No checkout URL returned from API");
        alert("Failed to get checkout URL. Please try again.");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div
      className={`
        relative  bg-[#0F0F0F]
        border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.45)]
        transition-all duration-300 select-none ${shapeClass}
        ${highlight
          ? "border-[#264e42] shadow-[0_0_40px_rgba(119,247,207,0.4)] ring-1 ring-[#264e42]"
          : "hover:border-white/20 hover:shadow-[0_12px_48px_rgba(0,0,0,0.55)]"
        }
      `}
    >

      <div className="p-10 flex flex-col items-start gap-6">
        {/* Most Popular Badge */}
        {/* {highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="px-3 py-1 text-xs font-semibold text-black bg-[#77F7CF] rounded-full shadow-lg">
            ⭐ Most Popular
          </div>
        </div>
      )} */}

        {/* Header */}
        <div>
          <h3 className="text-start text-xl font-bold tracking-tight text-white">{title}</h3>

          {/* Price */}
          <div className="space-y-1 mt-4">
            {isFreePlan ? (
              <p className= "text-start text-5xl font-extrabold text-white">$0.00
                <span className="text-lg font-medium text-gray-400"> /month</span>
              </p>
            ) : (
              <>
                <p className="text-start text-5xl font-extrabold text-white tracking-tight leading-none">
                  ${isAnnual ? monthlyEquivalent : monthlyPrice.toFixed(2)}
                  <span className="text-lg font-medium text-gray-400"> /month</span>
                </p>
                {/* {isAnnual && (
                  <p className="text-start mt-1 text-sm text-gray-400">
                    Save ${annualPrice - monthlyPrice * 12} on an Annual Plan
                  </p>
                )} */}
              </>
            )}
          </div>



          <p className="text-[15px] md:text-[17px] font-medium text-muted-foreground mt-3">{description}</p>
        </div>


        {/* Divider */}
        <div className="h-px bg-white/10 w-full" />

        {/* Features */}
        <ul className="flex flex-col gap-4 mt-2">
          {features.map((feature, i) => (
            <li key={i} className="flex gap-3 text-gray-200 text-base">
              <span className="text-[#77F7CF] text-xl leading-none">✔</span>
              {feature}
            </li>
          ))}
        </ul>



        {/* CTA */}
        {isFreePlan ? (
          <button
            disabled
            className="
            cursor-pointer
            mt-4 h-12 rounded-xl w-full bg-white/5 hover:bg-white/10 text-gray-300
            transition-all duration-300
            font-semibold border border-white/10
          "
          >
            Current Plan
          </button>
        ) : (
          <button
            onClick={handleSubscription}
            className="
            cursor-pointer
            mt-4 h-12 w-full rounded-xl font-semibold
            bg-[#77F7CF] text-black hover:bg-[#77F7CF]/70
            transition-all duration-300
            shadow-[0_0_25px_rgba(119,247,207,0.5)]
            flex items-center justify-center gap-2
          "
          >
            Subscribe <ChevronsRight className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default PlanCard;