import Link from "next/link";
import { redirect } from "next/navigation";
import { EvalStrip } from "@/components/eval-strip";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRecentVerdicts } from "@/lib/queries";
import { parseSaleResult } from "@/lib/parse";

export const dynamic = "force-dynamic";

export default async function ChecksPage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const [checks, verdicts] = await Promise.all([
    prisma.saleCheck.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    getRecentVerdicts(user.id, 100),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader email={user.email} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl text-foam">History</h1>
            <p className="mt-2 text-mist">Past refusals and reluctant exceptions.</p>
          </div>
          <Link href="/sale" className="text-sm text-signal hover:underline">
            New check
          </Link>
        </div>

        <EvalStrip verdicts={verdicts} />

        <ul className="space-y-3">
          {checks.map((c) => {
            const parsed = parseSaleResult(c.result);
            const summary = parsed.ok ? parsed.value.summary : "Unreadable check";
            const engine = parsed.ok ? parsed.value.engine : "rules";
            const dollars = parsed.ok ? parsed.value.dollarsRefused : 0;
            const fp = parsed.ok ? parsed.value.inputFingerprint : "—";

            return (
              <li key={c.id}>
                <Link
                  href={`/checks/${c.id}`}
                  className="block border border-line bg-panel/50 px-4 py-3 hover:border-foam/30"
                >
                  <p className="text-foam">{summary}</p>
                  <p className="mt-1 text-xs text-mist">
                    {new Date(c.createdAt).toLocaleString()} · {engine} · $
                    {dollars.toFixed(2)} refused · fp {fp}
                  </p>
                </Link>
              </li>
            );
          })}
          {checks.length === 0 ? (
            <li className="border border-dashed border-line px-4 py-8 text-center text-mist">
              No checks yet.
            </li>
          ) : null}
        </ul>
      </main>
    </div>
  );
}
