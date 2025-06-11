import { Download } from 'lucide-react';
import Link from 'next/link';

type PastApplication = {
    id: string;
    title: string;
    fileUrl: string;
    createdAt: string;
};

export default function ApplicationCard({
    application,
}: {
    application: PastApplication;
}) {
    return (
        <div className="bg-[#101010] border border-[#171717] p-5 rounded-md flex flex-col justify-between min-h-[110px] md:min-h-[130px]">
            <div className="flex items-start justify-between gap-2 mb-6">
                <h3 className="font-semibold text-white/90 text-[15px] md:text-[16px] leading-normal pr-2 line-clamp-2">
                    {application.title}
                </h3>
                <Link href={application.fileUrl} target="_blank" download>
                    <Download
                        className="text-muted-foreground hover:text-white transition"
                        size={20}
                    />
                </Link>
            </div>
            <div className="w-full flex flex-row justify-between items-center text-[15px] font-medium text-[#3A3A3A]">
                <div>Generated:</div>
                <div className="text-[#3A3A3A]">{application.createdAt}</div>
            </div>
        </div>
    );
}
