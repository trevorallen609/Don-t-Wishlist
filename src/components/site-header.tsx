import Link from "next/link";
import { logoutAction } from "@/lib/actions";

type Props = {
  email?: string | null;
};

export function SiteHeader({ email }: Props) {
  return (
    <header className="border-b border-line/80 bg-ink/40 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href={email ? "/library" : "/"} className="font-display text-xl tracking-tight text-foam">
          Don’t Wishlist
        </Link>
        <nav className="flex items-center gap-4 text-sm text-mist">
          {email ? (
            <>
              <Link href="/library" className="hover:text-foam">
                Library
              </Link>
              <Link href="/sale" className="hover:text-foam">
                Sale check
              </Link>
              <Link href="/checks" className="hover:text-foam">
                History
              </Link>
              <span className="hidden text-mist/70 sm:inline">{email}</span>
              <form action={logoutAction}>
                <button type="submit" className="text-signal hover:underline">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-foam">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-signal px-3 py-1.5 font-medium text-ink hover:brightness-110"
              >
                Start
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
