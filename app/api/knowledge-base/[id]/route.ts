// app/api/knowledge-base/[id]/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: جلب مقال واحد
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const entry = await prisma.knowledgeBase.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!entry)
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });

  return NextResponse.json({ entry });
}

// PUT: تحديث مقال
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const existing = await prisma.knowledgeBase.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing)
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });

  const data = await req.json();

  const entry = await prisma.knowledgeBase.update({
    where: { id: params.id },
    data: {
      title: data.title,
      content: data.content,
      category: data.category,
      isActive: data.isActive,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, entry });
}

// DELETE: حذف مقال
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const existing = await prisma.knowledgeBase.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing)
    return NextResponse.json({ error: "المقال غير موجود" }, { status: 404 });

  await prisma.knowledgeBase.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true, message: "تم حذف المقال" });
}
