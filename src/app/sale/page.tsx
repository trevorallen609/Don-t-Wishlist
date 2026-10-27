import Link from "next/link";
import { redirect } from "next/navigation";
import { SaleForm } from "@/components/sale-form";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth";
import { countLibrary } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function SalePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const count = await countLibrary(user.id);
  if (count < 3) redirect("/library");

  return (
    <div className="min-h-screen">
      <SiteHeader email={user.email} />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <div>
          <h1 className="font-display text-4xl text-foam">Sale check</h1>
          <p className="mt-2 text-mist">
            Paste what the store wants you to buy. Default answer is no.
          </p>
        </div>
        <SaleForm />
        <p className="text-sm text-mist">
          <Link href="/checks" className="text-foam underline-offset-2 hover:underline">
            View history
          </Link>
        </p>
      </main>
    </div>
  );
}
