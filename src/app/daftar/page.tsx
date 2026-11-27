import { redirect } from "next/navigation";
import { Suspense } from "react";
import { registerAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
import { getCurrentUser } from "@/lib/session";

async function RegisterContent() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }
  return <AuthForm mode="register" action={registerAction} />;
}

export default function DaftarPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <Suspense
        fallback={
          <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
            Memuat halaman daftar...
          </div>
        }
      >
        <RegisterContent />
      </Suspense>
    </main>
  );
}
