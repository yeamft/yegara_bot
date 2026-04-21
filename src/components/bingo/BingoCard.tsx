import { cn } from "@/lib/utils";
import { haptic } from "@/hooks/useTelegramIdentity";

interface BingoCardProps {
  numbers: number[];
  marked: number[];
  called: number[];
  onMark: (n: number) => void;
  disabled?: boolean;
}

export function BingoCard({ numbers, marked, called, onMark, disabled }: BingoCardProps) {
  const calledSet = new Set(called);
  const markedSet = new Set(marked);

  return (
    <div className="grid grid-cols-5 gap-2 p-3 rounded-2xl bg-card/80 border border-border shadow-card">
      {numbers.map((n) => {
        const isCalled = calledSet.has(n);
        const isMarked = markedSet.has(n);
        const canMark = isCalled && !isMarked && !disabled;
        return (
          <button
            key={n}
            onClick={() => {
              if (!canMark) return;
              haptic("medium");
              onMark(n);
            }}
            disabled={!canMark}
            className={cn(
              "aspect-square rounded-xl font-bold text-lg flex items-center justify-center transition-bounce border-2",
              isMarked && "gradient-primary text-primary-foreground border-transparent scale-95 shadow-elegant",
              !isMarked && isCalled && "bg-accent/20 text-accent border-accent/50 animate-pulse",
              !isMarked && !isCalled && "bg-secondary text-foreground border-border",
              canMark && "active:scale-90 cursor-pointer hover:border-primary",
              !canMark && !isMarked && "cursor-default",
            )}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
