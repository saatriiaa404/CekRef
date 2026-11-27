"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import {
  countLabels,
  FIELD_LABEL_TEXT,
  LABEL_TEXT,
  type LookupKind,
  type MatchLabel,
  type StoredCheckResult,
} from "@/lib/history";

const BADGE_STYLE: Record<MatchLabel, string> = {
  match: "border-emerald-200 bg-emerald-50 text-emerald-800",
  partial: "border-amber-300 bg-amber-50 text-amber-900",
  not_found: "border-zinc-300 bg-zinc-100 text-zinc-700",
};

const DOT: Record<MatchLabel, string> = {
  match: "🟢",
  partial: "🟡",
  not_found: "⚪",
};

const LOOKUP_TEXT: Record<LookupKind, string> = {
  doi: "dicocokkan lewat DOI",
  search: "dicocokkan lewat pencarian",
  none: "tanpa kandidat database",
};

function referenceTitle(item: StoredCheckResult): string {
  return item.parsed.title ?? item.parsed.raw;
}

function referenceMeta(item: StoredCheckResult): string {
  const firstAuthor = item.parsed.authors[0]?.family;
  const authorPart = firstAuthor
    ? item.parsed.authors.length > 1 || item.parsed.etAl
      ? `${firstAuthor} dkk.`
      : firstAuthor
    : null;
  const yearPart = item.parsed.year ? String(item.parsed.year) : null;
  return [authorPart, yearPart].filter(Boolean).join(" · ");
}

function DetailPanel({ item }: { item: StoredCheckResult }) {
  const percent = Math.round(item.score * 100);

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
      <p className="text-xs font-medium text-zinc-700">
        {DOT[item.label]} {LABEL_TEXT[item.label]} · Skor {percent}% · {LOOKUP_TEXT[item.lookup]}
        {item.fromCache ? " · dari cache" : ""}
      </p>

      {item.best === null ? (
        <div className="rounded-lg border border-zinc-200 bg-white p-3.5 text-sm text-zinc-700">
          Tidak ada kandidat di Crossref.{" "}
          <Link href="/edukasi" className="font-medium text-zinc-900 underline">
            Pelajari cara verifikasi manual di halaman Edukasi
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-zinc-100 text-xs text-zinc-600">
              <tr>
                <th className="px-3 py-2">Data</th>
                <th className="px-3 py-2">Yang kamu tulis</th>
                <th className="px-3 py-2">Di database (Crossref)</th>
                <th className="px-3 py-2">Kemiripan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {item.fields.map((field) => {
                const isLow = field.similarity !== null && field.similarity < 0.85;
                return (
                  <tr key={field.field} className={isLow ? "bg-amber-50" : undefined}>
                    <td className="px-3 py-2 font-medium text-zinc-800">
                      {FIELD_LABEL_TEXT[field.field]}
                    </td>
                    <td className="px-3 py-2 text-zinc-700">{field.input ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-700">{field.database ?? "—"}</td>
                    <td className="px-3 py-2 text-zinc-700">
                      {field.similarity === null
                        ? "tidak dibandingkan"
                        : `${Math.round(field.similarity * 100)}%${isLow ? " ⚠️" : ""}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {item.reasons.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Alasan</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-zinc-700 sm:text-sm">
            {item.reasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {item.best?.doi && (
        <p className="text-xs text-zinc-700 sm:text-sm">
          Buka artikel di database:{" "}
          <a
            href={`https://doi.org/${item.best.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-zinc-900 underline break-all"
          >
            https://doi.org/{item.best.doi}
          </a>
        </p>
      )}
    </div>
  );
}

/** Read-only result table with expandable field comparison panels for /riwayat/[id]. */
export function HistoryDetailView({ results }: { results: StoredCheckResult[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const counts = countLabels(results);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-xs">
        <span>Hasil:</span>
        <span>🟢 {counts.match} Cocok</span>
        <span>🟡 {counts.partial} Cocok Sebagian</span>
        <span>⚪ {counts.notFound} Tidak Ditemukan</span>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Referensi</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Skor</th>
              <th className="px-4 py-3">Alasan utama</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {results.map((item, idx) => {
              const isOpen = openIndex === idx;
              const meta = referenceMeta(item);
              const extraReasons = item.reasons.length > 1 ? ` (+${item.reasons.length - 1} lainnya)` : "";
              return (
                <Fragment key={idx}>
                  <tr>
                    <td className="px-4 py-3 align-top text-zinc-500">{idx + 1}</td>
                    <td className="max-w-xs px-4 py-3 align-top">
                      <p className="font-medium text-zinc-900 line-clamp-2">
                        {referenceTitle(item)}
                      </p>
                      {meta && <p className="mt-0.5 text-xs text-zinc-500">{meta}</p>}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLE[item.label]}`}
                      >
                        {DOT[item.label]} {LABEL_TEXT[item.label]}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top font-medium text-zinc-800">
                      {Math.round(item.score * 100)}%
                    </td>
                    <td className="max-w-xs px-4 py-3 align-top text-xs text-zinc-600">
                      {(item.reasons[0] ?? "—") + extraReasons}
                    </td>
                    <td className="px-4 py-3 text-right align-top">
                      <button
                        type="button"
                        onClick={() => setOpenIndex(isOpen ? null : idx)}
                        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
                      >
                        {isOpen ? "Tutup" : "Detail"}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={6} className="bg-zinc-50/60 px-4 py-4">
                        <DetailPanel item={item} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {results.map((item, idx) => {
          const isOpen = openIndex === idx;
          const meta = referenceMeta(item);
          return (
            <article
              key={idx}
              className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLE[item.label]}`}
                >
                  {DOT[item.label]} {LABEL_TEXT[item.label]}
                </span>
                <span className="text-xs font-semibold text-zinc-700">
                  Skor {Math.round(item.score * 100)}%
                </span>
              </div>

              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {idx + 1}. {referenceTitle(item)}
                </p>
                {meta && <p className="mt-0.5 text-xs text-zinc-500">{meta}</p>}
              </div>

              <p className="text-xs text-zinc-600">{item.reasons[0] ?? "—"}</p>

              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
              >
                {isOpen ? "Tutup detail" : "Detail"}
              </button>

              {isOpen && <DetailPanel item={item} />}
            </article>
          );
        })}
      </div>

      <aside className="rounded-xl border border-zinc-200 bg-zinc-100 p-4 text-xs leading-relaxed text-zinc-700 sm:text-sm">
        &ldquo;Tidak Ditemukan di Database&rdquo; bukan berarti referensi tersebut tidak sah atau
        buatan AI. Banyak jurnal (terutama jurnal Indonesia) belum terdaftar di Crossref. Pelajari
        cara cek manual di{" "}
        <Link href="/edukasi" className="font-medium text-zinc-900 underline">
          halaman Edukasi
        </Link>
        .
      </aside>
    </div>
  );
}
