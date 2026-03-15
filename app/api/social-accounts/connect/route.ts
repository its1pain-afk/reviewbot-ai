// app/api/social-accounts/connect/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getLateOAuthUrl, createLateProfile } from "@/lib/late";
import { prisma } from "@/lib/prisma";

const SUPPORTED_PLATFORMS = ["whatsapp", "facebook", "instagram", "twitter", "googlebusiness"];

// POST: بدء ربط حساب اجتماعي عبر Late OAuth
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const { platform } = await req.json();

  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { error: `المنصة "${platform}" غير مدعومة للرسائل المباشرة` },
      { status: 400 }
    );
  }

  try {
    // جلب أو إنشاء Late profile مرة واحدة فقط لكل مستخدم
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, lateProfileId: true },
    });
    console.log("[connect] user from DB:", JSON.stringify(user));

    let lateProfileId = user?.lateProfileId;

    if (!lateProfileId) {
      console.log("[connect] no lateProfileId found, creating new profile...");
      const profile = await createLateProfile(
        user?.name || user?.email || session.user.id
      );
      console.log("[connect] createLateProfile response:", JSON.stringify(profile));
      lateProfileId = profile.id;
      await prisma.user.update({
        where: { id: session.user.id },
        data: { lateProfileId },
      });
      console.log("[connect] saved lateProfileId to DB:", lateProfileId);
    } else {
      console.log("[connect] reusing existing lateProfileId:", lateProfileId);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const callbackUrl = `${appUrl}/api/social-accounts/callback`;

    console.log("[connect] calling getLateOAuthUrl for platform:", platform, "profileId:", lateProfileId);
    const { url } = await getLateOAuthUrl(platform, lateProfileId, callbackUrl);
    console.log("[connect] got OAuth URL:", url);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error("[connect] ERROR:", error?.message || error);
    console.error("[connect] ERROR stack:", error?.stack);
    return NextResponse.json(
      { error: "فشل بدء عملية الربط", detail: error?.message },
      { status: 500 }
    );
  }
}
