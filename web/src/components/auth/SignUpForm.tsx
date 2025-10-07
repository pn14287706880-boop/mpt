"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signUpAction } from "@/actions/auth";
import { authDefaultState } from "@/actions/auth-state";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="auth-button" type="submit" disabled={pending}>
      {pending ? "Creating account..." : label}
    </button>
  );
}

export default function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, authDefaultState);

  return (
    <form className="auth-card" action={formAction}>
      <h1>Create an account</h1>
      <p className="auth-subtitle">Sign up with your email address</p>

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
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="••••••••"
      />

      {state.message ? (
        <p className="auth-message" role="alert">
          {state.message}
        </p>
      ) : null}

      <SubmitButton label="Sign up" />

      <p className="auth-footer">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </form>
  );
}
