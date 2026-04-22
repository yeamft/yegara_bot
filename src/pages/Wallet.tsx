import { ArrowDownLeft, ArrowUpRight, Loader2, Wallet as WalletIcon, ShieldCheck } from "lucide-react";
import { useTelegramIdentity } from "@/hooks/useTelegramIdentity";
import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";

export default function WalletPage() {
  const { player, loading } = useTelegramIdentity();
  const { t } = useLang();

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
          <WalletIcon className="h-5 w-5 text-warning" /> Wallet
        </h1>
        <p className="text-sm text-muted-foreground mt-2">Current balance</p>
        <p className="text-4xl font-black text-warning mt-1 tabular-nums">{player.wallet_balance}</p>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border p-3 bg-card/40">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("playWallet")}</p>
            <p className="font-extrabold text-xl mt-1 tabular-nums text-foreground">{player.wallet_balance}</p>
          </div>
          <div className="rounded-xl border border-border p-3 bg-card/40">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("mainWallet")}</p>
            <p className="font-extrabold text-xl mt-1 tabular-nums text-foreground">{player.wallet_balance}</p>
          </div>
        </div>

        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 flex items-start gap-2 text-xs">
          <ShieldCheck className="h-4 w-4 mt-0.5 text-primary" />
          <p>
            {t("mainWallet")} holds your reserve. {t("playWallet")} is used for stakes and payouts.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button size="lg" className="h-11 font-bold">
            <ArrowDownLeft className="h-4 w-4 mr-1" /> Deposit
          </Button>
          <Button size="lg" variant="secondary" className="h-11 font-bold">
            <ArrowUpRight className="h-4 w-4 mr-1" /> Withdraw
          </Button>
        </div>
      </section>
    </main>
  );
}