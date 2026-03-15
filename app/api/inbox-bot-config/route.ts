// app/api/inbox-bot-config/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getDefaultInboxConfig(userId: string) {
  return {
    userId,
    isActive: true,
    replyMode: "manual",
    dialect: "saudi",
    personality: "friendly",
    includeEmoji: true,
    signatureName: "",
    businessName: "",
    businessType: "منشأة تجارية",
    forbiddenWords: "",
    maxReplyLength: 150,
    autoReplyDelay: 5,
  };
}

// GET: جلب إعدادات بوت الرسائل (أو إنشاء افتراضية)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const config = await prisma.inboxBotConfig.upsert({
    where: { userId: session.user.id },
    update: {},
    create: getDefaultInboxConfig(session.user.id),
  });

  return NextResponse.json({ config });
}

// PUT: تحديث إعدادات بوت الرسائل
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const data = await req.json();

  const config = await prisma.inboxBotConfig.upsert({
    where: { userId: session.user.id },
    update: {
      isActive: data.isActive,
      replyMode: data.replyMode,
      dialect: data.dialect,
      personality: data.personality,
      includeEmoji: data.includeEmoji,
      signatureName: data.signatureName,
      businessName: data.businessName,
      businessType: data.businessType,
      forbiddenWords: data.forbiddenWords,
      maxReplyLength: data.maxReplyLength,
      autoReplyDelay: data.autoReplyDelay,
      updatedAt: new Date(),
    },
    create: {
      ...getDefaultInboxConfig(session.user.id),
      ...data,
    },
  });

  return NextResponse.json({ success: true, config });
}
