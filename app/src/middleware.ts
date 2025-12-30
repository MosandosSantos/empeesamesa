import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, getTokenFromCookie } from "@/lib/auth";

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ["/login", "/logout"];

// Rotas de API públicas
const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/logout"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso a arquivos estáticos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Permitir rotas de API públicas
  if (PUBLIC_API_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Obter token do cookie
  const cookieHeader = request.headers.get("cookie");
  const token = getTokenFromCookie(cookieHeader);

  // Se está tentando acessar a página de logout, sempre permitir
  if (pathname === "/logout") {
    return NextResponse.next();
  }

  // Se está tentando acessar a página de login
  if (pathname === "/login") {
    // Se já está autenticado, redirecionar para o dashboard
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
    // Se não está autenticado, permitir acesso à página de login
    return NextResponse.next();
  }

  // Se não tem token, redirecionar para login
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verificar se o token é válido
  const payload = await verifyToken(token);

  if (!payload) {
    // Token inválido, redirecionar para login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);

    // Limpar cookie inválido
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("auth-token");

    return response;
  }

  // Token válido, permitir acesso
  return NextResponse.next();
}

// Configurar quais rotas o middleware deve ser executado
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
