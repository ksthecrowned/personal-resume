import { beforeEach, describe, expect, it } from "vitest";
import { draftLetter, matchProfile, parseJob } from "@/lib/ai";

describe("candidature flow helpers", () => {
  beforeEach(() => {
    process.env.AI_MODE = "mock";
  });

  it("runs parse → match → letter in sequence", async () => {
    const job = await parseJob(
      "Poste: Développeur Full-Stack\nEntreprise: Airtel Congo\nStack: React, Node.js",
    );
    const match = await matchProfile(
      {
        experiences: [
          { role: "Dev", company: "Webtinix", bullets: ["React", "Node"] },
        ],
        skills: ["React", "Node.js"],
        education: [],
      },
      job,
    );
    const letter = await draftLetter({
      profile: {
        experiences: [
          { role: "Dev", company: "Webtinix", bullets: ["React"] },
        ],
        skills: ["React"],
        education: [],
      },
      job,
      variantTitle: match.suggestedVariantTitle,
    });
    expect(match.score).toBeGreaterThanOrEqual(0);
    expect(letter).toContain("Airtel Congo");
  });
});
