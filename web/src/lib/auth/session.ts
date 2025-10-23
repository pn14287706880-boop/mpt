import { cache } from "react";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "mpt_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export const getCurrentSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt <= new Date()) {
    return null;
  }

  return session;
});

export const getCurrentUser = cache(async () => {
  const session = await getCurrentSession();
  return session?.user ?? null;
});

export async function createSession(userId: string) {
  const sessionToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.deleteMany({ where: { userId } });
  await prisma.session.create({
    data: {
      token: sessionToken,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    // Only use secure cookies if HTTPS is available
    // Internal servers on HTTP (like :8501) should use secure: false
    secure: process.env.FORCE_SECURE_COOKIES === "true" || false,
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
