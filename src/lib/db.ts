import { createClient } from "@supabase/supabase-js";
import type { MatchRow, ParticipantRow, PredictionRow } from "./types";

export type Database = {
  public: {
    Tables: {
      participants: {
        Row: ParticipantRow;
        Insert: Omit<ParticipantRow, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<ParticipantRow>;
        Relationships: [];
      };
      matches: {
        Row: MatchRow;
        Insert: {
          id?: string;
          round: string;
          kickoff_at: string;
          stadium?: string | null;
          home_team: string;
          away_team: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: MatchRow["status"];
        };
        Update: Partial<MatchRow>;
        Relationships: [];
      };
      predictions: {
        Row: PredictionRow;
        Insert: Omit<PredictionRow, "id" | "created_at" | "updated_at" | "points"> & {
          id?: string;
          points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<PredictionRow>;
        Relationships: [
          {
            foreignKeyName: "predictions_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "predictions_participant_id_fkey";
            columns: ["participant_id"];
            isOneToOne: false;
            referencedRelation: "participants";
            referencedColumns: ["id"];
          }
        ];
      };
    };
  };
};

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
