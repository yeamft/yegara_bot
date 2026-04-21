// Authoritative game engine for 100-ball Bingo
// All mutations go through this edge function. Clients never write game state directly.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function shuffled1to100(): number[] {
  const arr = Array.from({ length: 100 }, (_, i) => i + 1);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateCard(): number[] {
  // 15 unique numbers 1-100, sorted ascending for nice display
  const pool = Array.from({ length: 100 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 15).sort((a, b) => a - b);
}

function genRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++)
    s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function audit(
  room_id: string | null,
  player_id: string | null,
  action: string,
  payload: unknown,
) {
  await supabase
    .from("audit_log")
    .insert({ room_id, player_id, action, payload });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const { action, ...args } = await req.json();

    switch (action) {
      case "upsert_player": {
        const { telegram_id, username } = args;
        if (!telegram_id || !username)
          return json({ error: "missing identity" }, 400);
        const { data: existing } = await supabase
          .from("players")
          .select("*")
          .eq("telegram_id", String(telegram_id))
          .maybeSingle();
        if (existing) {
          if (existing.username !== username) {
            await supabase
              .from("players")
              .update({ username })
              .eq("id", existing.id);
            existing.username = username;
          }
          return json({ player: existing });
        }
        const { data, error } = await supabase
          .from("players")
          .insert({ telegram_id: String(telegram_id), username })
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        return json({ player: data });
      }

      case "create_room": {
        const { player_id } = args;
        if (!player_id) return json({ error: "missing player_id" }, 400);
        // unique code with retry
        let code = "";
        for (let i = 0; i < 5; i++) {
          code = genRoomCode();
          const { data: dup } = await supabase
            .from("rooms")
            .select("id")
            .eq("code", code)
            .maybeSingle();
          if (!dup) break;
        }
        const { data: room, error } = await supabase
          .from("rooms")
          .insert({ code, host_id: player_id, call_sequence: shuffled1to100() })
          .select()
          .single();
        if (error) return json({ error: error.message }, 500);
        // host auto-joins with a card
        await supabase.from("room_players").insert({
          room_id: room.id,
          player_id,
          card: generateCard(),
        });
        await audit(room.id, player_id, "create_room", { code });
        return json({ room });
      }

      case "join_room": {
        const { code, player_id } = args;
        if (!code || !player_id)
          return json({ error: "missing fields" }, 400);
        const { data: room } = await supabase
          .from("rooms")
          .select("*")
          .eq("code", String(code).toUpperCase())
          .maybeSingle();
        if (!room) return json({ error: "Room not found" }, 404);
        if (room.status !== "lobby" && room.status !== "live")
          return json({ error: "Room not joinable" }, 400);

        const { data: existing } = await supabase
          .from("room_players")
          .select("*")
          .eq("room_id", room.id)
          .eq("player_id", player_id)
          .maybeSingle();
        if (!existing) {
          await supabase.from("room_players").insert({
            room_id: room.id,
            player_id,
            card: generateCard(),
          });
          await audit(room.id, player_id, "join_room", {});
        }
        return json({ room });
      }

      case "leave_room": {
        const { room_id, player_id } = args;
        await supabase
          .from("room_players")
          .delete()
          .eq("room_id", room_id)
          .eq("player_id", player_id);
        await audit(room_id, player_id, "leave_room", {});
        return json({ ok: true });
      }

      case "set_ready": {
        const { room_id, player_id, ready } = args;
        await supabase
          .from("room_players")
          .update({ ready: !!ready })
          .eq("room_id", room_id)
          .eq("player_id", player_id);
        return json({ ok: true });
      }

      case "regenerate_card": {
        const { room_id, player_id } = args;
        const { data: room } = await supabase
          .from("rooms")
          .select("status")
          .eq("id", room_id)
          .maybeSingle();
        if (!room || room.status !== "lobby")
          return json({ error: "Cards locked once game starts" }, 400);
        await supabase
          .from("room_players")
          .update({ card: generateCard(), marked: [] })
          .eq("room_id", room_id)
          .eq("player_id", player_id);
        return json({ ok: true });
      }

      case "start_game": {
        const { room_id, player_id } = args;
        const { data: room } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", room_id)
          .maybeSingle();
        if (!room) return json({ error: "Room not found" }, 404);
        if (room.host_id !== player_id)
          return json({ error: "Only host can start" }, 403);
        if (room.status !== "lobby")
          return json({ error: "Game already started" }, 400);
        const { count } = await supabase
          .from("room_players")
          .select("*", { count: "exact", head: true })
          .eq("room_id", room_id);
        if (!count || count < 1)
          return json({ error: "Need at least 1 player" }, 400);

        await supabase
          .from("rooms")
          .update({
            status: "live",
            started_at: new Date().toISOString(),
            current_index: -1,
            call_sequence: shuffled1to100(),
            winner_id: null,
          })
          .eq("id", room_id);
        // reset all marks
        await supabase
          .from("room_players")
          .update({ marked: [] })
          .eq("room_id", room_id);
        await audit(room_id, player_id, "start_game", {});
        return json({ ok: true });
      }

      case "call_next": {
        // Anyone in the room can trigger the tick; we use timestamp guard later if needed.
        const { room_id } = args;
        const { data: room } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", room_id)
          .maybeSingle();
        if (!room) return json({ error: "Room not found" }, 404);
        if (room.status !== "live") return json({ ok: true, skipped: true });
        const next = room.current_index + 1;
        if (next >= room.call_sequence.length) {
          await supabase
            .from("rooms")
            .update({
              status: "finished",
              finished_at: new Date().toISOString(),
            })
            .eq("id", room_id);
          return json({ ok: true, finished: true });
        }
        await supabase
          .from("rooms")
          .update({ current_index: next })
          .eq("id", room_id);
        return json({ ok: true, index: next });
      }

      case "pause_resume": {
        const { room_id, player_id } = args;
        const { data: room } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", room_id)
          .maybeSingle();
        if (!room || room.host_id !== player_id)
          return json({ error: "forbidden" }, 403);
        const next = room.status === "live" ? "paused" : "live";
        if (room.status !== "live" && room.status !== "paused")
          return json({ error: "not running" }, 400);
        await supabase
          .from("rooms")
          .update({ status: next })
          .eq("id", room_id);
        await audit(room_id, player_id, "pause_resume", { next });
        return json({ ok: true, status: next });
      }

      case "end_game": {
        const { room_id, player_id } = args;
        const { data: room } = await supabase
          .from("rooms")
          .select("host_id")
          .eq("id", room_id)
          .maybeSingle();
        if (!room || room.host_id !== player_id)
          return json({ error: "forbidden" }, 403);
        await supabase
          .from("rooms")
          .update({
            status: "finished",
            finished_at: new Date().toISOString(),
          })
          .eq("id", room_id);
        return json({ ok: true });
      }

      case "mark_number": {
        const { room_id, player_id, number } = args;
        const { data: room } = await supabase
          .from("rooms")
          .select("call_sequence,current_index,status")
          .eq("id", room_id)
          .maybeSingle();
        if (!room) return json({ error: "Room not found" }, 404);
        if (room.status !== "live")
          return json({ error: "Game not live" }, 400);
        const called = room.call_sequence.slice(0, room.current_index + 1);
        if (!called.includes(number))
          return json({ error: "Number not called yet" }, 400);

        const { data: rp } = await supabase
          .from("room_players")
          .select("card,marked")
          .eq("room_id", room_id)
          .eq("player_id", player_id)
          .maybeSingle();
        if (!rp) return json({ error: "Not in room" }, 404);
        if (!rp.card.includes(number))
          return json({ error: "Not on your card" }, 400);
        if (rp.marked.includes(number)) return json({ ok: true });

        const marked = [...rp.marked, number];
        await supabase
          .from("room_players")
          .update({ marked })
          .eq("room_id", room_id)
          .eq("player_id", player_id);
        return json({ ok: true });
      }

      case "claim_bingo": {
        const { room_id, player_id } = args;
        const { data: room } = await supabase
          .from("rooms")
          .select("*")
          .eq("id", room_id)
          .maybeSingle();
        if (!room) return json({ error: "Room not found" }, 404);
        if (room.status !== "live")
          return json({ error: "Game not live" }, 400);
        if (room.winner_id) return json({ error: "Already won" }, 400);

        const { data: rp } = await supabase
          .from("room_players")
          .select("card,marked")
          .eq("room_id", room_id)
          .eq("player_id", player_id)
          .maybeSingle();
        if (!rp) return json({ error: "Not in room" }, 404);

        const called = new Set(
          room.call_sequence.slice(0, room.current_index + 1),
        );
        // full_house: every card number must be called AND marked
        const allCalled = rp.card.every((n: number) => called.has(n));
        const allMarked = rp.card.every((n: number) => rp.marked.includes(n));
        if (!allCalled || !allMarked) {
          await audit(room_id, player_id, "claim_invalid", {
            allCalled,
            allMarked,
          });
          return json({ error: "Invalid bingo" }, 400);
        }

        await supabase
          .from("rooms")
          .update({
            status: "finished",
            winner_id: player_id,
            finished_at: new Date().toISOString(),
          })
          .eq("id", room_id);
        await audit(room_id, player_id, "claim_valid", {});
        return json({ ok: true, winner: true });
      }

      case "next_round": {
        const { room_id, player_id } = args;
        const { data: room } = await supabase
          .from("rooms")
          .select("host_id,status")
          .eq("id", room_id)
          .maybeSingle();
        if (!room || room.host_id !== player_id)
          return json({ error: "forbidden" }, 403);
        await supabase
          .from("rooms")
          .update({
            status: "lobby",
            current_index: -1,
            call_sequence: shuffled1to100(),
            winner_id: null,
            started_at: null,
            finished_at: null,
          })
          .eq("id", room_id);
        await supabase
          .from("room_players")
          .update({ marked: [], card: generateCard(), ready: false })
          .eq("room_id", room_id);
        return json({ ok: true });
      }

      default:
        return json({ error: "unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
