import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function routeError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return jsonError("Faça login novamente.", 401);
    if (error.message === "FORBIDDEN") return jsonError("Acesso restrito ao administrador.", 403);
    return jsonError(error.message, 400);
  }

  return jsonError("Erro inesperado.", 500);
}
