// app/api/bot-config/[locationId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateReply } from "@/lib/botEngine";

function getDefaultConfig(userId: string, locationId: string) {
  return {
    userId,
    locationId,
    businessName: "",
    businessType: "منشأة تجارية",
    dialect: "saudi",
    personality: "friendly",
    tone: "warm",
    replySpeed: "2h",
    includeEmoji: true,
    signatureName: "",
    customContext: "",
    forbiddenWords: "",
    fiveStar: "",
    fourStar: "",
    threeStar: "",
    twoStar: "",
    oneStar: "",
    isActive: true,
  };
}

// GET: جلب إعدادات البوت لفرع معين (أو إنشاء افتراضية)
export async function GET(
  req: NextRequest,
  { params }: { params: { locationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const config = await prisma.botConfig.upsert({
    where: {
      locationId: params.locationId,
    },
    update: {},
    create: getDefaultConfig(session.user.id, params.locationId),
  });

  return NextResponse.json({ config });
}

// PUT: تحديث إعدادات البوت
export async function PUT(
  req: NextRequest,
  { params }: { params: { locationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const data = await req.json();

  const config = await prisma.botConfig.upsert({
    where: {
      locationId: params.locationId,
    },
    update: {
      businessName: data.businessName,
      businessType: data.businessType,
      dialect: data.dialect,
      tone: data.tone,
      personality: data.personality,
      replySpeed: data.replySpeed,
      includeEmoji: data.includeEmoji,
      signatureName: data.signatureName,
      fiveStar: data.fiveStar,
      fourStar: data.fourStar,
      threeStar: data.threeStar,
      twoStar: data.twoStar,
      oneStar: data.oneStar,
      customContext: data.customContext,
      forbiddenWords: data.forbiddenWords,
      isActive: data.isActive,
      updatedAt: new Date(),
    },
    create: {
      ...getDefaultConfig(session.user.id, params.locationId),
      businessName: data.businessName,
      businessType: data.businessType,
      dialect: data.dialect,
      tone: data.tone,
      personality: data.personality,
      replySpeed: data.replySpeed,
      includeEmoji: data.includeEmoji,
      signatureName: data.signatureName,
      fiveStar: data.fiveStar,
      fourStar: data.fourStar,
      threeStar: data.threeStar,
      twoStar: data.twoStar,
      oneStar: data.oneStar,
      customContext: data.customContext,
      forbiddenWords: data.forbiddenWords,
      isActive: data.isActive,
    },
  });

  return NextResponse.json({ success: true, config });
}

// POST: معاينة رد (تجربة البوت)
export async function POST(
  req: NextRequest,
  { params }: { params: { locationId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { reviewerName, rating, comment } = await req.json();

  // جلب أو إنشاء إعدادات افتراضية
  const config = await prisma.botConfig.upsert({
    where: { locationId: params.locationId },
    update: {},
    create: getDefaultConfig(session.user.id, params.locationId),
  });

  const reply = await generateReply({
    review: { reviewerName, rating, comment },
    botConfig: config,
  });

  return NextResponse.json({ reply });
}
