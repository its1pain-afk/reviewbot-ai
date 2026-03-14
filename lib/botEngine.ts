// lib/botEngine.ts
// محرك الذكاء الاصطناعي لتوليد الردود - OpenRouter

import OpenAI from "openai";
import { BotConfig } from "@prisma/client";

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY!,
    });
  }
  return _openai;
}

// ==============================
// أنواع اللهجات
// ==============================
const DIALECT_INSTRUCTIONS: Record<string, string> = {
  saudi: `
    - استخدم اللهجة السعودية البيضاء الأصيلة
    - كلمات مثل: يهلا، مرحبا، شكراً، نتشرف، يسعدنا، تسلم، والله، ما قصّر
    - تجنب العربية الفصحى المتكلفة
    - النبرة دافئة وكريمة كما هو متعارف عليه في الضيافة السعودية
  `,
  gulf: `
    - استخدم اللهجة الخليجية العامة
    - كلمات مثل: هلا، مرحبا، شكراً، يسعدنا، تسلم، إن شاء الله
    - النبرة محترمة وودية
  `,
  levant: `
    - استخدم اللهجة الشامية (لبنانية/سورية/فلسطينية/أردنية)
    - كلمات مثل: يسلمو، مرسي، كتير، هيدا، متشكرين
    - النبرة حارة ومرحة
  `,
  egyptian: `
    - استخدم اللهجة المصرية
    - كلمات مثل: شكراً جزيلاً، يارب، تسلم، حبيبي، إزيك
    - النبرة ودية ومريحة
  `,
  msa: `
    - استخدم العربية الفصحى البسيطة
    - أسلوب رسمي ومهني
  `,
};

// ==============================
// تعليمات حسب التقييم
// ==============================
const DEFAULT_STAR_INSTRUCTIONS: Record<number, string> = {
  5: "اشكر العميل بحرارة على تقييمه الممتاز، وعبّر عن سعادتك باستمرار دعمه",
  4: "اشكر العميل على تقييمه الجيد، واستفسر بلطف إذا كان هناك ما يمكن تحسينه",
  3: "اشكر العميل على ملاحظاته، وعبّر عن رغبتك في التحسين وخدمته بشكل أفضل",
  2: "تعامل مع الأمر باحترافية، اعتذر بلطف واعد بالتحسين، واطلب فرصة ثانية",
  1: "تعامل بحكمة وهدوء، اعتذر بصدق، اعترف بالتقصير إن وُجد، واعد بالتحسين ودعو للتواصل المباشر",
};

interface GenerateReplyOptions {
  review: {
    reviewerName: string;
    rating: number;
    comment: string | null;
  };
  botConfig: BotConfig;
}

// ==============================
// توليد الرد بالذكاء الاصطناعي
// ==============================
export async function generateReply({
  review,
  botConfig,
}: GenerateReplyOptions): Promise<string> {
  const dialectInstructions =
    DIALECT_INSTRUCTIONS[botConfig.dialect] || DIALECT_INSTRUCTIONS.saudi;

  const starInstructions = getStarInstructions(review.rating, botConfig);

  const systemMessage = `أنت موظف خدمة عملاء محترف في ${botConfig.businessName}، وهو ${botConfig.businessType}.

## شخصيتك وتوجهك:
- ${getPersonalityDescription(botConfig.personality)}
${botConfig.includeEmoji ? "- استخدم بعض الإيموجيات ذات الصلة بشكل معتدل ومناسب." : ""}

## اللهجة المطلوبة:
${dialectInstructions}

## معلومات عن المنشأة (للاستعانة بها بالرد):
${botConfig.customContext || "منشأة راقية تهتم بتجربة العملاء"}

## تعليمات الرد التحديداً لهذا التقييم (${review.rating} نجوم):
${starInstructions}

## ⚠️ قواعد صارمة جداً (يجب الالتزام بها حرفياً):
- طول الرد بين 20 إلى 80 كلمة كحد أقصى.
- لا تكرر الكلام، ويجب أن يكون الرد طبيعياً وصادقاً وليس آلياً.
- لا تذكر عدد النجوم ولا تقم بتقييم التقييم.
- رحب بالعميل باسمه إذا كان اسماً لشخص (تجاهل الأسماء مثل A Google User).
${!botConfig.includeEmoji ? "- **ممنوع منعاً باتاً** استخدام أي إيموجي (Emojis) أو رموز تعبيرية في الرد." : ""}
${botConfig.forbiddenWords ? `- **ممنوع منعاً باتاً** استخدام أي من هذه الكلمات: ${botConfig.forbiddenWords}` : ""}
${botConfig.signatureName ? `- **يجب** أن تختم الرد في سطر جديد بهذا التوقيع نصاً: ${botConfig.signatureName}` : ""}

اكتب الرد مباشرة كما سيقرأه العميل، بدون أي مقدمات أو شروحات إضافية.`;

  const userMessage = `تقييم جديد من: ${review.reviewerName}
التقييم: ${"⭐".repeat(review.rating)}
التعليق: ${review.comment || "(لا يوجد تعليق - فقط تقييم بالنجوم)"}

اكتب رداً مناسباً:`;

  const completion = await getOpenAI().chat.completions.create({
    model: "google/gemini-2.0-flash-001", // Using stable paid gemini via openrouter
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage }
    ],
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content || "";
  return reply.trim();
}

