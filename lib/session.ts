import { SignJWT, jwtVerify } from "jose";

function getSecretKey() {
  const secretKey = process.env.SESSION_SECRET;

  if (!secretKey) {
    throw new Error("SESSION_SECRET belum diatur");
  }

  return new TextEncoder().encode(secretKey);
}

export async function createSession(userId: number, role: string) {
  const token = await new SignJWT({
    userId,
    role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(getSecretKey());

  return token;
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());

    return payload;
  } catch {
    return null;
  }
}