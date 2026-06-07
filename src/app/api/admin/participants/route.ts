import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db";
import { hashPassword } from "@/lib/crypto";
import { routeError } from "@/lib/http";
import { requireAdmin } from "@/lib/session";

export async function GET() {
  try {
    requireAdmin();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("participants")
      .select("id, username, name, is_active, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return NextResponse.json({ participants: data ?? [] });
  } catch (error) {
    return routeError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireAdmin();
    const { name, username, password } = (await request.json()) as {
      name?: string;
      username?: string;
      password?: string;
    };

    if (!name || !username || !password) {
      throw new Error("Informe nome, usuario e senha.");
    }

    if (password.length < 6) {
      throw new Error("A senha precisa ter pelo menos 6 caracteres.");
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("participants").insert({
      name: name.trim(),
      username: username.trim().toLowerCase(),
      password_hash: hashPassword(password),
      is_active: true
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
