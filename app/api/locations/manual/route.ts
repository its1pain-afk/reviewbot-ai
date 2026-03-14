// app/api/locations/manual/route.ts
export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    try {
        const { name, address, phone, category } = await req.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: "اسم الفرع مطلوب" }, { status: 400 });
        }

        // Use a unique ID so manual locations don't conflict with GMB ones
        const manualId = `manual_${Date.now()}`;

        const location = await prisma.location.create({
            data: {
                userId: session.user.id,
                gmbAccountId: "manual",
                gmbLocationId: manualId,
                name: name.trim(),
                address: address?.trim() || null,
                phone: phone?.trim() || null,
                category: category?.trim() || null,
                isActive: true,
                botEnabled: true,
            },
        });

        return NextResponse.json({ location });
    } catch (error: any) {
        console.error("Error creating manual location:", error);
        return NextResponse.json(
            { error: error.message || "حدث خطأ" },
            { status: 500 }
        );
    }
}
