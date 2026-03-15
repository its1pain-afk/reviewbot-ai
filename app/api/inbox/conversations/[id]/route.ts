// app/api/inbox/conversations/[id]/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: جلب تفاصيل محادثة
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.id,
      socialAccount: { userId: session.user.id },
    },
    include: {
      socialAccount: {
        select: { platform: true, accountName: true, accountAvatar: true },
      },
    },
  });

  if (!conversation)
    return NextResponse.json(
      { error: "المحادثة غير موجودة" },
      { status: 404 }
    );

  // تصفير عداد غير المقروءة
  if (conversation.unreadCount > 0) {
    await prisma.conversation.update({
      where: { id: params.id },
      data: { unreadCount: 0 },
    });
  }

  return NextResponse.json({ conversation });
}

// PATCH: تحديث حالة المحادثة (أرشفة، تفعيل الرد التلقائي)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const existing = await prisma.conversation.findFirst({
    where: {
      id: params.id,
      socialAccount: { userId: session.user.id },
    },
  });

  if (!existing)
    return NextResponse.json(
      { error: "المحادثة غير موجودة" },
      { status: 404 }
    );

  const data = await req.json();
  const updateData: any = {};

  if (data.status !== undefined) updateData.status = data.status;
  if (data.autoReplyEnabled !== undefined)
    updateData.autoReplyEnabled = data.autoReplyEnabled;

  const conversation = await prisma.conversation.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ success: true, conversation });
}
