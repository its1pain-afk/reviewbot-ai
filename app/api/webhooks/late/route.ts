// app/api/webhooks/late/route.ts
// استقبال الأحداث من Late.dev (رسائل جديدة، إلخ)
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateChatReply } from "@/lib/chatEngine";
import { sendMessage } from "@/lib/late";

export async function POST(req: NextRequest) {
  // التحقق من صحة الطلب
  const secret = req.headers.get("x-webhook-secret");
  if (secret !== process.env.LATE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await req.json();

  try {
    switch (payload.event) {
      case "message.received":
        await handleIncomingMessage(payload.data);
        break;
      case "message.sent":
        await handleMessageSent(payload.data);
        break;
      default:
        console.log(`حدث غير معروف: ${payload.event}`);
    }
  } catch (error) {
    console.error("خطأ في معالجة webhook:", error);
  }

  // دائماً نرجع 200 بسرعة
  return NextResponse.json({ received: true });
}

async function handleIncomingMessage(data: {
  conversationId: string;
  messageId: string;
  text: string;
  platform: string;
  participant: { name: string; avatar?: string; id?: string };
  sentAt: string;
  accountId: string;
  contentType?: string;
  mediaUrl?: string;
}) {
  // البحث عن الحساب الاجتماعي
  const socialAccount = await prisma.socialAccount.findUnique({
    where: { lateAccountId: data.accountId },
  });

  if (!socialAccount || !socialAccount.isActive) return;

  // إنشاء أو تحديث المحادثة
  const conversation = await prisma.conversation.upsert({
    where: { lateConversationId: data.conversationId },
    update: {
      lastMessageText: data.text,
      lastMessageAt: new Date(data.sentAt),
      unreadCount: { increment: 1 },
      contactName: data.participant.name,
      contactAvatar: data.participant.avatar,
    },
    create: {
      socialAccountId: socialAccount.id,
      lateConversationId: data.conversationId,
      platform: data.platform,
      contactName: data.participant.name,
      contactAvatar: data.participant.avatar,
      contactId: data.participant.id,
      lastMessageText: data.text,
      lastMessageAt: new Date(data.sentAt),
      unreadCount: 1,
    },
  });

  // التحقق من التكرار
  const existing = await prisma.message.findUnique({
    where: { lateMessageId: data.messageId },
  });
  if (existing) return;

  // حفظ الرسالة
  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      lateMessageId: data.messageId,
      direction: "inbound",
      content: data.text,
      contentType: data.contentType || "text",
      mediaUrl: data.mediaUrl,
      replyStatus: "PENDING",
      sentAt: new Date(data.sentAt),
    },
  });

  // التحقق من إعدادات الرد التلقائي
  const inboxConfig = await prisma.inboxBotConfig.findUnique({
    where: { userId: socialAccount.userId },
  });

  if (
    inboxConfig?.isActive &&
    inboxConfig.replyMode === "auto" &&
    conversation.autoReplyEnabled
  ) {
    // قفل متفائل
    const locked = await prisma.message.updateMany({
      where: { id: message.id, replyStatus: "PENDING" },
      data: { replyStatus: "PROCESSING" },
    });
    if (locked.count === 0) return;

    try {
      const knowledgeEntries = await prisma.knowledgeBase.findMany({
        where: { userId: socialAccount.userId, isActive: true },
      });

      // جلب آخر 10 رسائل للسياق
      const recentMessages = await prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { sentAt: "desc" },
        take: 10,
      });

      const replyText = await generateChatReply({
        conversation: {
          platform: conversation.platform,
          contactName: conversation.contactName,
          recentMessages: recentMessages.reverse().map((m) => ({
            direction: m.direction as "inbound" | "outbound",
            content: m.content,
            sentAt: m.sentAt,
          })),
        },
        inboxBotConfig: inboxConfig,
        knowledgeEntries,
      });

      // إرسال الرد عبر Late
      const sentResult = await sendMessage(
        conversation.lateConversationId,
        replyText
      );

      // حفظ الرد
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          lateMessageId: sentResult.id,
          direction: "outbound",
          content: replyText,
          replyStatus: "SENT",
          aiGenerated: true,
          sentAt: new Date(),
        },
      });

      await prisma.message.update({
        where: { id: message.id },
        data: { replyStatus: "SENT" },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageText: replyText,
          lastMessageAt: new Date(),
        },
      });
    } catch (error) {
      console.error(`فشل الرد التلقائي على رسالة ${message.id}:`, error);
      await prisma.message.update({
        where: { id: message.id },
        data: { replyStatus: "FAILED" },
      });
    }
  }
}

async function handleMessageSent(data: {
  messageId: string;
  conversationId: string;
  status: string;
}) {
  // تحديث حالة الرسالة إذا كانت موجودة
  await prisma.message
    .updateMany({
      where: { lateMessageId: data.messageId },
      data: { replyStatus: data.status === "delivered" ? "SENT" : "FAILED" },
    })
    .catch(() => {});
}
