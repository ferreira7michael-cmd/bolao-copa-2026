import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db";
import { routeError } from "@/lib/http";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    requireSession();
    const supabase = getSupabaseAdmin();

    const { data: participants, error: participantsError } = await supabase
      .from("participants")
      .select("id, username, name, is_active")
      .eq("is_active", true);

    if (participantsError) throw participantsError;

    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions")
      .select("participant_id, points");

    if (predictionsError) throw predictionsError;

    const totals = new Map<string, { points: number; guesses: number }>();

    for (const prediction of predictions ?? []) {
      const current = totals.get(prediction.participant_id) ?? { points: 0, guesses: 0 };
      totals.set(prediction.participant_id, {
        points: current.points + prediction.points,
        guesses: current.guesses + 1
      });
    }

    const ranking = (participants ?? [])
      .map((participant) => ({
        id: participant.id,
        username: participant.username,
        name: participant.name,
        points: totals.get(participant.id)?.points ?? 0,
        guesses: totals.get(participant.id)?.guesses ?? 0
      }))
      .sort((a, b) => b.points - a.points || b.guesses - a.guesses || a.name.localeCompare(b.name));

    return NextResponse.json({ ranking });
  } catch (error) {
    return routeError(error);
  }
}
