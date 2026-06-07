import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/db";
import { routeError } from "@/lib/http";
import { setSession } from "@/lib/session";
import { verifyPassword } from "@/lib/crypto";

export async function POST(request: Request) {
  try {
    const { username, password } = (await request.json()) as {
      username?: string;
      password?: string;
    };

    if (!username || !password) {
      throw new Error("Informe usuario e senha.");
    }

    const normalizedUsername = username.trim().toLowerCase();
    const adminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (adminUsername && adminPassword && normalizedUsername === adminUsername && password === adminPassword) {
      setSession({
        id: "admin",
        username: adminUsername,
        name: "Administrador",
        isAdmin: true
      });

      return NextResponse.json({ ok: true });
    }

    const supabase = getSupabaseAdmin();
    const { data: participant, error } = await supabase
      .from("participants")
      .select("*")
      .eq("username", normalizedUsername)
      .eq("is_active", true)
      .single();

    if (error || !participant || !verifyPassword(password, participant.password_hash)) {
      throw new Error("Usuario ou senha invalidos.");
    }

    setSession({
      id: participant.id,
      username: participant.username,
      name: participant.name,
      isAdmin: false
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return routeError(error);
  }
}
