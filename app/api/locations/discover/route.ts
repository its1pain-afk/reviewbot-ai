// app/api/locations/discover/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getGMBAccounts, getGMBLocations } from "@/lib/gmb";

// اكتشاف جميع الفروع المتاحة على Google My Business
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  try {
    // جلب حسابات GMB
    const accounts = await getGMBAccounts(session.user.id);

    const allLocations = [];

    // لكل حساب، جلب فروعه
    for (const account of accounts) {
      try {
        const locations = await getGMBLocations(
          session.user.id,
          account.name
        );

        for (const loc of locations) {
          allLocations.push({
            accountId: account.name,
            accountName: account.accountName || account.name,
            locationId: loc.name,
            name: loc.title,
            address: formatAddress(loc.storefrontAddress),
            phone: loc.phoneNumbers?.primaryPhone,
            website: loc.websiteUri,
            category:
              loc.categories?.primaryCategory?.displayName || null,
            mapsUrl: loc.metadata?.mapsUri,
          });
        }
      } catch (err) {
        console.error(`فشل جلب فروع حساب ${account.name}:`, err);
      }
    }

    return NextResponse.json({ accounts, locations: allLocations });
  } catch (error: any) {
    // إذا لم يكن لدى المستخدم Google tokens
    if (
      error.message?.includes("لم يربط") ||
      error.message?.includes("token")
    ) {
      return NextResponse.json(
        { error: "يجب ربط حساب Google أولاً", needsAuth: true },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "حدث خطأ" },
      { status: 500 }
    );
  }
}

function formatAddress(address: any): string {
  if (!address) return "";
  const parts = [
    address.addressLines?.join(", "),
    address.locality,
    address.administrativeArea,
    address.regionCode,
  ].filter(Boolean);
  return parts.join("، ");
}
