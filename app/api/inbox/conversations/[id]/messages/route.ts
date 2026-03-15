// app/api/inbox/conversations/[id]/messages/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMessage } from "@/lib/late";

// GET: جلب رسائل المحادثة
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  // التحقق من ملكية المحادثة
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: params.id,
      socialAccount: { userId: session.user.id },
    },
  });

  if (!conversation)
    return NextResponse.json(
      { error: "المحادثة غير موجودة" },
      { status: 404 }
    );

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: params.id },
      orderBy: { sentAt: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.message.count({ where: { conversationId: params.id } }),
  ]);

  return NextResponse.json({
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

// POST: إرسال رسالة يدوية
export async function POST(
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
  });

  if (!conversation)
    return NextResponse.json(
      { error: "المحادثة غير موجودة" },
      { status: 404 }
    );

  const { text } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json(
      { error: "نص الرسالة مطلوب" },
      { status: 400 }
    );
  }

  try {
    // إرسال عبر Late API
    const result = await sendMessage(
      conversation.lateConversationId,
      text.trim()
    );

    // حفظ الرسالة في قاعدة البيانات
    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        lateMessageId: result.id,
        direction: "outbound",
        content: text.trim(),
        replyStatus: "SENT",
        aiGenerated: false,
        sentAt: new Date(),
      },
    });

    // تحديث المحادثة
    await prisma.conversation.update({
      where: { id: params.id },
      data: {
        lastMessageText: text.trim(),
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("فشل إرسال الرسالة:", error);
    return NextResponse.json(
      { error: "فشل إرسال الرسالة" },
      { status: 500 }
    );
  }
}
