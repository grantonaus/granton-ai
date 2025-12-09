"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import {
    MapPin,
    Clock,
    Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type GrantMatchCardProps = {
    grant: {
        id: string;
        title: string;
        agency: string;
        shortDescription: string;
        state: string;
        status: string;
        deadline: string;
        grantUrl?: string | null;
    };
    matchScore: number;
    matchQuality?: string;
    matchQualityColor?: string;
    isNavigating?: boolean;
    onCardClick?: () => void;
    onApply?: () => void;
};

const GrantMatchCard = ({
    grant,
    matchScore,
    matchQuality,
    matchQualityColor,
    isNavigating = false,
    onCardClick,
    onApply,
}: GrantMatchCardProps) => {
    const router = useRouter();

    const handleCardClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isNavigating) return; // Ignore if already navigating

        // Navigate to grant URL if available
        if (grant.grantUrl) {
            window.open(grant.grantUrl, "_blank", "noopener,noreferrer");
        } else {
            // Fallback to grant detail page if no URL
            startTransition(() => {
                if (onCardClick) {
                    onCardClick();
                }
                router.push(`/grants/${grant.id}`);
            });
        }
    };

    const handleApplyClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onApply) {
            onApply();
        } else if (grant.grantUrl) {
            window.open(grant.grantUrl, "_blank", "noopener,noreferrer");
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className={cn(
                "group border rounded-lg transition-colors flex flex-col relative bg-[#121111] hover:bg-[#191919]",
                "border-[#1a1a1a] hover:border-[#222222] cursor-pointer",
                isNavigating && "opacity-50 pointer-events-none"
            )}
        >

            <div className="px-4 md:px-5 py-3 md:py-4 bg-[#100E0E] group-hover:bg-[#141414] rounded-t-lg border-b transition-colors">
                {/* Mobile: Two-line layout */}
                <div className="md:hidden space-y-3">
                    {/* First line: Match Score Slider + Status */}
                    <div className="flex items-center justify-between gap-3">
                        {/* Match Score Slider */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-0">
                                    <div
                                        className="h-full bg-[#68FCF2] rounded-full transition-all duration-500"
                                        style={{ width: `${matchScore}%` }}
                                    />
                                </div>
                                <span className="text-white/50 font-medium text-[13px] whitespace-nowrap flex-shrink-0">{matchScore}%</span>
                            </div>
                        </div>

                        {/* Status on the right with color */}
                        <div className={cn(
                            "font-semibold text-[12px] px-2 py-1 rounded flex-shrink-0",
                            grant.status === "Open" && "text-green-400 bg-green-400/10",
                            grant.status === "Ongoing" && "text-blue-400 bg-blue-400/10",
                            grant.status === "Closed" && "text-red-400 bg-red-400/10",
                            !["Open", "Ongoing", "Closed"].includes(grant.status) && "text-white/60 bg-white/5"
                        )}>
                            {grant.status}
                        </div>
                    </div>

                    {/* Second line: Location and Deadline icons */}
                    <div className="flex flex-wrap items-center gap-3 font-medium text-white/50 text-[13px]">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="size-3.5 flex-shrink-0" />
                            <span className="whitespace-nowrap">{grant.state}</span>
                        </div>

                        {grant.deadline && (
                            <div className="flex items-center gap-1.5">
                                <Clock className="size-3.5 flex-shrink-0" />
                                <span className="whitespace-nowrap">{grant.deadline}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Desktop: Original single-line layout */}
                <div className="hidden md:flex items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 font-medium text-white/50 text-[15px] flex-1">
                        {/* Match Score Slider */}
                        <div className="flex items-center gap-2 min-w-[200px]">
                            <div className="flex items-center gap-1.5 flex-1">
                                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#68FCF2] rounded-full transition-all duration-500"
                                        style={{ width: `${matchScore}%` }}
                                    />
                                </div>
                                <span className="text-white/50 font-medium text-[15px] whitespace-nowrap">{matchScore}%</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <MapPin className="size-4" />
                            <span>{grant.state}</span>
                        </div>

                        {grant.deadline && (
                            <div className="flex items-center gap-1">
                                <Clock className="size-4" />
                                <span>{grant.deadline}</span>
                            </div>
                        )}
                    </div>

                    {/* Status on the right with color */}
                    <div className={cn(
                        "font-semibold text-[15px] px-2.5 py-1 rounded flex-shrink-0",
                        grant.status === "Open" && "text-green-400 bg-green-400/10",
                        grant.status === "Ongoing" && "text-blue-400 bg-blue-400/10",
                        grant.status === "Closed" && "text-red-400 bg-red-400/10",
                        !["Open", "Ongoing", "Closed"].includes(grant.status) && "text-white/60 bg-white/5"
                    )}>
                        {grant.status}
                    </div>
                </div>
            </div>



            <div className="p-5">
                <h3
                    className={cn(
                        "font-bold text-[17px] md:text-[19px] leading-snug pr-20 line-clamp-2 transition text-white/70"
                    )}
                >
                    {grant.title}
                </h3>


                {/* Description */}
                <p className="text-[15px] md:text-[16px] text-white/50 mt-3 line-clamp-2">
                    {grant.shortDescription}
                </p>

            </div>
        </div>
    );
};

export default GrantMatchCard;

