// app/api/social-accounts/callback/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleLateOAuthCallback, getConnectedAccounts } from "@/lib/late";

// GET: استقبال callback من Late بعد إتمام OAuth
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code) {
    return NextResponse.redirect(
      new URL("/dashboard/social-accounts?error=no_code", req.url)
    );
  }

  try {
    // إتمام عملية OAuth مع Late
    const result = await handleLateOAuthCallback({
      code,
      state: state || undefined,
    });

    // جلب بيانات الحساب المربوط
    const { accounts } = await getConnectedAccounts();
    const connectedAccount = accounts.find(
      (a) => a.id === result.accountId
    );

    if (connectedAccount) {
      // حفظ الحساب في قاعدة البيانات
      await prisma.socialAccount.upsert({
        where: { lateAccountId: connectedAccount.id },
        update: {
          accountName: connectedAccount.name,
          accountAvatar: connectedAccount.avatar,
          isActive: true,
        },
        create: {
          userId: session.user.id,
          platform: connectedAccount.platform,
          lateAccountId: connectedAccount.id,
          accountName: connectedAccount.name,
          accountAvatar: connectedAccount.avatar,
        },
      });
    }

    return NextResponse.redirect(
      new URL("/dashboard/social-accounts?connected=true", req.url)
    );
  } catch (error) {
    console.error("فشل إتمام ربط الحساب:", error);
    return NextResponse.redirect(
      new URL("/dashboard/social-accounts?error=callback_failed", req.url)
    );
  }
}
