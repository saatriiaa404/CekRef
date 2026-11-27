"use client";

import { useActionState, useState } from "react";
import { submitTestAction, type TestFormState } from "@/app/actions/test";
import type { PublicTestQuestion, QuestionAnswer, TestKind } from "@/lib/test-scoring";

interface TestRunnerProps {
  kind: TestKind;
  questions: PublicTestQuestion[];
}

const INITIAL_STATE: TestFormState = {};

/** Interactive form displaying one reference per question with Asli / Bermasalah choices. */
export function TestRunner({ kind, questions }: TestRunnerProps) {
  const boundAction = submitTestAction.bind(null, kind);
  const [state, formAction, pending] = useActionState(boundAction, INITIAL_STATE);
  const [selected, setSelected] = useState<Record<string, QuestionAnswer>>({});

  const answeredCount = Object.keys(selected).length;
  const total = questions.length;
  const title = kind === "pre" ? "Pre-test Literasi Sitasi" : "Post-test Literasi Sitasi";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Untuk setiap referensi di bawah, tentukan apakah referensi tersebut{" "}
            <span className="font-medium text-zinc-900">Asli</span> atau{" "}
            <span className="font-medium text-zinc-900">Bermasalah</span>.
          </p>
        </div>
        <div className="rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-700">
          Terjawab: {answeredCount} / {total}
        </div>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        {questions.map((question, index) => (
          <fieldset
            key={question.id}
            className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs"
          >
            <legend className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Soal {index + 1} dari {total}
            </legend>
            <p className="mt-2 rounded-lg bg-zinc-50 p-3.5 text-sm leading-relaxed text-zinc-800">
              {question.reference}
            </p>

            <div className="mt-4 flex flex-wrap gap-4">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-100">
                <input
                  type="radio"
                  name={`q_${question.id}`}
                  value="real"
                  checked={selected[question.id] === "real"}
                  onChange={() =>
                    setSelected((prev) => ({ ...prev, [question.id]: "real" }))
                  }
                  className="accent-zinc-900"
                />
                <span>Asli</span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-800 hover:bg-zinc-50 has-[:checked]:border-zinc-900 has-[:checked]:bg-zinc-100">
                <input
                  type="radio"
                  name={`q_${question.id}`}
                  value="problematic"
                  checked={selected[question.id] === "problematic"}
                  onChange={() =>
                    setSelected((prev) => ({ ...prev, [question.id]: "problematic" }))
                  }
                  className="accent-zinc-900"
                />
                <span>Bermasalah</span>
              </label>
            </div>
          </fieldset>
        ))}

        <div className="flex items-center justify-between gap-4 pt-2">
          <p className="text-xs text-zinc-500">
            Pastikan semua {total} soal sudah dipilih sebelum mengumpulkan.
          </p>
          <button
            type="submit"
            disabled={pending || answeredCount < total}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Menyimpan..." : "Kumpulkan"}
          </button>
        </div>
      </form>
    </div>
  );
}
