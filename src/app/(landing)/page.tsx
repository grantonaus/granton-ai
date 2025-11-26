import CTA from "@/components/landing/cta";
import Features from "@/components/landing/features";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import Navbar from "@/components/landing/navbar";
import PricingSection from "@/components/landing/pricing-section";
import dynamic from "next/dynamic";





export const metadata = {
    title: "Granly",
};

// This page is server-rendered by default because it's in the app/ directory
export default function LandingPage() {

    return (
        <div className="w-full bg-[#0F0F0F] text-white ">

            {/* <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1200px] h-[900px] bg-[#68FCF2]/10 blur-[160px] rounded-full" />
                <div className="absolute bottom-[-30%] right-1/2 translate-x-1/2 w-[1000px] h-[700px] bg-[#68FCF2]/5 blur-[200px] rounded-full" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,rgba(0,0,0,1)_80%)]" />
            </div> */}

            <Navbar removeTransparency={false} />

            <main className="flex flex-col items-center text-center">
                <Hero />
                <Features />
                <HowItWorks />
                <PricingSection isAnnual={false} />
                <CTA />
            </main>
            
        </div>
    );
}
