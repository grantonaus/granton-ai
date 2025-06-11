"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";


export const Banner = ({
}) => {
  return (
    <Link
      href={"personal-details"}
      className="
       cursor-pointer
       mt-6
        w-full
        mx-auto
        max-w-[960px]
        bg-[#24231F]
        hover:bg-[#24231F]/90
        text-[#F8EFC1]
        rounded-md
        px-6
        py-3
        flex
        items-center
        justify-between
        transition-colors
        duration-150
        ease-in-out
      "
    >
      <div className="flex w-full space-x-2 items-center justify-center">

        <span className="text-sm font-bold">Add your personal details to start generating content tailored to your needs</span>
            <ChevronRight className="w-5 h-5 text-[#F8EFC1]" strokeWidth={2} />
      </div>

    </Link>
  );
};
