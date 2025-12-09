"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import PlanCard from "./plan-card";
import SwitchToggle from "./switch-toggle";


export default function PricingSection({ isAnnual: initialIsAnnual = false }: { isAnnual?: boolean }) {
  const [isAnnual, setIsAnnual] = useState(initialIsAnnual);
  const plans = [
    {
      title: "Starter",
      description: "Explore the grant database",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        "Access to grant database",
        "Basic search and filtering",
        "Browse all available grants",
        "No AI matching",
      ],
      href: "/new-application",
      paymentLink: undefined,
      highlight: false,
    },
    {
      title: "Pro",
      description: "Unlock intelligent grant matching",
      monthlyPrice: 29,
      annualPrice: 300, // 25 * 12
      features: [
        "Everything in Starter",
        "Unlimited grant matching",
        "AI application generator",
        "Location-based matching",
        "Priority email support",
      ],
      href: "/new-application",
      paymentLink: "/api/stripe/pro", // replace with your real link
      highlight: true,
    },
  ];

  return (
    <section className="w-full relative isolate bg-[#0E0E0E] px-6 py-24 sm:py-32 lg:px-8 overflow-hidden">

      {/* BG glow */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-40 md:top-60 -z-10 transform-gpu blur-3xl"
      >
        <div
          className="mx-auto aspect-[1155/678] w-[72rem] bg-gradient-to-tr from-[#68FCF2] to-[#9F86FF] opacity-20"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      {/* Header */}
      <div className="mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="shadow-[0_0_18px_rgba(104,252,242,0.15)] mx-auto mb-8 text-md flex max-w-fit items-center justify-center space-x-2 overflow-hidden rounded-full border border-[#68FCF2]/20 bg-[#191C1C] px-3 py-1 transition-all"
        >
          <span className="text-md font-bold text-[#24bbb1]">Simple Pricing</span>
        </motion.div>

        <p className="mt-2 text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Choose your perfect plan
        </p>
      </div>

      <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-400 sm:text-xl">
        Start for free with database access, then upgrade to unlock AI-powered grant matching.
      </p>

      {/* Annual/Monthly Toggle */}
      <div className="mx-auto mt-8 flex items-center justify-center gap-3">
        <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>
          Monthly
        </span>
        <SwitchToggle
          isAnnual={isAnnual}
          setIsAnnual={setIsAnnual}
        />
        <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
          Annual
        </span>
        <span className={`text-xs text-[#68FCF2] font-medium ${isAnnual ? 'opacity-100' : 'opacity-0'}`}>
          Save 20%
        </span>
      </div>

      {/* Pricing grid */}
      {/* <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-10 sm:mt-20 lg:max-w-4xl lg:grid-cols-2 sm:gap-y-0">

        {plans.map((plan) => (

          <PlanCard
            title={plan.title}
            description={plan.description}
            monthlyPrice={plan.monthlyPrice}
            annualPrice={plan.annualPrice}
            features={plan.features}
            highlight={plan.highlight}
            href={plan.href}
            paymentLink={plan.paymentLink}
            isAnnual={isAnnual}
          />
        ))}

      </div> */}


      <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-10 sm:mt-20 lg:max-w-5xl lg:grid-cols-2">

        {/* FREE PLAN */}
        <div className="">
          <PlanCard
            title="Starter"
            description="Explore the grant database"
            monthlyPrice={0}
            annualPrice={0}
            href="/grant-database"
            features={[
              "Access to grant database",
              "Basic search and filtering",
              "Browse all available grants",
              "No AI matching",
            ]}
            isAnnual={isAnnual}
            shape="free-left"
          />
        </div>

        {/* PRO PLAN */}
        <div className="lg:-mt-6"> {/* Makes it taller visually */}
          <PlanCard
            title="Pro"
            description="Unlock intelligent grant matching"
            monthlyPrice={29}
            annualPrice={300}
            paymentLink="/api/stripe/checkout"
            href="/matching-grants"
            features={[
              "Everything in Starter",
              "Unlimited grant matching",
              "AI application generator",
              "Location-based matching",
              "Priority email support",
            ]}
            isAnnual={isAnnual}
            highlight
            shape="pro-right"
          />
        </div>
      </div>


      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mt-12 mb-8 w-auto items-center justify-center space-x-2 overflow-hidden transition-all"
      >
        <p className="text-md font-medium text-muted-foreground">
          Need a custom solution? <a href="mailto:info@granton.io" className="text-[#24bbb1] hover:underline">Contact our sales team</a>
        </p>
      </motion.div>
    </section>
  );
}