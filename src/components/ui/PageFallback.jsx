import { Skeleton } from "@/components/ui/skeleton";

export default function PageFallback() {
  return (
    <div
      className="min-h-[60vh] w-full min-w-0 flex-1 space-y-5 p-4 font-jakarta sm:p-6"
      role="status"
      aria-label="Loading page content"
    >
      <div aria-hidden="true" className="space-y-5">
        <div className="space-y-3">
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-3 w-96 max-w-full" />
        </div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="sibs-metric-card flex h-[104px] flex-col justify-between p-3 2xl:h-[116px] 2xl:p-3.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-2.5 w-4/5" />
            </div>
          ))}
        </div>
        <div className="sibs-card space-y-5 p-4 sm:p-5">
          <Skeleton className="h-8 w-72 max-w-full" />
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="flex gap-4 border-t border-sibs-border pt-4">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-1/6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
