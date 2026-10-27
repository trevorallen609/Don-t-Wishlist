"use client";

import { useCallback, useEffect, useId, useState } from "react";

const STORAGE_KEY = "dw-onboarding-v1";

type Step = 0 | 1;

function readDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "done";
  } catch {
    return false;
  }
}

export function OnboardingModal() {
  const titleId = useId();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    setReady(true);
    setOpen(!readDismissed());
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "done");
    } catch {
      /* private mode — still close */
    }
    setOpen(false);
  }, []);

  const next = useCallback(() => {
    setStep(1);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, dismiss]);

  if (!ready || !open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Dismiss story"
        className="absolute inset-0 bg-[#05070a]/75 backdrop-blur-md"
        onClick={dismiss}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(92vh,760px)] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-line/80 bg-panel shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        <div className="h-1 w-full bg-gradient-to-r from-signal via-warn to-go" />

        <div className="flex items-start justify-between gap-4 px-5 pb-0 pt-4 sm:px-7 sm:pt-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-mist">
            Why this exists · {step + 1} / 2
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md border border-line px-2.5 py-1 text-xs text-mist hover:border-foam/40 hover:text-foam"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          {step === 0 ? (
            <article className="space-y-4">
              <p className="font-display text-3xl leading-[1.05] tracking-tight text-foam sm:text-4xl" id={titleId}>
                After 6pm, Jonas came back from school.
              </p>
              <p className="text-[15px] leading-relaxed text-mist sm:text-base">
                He opened Steam. A live sale was screaming orange banners. He had{" "}
                <span className="text-foam">$15</span> in his inventory and a
                wishlist that looked like a second job. Every tile said{" "}
                <em className="text-foam">you’ll love this</em>. None of them
                mentioned the twelve games he already bought and quietly
                abandoned after an hour.
              </p>
              <p className="text-[15px] leading-relaxed text-mist sm:text-base">
                He could afford one. Maybe two if he picked the cheap ones.
                The clock on the deal said four hours. His thumbs knew the
                checkout path better than his backlog. That’s the trap: stores
                are built to help you <span className="text-signal">buy</span>.
                Nobody is paid to tell a tired gamer{" "}
                <span className="text-go">don’t</span>.
              </p>
            </article>
          ) : (
            <article className="space-y-4">
              <p className="font-display text-3xl leading-[1.05] tracking-tight text-foam sm:text-[2.15rem]" id={titleId}>
                Don’t Wishlist is Jonas’s $15 bodyguard.
              </p>
              <p className="text-[15px] leading-relaxed text-mist">
                Log what you own —{" "}
                <span className="text-signal">abandoned</span>,{" "}
                <span className="text-warn">playing</span>,{" "}
                <span className="text-go">finished</span> — then paste the sale.
                We score titles against <em>your</em> graveyard, not the
                storefront’s hype.
              </p>
              <ul className="space-y-2 rounded-xl border border-line/80 bg-ink/50 px-4 py-3 text-sm leading-relaxed text-mist">
                <li>
                  <span className="text-signal">3 hard nos</span> — FOMO, genre
                  traps, games you’ll bounce on.
                </li>
                <li>
                  <span className="text-go">1 reluctant yes</span> — the only
                  title your backlog can support. Short, finishable, cheap.
                  Sometimes: buy nothing.
                </li>
                <li>
                  Mark{" "}
                  <span className="text-foam">correct / wrong / too safe</span>{" "}
                  so the next sale gets stricter, not louder.
                </li>
              </ul>
              <p className="text-[15px] leading-relaxed text-mist">
                Jonas still spends the $15 — on the game that survives his
                history, not the prettiest banner.
              </p>
            </article>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line/80 bg-ink/40 px-5 py-4 sm:px-7">
          <div className="flex gap-1.5" aria-hidden>
            <span className={`h-1.5 w-6 rounded-full ${step === 0 ? "bg-signal" : "bg-line"}`} />
            <span className={`h-1.5 w-6 rounded-full ${step === 1 ? "bg-signal" : "bg-line"}`} />
          </div>
          {step === 0 ? (
            <button
              type="button"
              onClick={next}
              className="rounded-md bg-foam px-5 py-2.5 text-sm font-medium text-ink hover:brightness-95"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={dismiss}
              className="rounded-md bg-signal px-5 py-2.5 text-sm font-medium text-ink hover:brightness-110"
            >
              I Understand
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
