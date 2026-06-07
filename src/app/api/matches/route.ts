import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db";
import { routeError } from "@/lib/http";
import { requireSession } from "@/lib/session";

export async function GET() {
  try {
    const user = requireSession();
    const supabase = getSupabaseAdmin();

    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff_at", { ascending: true });

    if (matchesError) throw matchesError;

    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions")
      .select("*")
      .eq("participant_id", user.id);

    if (predictionsError && !user.isAdmin) throw predictionsError;

    const predictionByMatch = new Map((predictions ?? []).map((prediction) => [prediction.match_id, prediction]));

    return NextResponse.json({
      matches: (matches ?? []).map((match) => ({
        ...match,
        prediction: predictionByMatch.get(match.id) ?? null,
        locked: new Date(match.kickoff_at).getTime() <= Date.now()
      }))
    });
  } catch (error) {
    return routeError(error);
  }
}
