"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { scoringRules } from "@/lib/scoring";
import type { SessionUser } from "@/lib/types";
import { getTeamFlag } from "@/lib/worldCup2026";

type MatchWithPrediction = {
  id: string;
  round: string;
  kickoff_at: string;
  stadium: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "finished";
  locked: boolean;
  prediction: null | {
    home_score: number;
    away_score: number;
    points: number;
  };
};

type RankingItem = {
  id: string;
  username: string;
  name: string;
  points: number;
  guesses: number;
};

type Participant = {
  id: string;
  username: string;
  name: string;
  is_active: boolean;
};

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) return Object.fromEntries(headers.entries());
  if (Array.isArray(headers)) return Object.fromEntries(headers);
  return headers;
}

const api = async <T,>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...normalizeHeaders(options?.headers)
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Erro na requisicao.");
  }

  return data as T;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export default function HomePage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"palpites" | "ranking" | "admin">("palpites");
  const [matches, setMatches] = useState<MatchWithPrediction[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const pendingMatches = useMemo(
    () => matches.filter((match) => match.status === "scheduled"),
    [matches]
  );

  const finishedMatches = useMemo(
    () => matches.filter((match) => match.status === "finished"),
    [matches]
  );

  async function refresh() {
    const [matchesData, rankingData] = await Promise.all([
      api<{ matches: MatchWithPrediction[] }>("/api/matches"),
      api<{ ranking: RankingItem[] }>("/api/ranking")
    ]);

    setMatches(matchesData.matches);
    setRanking(rankingData.ranking);

    if (user?.isAdmin) {
      const participantsData = await api<{ participants: Participant[] }>("/api/admin/participants");
      setParticipants(participantsData.participants);
    }
  }

  useEffect(() => {
    api<{ user: SessionUser | null }>("/api/me")
      .then((data) => setUser(data.user))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      refresh().catch((error: Error) => setMessage(error.message));
    }
  }, [user]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: form.get("username"),
          password: form.get("password")
        })
      });

      const data = await api<{ user: SessionUser | null }>("/api/me");
      setUser(data.user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao entrar.");
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    setMatches([]);
    setRanking([]);
    setParticipants([]);
  }

  async function savePrediction(event: FormEvent<HTMLFormElement>, matchId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");

    try {
      await api("/api/predictions", {
        method: "POST",
        body: JSON.stringify({
          matchId,
          homeScore: Number(form.get("homeScore")),
          awayScore: Number(form.get("awayScore"))
        })
      });

      setMessage("Palpite salvo.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar palpite.");
    }
  }

  async function createParticipant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");

    try {
      await api("/api/admin/participants", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          username: form.get("username"),
          password: form.get("password")
        })
      });

      event.currentTarget.reset();
      setMessage("Participante criado.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao criar participante.");
    }
  }

  async function addMatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");

    try {
      await api("/api/admin/matches", {
        method: "POST",
        body: JSON.stringify({
          round: form.get("round"),
          kickoffAt: form.get("kickoffAt"),
          stadium: form.get("stadium"),
          homeTeam: form.get("homeTeam"),
          awayTeam: form.get("awayTeam")
        })
      });

      event.currentTarget.reset();
      setMessage("Jogo cadastrado.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao cadastrar jogo.");
    }
  }

  async function finishMatch(event: FormEvent<HTMLFormElement>, matchId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("");

    try {
      await api("/api/admin/matches", {
        method: "PATCH",
        body: JSON.stringify({
          matchId,
          homeScore: Number(form.get("homeScore")),
          awayScore: Number(form.get("awayScore"))
        })
      });

      setMessage("Resultado salvo e ranking recalculado.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao salvar resultado.");
    }
  }

  async function seedWorldCupSchedule() {
    const confirmed = window.confirm(
      "Isso vai substituir a tabela atual pelos 104 jogos da Copa 2026 e apagar palpites existentes. Continuar?"
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const data = await api<{ count: number }>("/api/admin/seed-world-cup", {
        method: "POST",
        body: JSON.stringify({})
      });

      setMessage(`Tabela completa carregada com ${data.count} jogos.`);
      await refresh();
      setTab("palpites");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Erro ao carregar tabela da Copa.");
    }
  }

  if (loading) {
    return <main className="screen center">Carregando...</main>;
  }

  if (!user) {
    return (
      <main className="login-screen">
        <section className="login-panel">
          <p className="eyebrow">Copa do Mundo 2026</p>
          <h1>Bolao da Copa</h1>
          <form onSubmit={login} className="stack">
            <label>
              Usuario
              <input name="username" autoComplete="username" required />
            </label>
            <label>
              Senha
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            <button type="submit">Entrar</button>
          </form>
          {message ? <p className="alert">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Bolao da Copa 2026</p>
          <h1>{user.name}</h1>
        </div>
        <button className="ghost-button" onClick={logout}>
          Sair
        </button>
      </header>

      <nav className="tabs" aria-label="Navegacao principal">
        <button className={tab === "palpites" ? "active" : ""} onClick={() => setTab("palpites")}>
          Palpites
        </button>
        <button className={tab === "ranking" ? "active" : ""} onClick={() => setTab("ranking")}>
          Ranking
        </button>
        {user.isAdmin ? (
          <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}>
            Admin
          </button>
        ) : null}
      </nav>

      {message ? <p className="status">{message}</p> : null}

      {tab === "palpites" ? (
        <section className="content-grid">
          <div className="hero-band">
            <div>
              <p className="eyebrow">Rumo ao Mundial</p>
              <h2>Copa 2026 completa</h2>
              <p>{matches.length} jogos cadastrados, da fase de grupos ate a final.</p>
            </div>
            <div className="hero-badges">
              <span>🇲🇽 Mexico</span>
              <span>🇺🇸 EUA</span>
              <span>🇨🇦 Canada</span>
            </div>
          </div>
          <div className="stats-grid">
            <div className="summary-band">
              <strong>{pendingMatches.length}</strong>
              <span>abertos para palpite</span>
            </div>
            <div className="summary-band accent">
              <strong>{finishedMatches.length}</strong>
              <span>resultados lancados</span>
            </div>
          </div>
          <div className="match-list">
            {matches.map((match) => (
              <article className="match-card" key={match.id}>
                <div className="match-meta">
                  <span>{match.round}</span>
                  <span>{formatDate(match.kickoff_at)}</span>
                </div>
                <div className="teams">
                  <strong>
                    <span className="flag">{getTeamFlag(match.home_team)}</span>
                    {match.home_team}
                  </strong>
                  <span>x</span>
                  <strong>
                    {match.away_team}
                    <span className="flag">{getTeamFlag(match.away_team)}</span>
                  </strong>
                </div>
                {match.stadium ? <p className="muted">{match.stadium}</p> : null}
                {match.status === "finished" ? (
                  <p className="result">
                    Final: {match.home_score} x {match.away_score}
                    {match.prediction ? ` | seus pontos: ${match.prediction.points}` : ""}
                  </p>
                ) : (
                  <form className="score-form" onSubmit={(event) => savePrediction(event, match.id)}>
                    <input
                      name="homeScore"
                      type="number"
                      min="0"
                      max="20"
                      defaultValue={match.prediction?.home_score ?? ""}
                      disabled={match.locked || user.isAdmin}
                      required
                    />
                    <span>x</span>
                    <input
                      name="awayScore"
                      type="number"
                      min="0"
                      max="20"
                      defaultValue={match.prediction?.away_score ?? ""}
                      disabled={match.locked || user.isAdmin}
                      required
                    />
                    <button disabled={match.locked || user.isAdmin} type="submit">
                      Salvar
                    </button>
                  </form>
                )}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "ranking" ? (
        <section className="content-grid">
          <div className="ranking-list">
            {ranking.map((item, index) => (
              <article className="ranking-row" key={item.id}>
                <span className="position">{index + 1}</span>
                <div>
                  <strong>{item.name}</strong>
                  <p>{item.guesses} palpites</p>
                </div>
                <strong>{item.points} pts</strong>
              </article>
            ))}
          </div>
          <section className="rules">
            <h2>Pontuacao</h2>
            {scoringRules.map((rule) => (
              <p key={rule}>{rule}</p>
            ))}
          </section>
        </section>
      ) : null}

      {tab === "admin" && user.isAdmin ? (
        <section className="admin-grid">
          <section className="panel schedule-panel">
            <h2>Tabela oficial</h2>
            <p className="muted">
              Carrega os 104 jogos da Copa 2026, incluindo fase de grupos, 16 avos, oitavas,
              quartas, semifinais, terceiro lugar e final.
            </p>
            <button type="button" onClick={seedWorldCupSchedule}>
              Carregar Copa 2026 completa
            </button>
          </section>

          <form className="panel stack" onSubmit={createParticipant}>
            <h2>Novo participante</h2>
            <label>
              Nome
              <input name="name" required />
            </label>
            <label>
              Usuario
              <input name="username" required />
            </label>
            <label>
              Senha inicial
              <input name="password" type="password" minLength={6} required />
            </label>
            <button type="submit">Criar participante</button>
          </form>

          <form className="panel stack" onSubmit={addMatch}>
            <h2>Novo jogo</h2>
            <label>
              Fase
              <input name="round" placeholder="Grupo A" required />
            </label>
            <label>
              Data e hora
              <input name="kickoffAt" type="datetime-local" required />
            </label>
            <label>
              Estadio
              <input name="stadium" />
            </label>
            <label>
              Time mandante
              <input name="homeTeam" required />
            </label>
            <label>
              Time visitante
              <input name="awayTeam" required />
            </label>
            <button type="submit">Cadastrar jogo</button>
          </form>

          <section className="panel">
            <h2>Resultados</h2>
            <div className="match-list compact">
              {matches.map((match) => (
                <article className="match-card" key={match.id}>
                  <div className="match-meta">
                    <span>{match.round}</span>
                    <span>{formatDate(match.kickoff_at)}</span>
                  </div>
                  <div className="teams">
                    <strong>
                      <span className="flag">{getTeamFlag(match.home_team)}</span>
                      {match.home_team}
                    </strong>
                    <span>x</span>
                    <strong>
                      {match.away_team}
                      <span className="flag">{getTeamFlag(match.away_team)}</span>
                    </strong>
                  </div>
                  <form className="score-form" onSubmit={(event) => finishMatch(event, match.id)}>
                    <input name="homeScore" type="number" min="0" max="20" defaultValue={match.home_score ?? ""} required />
                    <span>x</span>
                    <input name="awayScore" type="number" min="0" max="20" defaultValue={match.away_score ?? ""} required />
                    <button type="submit">Finalizar</button>
                  </form>
                </article>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>Participantes</h2>
            <div className="participant-list">
              {participants.map((participant) => (
                <p key={participant.id}>
                  <strong>{participant.name}</strong>
                  <span>@{participant.username}</span>
                </p>
              ))}
            </div>
          </section>
        </section>
      ) : null}
    </main>
  );
}
