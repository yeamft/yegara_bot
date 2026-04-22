import { Gamepad2, History, User, Wallet } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/game", label: "Game", icon: Gamepad2 },
  { to: "/history", label: "History", icon: History },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/profile", label: "Profile", icon: User },
];

export function BottomNavigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="max-w-md mx-auto px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <div className="glass rounded-2xl shadow-card border border-border/80 grid grid-cols-4 p-1.5">
          {tabs.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-smooth",
                "text-muted-foreground hover:text-foreground hover:bg-secondary/70",
              )}
              activeClassName="text-primary bg-primary/15"
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}