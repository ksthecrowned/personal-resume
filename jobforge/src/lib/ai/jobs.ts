import { runWorkersAiPrompt } from "./client";
import {
  mockDraftLetter,
  mockExtractCv,
  mockMatchProfile,
  mockParseJob,
} from "./mock";
import type {
  DraftLetterInput,
  MatchResult,
  ParsedJob,
  ProfileData,
} from "./types";

function useMock() {
  return (process.env.AI_MODE ?? "mock") !== "cloudflare";
}

export async function parseJob(raw: string): Promise<ParsedJob> {
  if (useMock()) return mockParseJob(raw);
  const response = await runWorkersAiPrompt(
    "Tu extrais une offre d'emploi en JSON {title,company,skills,level,rawSummary}. Pas de markdown. Français.",
    raw,
  );
  return JSON.parse(response) as ParsedJob;
}

export async function matchProfile(
  profile: ProfileData,
  job: ParsedJob,
): Promise<MatchResult> {
  if (useMock()) return mockMatchProfile(profile, job);
  const response = await runWorkersAiPrompt(
    "Tu scores 0-100 le match profil/offre. JSON {score,gaps,suggestedVariantTitle,reasons}. N'invente rien.",
    JSON.stringify({ profile, job }),
  );
  return JSON.parse(response) as MatchResult;
}

export async function draftLetter(input: DraftLetterInput): Promise<string> {
  if (useMock()) return mockDraftLetter(input);
  return runWorkersAiPrompt(
    "Rédige une lettre de motivation FR courte. N'invente aucun employeur ni diplôme absent du profil.",
    JSON.stringify(input),
  );
}

export async function extractCv(text: string): Promise<ProfileData> {
  if (useMock()) return mockExtractCv(text);
  const response = await runWorkersAiPrompt(
    "Extrais un profil JSON {headline,summary,experiences,skills,education}. N'invente rien.",
    text,
  );
  return JSON.parse(response) as ProfileData;
}
