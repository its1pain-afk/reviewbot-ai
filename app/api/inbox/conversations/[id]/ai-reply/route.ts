// app/api/inbox/conversations/[id]/ai-reply/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateChatReply } from "@/lib/chatEngine";
import { sendMessage } from "@/lib/late";

// POST: توليد رد ذكي وإرساله (أو معاينة فقط)
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
    include: {
      messages: {
        orderBy: { sentAt: "desc" },
        take: 10,
      },
    },
  });

  if (!conversation)
    return NextResponse.json(
      { error: "المحادثة غير موجودة" },
      { status: 404 }
    );

  // جلب إعدادات البوت
  const inboxConfig = await prisma.inboxBotConfig.findUnique({
    where: { userId: session.user.id },
  });

  if (!inboxConfig) {
    return NextResponse.json(
      { error: "يرجى إعداد بوت الرسائل أولاً" },
      { status: 400 }
    );
  }

  // جلب قاعدة المعرفة
  const knowledgeEntries = await prisma.knowledgeBase.findMany({
    where: { userId: session.user.id, isActive: true },
  });

  try {
    const replyText = await generateChatReply({
      conversation: {
        platform: conversation.platform,
        contactName: conversation.contactName,
        recentMessages: conversation.messages.reverse().map((m) => ({
          direction: m.direction as "inbound" | "outbound",
          content: m.content,
          sentAt: m.sentAt,
        })),
      },
      inboxBotConfig: inboxConfig,
      knowledgeEntries,
    });

    const body = await req.json().catch(() => ({}));
    const sendNow = body.send !== false; // إرسال مباشر ما لم يُطلب المعاينة فقط

    if (!sendNow) {
      // وضع المعاينة - إرجاع النص فقط
      return NextResponse.json({ reply: replyText, preview: true });
    }

    // إرسال الرد
    const result = await sendMessage(
      conversation.lateConversationId,
      replyText
    );

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        lateMessageId: result.id,
        direction: "outbound",
        content: replyText,
        replyStatus: "SENT",
        aiGenerated: true,
        sentAt: new Date(),
      },
    });

    await prisma.conversation.update({
      where: { id: params.id },
      data: {
        lastMessageText: replyText,
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, reply: replyText, message });
  } catch (error) {
    console.error("فشل توليد الرد الذكي:", error);
    return NextResponse.json(
      { error: "فشل توليد الرد" },
      { status: 500 }
    );
  }
}
