import Link from "next/link";
import { redirect } from "next/navigation";
import { GameForm } from "@/components/game-form";
import { LibraryList } from "@/components/library-list";
import { SiteHeader } from "@/components/site-header";
import { seedSampleLibraryAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { getLibraryGames, summarizeLibrary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const games = await getLibraryGames(user.id);
  const summary = summarizeLibrary(games);

  return (
    <div className="min-h-screen">
      <SiteHeader email={user.email} />
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-foam">Library</h1>
            <p className="mt-2 text-mist">
              Status matters. Abandoned games are the evidence for every hard no.
            </p>
            <p className="mt-1 text-xs text-mist">
              {summary.abandoned} abandoned · {summary.playing} playing ·{" "}
              {summary.finished} finished
            </p>
          </div>
          {games.length >= 3 ? (
            <Link
              href="/sale"
              className="rounded-md bg-signal px-4 py-2 font-medium text-ink hover:brightness-110"
            >
              Run sale check →
            </Link>
          ) : (
            <p className="text-sm text-warn">Add at least 3 games to unlock sale checks.</p>
          )}
        </div>

        <GameForm />

        {games.length === 0 ? (
          <form action={seedSampleLibraryAction}>
            <button
              type="submit"
              className="rounded-md border border-line px-4 py-2 text-sm text-mist hover:border-foam/40 hover:text-foam"
            >
              Load sample backlog (demo)
            </button>
          </form>
        ) : null}

        <LibraryList games={games} />
      </main>
    </div>
  );
}
