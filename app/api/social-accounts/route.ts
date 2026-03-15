// app/api/social-accounts/route.ts
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: جلب الحسابات الاجتماعية المربوطة
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { connectedAt: "desc" },
  });

  return NextResponse.json({ accounts });
}
