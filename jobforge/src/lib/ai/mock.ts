import type { DraftLetterInput, MatchResult, ParsedJob, ProfileData } from "./types";

export function mockParseJob(raw: string): ParsedJob {
  const titleMatch = raw.match(/(?:Poste|Title)\s*[:\-]\s*(.+)/i);
  const companyMatch = raw.match(/(?:Entreprise|Company)\s*[:\-]\s*(.+)/i);
  const skills = Array.from(
    new Set(
      (
        raw.match(
          /\b(Node\.?js|React|NestJS|PostgreSQL|PHP|Laravel|Flutter|AWS|SI)\b/gi,
        ) ?? []
      ).map((s) => s.replace(/node\.?js/i, "Node.js")),
    ),
  );
  return {
    title: titleMatch?.[1]?.trim() || "Poste à pourvoir",
    company: companyMatch?.[1]?.trim(),
    skills: skills.length ? skills : ["Général"],
    rawSummary: raw.slice(0, 500),
  };
}

export function mockMatchProfile(
  profile: ProfileData,
  job: ParsedJob,
): MatchResult {
  const profileSkills = new Set(
    [...profile.skills, ...profile.experiences.flatMap((e) => e.bullets)].map(
      (s) => s.toLowerCase(),
    ),
  );
  const hits = job.skills.filter((s) =>
    [...profileSkills].some((p) => p.includes(s.toLowerCase())),
  );
  const score = Math.min(
    100,
    Math.round((hits.length / Math.max(job.skills.length, 1)) * 100),
  );
  const gaps = job.skills.filter((s) => !hits.includes(s));
  return {
    score,
    gaps,
    suggestedVariantTitle: job.title,
    reasons: hits.map((h) => `Compétence alignée: ${h}`),
  };
}

export function mockDraftLetter(input: DraftLetterInput): string {
  const company = input.job.company ?? "votre entreprise";
  const exp = input.profile.experiences[0];
  return [
    "Madame, Monsieur,",
    "",
    `Je postule au poste de ${input.job.title} au sein de ${company}.`,
    exp
      ? `Mon expérience en tant que ${exp.role} chez ${exp.company} m'a préparé à ce défi.`
      : "Mon parcours m'a préparé à ce défi.",
    "",
    "Je reste à votre disposition pour un entretien.",
    "",
    "Cordialement,",
  ].join("\n");
}

export function mockExtractCv(text: string): ProfileData {
  return {
    headline: "Candidat",
    summary: text.slice(0, 240),
    experiences: [],
    skills: [],
    education: [],
  };
}
