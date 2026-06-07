import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db";
import { routeError } from "@/lib/http";
import { requireSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const user = requireSession();

    if (user.isAdmin) {
      throw new Error("Administrador nao envia palpites.");
    }

    const { matchId, homeScore, awayScore } = (await request.json()) as {
      matchId?: string;
      homeScore?: number;
      awayScore?: number;
    };

    if (!matchId || !Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
      throw new Error("Informe um placar valido.");
    }

    if (homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
      throw new Error("O placar precisa ficar entre 0 e 20 gols.");
    }

    const supabase = getSupabaseAdmin();
    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchError || !match) throw new Error("Jogo nao encontrado.");
    if (match.status !== "scheduled") throw new Error("Este jogo ja foi encerrado.");
    if (new Date(match.kickoff_at).getTime() <= Date.now()) {
      throw new Error("Palpites bloqueados para este jogo.");
    }

    const { error } = await supabase.from("predictions").upsert(
      {
        participant_id: user.id,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        points: 0,
        updated_at: new Date().toISOString()
      },
      { onConflict: "participant_id,match_id" }
    );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
