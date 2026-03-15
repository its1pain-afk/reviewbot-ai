// lib/chatEngine.ts
// محرك الذكاء الاصطناعي للرد على رسائل التواصل الاجتماعي

import { InboxBotConfig, KnowledgeBase } from "@prisma/client";
import {
  getOpenAI,
  DIALECT_INSTRUCTIONS,
  getPersonalityDescription,
} from "./ai-shared";

const PLATFORM_NAMES: Record<string, string> = {
  whatsapp: "واتساب",
  messenger: "ماسنجر",
  instagram: "انستقرام",
  x: "إكس (تويتر)",
};

interface ChatMessage {
  direction: "inbound" | "outbound";
  content: string;
  sentAt: Date;
}

interface GenerateChatReplyOptions {
  conversation: {
    platform: string;
    contactName: string;
    recentMessages: ChatMessage[];
  };
  inboxBotConfig: InboxBotConfig;
  knowledgeEntries: KnowledgeBase[];
}

// ==============================
// توليد رد ذكي على رسالة
// ==============================
export async function generateChatReply({
  conversation,
  inboxBotConfig,
  knowledgeEntries,
}: GenerateChatReplyOptions): Promise<string> {
  const dialectInstructions =
    DIALECT_INSTRUCTIONS[inboxBotConfig.dialect] || DIALECT_INSTRUCTIONS.saudi;

  const platformName =
    PLATFORM_NAMES[conversation.platform] || conversation.platform;

  // بناء محتوى قاعدة المعرفة (بحد أقصى 4000 حرف)
  const knowledgeContent = buildKnowledgeContent(knowledgeEntries);

  // بناء سجل المحادثة (آخر 10 رسائل)
  const conversationHistory = buildConversationHistory(
    conversation.recentMessages
  );

  const systemMessage = `أنت موظف خدمة عملاء في ${inboxBotConfig.businessName || "منشأتنا"}، وهو ${inboxBotConfig.businessType || "منشأة تجارية"}.
أنت ترد على رسائل العملاء عبر ${platformName}.

## شخصيتك وتوجهك:
- ${getPersonalityDescription(inboxBotConfig.personality)}
${inboxBotConfig.includeEmoji ? "- استخدم بعض الإيموجيات ذات الصلة بشكل معتدل ومناسب." : ""}

## اللهجة المطلوبة:
${dialectInstructions}

## قاعدة المعرفة (استعن بها للرد):
${knowledgeContent || "لا توجد معلومات محددة - رد بشكل عام ومهني"}

## المحادثة السابقة:
${conversationHistory}

## ⚠️ قواعد صارمة:
- طول الرد بين 10 إلى ${inboxBotConfig.maxReplyLength} كلمة.
- رد بشكل طبيعي كأنك تراسل على ${platformName}، وليس كرد رسمي.
- إذا لم تجد إجابة في قاعدة المعرفة، اعتذر بلطف واطلب من العميل التواصل المباشر أو الانتظار.
- لا ترد على رسائل السبام أو الرسائل غير المفهومة - فقط رد بـ "عذراً، لم أفهم رسالتك. كيف أقدر أساعدك؟"
- لا تكرر الكلام من الرسائل السابقة.
${!inboxBotConfig.includeEmoji ? "- **ممنوع** استخدام أي إيموجي أو رموز تعبيرية." : ""}
${inboxBotConfig.forbiddenWords ? `- **ممنوع** استخدام أي من هذه الكلمات: ${inboxBotConfig.forbiddenWords}` : ""}
${inboxBotConfig.signatureName ? `- اختم الرد بـ: ${inboxBotConfig.signatureName}` : ""}

اكتب الرد مباشرة كما سيقرأه العميل.`;

  const lastInbound = conversation.recentMessages
    .filter((m) => m.direction === "inbound")
    .pop();

  const userMessage = `رسالة جديدة من ${conversation.contactName}:
"${lastInbound?.content || ""}"

اكتب رداً مناسباً:`;

  const completion = await getOpenAI().chat.completions.create({
    model: "google/gemini-2.0-flash-001",
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage },
    ],
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content || "";
  return reply.trim();
}

