// lib/late.ts
// Late.dev Unified Inbox API wrapper
// يستخدم Late API لإدارة الرسائل من جميع منصات التواصل الاجتماعي

const LATE_BASE_URL =
  process.env.LATE_API_BASE_URL || "https://getlate.dev/api/v1";

function getHeaders() {
  if (!process.env.LATE_API_KEY) {
    throw new Error("LATE_API_KEY غير معرّف في متغيرات البيئة");
  }
  return {
    Authorization: `Bearer ${process.env.LATE_API_KEY}`,
    "Content-Type": "application/json",
  };
}

async function lateRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${LATE_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Late API Error [${path}]:`, errorBody);
    throw new Error(
      `Late API Error: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  return response.json();
}

// ==============================
// إدارة الحسابات والربط
// ==============================

export async function createLateProfile(name: string) {
  const res = await lateRequest<{ profile: { _id: string } }>("/profiles", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return { id: res.profile._id };
}

export async function getLateOAuthUrl(
  platform: string,
  profileId: string,
  callbackUrl?: string
) {
  const params = new URLSearchParams({ profileId });
  if (callbackUrl) params.set("callbackUrl", callbackUrl);

  const raw = await lateRequest<Record<string, unknown>>(
    `/connect/${platform}?${params.toString()}`
  );
  console.log("[getLateOAuthUrl] raw response:", JSON.stringify(raw));
  // normalize: try known field names
  const url = (raw.url || raw.oauthUrl || raw.redirectUrl || raw.authUrl) as string | undefined;
  return { url };
}

export async function handleLateOAuthCallback(data: {
  code: string;
  state?: string;
}) {
  return lateRequest<{ accountId: string }>("/connect/handle-oauth-callback", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getConnectedAccounts() {
  return lateRequest<{
    accounts: Array<{
      id: string;
      platform: string;
      name: string;
      avatar?: string;
      status: string;
    }>;
  }>("/accounts");
}

// ==============================
// صندوق الوارد - المحادثات
// ==============================

export async function listInboxConversations(params?: {
  accountId?: string;
  status?: string;
  nextPageToken?: string;
}) {
  const url = new URL(`${LATE_BASE_URL}/messages/list-inbox-conversations`);
  if (params?.accountId) url.searchParams.set("accountId", params.accountId);
  if (params?.status) url.searchParams.set("status", params.status);
  if (params?.nextPageToken)
    url.searchParams.set("nextPageToken", params.nextPageToken);

  const response = await fetch(url.toString(), { headers: getHeaders() });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`فشل جلب المحادثات: ${error}`);
  }
  return response.json() as Promise<{
    conversations: Array<{
      id: string;
      platform: string;
      participant: {
        name: string;
        avatar?: string;
        id?: string;
      };
      lastMessage?: {
        text: string;
        sentAt: string;
      };
      unreadCount: number;
      status: string;
    }>;
    nextPageToken?: string;
  }>;
}

export async function getConversation(conversationId: string) {
  return lateRequest<{
    id: string;
    platform: string;
    participant: { name: string; avatar?: string; id?: string };
    status: string;
  }>(`/messages/get-inbox-conversation?conversationId=${conversationId}`);
}

export async function getConversationMessages(
  conversationId: string,
  nextPageToken?: string
) {
  const url = new URL(
    `${LATE_BASE_URL}/messages/get-inbox-conversation-messages`
  );
  url.searchParams.set("conversationId", conversationId);
  if (nextPageToken) url.searchParams.set("nextPageToken", nextPageToken);

  const response = await fetch(url.toString(), { headers: getHeaders() });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`فشل جلب الرسائل: ${error}`);
  }
  return response.json() as Promise<{
    messages: Array<{
      id: string;
      text: string;
      direction: "inbound" | "outbound";
      contentType?: string;
      mediaUrl?: string;
      sentAt: string;
    }>;
    nextPageToken?: string;
  }>;
}

// ==============================
// إرسال الرسائل
// ==============================

export async function sendMessage(
  conversationId: string,
  text: string
) {
  return lateRequest<{ id: string; status: string }>(
    "/messages/send-inbox-message",
    {
      method: "POST",
      body: JSON.stringify({ conversationId, text }),
    }
  );
}

export async function updateConversation(
  conversationId: string,
  data: { status?: string }
) {
  return lateRequest<{ success: boolean }>(
    "/messages/update-inbox-conversation",
    {
      method: "PATCH",
      body: JSON.stringify({ conversationId, ...data }),
    }
  );
}

// ==============================
// Webhooks
// ==============================

export async function createWebhookSettings(data: {
  url: string;
  events: string[];
  secret?: string;
}) {
  return lateRequest<{ id: string }>("/webhooks/create-webhook-settings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
