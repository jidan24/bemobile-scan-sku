import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secretKey = process.env.JWT_SECRET || "super-secret-key-for-mobile-livo-1234567890";
const key = new TextEncoder().encode(secretKey);

export async function signJWT(payload: JWTPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d") // Token valid 30 hari untuk mobile app
    .sign(key);
}

export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, key);
    return payload;
  } catch {
    return null;
  }
}
