import { NextResponse } from "next/server";
import type { ProfileData } from "@/lib/ai";
import { matchProfile, parseJob } from "@/lib/ai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { id } = await params;
  const application = await prisma.application.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!application) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json(
      { error: "Complétez votre profil" },
      { status: 400 },
    );
  }

  const job = await parseJob(application.jobRaw);
  const match = await matchProfile(profile.data as ProfileData, job);

  const updated = await prisma.application.update({
    where: { id },
    data: {
      companyName: job.company,
      jobParsed: job,
      matchScore: match.score,
      matchPayload: match,
      status: "MATCHED",
    },
  });

  return NextResponse.json(updated);
}
