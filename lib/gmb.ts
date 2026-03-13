// lib/gmb.ts
// Google My Business API Service
// يستخدم Google My Business API v4 (Business Profile API)

import { google } from "googleapis";
import { prisma } from "./prisma";

const SCOPES = ["https://www.googleapis.com/auth/business.manage"];

// إنشاء OAuth2 client مع token refresh تلقائي
export async function getGMBClient(userId: string) {
  // Read tokens from the Account table (managed by NextAuth Prisma adapter)
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
    select: {
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  });

  if (!account?.access_token) {
    throw new Error("المستخدم لم يربط حساب Google بعد");
  }

  const tokens = {
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  };

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials(tokens);

  // تجديد الـ token تلقائياً عند انتهاء صلاحيته
  oauth2Client.on("tokens", async (newTokens) => {
    await prisma.account.updateMany({
      where: { userId, provider: "google" },
      data: {
        access_token: newTokens.access_token ?? account.access_token,
        refresh_token: newTokens.refresh_token ?? account.refresh_token,
        expires_at: newTokens.expiry_date
          ? Math.floor(newTokens.expiry_date / 1000)
          : account.expires_at,
      },
    });
  });

  return oauth2Client;
}

// ==============================
// جلب حسابات GMB للمستخدم
// ==============================
export async function getGMBAccounts(userId: string) {
  const auth = await getGMBClient(userId);

  const response = await fetch(
    "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
    {
      headers: {
        Authorization: `Bearer ${(await auth.getAccessToken()).token}`,
      },
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("GMB API Error body:", errorBody);
    throw new Error(`GMB API Error: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return data.accounts || [];
}

// ==============================
// جلب الفروع (locations) لحساب محدد
// ==============================
export async function getGMBLocations(userId: string, accountName: string) {
  const auth = await getGMBClient(userId);
  const token = (await auth.getAccessToken()).token;

  const response = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title,storefrontAddress,phoneNumbers,categories,websiteUri,metadata`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`فشل جلب الفروع: ${error}`);
  }

  const data = await response.json();
  return data.locations || [];
}

// ==============================
// جلب التقييمات لفرع معين
// ==============================
export async function getReviews(
  userId: string,
  locationName: string,
  pageToken?: string
) {
  const auth = await getGMBClient(userId);
  const token = (await auth.getAccessToken()).token;

  const url = new URL(
    `https://mybusiness.googleapis.com/v4/${locationName}/reviews`
  );
  url.searchParams.set("pageSize", "50");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  url.searchParams.set("orderBy", "updateTime desc");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`فشل جلب التقييمات: ${error}`);
  }

  return await response.json();
}

// ==============================
// الرد على تقييم
// ==============================
export async function replyToReview(
  userId: string,
  locationName: string,
  reviewId: string,
  replyText: string
) {
  const auth = await getGMBClient(userId);
  const token = (await auth.getAccessToken()).token;

  const reviewName = `${locationName}/reviews/${reviewId}`;

  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ comment: replyText }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`فشل الرد على التقييم: ${error}`);
  }

  return await response.json();
}

// ==============================
// حذف رد على تقييم
// ==============================
export async function deleteReply(
  userId: string,
  locationName: string,
  reviewId: string
) {
  const auth = await getGMBClient(userId);
  const token = (await auth.getAccessToken()).token;

  const reviewName = `${locationName}/reviews/${reviewId}`;

  const response = await fetch(
    `https://mybusiness.googleapis.com/v4/${reviewName}/reply`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.ok;
}

// ==============================
// مساعدة: تحويل rating من GMB للرقم
// ==============================
export function parseRating(starRating: string): number {
  const map: Record<string, number> = {
    ONE: 1,
    TWO: 2,
    THREE: 3,
    FOUR: 4,
    FIVE: 5,
  };
  return map[starRating] || 0;
}
