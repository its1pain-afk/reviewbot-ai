// app/api/webhooks/late/register/route.ts
// تسجيل webhook مع Late (يُستخدم مرة واحدة عند الإعداد)
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createWebhookSettings } from "@/lib/late";

export async function POST(req: NextRequest) {
  // حماية بنفس طريقة cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const result = await createWebhookSettings({
      url: `${appUrl}/api/webhooks/late`,
      events: ["message.received", "message.sent"],
      secret: process.env.LATE_WEBHOOK_SECRET,
    });

    return NextResponse.json({
      success: true,
      webhookId: result.id,
      message: "تم تسجيل webhook بنجاح",
    });
  } catch (error) {
    console.error("فشل تسجيل webhook:", error);
    return NextResponse.json(
      { error: "فشل تسجيل webhook" },
      { status: 500 }
    );
  }
}
