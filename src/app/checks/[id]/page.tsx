import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ProvenanceBar } from "@/components/provenance-bar";
import { RefusalCard } from "@/components/refusal-card";
import { SiteHeader } from "@/components/site-header";
import { regenerateSaleCheckAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseCandidates, parseSaleResult } from "@/lib/parse";
import { GameCover } from "@/components/game-cover";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CheckDetailPage({ params }: Props) {
  const user = await requireUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const check = await prisma.saleCheck.findFirst({
    where: { id, userId: user.id },
    include: { verdicts: { orderBy: { createdAt: "desc" } } },
  });
  if (!check) notFound();

  const resultParsed = parseSaleResult(check.result);
  const candidatesParsed = parseCandidates(check.candidates);
  if (!resultParsed.ok || !candidatesParsed.ok) notFound();

  const result = resultParsed.value;
  const candidates = candidatesParsed.value;

  return (
    <div className="min-h-screen">
      <SiteHeader email={user.email} />
      <main className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <div>
          <p className="text-sm text-mist">
            <Link href="/checks" className="hover:text-foam">
              ← History
            </Link>
          </p>
          <h1 className="mt-2 font-display text-4xl text-foam">Verdict</h1>
          <p className="mt-3 text-lg text-mist">{result.summary}</p>
        </div>

        <ProvenanceBar
          fingerprint={result.inputFingerprint}
          dollarsRefused={result.dollarsRefused}
          engine={result.engine}
          scoredAt={result.scoredAt}
        />

        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-[0.2em] text-signal">Hard nos</h2>
          {result.hardNos.map((item) => (
            <RefusalCard
              key={item.title}
              item={item}
              saleCheckId={check.id}
              tone="no"
            />
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-[0.2em] text-go">Reluctant yes</h2>
          {result.buyNothing || !result.reluctantYes ? (
            <p className="border border-line bg-panel/40 px-4 py-3 text-mist">
              Buy nothing. Protect the backlog. You just refused $
              {result.dollarsRefused.toFixed(2)}.
            </p>
          ) : (
            <RefusalCard
              item={result.reluctantYes}
              saleCheckId={check.id}
              tone="yes"
            />
          )}
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-[0.2em] text-mist">Candidates</h2>
          <ul className="mt-3 space-y-2">
            {candidates.map((c) => (
              <li key={c.title} className="flex items-center gap-3 text-sm text-mist">
                <GameCover title={c.title} size={36} />
                <span>
                  {c.title}
                  {c.price != null ? ` · $${c.price}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {check.verdicts.length > 0 ? (
          <section>
            <h2 className="text-sm uppercase tracking-[0.2em] text-mist">Your marks</h2>
            <ul className="mt-2 space-y-1 text-sm text-mist">
              {check.verdicts.map((v) => (
                <li key={v.id}>
                  {v.itemTitle}: <span className="text-foam">{v.verdict}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <form action={regenerateSaleCheckAction.bind(null, check.id)}>
          <button
            type="submit"
            className="rounded-md border border-line px-4 py-2 text-foam hover:border-foam/40"
          >
            Regenerate with my verdicts
          </button>
          <p className="mt-2 text-xs text-mist">
            Fingerprint changes when verdicts change — proof the loop is real.
          </p>
        </form>
      </main>
    </div>
  );
}
