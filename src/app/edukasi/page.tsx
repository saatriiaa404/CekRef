import Link from "next/link";
import { loadEducationContent } from "@/lib/content";

export default async function EdukasiPage() {
  const content = await loadEducationContent();

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
          {content.title}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600 sm:text-base">
          {content.subtitle}
        </p>
      </header>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-semibold text-zinc-900">{content.whyAiTitle}</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-700 sm:text-base">
          {content.whyAiParagraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {content.whyAiExamples.map((example, index) => (
            <div
              key={index}
              className="rounded-lg border border-amber-200 bg-amber-50/70 p-4"
            >
              <p className="text-sm font-semibold text-amber-950">{example.label}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-amber-900">
                {example.detail}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900">
          {content.manualStepsTitle}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {content.manualSteps.map((step) => (
            <article
              key={step.number}
              className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-xs"
            >
              <div>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                  {step.number}
                </span>
                <h3 className="mt-3 text-base font-semibold text-zinc-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                  {step.description}
                </p>
              </div>
              <p className="mt-4 rounded-lg bg-zinc-100 p-3 text-xs leading-relaxed text-zinc-700">
                <span className="font-semibold">Tips:</span> {step.tip}
              </p>
            </article>
          ))}
        </div>
      </section>

      <aside className="rounded-xl border border-zinc-200 bg-zinc-100 p-4 text-sm text-zinc-700">
        {content.closingNote}
      </aside>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Coba cek daftar pustakamu
        </Link>
        <Link
          href="/tes/post"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
        >
          Kerjakan post-test
        </Link>
      </div>
    </main>
  );
}
