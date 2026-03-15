// app/api/cron/sync-messages/route.ts
// مزامنة الرسائل من Late API (fallback للـ webhooks)
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  listInboxConversations,
  getConversationMessages,
} from "@/lib/late";
import { processPendingMessages } from "@/lib/chatEngine";

export async function POST(req: NextRequest) {
  // حماية بنفس طريقة sync-reviews
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const results: any[] = [];

  try {
    // جلب جميع الحسابات النشطة
    const socialAccounts = await prisma.socialAccount.findMany({
      where: { isActive: true },
      include: { user: { select: { id: true } } },
    });

    for (const account of socialAccounts) {
      try {
        // جلب المحادثات من Late
        const { conversations } = await listInboxConversations({
          accountId: account.lateAccountId,
        });

        let newMessages = 0;

        for (const conv of conversations) {
          // إنشاء أو تحديث المحادثة
          const conversation = await prisma.conversation.upsert({
            where: { lateConversationId: conv.id },
            update: {
              contactName: conv.participant.name,
              contactAvatar: conv.participant.avatar,
              lastMessageText: conv.lastMessage?.text,
              lastMessageAt: conv.lastMessage
                ? new Date(conv.lastMessage.sentAt)
                : undefined,
            },
            create: {
              socialAccountId: account.id,
              lateConversationId: conv.id,
              platform: conv.platform,
              contactName: conv.participant.name,
              contactAvatar: conv.participant.avatar,
              contactId: conv.participant.id,
              lastMessageText: conv.lastMessage?.text,
              lastMessageAt: conv.lastMessage
                ? new Date(conv.lastMessage.sentAt)
                : undefined,
            },
          });

          // جلب رسائل المحادثة
          const { messages } = await getConversationMessages(conv.id);

          for (const msg of messages) {
            // التحقق من التكرار
            const exists = await prisma.message.findUnique({
              where: { lateMessageId: msg.id },
            });
            if (exists) continue;

            await prisma.message.create({
              data: {
                conversationId: conversation.id,
                lateMessageId: msg.id,
                direction: msg.direction,
                content: msg.text,
                contentType: msg.contentType || "text",
                mediaUrl: msg.mediaUrl,
                replyStatus:
                  msg.direction === "inbound" ? "PENDING" : "NONE",
                sentAt: new Date(msg.sentAt),
              },
            });

            if (msg.direction === "inbound") {
              newMessages++;
              // تحديث عداد غير المقروءة
              await prisma.conversation.update({
                where: { id: conversation.id },
                data: { unreadCount: { increment: 1 } },
              });
            }
          }
        }

        // معالجة الردود التلقائية
        await processPendingMessages(account.userId);

        results.push({
          accountId: account.id,
          platform: account.platform,
          conversations: conversations.length,
          newMessages,
        });
      } catch (error) {
        console.error(
          `فشل مزامنة حساب ${account.id}:`,
          error
        );
        results.push({
          accountId: account.id,
          platform: account.platform,
          error: String(error),
        });
      }
    }

    return NextResponse.json({
      success: true,
      syncedAt: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("فشل مزامنة الرسائل:", error);
    return NextResponse.json(
      { error: "فشل المزامنة" },
      { status: 500 }
    );
  }
}
