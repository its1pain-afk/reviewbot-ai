// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  const status = searchParams.get("status"); // pending, replied, all
  const rating = searchParams.get("rating");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  // تحقق من ملكية الفرع
  if (locationId) {
    const location = await prisma.location.findFirst({
      where: { id: locationId, userId: session.user.id },
    });
    if (!location)
      return NextResponse.json({ error: "الفرع غير موجود" }, { status: 404 });
  }

  const where: any = {
    location: { userId: session.user.id },
  };

  if (locationId) where.locationId = locationId;
  if (status === "pending") where.replied = false;
  if (status === "replied") where.replied = true;
  if (rating) where.rating = parseInt(rating);

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        location: { select: { name: true, id: true } },
      },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where }),
  ]);

  return NextResponse.json({
    reviews,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  });
}
