"use client";

import Link from "next/link";
import React, { useState } from "react";
import { ChevronsRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

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
  isSubscribed?: boolean;

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
  isSubscribed = false,
  shape = "default",
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isFreePlan = monthlyPrice === 0;

  const monthlyEquivalent = (annualPrice / 12).toFixed(2);

  // shape-specific rounding
  const shapeClass = {
    "default": "rounded-3xl",
    "free-left": "rounded-3xl sm:rounded-r-none sm:rounded-l-3xl",
    "pro-right": "rounded-3xl",
  }[shape];


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
        ) : paymentLink ? (
          <button
            onClick={async () => {
              setIsLoading(true);
              
              // If user is already subscribed, redirect to new-application
              if (isSubscribed) {
                router.push('/new-application');
                return;
              }

              try {
                // User is not subscribed, proceed with checkout
                const response = await fetch('/api/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ isAnnual }),
                });
                const data = await response.json();
                if (data.url) {
                  window.location.href = data.url;
                } else {
                  console.error('No checkout URL received');
                  setIsLoading(false);
                }
              } catch (error) {
                console.error('Error creating checkout:', error);
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            className="
            cursor-pointer
            mt-4 h-12 w-full rounded-xl font-semibold
            bg-[#77F7CF] text-black hover:bg-[#77F7CF]/70
            transition-all duration-300
            shadow-[0_0_25px_rgba(119,247,207,0.5)]
            flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          >
            {isLoading ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Get Started <ChevronsRight className="size-5" />
              </>
            )}
          </button>
        ) : (
          <Link
            href={href}
            className="
            cursor-pointer
            mt-4 h-12 w-full rounded-xl font-semibold
            bg-[#77F7CF] text-black hover:bg-[#77F7CF]/70
            transition-all duration-300
            shadow-[0_0_25px_rgba(119,247,207,0.5)]
            flex items-center justify-center gap-2
          "
          >
            Get Started <ChevronsRight className="size-5" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default PlanCard;