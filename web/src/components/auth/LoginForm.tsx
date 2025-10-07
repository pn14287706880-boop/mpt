"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { loginAction } from "@/actions/auth";
import { authDefaultState } from "@/actions/auth-state";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="auth-button" type="submit" disabled={pending}>
      {pending ? "Logging in..." : label}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(loginAction, authDefaultState);

  return (
    <form className="auth-card" action={formAction}>
      <h1>Welcome back</h1>
      <p className="auth-subtitle">Use your credentials to access the app</p>

      <label className="auth-label" htmlFor="email">
        Email
      </label>
      <input
        className="auth-input"
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
      />

      <label className="auth-label" htmlFor="password">
        Password
      </label>
      <input
        className="auth-input"
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        minLength={8}
        placeholder="••••••••"
      />

      {state.message ? (
        <p className="auth-message" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Log in" />

      <p className="auth-footer">
        Need an account? <Link href="/signup">Create one</Link>
      </p>
    </form>
  );
}
