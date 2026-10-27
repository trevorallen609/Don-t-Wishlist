import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { SiteHeader } from "@/components/site-header";
import { loginAction } from "@/lib/actions";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  if (await requireUser()) redirect("/library");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-12">
        <h1 className="font-display text-3xl text-foam">Log in</h1>
        <p className="mt-2 text-mist">Back to bullying your wishlist.</p>
        <div className="mt-8">
          <AuthForm action={loginAction} submitLabel="Log in" />
        </div>
        <p className="mt-6 text-sm text-mist">
          No account?{" "}
          <Link href="/register" className="text-signal hover:underline">
            Register
          </Link>
        </p>
      </main>
    </div>
  );
}
