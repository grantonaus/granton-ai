"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

type Submenu = { href: string; label: string; active: boolean };

interface ExpandableLinkMenuProps {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  submenus: Submenu[];
  isOpen: boolean | undefined;
}

export function ExpandableLinkMenu({
  href,
  label,
  icon: Icon,
  active,
  submenus,
  isOpen,
}: ExpandableLinkMenuProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="w-full"
    >
      <div className="[&[data-state=open]>button>div>div>svg]:rotate-180 mb-1">
        <Button
          variant={active ? "secondary" : "ghost"}
          className="w-full justify-start h-12"
        >
          <CollapsibleTrigger asChild>
            <div className="w-full flex justify-between items-center">
              <Link href={href} className="flex items-center flex-grow">
                <span className="mr-3">
                  <Icon width={24} height={24} />
                </span>
                <span
                  className={cn(
                    "text-[15px] truncate max-w-[150px]",
                    isOpen
                      ? "translate-x-0 opacity-100"
                      : "-translate-x-96 opacity-0"
                  )}
                >
                  {label}
                </span>
              </Link>
              <ChevronDown
                size={24}
                strokeWidth={3}
                className={cn(
                  "transition-transform duration-200",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
          </CollapsibleTrigger>
        </Button>
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        {submenus.map(({ href, label, active }, index) => (
          <Button
            key={index}
            variant={active ? "secondary" : "ghost"}
            className="w-full justify-start h-10 pl-11"
            asChild
          >
            <Link href={href} target="_blank" download>
              <span className="mr-2 size-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
              <span className="truncate text-sm">{label}</span>
            </Link>
          </Button>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
