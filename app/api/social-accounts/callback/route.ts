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
    console.log("[Callback] Late OAuth result:", JSON.stringify(result));

    // جلب بيانات الحساب المربوط
    const accountsData = await getConnectedAccounts();
    const accounts = accountsData.accounts || [];
    console.log("[Callback] Connected accounts length:", accounts.length);
    
    const accountIdToFind = result.accountId || (result as any).account?._id || (result as any).account?.id;
    const connectedAccount = accounts.find(
      (a: any) => a.id === accountIdToFind
    ) as any;

    if (connectedAccount) {
      console.log("[Callback] Found account to connect:", connectedAccount.id);
      
      const accountName = connectedAccount.name || connectedAccount.displayName || connectedAccount.username || "حساب اجتماعي";
      const accountAvatar = connectedAccount.avatar || connectedAccount.profilePicture || null;

      // حفظ الحساب في قاعدة البيانات
      await prisma.socialAccount.upsert({
        where: { lateAccountId: connectedAccount.id },
        update: {
          accountName,
          accountAvatar,
          isActive: true,
        },
        create: {
          userId: session.user.id,
          platform: connectedAccount.platform,
          lateAccountId: connectedAccount.id,
          accountName,
          accountAvatar,
        },
      });

      return NextResponse.redirect(
        new URL("/dashboard/social-accounts?connected=true", req.url)
      );
    } else {
      console.error("[Callback] Account not found in connected accounts list! Expected ID:", accountIdToFind);
      return NextResponse.redirect(
        new URL("/dashboard/social-accounts?error=callback_failed", req.url)
      );
    }
  } catch (error) {
    console.error("فشل إتمام ربط الحساب:", error);
    return NextResponse.redirect(
      new URL("/dashboard/social-accounts?error=callback_failed", req.url)
    );
  }
}
