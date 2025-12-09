"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CTA from "@/components/landing/cta";
import Features from "@/components/landing/features";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import Navbar from "@/components/landing/navbar";
import PricingSection from "@/components/landing/pricing-section";
import dynamic from "next/dynamic";


export default function LandingPage() {
    const searchParams = useSearchParams();
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const subscription = searchParams.get('subscription');
        if (subscription === 'canceled') {
            setMessage({ type: 'error', text: 'Subscription canceled. You can try again anytime.' });
            setShowMessage(true);
            // Clear URL param
            window.history.replaceState({}, '', '/');
            setTimeout(() => setShowMessage(false), 5000);
        }
    }, [searchParams]);

    return (
        <div className="w-full bg-[#0E0E0E] text-white ">
            <Navbar removeTransparency={false} />

            {showMessage && message && (
                <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-lg ${
                    message.type === 'success' 
                        ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                        : 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-400'
                }`}>
                    {message.text}
                </div>
            )}

            <main className="relative flex flex-col items-center text-center">
                <div className="absolute top-28 md:top-40 left-4/12 size-72 sm:size-96 xl:size-120 2xl:size-132 bg-[#143735] blur-[100px] opacity-40"></div>
                <Hero />
                <Features />
                <HowItWorks />
                <PricingSection isAnnual={false} />
                <CTA />
            </main>
        </div>
    );
}
