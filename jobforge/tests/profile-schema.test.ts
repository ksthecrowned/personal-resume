import { describe, expect, it } from "vitest";
import { profileDataSchema } from "@/lib/profile-schema";

describe("profileDataSchema", () => {
  it("accepts a minimal valid profile", () => {
    const parsed = profileDataSchema.parse({
      experiences: [],
      skills: ["React"],
      education: [],
    });
    expect(parsed.skills).toEqual(["React"]);
  });

  it("rejects missing skills array", () => {
    expect(() =>
      profileDataSchema.parse({ experiences: [], education: [] }),
    ).toThrow();
  });
});
