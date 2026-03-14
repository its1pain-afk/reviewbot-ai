"use client";
import { useState, useEffect } from "react";
import { Star, ChevronUp, ChevronDown, Inbox, Bot, Clock, CheckCircle2 } from "lucide-react";

interface Review {
  id: string;
  reviewerName: string;
  reviewerPhoto?: string;
  rating: number;
  comment?: string;
  replied: boolean;
  replyText?: string;
  repliedAt?: string;
  publishedAt: string;
  aiGenerated?: boolean;
  replyStatus: string;
  location: { id: string; name: string };
}

const STATUS_FILTERS = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "بانتظار الرد" },
  { value: "replied", label: "تم الرد" },
];

const STAR_COLORS = ["", "#ef4444", "#f97316", "#fbbf24", "#86efac", "#22c55e"];

function StarRow({ count, color }: { count: number; color: string }) {
  return (
    <span className="flex items-center gap-0.5" style={{ color }}>
      {Array.from({ length: count }, (_, i) => (
        <Star key={i} className="w-3 h-3 fill-current" />
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [filter, ratingFilter, page]);

  async function fetchReviews() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (filter !== "all") params.set("status", filter);
      if (ratingFilter) params.set("rating", String(ratingFilter));

      const res = await fetch(`/api/reviews?${params}`);
      const { reviews: data, pagination } = await res.json();
      setReviews(data || []);
      setTotalPages(pagination?.pages || 1);
      setTotal(pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">التقييمات</h1>
        <p style={{ color: "var(--text-muted)" }}>{total.toLocaleString("ar")} تقييم إجمالي</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: filter === f.value ? "var(--primary)" : "var(--surface-2)",
              border: filter === f.value ? "1px solid var(--primary)" : "1px solid var(--border)",
            }}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px" style={{ background: "var(--border)" }} />
        {[5, 4, 3, 2, 1].map((r) => (
          <button
            key={r}
            onClick={() => { setRatingFilter(ratingFilter === r ? null : r); setPage(1); }}
            className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: ratingFilter === r ? STAR_COLORS[r] : "var(--surface-2)",
              border: `1px solid ${ratingFilter === r ? STAR_COLORS[r] : "var(--border)"}`,
              color: ratingFilter === r ? "white" : undefined,
            }}
          >
            <Star className={`w-3.5 h-3.5 ${ratingFilter === r ? "fill-white" : ""}`} />
            {r}
          </button>
        ))}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl skeleton" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 rounded-2xl glass">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <Inbox className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
          </div>
          <p style={{ color: "var(--text-muted)" }}>لا توجد تقييمات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-2xl glass overflow-hidden transition-all"
            >
              <div
                className="p-5 cursor-pointer"
                onClick={() => setExpanded(expanded === review.id ? null : review.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  {review.reviewerPhoto ? (
                    <img
                      src={review.reviewerPhoto}
                      alt=""
                      className="w-11 h-11 rounded-full shrink-0"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0"
                      style={{
                        background: `${STAR_COLORS[review.rating]}25`,
                        color: STAR_COLORS[review.rating],
                      }}
                    >
                      {review.reviewerName[0]}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold">{review.reviewerName}</span>
                      <StarRow count={review.rating} color={STAR_COLORS[review.rating]} />
                      {review.replied ? (
                        <span
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(0,212,170,0.15)", color: "var(--accent)" }}
                        >
                          {review.aiGenerated ? (
                            <Bot className="w-3 h-3" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {review.aiGenerated ? "رد تلقائي" : "تم الرد"}
                        </span>
                      ) : (
                        <span
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}
                        >
                          <Clock className="w-3 h-3" />
                          بانتظار الرد
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        • {review.location.name}
                      </span>
                    </div>

                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>
                      {review.comment || (
                        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>
                          (تقييم بدون تعليق)
                        </span>
                      )}
                    </p>

                    <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                      {new Date(review.publishedAt).toLocaleDateString("ar-SA", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>

                  <div style={{ color: "var(--text-muted)" }}>
                    {expanded === review.id ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded: show reply */}
              {expanded === review.id && review.replyText && (
                <div className="px-5 pb-5 pt-0" style={{ borderTop: "1px solid var(--border)" }}>
                  <div
                    className="mt-4 p-4 rounded-xl"
                    style={{
                      background: "rgba(108,99,255,0.08)",
                      border: "1px solid rgba(108,99,255,0.2)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 shrink-0" style={{ color: "var(--primary)" }} />
                      <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>
                        رد البوت
                      </span>
                      {review.repliedAt && (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          • {new Date(review.repliedAt).toLocaleDateString("ar-SA")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed">{review.replyText}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity"
            style={{ background: "var(--surface-2)" }}
          >
            السابق
          </button>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 transition-opacity"
            style={{ background: "var(--surface-2)" }}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}
