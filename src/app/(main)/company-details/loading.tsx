import Spinner from "@/components/Spinner";

export default function Loading() {
  return (
    <div className="w-full min-h-screen bg-[#0F0F0F] overscroll-none">
      <div className="flex min-h-[100vh] items-center justify-center text-gray-400">
        <div role="status" aria-label="Loading company details">
          <Spinner />
        </div>
      </div>
    </div>
  );
}

