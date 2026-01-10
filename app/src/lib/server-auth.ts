import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { getUserFromPayload } from "@/lib/api-auth";

export async function getCurrentUser() {
  const token = (await cookies()).get("auth-token")?.value ?? null;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  return getUserFromPayload(payload);
}
