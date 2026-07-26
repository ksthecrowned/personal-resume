import { describe, expect, it } from "vitest";
import { ApplicationStatus } from "@prisma/client";

describe("prisma enums", () => {
  it("exposes ApplicationStatus values used by the product", () => {
    expect(ApplicationStatus.DRAFT).toBe("DRAFT");
    expect(ApplicationStatus.SENT).toBe("SENT");
  });
});