// ==============================
// بناء محتوى قاعدة المعرفة
// ==============================
function buildKnowledgeContent(entries: KnowledgeBase[]): string {
  const activeEntries = entries.filter((e) => e.isActive);
  if (activeEntries.length === 0) return "";

  let content = "";
  for (const entry of activeEntries) {
    const section = `### ${entry.title}\n${entry.content}\n\n`;
    if (content.length + section.length > 4000) break;
    content += section;
  }
  return content;
}

// ==============================
// بناء سجل المحادثة
// ==============================
function buildConversationHistory(messages: ChatMessage[]): string {
  const recent = messages.slice(-10);
  if (recent.length === 0) return "لا توجد رسائل سابقة";

  return recent
    .map((m) => {
      const sender = m.direction === "inbound" ? "العميل" : "أنت";
      return `${sender}: ${m.content}`;
    })
    .join("\n");
}

// ==============================
// معالجة الرسائل المعلقة
// ==============================
export async function processPendingMessages(userId: string) {
  const { prisma } = await import("./prisma");
  const { sendMessage } = await import("./late");

  const inboxConfig = await prisma.inboxBotConfig.findUnique({
    where: { userId },
  });

  if (!inboxConfig?.isActive || inboxConfig.replyMode !== "auto") return;

  const knowledgeEntries = await prisma.knowledgeBase.findMany({
    where: { userId, isActive: true },
  });

  // جلب الرسائل المعلقة في المحادثات المفعّل فيها الرد التلقائي
  const pendingMessages = await prisma.message.findMany({
    where: {
      direction: "inbound",
      replyStatus: "PENDING",
      conversation: {
        autoReplyEnabled: true,
        socialAccount: { userId, isActive: true },
      },
    },
    include: {
      conversation: {
        include: {
          messages: {
            orderBy: { sentAt: "desc" },
            take: 10,
          },
        },
      },
    },
    orderBy: { sentAt: "asc" },
    take: 20,
  });

  for (const message of pendingMessages) {
    try {
      // قفل متفائل: لا تعالج إلا إذا كانت لا تزال PENDING
      const updated = await prisma.message.updateMany({
        where: { id: message.id, replyStatus: "PENDING" },
        data: { replyStatus: "PROCESSING" },
      });
      if (updated.count === 0) continue;

      const replyText = await generateChatReply({
        conversation: {
          platform: message.conversation.platform,
          contactName: message.conversation.contactName,
          recentMessages: message.conversation.messages
            .reverse()
            .map((m) => ({
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
        message.conversation.lateConversationId,
        replyText
      );

      // حفظ الرد كرسالة جديدة
      await prisma.message.create({
        data: {
          conversationId: message.conversationId,
          lateMessageId: sentResult.id,
          direction: "outbound",
          content: replyText,
          replyStatus: "SENT",
          aiGenerated: true,
          sentAt: new Date(),
        },
      });

      // تحديث حالة الرسالة الأصلية
      await prisma.message.update({
        where: { id: message.id },
        data: { replyStatus: "SENT" },
      });

      // تحديث المحادثة
      await prisma.conversation.update({
        where: { id: message.conversationId },
        data: {
          lastMessageText: replyText,
          lastMessageAt: new Date(),
        },
      });

      // تأخير بسيط بين الردود
      if (inboxConfig.autoReplyDelay > 0) {
        await new Promise((r) =>
          setTimeout(r, inboxConfig.autoReplyDelay * 1000)
        );
      }
    } catch (error) {
      console.error(`فشل الرد على رسالة ${message.id}:`, error);
      await prisma.message.update({
        where: { id: message.id },
        data: { replyStatus: "FAILED" },
      });
    }
  }
}
