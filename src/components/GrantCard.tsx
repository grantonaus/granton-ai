import { ExternalLink } from "lucide-react";
import Link from "next/link";

type GrantSuggestion = {
  id: string;
  name: string;
  company: string;
  pdfUrl?: string;
  description?: string;
};

export default function GrantCard({ grant }: { grant: GrantSuggestion }) {
  return (
    <div className="bg-[#101010] border border-[#171717] p-5 rounded-md flex flex-col justify-between min-h-[110px] md:min-h-[130px]">
      <div className="flex items-start justify-between gap-2 mb-4">
        <h3 className="font-semibold text-white/90 text-[15px] md:text-[16px] leading-normal pr-2 line-clamp-2">
          {grant.name}
        </h3>
        {grant.pdfUrl && (
          <Link href={grant.pdfUrl} target="_blank">
            <ExternalLink
              className="text-muted-foreground hover:text-white transition"
              size={20}
            />
          </Link>
        )}
      </div>

      {grant.description && (
        <p className="text-[#3A3A3A] text-[15px] font-semibold line-clamp-2">
          {grant.description}
        </p>
      )}
    </div>
  );
}
