"use client";

import { FormEvent, useEffect, useState } from "react";

type ProfileForm = {
  headline: string;
  summary: string;
  skills: string;
};

export default function ProfilPage() {
  const [form, setForm] = useState<ProfileForm>({
    headline: "",
    summary: "",
    skills: "",
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (res) => {
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Chargement impossible");
        return res.json();
      })
      .then((profile) => {
        if (!profile) return;
        const data = profile.data as {
          skills?: string[];
          headline?: string;
          summary?: string;
        };
        setForm({
          headline: profile.headline ?? data.headline ?? "",
          summary: profile.summary ?? data.summary ?? "",
          skills: (data.skills ?? []).join(", "),
        });
      })
      .catch(() => setError("Impossible de charger le profil"))
      .finally(() => setLoading(false));
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const skills = form.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        headline: form.headline,
        summary: form.summary,
        data: {
          headline: form.headline,
          summary: form.summary,
          skills,
          experiences: [],
          education: [],
        },
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Enregistrement impossible");
      return;
    }
    setMessage("Profil enregistré");
  }

  if (loading) {
    return <p className="p-6 text-sm text-zinc-600">Chargement…</p>;
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Profil</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Titre
          <input
            className="rounded border border-zinc-300 px-3 py-2"
            value={form.headline}
            onChange={(e) => setForm({ ...form, headline: e.target.value })}
            placeholder="ex. Développeur Full-Stack"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Résumé
          <textarea
            className="min-h-28 rounded border border-zinc-300 px-3 py-2"
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Compétences (séparées par des virgules)
          <input
            className="rounded border border-zinc-300 px-3 py-2"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="React, Node.js, PostgreSQL"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}
        <button
          type="submit"
          className="w-fit rounded bg-zinc-900 px-4 py-2 text-white"
        >
          Enregistrer
        </button>
      </form>
    </main>
  );
}
