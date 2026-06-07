export type SessionUser = {
  id: string;
  username: string;
  name: string;
  isAdmin: boolean;
};

export type MatchStatus = "scheduled" | "finished";

export type MatchRow = {
  id: string;
  round: string;
  kickoff_at: string;
  stadium: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
};

export type PredictionRow = {
  id: string;
  participant_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  points: number;
  created_at: string;
  updated_at: string;
};

export type ParticipantRow = {
  id: string;
  username: string;
  name: string;
  password_hash: string;
  is_active: boolean;
  created_at: string;
};
