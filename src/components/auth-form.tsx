"use client";

import { useActionState, useMemo } from "react";
import type { ActionState } from "@/lib/result";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
};

export function AuthForm({ action, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  const buttonText = useMemo(
    () => (pending ? "Working…" : submitLabel),
    [pending, submitLabel],
  );

  return (
    <form action={formAction} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-sm text-mist">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-line bg-ink/60 px-3 py-2 outline-none ring-signal/40 focus:ring-2"
          placeholder="you@example.com"
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm text-mist">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          className="w-full rounded-md border border-line bg-ink/60 px-3 py-2 outline-none ring-signal/40 focus:ring-2"
          placeholder="••••••••"
        />
      </label>
      {state.error ? (
        <p className="text-sm text-signal" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-signal px-4 py-2.5 font-medium text-ink transition hover:brightness-110 disabled:opacity-60"
      >
        {buttonText}
      </button>
    </form>
  );
}
