import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
);

export interface JWTPayload {
  userId: string;
  email: string;
  tenantId: string;
}

/**
 * Gera hash da senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verifica se a senha corresponde ao hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Cria um JWT token com validade de 7 dias
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verifica e decodifica um JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    const payload = verified.payload;

    // Verificar se o payload tem os campos necessários
    if (
      typeof payload.userId === "string" &&
      typeof payload.email === "string" &&
      typeof payload.tenantId === "string"
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        tenantId: payload.tenantId,
      };
    }

    return null;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/**
 * Extrai o token do cookie
 */
export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  const authCookie = cookies.find((c) => c.startsWith("auth-token="));

  if (!authCookie) return null;

  return authCookie.split("=")[1];
}
