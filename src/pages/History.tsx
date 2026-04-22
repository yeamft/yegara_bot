import { History as HistoryIcon, Loader2 } from "lucide-react";
import { useTelegramIdentity } from "@/hooks/useTelegramIdentity";

export default function HistoryPage() {
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
          <HistoryIcon className="h-5 w-5 text-primary" /> Game History
        </h1>

        <div className="bg-secondary/60 rounded-xl p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Games</p>
          <p className="text-3xl font-black tabular-nums mt-1">0</p>
        </div>

        <div>
          <h2 className="text-sm font-bold">Recent Games</h2>
          <p className="text-sm text-muted-foreground mt-1">
            No completed games yet for <span className="font-semibold text-foreground">{player.username}</span>.
          </p>
        </div>
      </section>
    </main>
  );
}