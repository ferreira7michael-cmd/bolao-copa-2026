import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db";
import { routeError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { worldCup2026Schedule } from "@/lib/worldCup2026";

export async function POST() {
  try {
    requireAdmin();
    const supabase = getSupabaseAdmin();

    const { error: predictionsError } = await supabase
      .from("predictions")
      .delete()
      .gte("created_at", "1900-01-01");

    if (predictionsError) throw predictionsError;

    const { error: matchesError } = await supabase
      .from("matches")
      .delete()
      .gte("kickoff_at", "1900-01-01");

    if (matchesError) throw matchesError;

    const { error: insertError } = await supabase.from("matches").insert(
      worldCup2026Schedule.map((match) => ({
        round: match.round,
        kickoff_at: match.kickoff_at,
        stadium: match.stadium,
        home_team: match.home_team,
        away_team: match.away_team,
        home_score: null,
        away_score: null,
        status: "scheduled"
      }))
    );

    if (insertError) throw insertError;

    return NextResponse.json({
      ok: true,
      count: worldCup2026Schedule.length
    });
  } catch (error) {
    return routeError(error);
  }
}
