import { supabase } from "@/integrations/supabase/client";

export type Player = {
  id: string;
  telegram_id: string;
  username: string;
};

export type Room = {
  id: string;
  code: string;
  host_id: string;
  status: "lobby" | "countdown" | "live" | "paused" | "finished";
  pattern: "full_house";
  call_interval_ms: number;
  current_index: number;
  call_sequence: number[];
  winner_id: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export type RoomPlayer = {
  id: string;
  room_id: string;
  player_id: string;
  ready: boolean;
  card: number[];
  marked: number[];
  joined_at: string;
};

async function call<T = any>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke("game-action", {
    body: { action, ...args },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return data as T;
}

export const api = {
  upsertPlayer: (telegram_id: string, username: string) =>
    call<{ player: Player }>("upsert_player", { telegram_id, username }),
  createRoom: (player_id: string) => call<{ room: Room }>("create_room", { player_id }),
  joinRoom: (code: string, player_id: string) =>
    call<{ room: Room }>("join_room", { code, player_id }),
  leaveRoom: (room_id: string, player_id: string) =>
    call("leave_room", { room_id, player_id }),
  setReady: (room_id: string, player_id: string, ready: boolean) =>
    call("set_ready", { room_id, player_id, ready }),
  regenerateCard: (room_id: string, player_id: string) =>
    call("regenerate_card", { room_id, player_id }),
  startGame: (room_id: string, player_id: string) =>
    call("start_game", { room_id, player_id }),
  callNext: (room_id: string) => call("call_next", { room_id }),
  pauseResume: (room_id: string, player_id: string) =>
    call("pause_resume", { room_id, player_id }),
  endGame: (room_id: string, player_id: string) =>
    call("end_game", { room_id, player_id }),
  markNumber: (room_id: string, player_id: string, number: number) =>
    call("mark_number", { room_id, player_id, number }),
  claimBingo: (room_id: string, player_id: string) =>
    call("claim_bingo", { room_id, player_id }),
  nextRound: (room_id: string, player_id: string) =>
    call("next_round", { room_id, player_id }),
};
