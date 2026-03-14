// app/api/locations/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGMBAccounts, getGMBLocations } from "@/lib/gmb";

// GET: جلب فروع المستخدم المحفوظة
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const locations = await prisma.location.findMany({
    where: { userId: session.user.id },
    include: {
      botConfig: {
        select: {
          isActive: true,
          tone: true,
          dialect: true,
          replySpeed: true,
          businessType: true,
        },
      },
      _count: {
        select: {
          reviews: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ locations });
}

// POST: استيراد فرع من Google My Business
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const { gmbAccountId, gmbLocationId, name, address, phone, category } =
    await req.json();

  // تحقق من عدم تكرار الفرع
  const existing = await prisma.location.findUnique({
    where: {
      userId_gmbLocationId: {
        userId: session.user.id,
        gmbLocationId,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "هذا الفرع مضاف بالفعل" },
      { status: 400 }
    );
  }

  const location = await prisma.location.create({
    data: {
      userId: session.user.id,
      gmbAccountId,
      gmbLocationId,
      name,
      address,
      phone,
      category,
    },
  });

  // إنشاء إعدادات افتراضية للبوت
  await prisma.botConfig.create({
    data: {
      userId: session.user.id,
      locationId: location.id,
      businessName: name,
      businessType: category || "منشأة تجارية",
      dialect: "saudi",
      tone: "warm",
      personality: "friendly",
      replySpeed: "2h",
      includeEmoji: true,
    },
  });

  return NextResponse.json({ location, message: "تم إضافة الفرع بنجاح" });
}
