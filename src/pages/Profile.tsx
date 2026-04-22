import { Loader2, UserCircle2 } from "lucide-react";
import { useTelegramIdentity } from "@/hooks/useTelegramIdentity";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function ProfilePage() {
  const { player, loading } = useTelegramIdentity();

  if (loading || !player) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen max-w-md mx-auto px-5 py-6 safe-top">
      <section className="glass rounded-2xl p-5 shadow-card space-y-4">
        <h1 className="text-lg font-extrabold flex items-center gap-2">
          <UserCircle2 className="h-5 w-5 text-accent" /> Profile
        </h1>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-secondary/60 rounded-xl p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Main Wallet</p>
            <p className="text-2xl font-black tabular-nums mt-1">0</p>
          </div>
          <div className="bg-secondary/60 rounded-xl p-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Play Wallet</p>
            <p className="text-2xl font-black tabular-nums mt-1">0</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-secondary/60 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Games Won</p>
            <p className="text-lg font-black tabular-nums mt-1">0</p>
          </div>
          <div className="bg-secondary/60 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Invite</p>
            <p className="text-lg font-black tabular-nums mt-1">0</p>
          </div>
          <div className="bg-secondary/60 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total Earning</p>
            <p className="text-lg font-black tabular-nums mt-1">NaN</p>
          </div>
        </div>

        <div className="mt-3 space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Username:</span>{" "}
            <span className="font-semibold">{player.username}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Telegram ID:</span>{" "}
            <span className="font-mono text-xs">{player.telegram_id}</span>
          </p>
        </div>

        <div className="bg-secondary/60 rounded-xl p-4 space-y-3">
          <h2 className="text-sm font-bold">Settings</h2>
          <div className="flex items-center justify-between">
            <Label htmlFor="sound-toggle" className="text-sm">
              Sound
            </Label>
            <Switch id="sound-toggle" defaultChecked />
          </div>
        </div>
      </section>
    </main>
  );
}