// ==============================
// تعليمات النجوم مع custom override
// ==============================
function getStarInstructions(rating: number, botConfig: BotConfig): string {
  const customMap: Record<number, string | null> = {
    5: botConfig.fiveStar,
    4: botConfig.fourStar,
    3: botConfig.threeStar,
    2: botConfig.twoStar,
    1: botConfig.oneStar,
  };

  return customMap[rating] || DEFAULT_STAR_INSTRUCTIONS[rating] || DEFAULT_STAR_INSTRUCTIONS[3];
}

function getPersonalityDescription(personality: string): string {
  const descriptions: Record<string, string> = {
    friendly: "ودود ودافئ، تتعامل مع العملاء كأصدقاء",
    professional: "محترف ورسمي، تحافظ على مستوى راقٍ من الاحترافية",
    luxury: "فاخر ومتميز، أسلوبك يعكس تجربة فاخرة لا مثيل لها",
  };
  return descriptions[personality] || descriptions.friendly;
}

// ==============================
// معالجة دفعة من التقييمات
// ==============================
export async function processPendingReviews(locationId: string) {
  const { prisma } = await import("./prisma");

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { botConfig: true, user: true },
  });

  if (!location?.botConfig?.isActive || !location.botEnabled) return;

  const pendingReviews = await prisma.review.findMany({
    where: {
      locationId,
      replyStatus: "PENDING",
      replied: false,
    },
    orderBy: { publishedAt: "desc" },
    take: 10,
  });

  const { replyToReview } = await import("./gmb");

  for (const review of pendingReviews) {
    try {
      await prisma.review.update({
        where: { id: review.id },
        data: { replyStatus: "PROCESSING" },
      });

      const replyText = await generateReply({
        review: {
          reviewerName: review.reviewerName,
          rating: review.rating,
          comment: review.comment,
        },
        botConfig: location.botConfig,
      });

      // نشر الرد على Google
      await replyToReview(
        location.userId,
        location.gmbLocationId,
        review.gmbReviewId,
        replyText
      );

      await prisma.review.update({
        where: { id: review.id },
        data: {
          replyStatus: "REPLIED",
          replied: true,
          replyText,
          repliedAt: new Date(),
          aiGenerated: true,
        },
      });

      // تأخير بسيط بين الردود لتبدو طبيعية
      await delay(getReplyDelay(location.botConfig.replySpeed));
    } catch (error) {
      console.error(`فشل الرد على تقييم ${review.id}:`, error);
      await prisma.review.update({
        where: { id: review.id },
        data: { replyStatus: "FAILED" },
      });
    }
  }
}

function getReplyDelay(speed: string): number {
  const delays: Record<string, number> = {
    instant: 0,
    "30m": 30 * 60 * 1000,
    "1h": 60 * 60 * 1000,
    "2h": 2 * 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "24h": 24 * 60 * 60 * 1000,
  };
  return delays[speed] || 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
