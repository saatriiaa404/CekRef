import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/session";

/** Renders the shared top navigation bar and DEMO_MODE notice. */
export async function Navbar() {
  const user = await getCurrentUser();
  const isDemoMode = (process.env.DEMO_MODE ?? "").trim().toLowerCase() === "true";

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-5">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            CekRef
          </Link>
          <nav aria-label="Menu utama" className="flex flex-wrap items-center gap-4 text-sm font-medium text-zinc-600">
            <Link href="/" className="hover:text-zinc-900">
              Cek
            </Link>
            <Link href="/edukasi" className="hover:text-zinc-900">
              Edukasi
            </Link>
            <Link href="/tes" className="hover:text-zinc-900">
              Tes
            </Link>
            <Link href="/riwayat" className="hover:text-zinc-900">
              Riwayat
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="hover:text-zinc-900">
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="hidden text-zinc-500 sm:inline">{user.email}</span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Keluar
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/masuk"
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Masuk
              </Link>
              <Link
                href="/daftar"
                className="rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white hover:bg-zinc-800"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>

      {isDemoMode && (
        <div className="border-t border-zinc-200 bg-zinc-100 px-4 py-2 text-center text-xs text-zinc-700">
          Mode demo: data dibaca dari cache, tanpa internet.
        </div>
      )}
    </header>
  );
}

/** Static fallback shown while the session cookie is read on the server. */
export function NavbarFallback() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <span className="text-lg font-semibold tracking-tight text-zinc-900">CekRef</span>
        <span className="text-sm text-zinc-400">Memuat menu...</span>
      </div>
    </header>
  );
}
