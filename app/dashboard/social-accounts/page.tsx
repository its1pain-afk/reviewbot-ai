"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Link2,
  Unlink,
  Loader2,
  CheckCircle2,
  Clock,
  MessageSquare,
} from "lucide-react";

interface SocialAccount {
  id: string;
  platform: string;
  accountName: string;
  accountAvatar?: string;
  isActive: boolean;
  connectedAt: string;
}

function PlatformIcon({ id, className }: { id: string; className?: string }) {
  const cls = className || "w-6 h-6";
  switch (id) {
    case "whatsapp":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case "facebook":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M.001 11.639C.001 4.949 5.241 0 12.001 0S24 4.95 24 11.639c0 6.689-5.24 11.638-12 11.638-1.21 0-2.38-.16-3.47-.46a.96.96 0 00-.64.05l-2.39 1.05a.96.96 0 01-1.35-.85l-.07-2.14a.97.97 0 00-.32-.68A11.39 11.389 0 01.002 11.64zm8.32-2.19l-3.52 5.6c-.35.53.32 1.139.82.75l3.79-2.87c.26-.2.6-.2.87 0l2.8 2.1c.84.63 2.04.4 2.6-.48l3.52-5.6c.35-.53-.32-1.13-.82-.75l-3.79 2.87c-.25.2-.6.2-.86 0l-2.8-2.1a1.8 1.8 0 00-2.61.48z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />
        </svg>
      );
    case "twitter":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    case "googlebusiness":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z" />
        </svg>
      );
    default:
      return null;
  }
}

const PLATFORMS: Array<{
  id: string;
  label: string;
  color: string;
  supported: boolean;
  subtitle: string;
  unavailableNote?: string;
}> = [
  {
    id: "whatsapp",
    label: "واتساب",
    color: "#25D366",
    supported: true,
    subtitle: "رسائل مباشرة",
  },
  {
    id: "facebook",
    label: "ماسنجر",
    color: "#0084FF",
    supported: true,
    subtitle: "رسائل مباشرة",
  },
  {
    id: "instagram",
    label: "انستقرام",
    color: "#E4405F",
    supported: true,
    subtitle: "رسائل مباشرة",
  },
  {
    id: "twitter",
    label: "إكس (تويتر)",
    color: "#1DA1F2",
    supported: true,
    subtitle: "رسائل مباشرة",
  },
  {
    id: "googlebusiness",
    label: "خرائط قوقل",
    color: "#4285F4",
    supported: true,
    subtitle: "ردود تلقائية على التقييمات",
  },
  {
    id: "tiktok",
    label: "تيك توك",
    color: "#ff0050",
    supported: false,
    subtitle: "غير مدعوم حالياً",
    unavailableNote: "قريباً - TikTok لا يدعم الرسائل المباشرة عبر API حالياً",
  },
];

function SocialAccountsContent() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    fetchAccounts();

    const connected = searchParams.get("connected");
    const error = searchParams.get("error");

    if (connected === "true") {
      toast.success("تم ربط الحساب بنجاح!");
      router.replace("/dashboard/social-accounts");
    } else if (error) {
      const messages: Record<string, string> = {
        no_code: "فشل الربط: لم يتم استلام رمز التفويض",
        callback_failed: "فشل إتمام ربط الحساب، حاول مرة أخرى",
      };
      toast.error(messages[error] || "حدث خطأ أثناء الربط");
      router.replace("/dashboard/social-accounts");
    }
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/social-accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch {
      toast.error("فشل تحميل الحسابات");
    } finally {
      setLoading(false);
    }
  }

  async function connectPlatform(platform: string) {
    setConnecting(platform);
    try {
      const res = await fetch("/api/social-accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || "فشل بدء الربط");
      }
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setConnecting(null);
    }
  }

  async function disconnectAccount(id: string) {
    setDisconnecting(id);
    try {
      const res = await fetch(`/api/social-accounts/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("تم فصل الحساب");
      fetchAccounts();
    } catch {
      toast.error("فشل فصل الحساب");
    } finally {
      setDisconnecting(null);
    }
  }

  function getConnectedAccount(platformId: string) {
    return accounts.find((a) => a.platform === platformId && a.isActive);
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">الحسابات الاجتماعية</h1>
        <p style={{ color: "var(--text-muted)" }}>
          اربط حساباتك لاستقبال والرد على الرسائل المباشرة من مكان واحد
        </p>
      </div>

      {/* Platform cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map((platform) => {
          const connected = getConnectedAccount(platform.id);
          const isConnecting = connecting === platform.id;

          return (
            <div
              key={platform.id}
              className={`rounded-2xl glass p-5 transition-all ${
                !platform.supported ? "opacity-60" : "hover:scale-[1.02]"
              }`}
            >
              {/* Platform header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${platform.color}20`,
                      color: platform.color,
                    }}
                  >
                    <PlatformIcon id={platform.id} className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold">{platform.label}</h3>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {platform.subtitle}
                    </p>
                  </div>
                </div>

                {connected && (
                  <CheckCircle2
                    className="w-5 h-5"
                    style={{ color: "var(--accent)" }}
                  />
                )}
              </div>

              {/* Status / Action */}
              {!platform.supported ? (
                <div
                  className="flex items-center gap-2 p-3 rounded-xl text-xs"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <Clock
                    className="w-4 h-4 shrink-0"
                    style={{ color: "var(--text-muted)" }}
                  />
                  <span style={{ color: "var(--text-muted)" }}>
                    {platform.unavailableNote}
                  </span>
                </div>
              ) : connected ? (
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-2 p-3 rounded-xl text-sm"
                    style={{
                      background: "rgba(0,212,170,0.08)",
                      border: "1px solid rgba(0,212,170,0.2)",
                    }}
                  >
                    <span className="font-semibold">{connected.accountName}</span>
                  </div>
                  <button
                    onClick={() => disconnectAccount(connected.id)}
                    disabled={disconnecting === connected.id}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#ef4444",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    {disconnecting === connected.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4" />
                    )}
                    فصل الحساب
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connectPlatform(platform.id)}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: platform.color }}
                >
                  {isConnecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )}
                  ربط الحساب
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div
        className="mt-8 rounded-2xl p-5"
        style={{
          background:
            "linear-gradient(135deg, rgba(108,99,255,0.1), rgba(0,212,170,0.05))",
          border: "1px solid rgba(108,99,255,0.2)",
        }}
      >
        <div className="flex items-start gap-3">
          <MessageSquare
            className="w-5 h-5 shrink-0 mt-0.5"
            style={{ color: "var(--primary)" }}
          />
          <div>
            <h3 className="font-bold text-sm mb-1">كيف يعمل صندوق الوارد؟</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              بعد ربط حساباتك، ستظهر جميع الرسائل المباشرة وتقييمات خرائط
              قوقل في صفحة صندوق الوارد. يمكنك الرد يدوياً أو تفعيل الرد
              التلقائي بالذكاء الاصطناعي الذي يعتمد على قاعدة المعرفة الخاصة بك.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SocialAccountsPage() {
  return (
    <Suspense>
      <SocialAccountsContent />
    </Suspense>
  );
}
