import { beforeEach, describe, expect, it } from "vitest";
import { draftLetter, matchProfile, parseJob } from "@/lib/ai";

describe("ai jobs (mock mode)", () => {
  beforeEach(() => {
    process.env.AI_MODE = "mock";
  });

  it("parses a job offer into title and skills", async () => {
    const job = await parseJob(
      "Poste: Développeur Full-Stack\nEntreprise: MTN Congo\nStack: Node.js, React, PostgreSQL",
    );
    expect(job.title.toLowerCase()).toContain("développeur");
    expect(job.skills.length).toBeGreaterThan(0);
  });

  it("returns a score between 0 and 100", async () => {
    const job = await parseJob("Développeur Node.js React");
    const match = await matchProfile(
      {
        experiences: [
          {
            role: "Développeur Full-Stack",
            company: "LRC",
            bullets: ["NestJS", "React"],
          },
        ],
        skills: ["Node.js", "React"],
        education: [],
      },
      job,
    );
    expect(match.score).toBeGreaterThanOrEqual(0);
    expect(match.score).toBeLessThanOrEqual(100);
  });

  it("drafts a French letter without inventing a fake employer history", async () => {
    const letter = await draftLetter({
      profile: {
        experiences: [
          { role: "Lead", company: "LRC Group", bullets: ["Pilotage"] },
        ],
        skills: ["NestJS"],
        education: [],
      },
      job: {
        title: "Responsable Informatique",
        company: "Bralico",
        skills: ["SI"],
        rawSummary: "Pilotage SI",
      },
      variantTitle: "Responsable Informatique",
    });
    expect(letter).toMatch(/Madame, Monsieur/);
    expect(letter).toContain("LRC Group");
    expect(letter).not.toMatch(/Google|Meta|Amazon/);
  });
});
