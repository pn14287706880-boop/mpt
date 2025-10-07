"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/auth/session";

import type { AuthActionState } from "@/actions/auth-state";

const credentialsSchema = z.object({
  email: z
    .string()
    .email("Please provide a valid email")
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, "Password needs to be at least 8 characters long")
    .max(128, "Password cannot exceed 128 characters"),
});

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const { email, password } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { message: "An account with that email already exists" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  await createSession(user.id);
  redirect("/");
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = credentialsSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: parsed.error.issues[0]?.message ?? "Invalid credentials" };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "Incorrect email or password" };
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return { message: "Incorrect email or password" };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await deleteSession();
  redirect("/");
}
