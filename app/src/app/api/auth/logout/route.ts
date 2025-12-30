import { NextResponse } from "next/server";

export async function POST() {
  // Criar resposta
  const response = NextResponse.json(
    { success: true, message: "Logout realizado com sucesso" },
    { status: 200 }
  );

  // Remover cookie de autenticação
  response.cookies.set({
    name: "auth-token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
