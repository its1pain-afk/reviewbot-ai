// app/api/social-accounts/[id]/route.ts
export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE: فصل حساب اجتماعي (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });

  const account = await prisma.socialAccount.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!account)
    return NextResponse.json(
      { error: "الحساب غير موجود" },
      { status: 404 }
    );

  // تعطيل الحساب وأرشفة محادثاته
  await prisma.$transaction([
    prisma.socialAccount.update({
      where: { id: params.id },
      data: { isActive: false },
    }),
    prisma.conversation.updateMany({
      where: { socialAccountId: params.id },
      data: { status: "archived" },
    }),
  ]);

  return NextResponse.json({
    success: true,
    message: "تم فصل الحساب بنجاح",
  });
}
