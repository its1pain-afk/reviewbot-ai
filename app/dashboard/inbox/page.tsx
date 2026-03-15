"use client";
import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import {
  MessageSquare,
  Send,
  Bot,
  Archive,
  RotateCcw,
  Loader2,
  Sparkles,
  ChevronRight,
  Settings2,
  Inbox,
} from "lucide-react";
import Link from "next/link";

interface Conversation {
  id: string;
  platform: string;
  contactName: string;
  contactAvatar?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  unreadCount: number;
  status: string;
  autoReplyEnabled: boolean;
  socialAccount: { platform: string; accountName: string };
}

interface Message {
  id: string;
  direction: string;
  content: string;
  contentType: string;
  aiGenerated: boolean;
  sentAt: string;
  replyStatus: string;
}

const PLATFORM_INFO: Record<string, { label: string; color: string }> = {
  whatsapp: { label: "واتساب", color: "#25D366" },
  messenger: { label: "ماسنجر", color: "#0084FF" },
  instagram: { label: "انستقرام", color: "#E4405F" },
  x: { label: "إكس", color: "#1DA1F2" },
};

function MiniPlatformIcon({ id }: { id: string }) {
  const s = "w-3.5 h-3.5";
  switch (id) {
    case "whatsapp":
      return (
        <svg className={s} viewBox="0 0 24 24" fill="#25D366">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      );
    case "messenger":
      return (
        <svg className={s} viewBox="0 0 24 24" fill="#0084FF">
          <path d="M.001 11.639C.001 4.949 5.241 0 12.001 0S24 4.95 24 11.639c0 6.689-5.24 11.638-12 11.638-1.21 0-2.38-.16-3.47-.46a.96.96 0 00-.64.05l-2.39 1.05a.96.96 0 01-1.35-.85l-.07-2.14a.97.97 0 00-.32-.68A11.39 11.389 0 01.002 11.64zm8.32-2.19l-3.52 5.6c-.35.53.32 1.139.82.75l3.79-2.87c.26-.2.6-.2.87 0l2.8 2.1c.84.63 2.04.4 2.6-.48l3.52-5.6c.35-.53-.32-1.13-.82-.75l-3.79 2.87c-.25.2-.6.2-.86 0l-2.8-2.1a1.8 1.8 0 00-2.61.48z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className={s} viewBox="0 0 24 24" fill="#E4405F">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z" />
        </svg>
      );
    case "x":
      return (
        <svg className={s} viewBox="0 0 24 24" fill="#1DA1F2">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    default:
      return null;
  }
}

const PLATFORM_FILTERS = [
  { id: "all", label: "الكل" },
  { id: "whatsapp", label: "واتساب" },
  { id: "messenger", label: "ماسنجر" },
  { id: "instagram", label: "انستقرام" },
  { id: "x", label: "إكس" },
];

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}س`;
  const days = Math.floor(hours / 24);
  return `${days}ي`;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("all");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, [platformFilter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function fetchConversations() {
    try {
      const url = `/api/inbox/conversations?platform=${platformFilter}&status=active`;
      const res = await fetch(url);
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch {
      // silent fail on poll
    } finally {
      setLoading(false);
    }
  }

  async function selectConversation(conv: Conversation) {
    setSelectedConv(conv);
    setLoadingMessages(true);
    setReplyText("");
    try {
      const res = await fetch(
        `/api/inbox/conversations/${conv.id}/messages`
      );
      const data = await res.json();
      setMessages(data.messages || []);

      // Mark as read
      await fetch(`/api/inbox/conversations/${conv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      // Update local unread count
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conv.id ? { ...c, unreadCount: 0 } : c
        )
      );
    } catch {
      toast.error("فشل تحميل الرسائل");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function sendReply() {
    if (!replyText.trim() || !selectedConv) return;
    setSending(true);
    try {
      const res = await fetch(
        `/api/inbox/conversations/${selectedConv.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: replyText }),
        }
      );
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...prev, data.message]);
        setReplyText("");
        fetchConversations();
      } else {
        toast.error(data.error || "فشل الإرسال");
      }
    } catch {
      toast.error("فشل الإرسال");
    } finally {
      setSending(false);
    }
  }

  async function generateAiReply() {
    if (!selectedConv) return;
    setGeneratingAi(true);
    try {
      const res = await fetch(
        `/api/inbox/conversations/${selectedConv.id}/ai-reply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ send: false }),
        }
      );
      const data = await res.json();
      if (data.reply) {
        setReplyText(data.reply);
        toast.success("تم توليد الرد - يمكنك تعديله ثم إرساله");
      } else {
        toast.error(data.error || "فشل التوليد");
      }
    } catch {
      toast.error("فشل توليد الرد");
    } finally {
      setGeneratingAi(false);
    }
  }

  async function toggleAutoReply() {
    if (!selectedConv) return;
    const newValue = !selectedConv.autoReplyEnabled;
    try {
      await fetch(`/api/inbox/conversations/${selectedConv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoReplyEnabled: newValue }),
      });
      setSelectedConv({ ...selectedConv, autoReplyEnabled: newValue });
      toast.success(
        newValue ? "تم تفعيل الرد التلقائي" : "تم إيقاف الرد التلقائي"
      );
    } catch {
      toast.error("حدث خطأ");
    }
  }

  async function archiveConversation() {
    if (!selectedConv) return;
    try {
      await fetch(`/api/inbox/conversations/${selectedConv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });
      toast.success("تم أرشفة المحادثة");
      setSelectedConv(null);
      setMessages([]);
      fetchConversations();
    } catch {
      toast.error("حدث خطأ");
    }
  }

  return (
    <div className="animate-fade-in h-[calc(100vh-7rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black">صندوق الوارد</h1>
        </div>
        <Link
          href="/dashboard/inbox/settings"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
          }}
        >
          <Settings2 className="w-4 h-4" />
          إعدادات البوت
        </Link>
      </div>

      {/* Main content */}
      <div
        className="flex-1 flex gap-4 min-h-0 rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Conversation list (right panel in RTL) */}
        <div
          className={`w-full sm:w-80 lg:w-96 flex-shrink-0 flex flex-col ${
            selectedConv ? "hidden sm:flex" : "flex"
          }`}
          style={{
            background: "var(--surface-2)",
            borderLeft: "1px solid var(--border)",
          }}
        >
          {/* Platform filter */}
          <div
            className="flex gap-1 p-3 overflow-x-auto"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {PLATFORM_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setPlatformFilter(f.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  background:
                    platformFilter === f.id
                      ? "var(--primary)"
                      : "transparent",
                  color:
                    platformFilter === f.id
                      ? "white"
                      : "var(--text-muted)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Conversation items */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div key={i} className="h-16 rounded-xl skeleton" />
                  ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Inbox
                  className="w-10 h-10 mx-auto mb-3"
                  style={{ color: "var(--text-muted)" }}
                />
                <p
                  className="text-sm"
                  style={{ color: "var(--text-muted)" }}
                >
                  لا توجد محادثات
                </p>
                <Link
                  href="/dashboard/social-accounts"
                  className="text-xs mt-2 inline-block"
                  style={{ color: "var(--primary)" }}
                >
                  اربط حساباتك للبدء
                </Link>
              </div>
            ) : (
              conversations.map((conv) => {
                const platform = PLATFORM_INFO[conv.platform];
                const isSelected = selectedConv?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className="w-full flex items-center gap-3 p-4 text-right transition-all"
                    style={{
                      background: isSelected
                        ? "rgba(108,99,255,0.1)"
                        : "transparent",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          background: `${platform?.color || "#666"}20`,
                          color: platform?.color || "#666",
                        }}
                      >
                        {conv.contactName[0]}
                      </div>
                      <span
                        className="absolute -bottom-0.5 -left-0.5 text-xs"
                        title={platform?.label}
                      >
                        <MiniPlatformIcon id={conv.platform} />
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm truncate">
                          {conv.contactName}
                        </span>
                        <span
                          className="text-xs shrink-0"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {conv.lastMessageAt
                            ? timeAgo(conv.lastMessageAt)
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p
                          className="text-xs truncate"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {conv.lastMessageText || "..."}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: "var(--primary)" }}
                          >
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message thread (left panel in RTL) */}
        <div
          className={`flex-1 flex flex-col ${
            selectedConv ? "flex" : "hidden sm:flex"
          }`}
          style={{ background: "var(--surface)" }}
        >
          {!selectedConv ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare
                  className="w-12 h-12 mx-auto mb-3"
                  style={{ color: "var(--text-muted)" }}
                />
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-muted)" }}
                >
                  اختر محادثة للبدء
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div
                className="flex items-center justify-between gap-3 p-4"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: "var(--surface-2)",
                }}
              >
                <div className="flex items-center gap-3">
                  {/* Back button (mobile) */}
                  <button
                    onClick={() => setSelectedConv(null)}
                    className="sm:hidden p-1"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: `${PLATFORM_INFO[selectedConv.platform]?.color || "#666"}20`,
                      color:
                        PLATFORM_INFO[selectedConv.platform]?.color || "#666",
                    }}
                  >
                    {selectedConv.contactName[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">
                      {selectedConv.contactName}
                    </div>
                    <div
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {PLATFORM_INFO[selectedConv.platform]?.label}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Auto-reply toggle */}
                  <button
                    onClick={toggleAutoReply}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: selectedConv.autoReplyEnabled
                        ? "rgba(0,212,170,0.12)"
                        : "rgba(255,255,255,0.05)",
                      color: selectedConv.autoReplyEnabled
                        ? "var(--accent)"
                        : "var(--text-muted)",
                      border: `1px solid ${selectedConv.autoReplyEnabled ? "rgba(0,212,170,0.3)" : "var(--border)"}`,
                    }}
                  >
                    <Bot className="w-3.5 h-3.5" />
                    رد تلقائي
                  </button>
                  <button
                    onClick={archiveConversation}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                    title="أرشفة"
                  >
                    <Archive
                      className="w-4 h-4"
                      style={{ color: "var(--text-muted)" }}
                    />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--primary)" }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p style={{ color: "var(--text-muted)" }}>
                      لا توجد رسائل
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.direction === "inbound"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className="max-w-[75%] rounded-2xl px-4 py-2.5"
                        style={{
                          background:
                            msg.direction === "inbound"
                              ? "rgba(255,255,255,0.08)"
                              : "var(--primary)",
                          color:
                            msg.direction === "inbound"
                              ? "var(--text)"
                              : "white",
                        }}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                        </p>
                        <div
                          className="flex items-center gap-1.5 mt-1"
                          style={{
                            color:
                              msg.direction === "inbound"
                                ? "var(--text-muted)"
                                : "rgba(255,255,255,0.7)",
                          }}
                        >
                          {msg.aiGenerated && (
                            <span className="flex items-center gap-0.5 text-xs">
                              <Bot className="w-3 h-3" />
                              AI
                            </span>
                          )}
                          <span className="text-xs">
                            {new Date(msg.sentAt).toLocaleTimeString("ar", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply bar */}
              <div
                className="p-4"
                style={{
                  borderTop: "1px solid var(--border)",
                  background: "var(--surface-2)",
                }}
              >
                <div className="flex gap-2">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    placeholder="اكتب ردك..."
                    rows={1}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{
                      background: "var(--surface-3)",
                      border: "1px solid var(--border)",
                    }}
                  />
                  <button
                    onClick={generateAiReply}
                    disabled={generatingAi}
                    className="p-2.5 rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                    style={{
                      background: "rgba(108,99,255,0.12)",
                      border: "1px solid rgba(108,99,255,0.3)",
                    }}
                    title="رد ذكي"
                  >
                    {generatingAi ? (
                      <Loader2
                        className="w-5 h-5 animate-spin"
                        style={{ color: "var(--primary)" }}
                      />
                    ) : (
                      <Sparkles
                        className="w-5 h-5"
                        style={{ color: "var(--primary)" }}
                      />
                    )}
                  </button>
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyText.trim()}
                    className="p-2.5 rounded-xl text-white transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: "var(--primary)" }}
                  >
                    {sending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
