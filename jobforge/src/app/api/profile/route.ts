import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { profileDataSchema } from "@/lib/profile-schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });
  }
  return NextResponse.json(profile);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const body = await req.json();
  const dataParsed = profileDataSchema.safeParse(body.data ?? body);
  if (!dataParsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const headline =
    typeof body.headline === "string"
      ? body.headline
      : dataParsed.data.headline;
  const summary =
    typeof body.summary === "string" ? body.summary : dataParsed.data.summary;

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      headline,
      summary,
      data: dataParsed.data,
    },
    update: {
      headline,
      summary,
      data: dataParsed.data,
    },
  });

  await prisma.variant.upsert({
    where: {
      userId_slug: { userId: session.user.id, slug: "default" },
    },
    create: {
      userId: session.user.id,
      slug: "default",
      title: headline || "Variante par défaut",
      data: dataParsed.data,
    },
    update: {
      title: headline || "Variante par défaut",
      data: dataParsed.data,
    },
  });

  return NextResponse.json(profile);
}
