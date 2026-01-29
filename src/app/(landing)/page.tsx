import CTA from "@/components/landing/cta";
import Features from "@/components/landing/features";
import Hero from "@/components/landing/hero";
import HowItWorks from "@/components/landing/how-it-works";
import Navbar from "@/components/landing/navbar";
import PricingSection from "@/components/landing/pricing-section";
import { getServerSession } from "@/lib/auth-server";
import { isUserPremium } from "@/app/actions/premium";

export default async function LandingPage() {
    const session = await getServerSession();
    let isSubscribed = false;
    
    if (session?.user?.id) {
        const premiumStatus = await isUserPremium();
        isSubscribed = premiumStatus.subscribed;
    }

    return (
        <div className="w-full bg-[#0E0E0E] text-white ">
            <Navbar removeTransparency={false} />

            <main className="relative flex flex-col items-center text-center">
                <div className="absolute top-28 md:top-40 left-4/12 size-72 sm:size-96 xl:size-120 2xl:size-132 bg-[#143735] blur-[100px] opacity-40"></div>
                <Hero />
                <Features />
                <HowItWorks />
                <PricingSection isAnnual={false} isSubscribed={isSubscribed} />
                <CTA />
            </main>
        </div>
    );
}
