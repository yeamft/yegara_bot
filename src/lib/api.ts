import { supabase } from "@/integrations/supabase/client";

export type Player = {
  id: string;
  telegram_id: string;
  username: string;
  wallet_balance: number;
  created_at: string;
};

export type RoomStatus = "lobby" | "live" | "paused" | "finished";

export type Room = {
  id: string;
  code: string;
  game_id?: string | null;
  is_private?: boolean;
  host_id: string;
  status: RoomStatus;
  stake_amount: number;
  house_commission_pct: number;
  derash: number;
  call_interval_ms: number;
  lobby_seconds: number;
  lobby_ends_at: string | null;
  current_index: number;
  call_sequence: number[];
  winner_id: string | null;
  winning_line: string | null;
  pending_winner_id?: string | null;
  pending_winning_line?: string | null;
  pending_payout?: number | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type RoomPlayerRole = "player" | "watcher";

export type RoomPlayer = {
  id: string;
  room_id: string;
  player_id: string;
  role: RoomPlayerRole;
  stake_paid: boolean;
  selected_cartelas?: number[];
  auto_fill?: boolean;
  false_claims?: number;
  card: number[];
  marked: number[];
  joined_at: string;
};

async function call<T = any>(
  action: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("game-action", {
    body: { action, ...args },
  });
  if (error) throw new Error(error.message);
  if (data?.error) {
    const penalty = typeof data?.penalty === "number" ? ` (${data.penalty})` : "";
    throw new Error(`${data.error}${penalty}`);
  }
  return data as T;
}

export const api = {
  upsertPlayer: (telegram_id: string, username: string) =>
    call<{ player: Player }>("upsert_player", { telegram_id, username }),
  createRoom: (
    player_id: string,
    stake_amount = 20,
    selected_cartelas: number[] = [1],
    is_private = false,
  ) =>
    call<{ room: Room }>("create_room", {
      player_id,
      stake_amount,
      selected_cartelas,
      is_private,
    }),
  joinRoom: (code: string, player_id: string, selected_cartelas: number[] = [1]) =>
    call<{ room: Room }>("join_room", { code, player_id, selected_cartelas }),
  leaveRoom: (room_id: string, player_id: string) =>
    call("leave_room", { room_id, player_id }),
  tickLobby: (room_id: string) => call("tick_lobby", { room_id }),
  callNext: (room_id: string) => call("call_next", { room_id }),
  setAutoFill: (room_id: string, player_id: string, auto_fill: boolean) =>
    call("set_auto_fill", { room_id, player_id, auto_fill }),
  markNumber: (room_id: string, player_id: string, number: number) =>
    call("mark_number", { room_id, player_id, number }),
  verifyBingo: (room_id: string, host_player_id: string, approve = true) =>
    call("verify_bingo", { room_id, host_player_id, approve }),
  claimBingo: (room_id: string, player_id: string) =>
    call<{ winner: boolean; pending?: boolean; payout: number; line: string }>("claim_bingo", {
      room_id,
      player_id,
    }),
};

// 75-ball helpers
export function letterFor(n: number): "B" | "I" | "N" | "G" | "O" {
  if (n <= 15) return "B";
  if (n <= 30) return "I";
  if (n <= 45) return "N";
  if (n <= 60) return "G";
  return "O";
}
