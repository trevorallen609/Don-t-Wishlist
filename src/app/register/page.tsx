import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { registerAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  if (await requireUser()) redirect("/library");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-3xl text-foam">Create account</h1>
        <p className="mt-2 text-mist">Two minutes to set up. A lifetime of skipped purchases.</p>
        <div className="mt-8">
          <AuthForm action={registerAction} submitLabel="Create account" />
        </div>
        <p className="mt-6 text-sm text-mist">
          Already in?{" "}
          <Link href="/login" className="text-signal hover:underline">
            Log in
          </Link>
        </p>
      </main>
    </div>
  );
}
