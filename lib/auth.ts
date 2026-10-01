import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { JWTPayload } from "jose";

// 1. Buat interface yang memperluas (extend) JWTPayload bawaan jose
export interface UserPayload extends JWTPayload {
  id?: string | number;
  name?: string;
  email?: string;
  role?: string;
}

// 2. Berikan tipe return Promise<UserPayload | null> pada fungsi
export async function getCurrentUser(): Promise<UserPayload | null> {
  const cookieStore = await cookies();

  const token = cookieStore.get("session")?.value;

  if (!token) {
    return null;
  }

  const session = await verifySession(token);

  if (!session) {
    return null;
  }

  // 3. Assertion tipe data session menjadi UserPayload
  return session as UserPayload;
}