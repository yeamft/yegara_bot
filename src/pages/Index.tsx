import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegramIdentity, haptic } from "@/hooks/useTelegramIdentity";
import { api } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { BingoBall } from "@/components/bingo/BingoBall";
import { BingoCard } from "@/components/bingo/BingoCard";
import { generateCardFromCartela } from "@/lib/cartela";
import { Loader2, Plus, LogIn, Wallet, Languages, Eye } from "lucide-react";

const Index = () => {
  const { player, loading } = useTelegramIdentity();
  const { t, lang, toggle } = useLang();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [stake, setStake] = useState(20);
  const [selectedCartelas, setSelectedCartelas] = useState<number[]>([1]);
  const [previewCartela, setPreviewCartela] = useState<number | null>(null);
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const totalStake = stake * selectedCartelas.length;
  const canAfford = (player?.wallet_balance ?? 0) >= totalStake;

  const cartelaPreviewCard = useMemo(
    () => (previewCartela ? generateCardFromCartela(previewCartela) : []),
    [previewCartela],
  );

  function toggleCartela(cardNo: number) {
    setSelectedCartelas((prev) => {
      if (prev.includes(cardNo)) return prev.filter((n) => n !== cardNo);
      if (prev.length >= 3) return prev;
      return [...prev, cardNo].sort((a, b) => a - b);
    });
  }

  async function handleCreate() {
    if (!player) return;
    if (!selectedCartelas.length) {
      toast.error(t("chooseUpToThree"));
      return;
    }
    if (!canAfford) {
      toast.error(t("insufficientBalance"));
      haptic("error");
      return;
    }
    setBusy("create");
    haptic("medium");
    try {
      const { room } = await api.createRoom(player.id, stake, selectedCartelas, isPrivateRoom);
      navigate(`/room/${room.code}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  async function handleJoin() {
    if (!player || !code.trim()) return;
    if (!selectedCartelas.length) {
      toast.error(t("chooseUpToThree"));
      return;
    }
    setBusy("join");
    haptic("medium");
    try {
      const { room } = await api.joinRoom(code.trim().toUpperCase(), player.id, selectedCartelas);
      navigate(`/room/${room.code}`);
    } catch (e: any) {
      toast.error(e.message);
      haptic("error");
    } finally {
      setBusy(null);
    }
  }

  if (loading || !player) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col safe-top safe-bottom px-5 py-6 max-w-md mx-auto">
      <div className="flex justify-end mb-2">
        <button
          onClick={toggle}
          className="flex items-center gap-1.5 text-xs glass px-3 py-1.5 rounded-full font-semibold uppercase tracking-wider"
        >
          <Languages className="h-3.5 w-3.5" /> {lang === "en" ? "EN" : "አማ"}
        </button>
      </div>

      <header className="text-center mb-6">
        <div className="flex justify-center gap-2 mb-5">
          <BingoBall number={7} size="md" className="rotate-[-12deg]" showLetter={false} />
          <BingoBall number={42} size="md" className="translate-y-2" showLetter={false} />
          <BingoBall number={68} size="md" className="rotate-12" showLetter={false} />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="inline-block gradient-primary text-primary-foreground px-4 py-1.5 rounded-xl shadow-elegant">
            {t("appName")}
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-3 max-w-xs mx-auto">{t("tagline")}</p>
      </header>

      <section className="glass rounded-2xl p-4 mb-4 shadow-card flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("playingAs")}
          </p>
          <p className="font-bold">{player.username}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
            <Wallet className="h-3 w-3" /> {t("wallet")}
          </p>
          <p className="font-extrabold text-2xl text-warning leading-tight">
            {player.wallet_balance}
          </p>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 mb-3 shadow-card space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <LogIn className="h-4 w-4 text-accent" /> {t("joinRoom")}
        </h2>
        <div className="flex gap-2">
          <Input
            placeholder={t("roomCode")}
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 5))}
            maxLength={5}
            className="text-center font-mono tracking-[0.4em] text-lg uppercase h-12"
          />
          <Button
            onClick={handleJoin}
            disabled={!code.trim() || busy !== null}
            size="lg"
            className="h-12 px-5"
          >
            {busy === "join" ? <Loader2 className="h-4 w-4 animate-spin" /> : t("join")}
          </Button>
        </div>
      </section>

      <section className="glass rounded-2xl p-5 shadow-card space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> {t("hostNew")}
        </h2>

        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            {t("stake")}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
            {[10, 20, 50, 100].map((v) => (
              <button
                key={v}
                onClick={() => setStake(v)}
                className={`rounded-xl p-3 text-left border-2 transition-smooth ${
                  stake === v
                    ? "border-primary bg-primary/20 text-foreground shadow-elegant"
                    : "border-border bg-secondary text-muted-foreground hover:border-primary/40"
                }`}
              >
                <p className="text-[10px] uppercase tracking-wider opacity-80">ETB</p>
                <p className="font-black text-lg leading-none mt-1">{v}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border p-3 bg-card/40">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm">{t("cartelaMarket")}</h3>
            <span className="text-xs text-muted-foreground">
              {t("selected")}: <span className="font-bold text-foreground">{selectedCartelas.length}/3</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">{t("chooseUpToThree")}</p>

          <div className="grid grid-cols-8 gap-1.5 max-h-52 overflow-y-auto pr-1">
            {Array.from({ length: 200 }, (_, i) => i + 1).map((n) => {
              const selected = selectedCartelas.includes(n);
              const blocked = !selected && selectedCartelas.length >= 3;
              return (
                <button
                  key={n}
                  onClick={() => !blocked && toggleCartela(n)}
                  className={`h-8 rounded-md text-xs font-bold border transition-smooth ${
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : blocked
                        ? "border-border bg-secondary/40 text-muted-foreground opacity-50 cursor-not-allowed"
                        : "border-border bg-secondary text-foreground hover:border-primary/50"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>

          {selectedCartelas.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="text-xs text-muted-foreground">
                {t("totalStake")}: <span className="font-bold text-foreground">{totalStake}</span>
              </div>
              <div className="flex gap-1.5">
                {selectedCartelas.map((n) => (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    key={n}
                    className="h-7 px-2 text-[10px]"
                    onClick={() => setPreviewCartela(n)}
                  >
                    <Eye className="h-3 w-3 mr-1" /> #{n}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-3 bg-card/40">
          <span className="text-sm font-semibold">{t("privateRoom")}</span>
          <Switch checked={isPrivateRoom} onCheckedChange={setIsPrivateRoom} />
        </div>

        {!canAfford && (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex items-center justify-between gap-3">
            <p className="text-xs text-destructive font-semibold">{t("insufficientBalance")}</p>
            <Button type="button" variant="destructive" size="sm" onClick={() => navigate("/wallet")}>
              {t("topUp")}
            </Button>
          </div>
        )}

        <Button
          onClick={handleCreate}
          disabled={busy !== null || !selectedCartelas.length || !canAfford}
          size="lg"
          className="w-full h-12 gradient-primary text-primary-foreground font-bold shadow-elegant"
        >
          {busy === "create" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            `${t("createRoom")} · ${totalStake}`
          )}
        </Button>
      </section>

      <Dialog open={previewCartela !== null} onOpenChange={(open) => !open && setPreviewCartela(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {t("preview")} #{previewCartela}
            </DialogTitle>
            <DialogDescription>{t("cartelaMarket")}</DialogDescription>
          </DialogHeader>
          <BingoCard numbers={cartelaPreviewCard} marked={[0]} current={null} disabled />
        </DialogContent>
      </Dialog>

    </main>
  );
};

export default Index;
