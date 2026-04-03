"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";
import {
  MapPin,
  Clock,
  Flag,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";

type GrantDatabaseCardProps = {
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
  isSaved: boolean;
  isNew: boolean;
  isPending?: boolean;
  isNavigating?: boolean;
  onToggleSave: (save: boolean) => void;
  onCardClick?: () => void;
};

const GrantDatabaseCard = ({
  grant,
  isSaved,
  isNew,
  isPending = false,
  isNavigating = false,
  onToggleSave,
  onCardClick,
}: GrantDatabaseCardProps) => {
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

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group border rounded-lg p-5 transition-colors flex flex-col relative bg-[#121111] hover:bg-[#171717] duration-300",
        "border-[#1a1a1a] hover:border-[#222222] cursor-pointer",
        isNavigating && "opacity-50 pointer-events-none"
      )}
    >
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {/* Save Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!isPending) {
              onToggleSave(!isSaved);
            }
          }}
          disabled={isPending}
          className={cn(
            "group/saved-heart transition-all duration-200 p-2 rounded-md cursor-pointer",
            isSaved 
              ? "text-red-500 hover:text-red-400 bg-[#1f1d1d] hover:bg-[#222020]" 
              : "text-white/60 hover:text-white bg-[#1d1b1b]/60 hover:bg-[#1d1c1c]",
            isPending && "opacity-100"
          )}
          title={isPending ? "Saving..." : isSaved ? "Remove from saved" : "Save grant"}
        >
          <Heart 
            className={cn(
              "size-5 transition-all duration-200",
              // "group-hover/saved-heart:scale-110",
              isSaved && "fill-red-500"
            )} 
          />
        </button>
      </div>

      {/* Title */}
      <h3
        className={cn(
          "font-bold text-[17px] md:text-[19px] leading-snug pr-20 line-clamp-2 transition",
          isNew ? "text-white" : "text-white/70"
        )}
      >
        {grant.title}
      </h3>

      {/* Agency */}
      {/* <p className="text-[15px] md:text-[16px] text-white/50 font-medium pt-[8px]">
        {grant.agency}
      </p> */}

      {/* Description */}
      <p className="text-[15px] md:text-[16px] text-white/50 mt-3 line-clamp-2">
        {grant.shortDescription}
      </p>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-4 font-medium text-white/50 text-[14px] md:text-[15px] mt-5">
        <div className="flex items-center gap-1">
          <MapPin className="size-4" />
          <span>{grant.state}</span>
        </div>

        <div className="flex items-center gap-1">
          <Flag className="size-4" />
          <span>{grant.status}</span>
        </div>

        {grant.deadline && (
          <div className="flex items-center gap-1">
            <Clock className="size-4" />
            <span>{grant.deadline}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GrantDatabaseCard;