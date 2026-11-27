"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { AuthFormState } from "@/app/actions/auth";

interface AuthFormProps {
  mode: "login" | "register";
  action: (prevState: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}

const INITIAL_STATE: AuthFormState = {};

/** Shared client form for /masuk and /daftar with yellow/amber error styling. */
export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);
  const isRegister = mode === "register";

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
      <h1 className="text-2xl font-semibold text-zinc-900">
        {isRegister ? "Daftar Akun" : "Masuk ke CekRef"}
      </h1>
      <p className="mt-1 text-sm text-zinc-600">
        {isRegister
          ? "Cukup gunakan email dan password. Kami tidak menyimpan nama lengkap atau NIM."
          : "Masuk untuk mengerjakan pre-test, post-test, dan melihat riwayat pengecekan."}
      </p>

      {state.error && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-800">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@contoh.ac.id"
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-zinc-800">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
          />
          {isRegister && (
            <p className="mt-1 text-xs text-zinc-500">Minimal 8 karakter.</p>
          )}
        </div>

        {isRegister && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-800">
              Ulangi Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-1 block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? isRegister
              ? "Mendaftarkan..."
              : "Memproses..."
            : isRegister
              ? "Daftar"
              : "Masuk"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-zinc-600">
        {isRegister ? (
          <>
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-medium text-zinc-900 underline">
              Masuk
            </Link>
          </>
        ) : (
          <>
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-medium text-zinc-900 underline">
              Daftar
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
