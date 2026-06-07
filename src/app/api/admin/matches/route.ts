import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db";
import { routeError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";
import { calculatePoints } from "@/lib/scoring";

export async function POST(request: Request) {
  try {
    requireAdmin();
    const { round, kickoffAt, stadium, homeTeam, awayTeam } = (await request.json()) as {
      round?: string;
      kickoffAt?: string;
      stadium?: string;
      homeTeam?: string;
      awayTeam?: string;
    };

    if (!round || !kickoffAt || !homeTeam || !awayTeam) {
      throw new Error("Informe fase, data, mandante e visitante.");
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("matches").insert({
      round: round.trim(),
      kickoff_at: new Date(kickoffAt).toISOString(),
      stadium: stadium?.trim() || null,
      home_team: homeTeam.trim(),
      away_team: awayTeam.trim(),
      home_score: null,
      away_score: null,
      status: "scheduled"
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    requireAdmin();
    const { matchId, homeScore, awayScore } = (await request.json()) as {
      matchId?: string;
      homeScore?: number;
      awayScore?: number;
    };

    if (
      !matchId ||
      typeof homeScore !== "number" ||
      typeof awayScore !== "number" ||
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore)
    ) {
      throw new Error("Informe o jogo e o placar final.");
    }

    if (homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
      throw new Error("O placar precisa ficar entre 0 e 20 gols.");
    }

    const supabase = getSupabaseAdmin();

    const { error: matchError } = await supabase
      .from("matches")
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: "finished"
      })
      .eq("id", matchId);

    if (matchError) throw matchError;

    const { data: predictions, error: predictionsError } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", matchId);

    if (predictionsError) throw predictionsError;

    for (const prediction of predictions ?? []) {
      const points = calculatePoints(
        { home: prediction.home_score, away: prediction.away_score },
        { home: homeScore, away: awayScore }
      );

      const { error } = await supabase.from("predictions").update({ points }).eq("id", prediction.id);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
