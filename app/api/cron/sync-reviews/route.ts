// app/api/cron/sync-reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getReviews, parseRating } from "@/lib/gmb";
import { processPendingReviews } from "@/lib/botEngine";

export async function POST(req: NextRequest) {
  // حماية الـ endpoint من الاستخدام غير المصرح
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    processed: 0,
    newReviews: 0,
    errors: [] as string[],
  };

  // جلب كل الفروع النشطة
  const activeLocations = await prisma.location.findMany({
    where: {
      isActive: true,
      botEnabled: true,
      botConfig: { isActive: true },
    },
    include: { user: true },
  });

  for (const location of activeLocations) {
    try {
      // جلب التقييمات الجديدة من Google
      const reviewsData = await getReviews(
        location.userId,
        location.gmbLocationId
      );

      const reviews = reviewsData.reviews || [];

      for (const gmbReview of reviews) {
        const reviewId = gmbReview.reviewId;
        const rating = parseRating(gmbReview.starRating);

        // تجاهل التقييمات المحفوظة بالفعل
        const existing = await prisma.review.findUnique({
          where: { gmbReviewId: reviewId },
        });

        if (existing) continue;

        // حفظ التقييم الجديد
        await prisma.review.create({
          data: {
            locationId: location.id,
            gmbReviewId: reviewId,
            reviewerName:
              gmbReview.reviewer?.displayName || "مستخدم Google",
            reviewerPhoto: gmbReview.reviewer?.profilePhotoUrl,
            rating,
            comment: gmbReview.comment || null,
            publishedAt: new Date(gmbReview.createTime),
            // هل لديه رد بالفعل على Google؟
            replied: !!gmbReview.reviewReply,
            replyText: gmbReview.reviewReply?.comment || null,
            repliedAt: gmbReview.reviewReply?.updateTime
              ? new Date(gmbReview.reviewReply.updateTime)
              : null,
            replyStatus: gmbReview.reviewReply ? "REPLIED" : "PENDING",
          },
        });

        results.newReviews++;
      }

      // تحديث إحصائيات الموقع
      await updateLocationStats(location.id);

      // تشغيل البوت على التقييمات الجديدة
      await processPendingReviews(location.id);

      // تحديث وقت آخر مزامنة
      await prisma.location.update({
        where: { id: location.id },
        data: { lastSyncAt: new Date() },
      });

      results.processed++;
    } catch (error: any) {
      results.errors.push(`${location.name}: ${error.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
    timestamp: new Date().toISOString(),
  });
}

async function updateLocationStats(locationId: string) {
  const stats = await prisma.review.aggregate({
    where: { locationId },
    _count: { id: true },
    _avg: { rating: true },
  });

  const repliedCount = await prisma.review.count({
    where: { locationId, replied: true },
  });

  await prisma.location.update({
    where: { id: locationId },
    data: {
      totalReviews: stats._count.id,
      avgRating: stats._avg.rating || 0,
      repliedCount,
    },
  });
}
