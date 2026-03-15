// app/api/knowledge-base/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: جلب جميع مقالات قاعدة المعرفة
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const entries = await prisma.knowledgeBase.findMany({
    where: {
      userId: session.user.id,
      ...(category && category !== "all" ? { category } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ entries });
}

// POST: إضافة مقال جديد
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { title, content, category } = await req.json();

  if (!title || !content) {
    return NextResponse.json(
      { error: "العنوان والمحتوى مطلوبان" },
      { status: 400 }
    );
  }

  const entry = await prisma.knowledgeBase.create({
    data: {
      userId: session.user.id,
      title,
      content,
      category: category || "general",
    },
  });

  return NextResponse.json({ entry, message: "تم إضافة المقال بنجاح" });
}
