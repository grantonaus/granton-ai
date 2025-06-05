"use client"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverTrigger, PopoverContent } from "./popover"
import { JSX } from "react"

type DropDownProps = {
  title: string
  trigger: JSX.Element
  children: React.ReactNode
  ref?: React.RefObject<HTMLButtonElement>
}

export const DropDown = ({ trigger, title, children, ref }: DropDownProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild ref={ref}>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="text-white/80 rounded-md w-52 items-start bg-[#0E0E0E] border border-[#1C1C1C] bg-clip-padding backdrop--blur__safari backdrop-filter backdrop-blur-4xl p-4 mr-5 md:mr-8 mt-1">
        <h4 className="text-sm font-medium">{title}</h4>
        <Separator className=" my-2.5" />
        {children}
      </PopoverContent>
    </Popover>
  )
}