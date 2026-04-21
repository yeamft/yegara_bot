import { cn } from "@/lib/utils";

interface BingoBallProps {
  number: number;
  size?: "sm" | "md" | "lg" | "xl" | "hero";
  called?: boolean;
  highlight?: boolean;
  className?: string;
  animate?: boolean;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-2xl",
  hero: "h-44 w-44 text-7xl",
};

export function BingoBall({ number, size = "md", called = true, highlight, className, animate }: BingoBallProps) {
  return (
    <div
      className={cn(
        "ball",
        sizes[size],
        !called && "ball-uncalled",
        highlight && "animate-pulse-glow",
        animate && "animate-ball-pop",
        className,
      )}
    >
      {number}
    </div>
  );
}
