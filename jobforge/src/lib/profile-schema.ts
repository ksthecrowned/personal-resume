import { z } from "zod";

export const profileDataSchema = z.object({
  headline: z.string().optional(),
  summary: z.string().optional(),
  experiences: z.array(
    z.object({
      role: z.string(),
      company: z.string(),
      period: z.string().optional(),
      bullets: z.array(z.string()),
    }),
  ),
  skills: z.array(z.string()),
  education: z.array(
    z.object({
      title: z.string(),
      place: z.string().optional(),
    }),
  ),
});

export type ProfileDataInput = z.infer<typeof profileDataSchema>;
