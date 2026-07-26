"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Application = {
  id: string;
  companyName?: string | null;
  matchScore?: number | null;
  matchPayload?: {
    gaps?: string[];
    reasons?: string[];
    suggestedVariantTitle?: string;
  } | null;
  letterBody?: string | null;
  status: string;
  jobRaw: string;
};

export default function CandidaturePage() {
  const params = useParams<{ id: string }>();
  const [app, setApp] = useState<Application | null>(null);
  const [letter, setLetter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/applications/${params.id}`);
    if (!res.ok) {
      setError("Candidature introuvable");
      return;
    }
    const data = (await res.json()) as Application;
    setApp(data);
    setLetter(data.letterBody ?? "");
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function rematch() {
    setMessage(null);
    const res = await fetch(`/api/applications/${params.id}/match`, {
      method: "POST",
    });
    if (!res.ok) {
      setError("Relance du match impossible");
      return;
    }
    await load();
    setMessage("Match mis à jour");
  }

  async function regenerateLetter() {
    setMessage(null);
    const res = await fetch(`/api/applications/${params.id}/letter`, {
      method: "POST",
    });
    if (!res.ok) {
      setError("Génération de lettre impossible");
      return;
    }
    await load();
    setMessage("Lettre régénérée");
  }

  async function saveLetter(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch(`/api/applications/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ letterBody: letter }),
    });
    if (!res.ok) {
      setError("Sauvegarde impossible");
      return;
    }
    setMessage("Lettre enregistrée");
  }

  if (error && !app) {
    return <p className="p-6 text-sm text-red-600">{error}</p>;
  }
  if (!app) {
    return <p className="p-6 text-sm text-zinc-600">Chargement…</p>;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="mb-2 text-2xl font-semibold">
        {app.companyName ?? "Candidature"}
      </h1>
      <p className="mb-6 text-sm text-zinc-600">
        Statut : {app.status}
        {typeof app.matchScore === "number" ? ` · Score ${app.matchScore}/100` : ""}
      </p>

      {app.matchPayload?.gaps?.length ? (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold">Écarts</h2>
          <ul className="list-disc pl-5 text-sm text-zinc-700">
            {app.matchPayload.gaps.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={rematch}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          Relancer le match
        </button>
        <button
          type="button"
          onClick={regenerateLetter}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
        >
          Générer la lettre
        </button>
      </div>

      <form onSubmit={saveLetter} className="flex flex-col gap-3">
        <label className="text-sm font-semibold">Lettre de motivation</label>
        <textarea
          className="min-h-64 rounded border border-zinc-300 bg-white px-3 py-2 text-sm"
          value={letter}
          onChange={(e) => setLetter(e.target.value)}
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          className="w-fit rounded bg-zinc-900 px-4 py-2 text-white"
        >
          Enregistrer la lettre
        </button>
      </form>
    </main>
  );
}
