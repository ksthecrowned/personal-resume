import { NextResponse } from "next/server";
import type { ParsedJob, ProfileData } from "@/lib/ai";
import { draftLetter } from "@/lib/ai";
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
  if (!application.jobParsed) {
    return NextResponse.json(
      { error: "Lancez d'abord le match" },
      { status: 400 },
    );
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

  const matchPayload = application.matchPayload as {
    suggestedVariantTitle?: string;
  } | null;

  const letterBody = await draftLetter({
    profile: profile.data as ProfileData,
    job: application.jobParsed as ParsedJob,
    variantTitle:
      matchPayload?.suggestedVariantTitle ??
      (application.jobParsed as ParsedJob).title,
  });

  const updated = await prisma.application.update({
    where: { id },
    data: {
      letterBody,
      status: "LETTER_READY",
    },
  });

  return NextResponse.json(updated);
}
