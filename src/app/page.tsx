import Link from "next/link";
import { OnboardingModal } from "@/components/onboarding-modal";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await requireUser();
  if (user) redirect("/library");

  return (
    <div className="min-h-screen">
      <OnboardingModal />
      <SiteHeader />
      <main className="relative mx-auto flex min-h-[calc(100vh-73px)] max-w-5xl flex-col justify-end px-4 pb-16 pt-10 sm:justify-center sm:pb-24">
        <div className="pointer-events-none absolute inset-x-0 top-8 h-px bg-gradient-to-r from-transparent via-signal/50 to-transparent scan-line" />
        <p className="animate-rise font-display text-5xl leading-[0.95] tracking-tight text-foam sm:text-7xl md:text-8xl">
          Don’t
          <br />
          Wishlist
        </p>
        <p className="animate-rise-delay mt-6 max-w-xl text-lg text-mist sm:text-xl">
          Your backlog already voted. This app bullies you out of the next Steam sale.
        </p>
        <div className="animate-rise-delay mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-md bg-signal px-5 py-3 font-medium text-ink hover:brightness-110"
          >
            Build my library
          </Link>
          <Link
            href="/login"
            className="rounded-md border border-line px-5 py-3 text-foam hover:border-foam/40"
          >
            Log in
          </Link>
        </div>
      </main>
    </div>
  );
}
