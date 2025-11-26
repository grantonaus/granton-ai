// components/switch-toggle.tsx

"use client";

import React from "react";

interface SwitchToggleProps {
  isAnnual: boolean;
  setIsAnnual: React.Dispatch<React.SetStateAction<boolean>>;
}

const SwitchToggle: React.FC<SwitchToggleProps> = ({ isAnnual, setIsAnnual }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isAnnual}
      onClick={() => setIsAnnual(!isAnnual)}
      className={`
        relative h-8 w-14 rounded-full transition-all duration-300
        border border-[#1C1C1C]
        ${isAnnual ? "bg-[#68FCF2]" : "bg-[#111111]"}
        flex items-center px-1
        shadow-inner shadow-black/40
      `}
    >
      <span
        className={`
          h-6 w-6 rounded-full  transition-transform duration-300 shadow-md
          ${isAnnual ? "translate-x-6 bg-white" : "translate-x-0 bg-accent"}
        `}
      />
    </button>
  );
};

export default SwitchToggle;