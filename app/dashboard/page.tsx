// app/dashboard/page.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Stats {
  totalLocations: number;
  activeLocations: number;
  totalReviews: number;
  repliedReviews: number;
  pendingReviews: number;
  avgRating: number;
  replyRate: number;
}

interface RecentReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  replied: boolean;
  publishedAt: string;
  location: { name: string };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      const [locRes, revRes] = await Promise.all([
        fetch("/api/locations"),
        fetch("/api/reviews?limit=5"),
      ]);
      const { locations } = await locRes.json();
      const { reviews } = await revRes.json();

      const totalReviews = locations.reduce((s: number, l: any) => s + l.totalReviews, 0);
      const repliedReviews = locations.reduce((s: number, l: any) => s + l.repliedCount, 0);
      const avgRating =
        locations.length > 0
          ? locations.reduce((s: number, l: any) => s + l.avgRating, 0) / locations.length
          : 0;

      setStats({
        totalLocations: locations.length,
        activeLocations: locations.filter((l: any) => l.isActive).length,
        totalReviews,
        repliedReviews,
        pendingReviews: totalReviews - repliedReviews,
        avgRating,
        replyRate: totalReviews > 0 ? (repliedReviews / totalReviews) * 100 : 0,
      });
      setRecentReviews(reviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const STAT_CARDS = stats
    ? [
        {
          label: "الفروع المرتبطة",
          value: stats.totalLocations,
          icon: "🏢",
          color: "var(--primary)",
          sub: `${stats.activeLocations} نشط`,
        },
        {
          label: "إجمالي التقييمات",
          value: stats.totalReviews,
          icon: "⭐",
          color: "#f59e0b",
          sub: `معدل ${stats.avgRating.toFixed(1)} نجوم`,
        },
        {
          label: "ردود تلقائية",
          value: stats.repliedReviews,
          icon: "✅",
          color: "var(--accent)",
          sub: `${stats.replyRate.toFixed(0)}% معدل الرد`,
        },
        {
          label: "بانتظار الرد",
          value: stats.pendingReviews,
          icon: "⏳",
          color: stats.pendingReviews > 0 ? "#f97316" : "var(--accent)",
          sub: stats.pendingReviews > 0 ? "ستُرد خلال ساعتين" : "كل شي مرتب 🎉",
        },
      ]
    : [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">لوحة التحكم</h1>
        <p style={{ color: "var(--text-muted)" }}>
          مرحباً! بوتك شغّال وجاهز للرد على التقييمات 🤖
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="h-32 rounded-2xl skeleton" />
              ))
          : STAT_CARDS.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl p-5 glass hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{card.icon}</span>
                  <div
                    className="text-3xl font-black"
                    style={{ color: card.color }}
                  >
                    {card.value.toLocaleString("ar")}
                  </div>
                </div>
                <div className="font-semibold text-sm mb-1">{card.label}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {card.sub}
                </div>
              </div>
            ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent reviews */}
        <div className="lg:col-span-3 rounded-2xl glass p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold">آخر التقييمات</h2>
            <Link
              href="/dashboard/reviews"
              className="text-sm transition-colors hover:text-white"
              style={{ color: "var(--primary)" }}
            >
              عرض الكل ←
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-16 rounded-xl skeleton" />
              ))}
            </div>
          ) : recentReviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">📭</div>
              <p style={{ color: "var(--text-muted)" }}>لا توجد تقييمات بعد</p>
              <Link
                href="/dashboard/locations"
                className="inline-block mt-3 text-sm px-4 py-2 rounded-xl"
                style={{ background: "var(--primary)", color: "white" }}
              >
                أضف فرعك الأول
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start gap-3 p-4 rounded-xl transition-colors"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0"
                    style={{ background: "var(--surface-3)" }}>
                    {review.reviewerName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm truncate">
                        {review.reviewerName}
                      </span>
                      <span className="text-xs shrink-0">
                        {"⭐".repeat(review.rating)}
                      </span>
                      {review.replied && (
                        <span className="text-xs px-2 py-0.5 rounded-full shrink-0"
                          style={{ background: "rgba(0,212,170,0.15)", color: "var(--accent)" }}>
                          تم الرد
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {review.comment || "(تقييم بدون تعليق)"}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {review.location.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl glass p-6">
            <h2 className="text-lg font-bold mb-4">إجراءات سريعة</h2>
            <div className="space-y-3">
              {[
                { href: "/dashboard/locations", icon: "➕", label: "إضافة فرع جديد", color: "var(--primary)" },
                { href: "/dashboard/reviews", icon: "👀", label: "مراجعة التقييمات", color: "#f59e0b" },
                { href: "/dashboard/bot", icon: "⚙️", label: "ضبط إعدادات البوت", color: "var(--accent)" },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02]"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}
                >
                  <span className="text-2xl">{action.icon}</span>
                  <span className="font-semibold text-sm">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Bot status */}
          <div className="rounded-2xl p-5"
            style={{ background: "linear-gradient(135deg, rgba(108,99,255,0.15), rgba(0,212,170,0.1))", border: "1px solid rgba(108,99,255,0.3)" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
              <span className="font-bold text-sm">البوت شغّال</span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              آخر مزامنة: الآن
              <br />
              المزامنة القادمة: خلال ساعتين
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
