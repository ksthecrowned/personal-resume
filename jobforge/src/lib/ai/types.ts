export type ProfileData = {
  headline?: string;
  summary?: string;
  experiences: Array<{
    role: string;
    company: string;
    period?: string;
    bullets: string[];
  }>;
  skills: string[];
  education: Array<{ title: string; place?: string }>;
};

export type ParsedJob = {
  title: string;
  company?: string;
  skills: string[];
  level?: string;
  rawSummary: string;
};

export type MatchResult = {
  score: number;
  gaps: string[];
  suggestedVariantTitle: string;
  reasons: string[];
};

export type DraftLetterInput = {
  profile: ProfileData;
  job: ParsedJob;
  variantTitle: string;
};
