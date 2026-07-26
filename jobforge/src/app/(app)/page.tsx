"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [jobRaw, setJobRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const create = await fetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobRaw }),
    });
    const created = await create.json();
    if (!create.ok) {
      setLoading(false);
      setError(created.error ?? "Création impossible");
      return;
    }

    const match = await fetch(`/api/applications/${created.id}/match`, {
      method: "POST",
    });
    if (!match.ok) {
      setLoading(false);
      setError("Match impossible");
      return;
    }

    await fetch(`/api/applications/${created.id}/letter`, { method: "POST" });
    setLoading(false);
    router.push(`/candidatures/${created.id}`);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Analyser une offre</h1>
      <p className="mb-6 text-sm text-zinc-600">
        Colle une offre d&apos;emploi. JobForge propose un score de match et un
        brouillon de lettre.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <textarea
          className="min-h-48 rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
          placeholder="Poste: …&#10;Entreprise: …&#10;Stack: …"
          value={jobRaw}
          onChange={(e) => setJobRaw(e.target.value)}
          required
          minLength={20}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-fit rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-60"
        >
          {loading ? "Analyse…" : "Analyser"}
        </button>
      </form>
    </main>
  );
}
