import { cn } from "@/lib/utils";

interface CalledGridProps {
  called: number[];
  current: number | null;
}

export function CalledGrid({ called, current }: CalledGridProps) {
  const calledSet = new Set(called);
  return (
    <div className="grid grid-cols-10 gap-1">
      {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => {
        const isCalled = calledSet.has(n);
        const isCurrent = n === current;
        return (
          <div
            key={n}
            className={cn(
              "aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold transition-smooth",
              isCurrent && "gradient-primary text-primary-foreground scale-125 shadow-elegant z-10",
              isCalled && !isCurrent && "bg-accent/30 text-accent",
              !isCalled && "bg-secondary/50 text-muted-foreground",
            )}
          >
            {n}
          </div>
        );
      })}
    </div>
  );
}
