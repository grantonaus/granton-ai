import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Navbar({ removeTransparency = true }) {
  return (
    <>
      {/* Local keyframes — needed because Tailwind v4 has no config */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header
        className={`
          fixed left-0 top-0 z-50 w-full
          border-b border-white/10 text-white
          ${removeTransparency ? "bg-[#0c0c0c]" : "bg-black/60 backdrop-blur-3xl"}
          opacity-0 animate-[fadeIn_0.6s_ease_forwards_0.3s]
        `}
      >
        <div className="container max-w-6xl mx-auto flex h-[5rem] items-center justify-between px-5">
          <Link href="/">
            <div className="flex items-center gap-2">
              <Image
                src="/1.png"
                alt="logo"
                width={140}
                height={140}
              />
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex items-center rounded-md font-semibold bg-[#0E0E0E] border border-[#1C1C1C]
              text-white px-4 h-11 hover:bg-[#0E0E0E]/80 transition"
            >
              Login
            </Link>

            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-md font-semibold bg-[#0E0E0E] border border-[#1C1C1C]
              text-white px-4 h-11 hover:bg-[#0E0E0E]/80 transition"
            >
              Sign Up
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}