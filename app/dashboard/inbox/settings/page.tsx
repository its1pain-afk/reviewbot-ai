"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Bot,
  Save,
  Smile,
  Briefcase,
  Sparkles,
  Globe,
  Loader2,
  ArrowRight,
  MessageSquare,
  Building2,
  Ban,
  type LucideIcon,
} from "lucide-react";

const DIALECTS: Array<{
  value: string;
  label: string;
  desc: string;
}> = [
  { value: "saudi", label: "سعودي", desc: "اللهجة السعودية البيضاء" },
  { value: "gulf", label: "خليجي", desc: "لهجة خليجية عامة" },
  { value: "levant", label: "شامي", desc: "لبناني / سوري / أردني" },
  { value: "egyptian", label: "مصري", desc: "اللهجة المصرية" },
  { value: "msa", label: "فصحى", desc: "العربية الفصحى البسيطة" },
];

const PERSONALITIES: Array<{
  value: string;
  Icon: LucideIcon;
  label: string;
}> = [
  { value: "friendly", Icon: Smile, label: "ودود ودافئ" },
  { value: "professional", Icon: Briefcase, label: "محترف ورسمي" },
  { value: "luxury", Icon: Sparkles, label: "فاخر ومتميز" },
];

interface InboxConfig {
  isActive: boolean;
  replyMode: string;
  dialect: string;
  personality: string;
  includeEmoji: boolean;
  signatureName: string;
  businessName: string;
  businessType: string;
  forbiddenWords: string;
  maxReplyLength: number;
  autoReplyDelay: number;
}

function Section({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl glass p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: "var(--primary)" }} />
        <h2 className="font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function InboxSettingsPage() {
  const [config, setConfig] = useState<InboxConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  async function fetchConfig() {
    try {
      const res = await fetch("/api/inbox-bot-config");
      const data = await res.json();
      setConfig(data.config);
    } catch {
      toast.error("فشل تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  }

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch("/api/inbox-bot-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error();
      toast.success("تم حفظ الإعدادات");
    } catch {
      toast.error("فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  function update(field: keyof InboxConfig, value: any) {
    if (config) setConfig({ ...config, [field]: value });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "var(--primary)" }}
        />
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/inbox"
            className="p-2 rounded-lg hover:opacity-70 transition-opacity"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black">إعدادات بوت الرسائل</h1>
            <p
              className="text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              تحكم في سلوك الرد التلقائي على الرسائل المباشرة
            </p>
          </div>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50"
          style={{
            background:
              "linear-gradient(135deg, var(--primary), var(--accent))",
          }}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          حفظ
        </button>
      </div>

      <div className="space-y-6">
        {/* Bot status & reply mode */}
        <Section title="حالة البوت" Icon={Bot}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">تفعيل البوت</p>
              <p
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                تشغيل أو إيقاف الرد التلقائي
              </p>
            </div>
            <button
              onClick={() => update("isActive", !config.isActive)}
              className="w-12 h-7 rounded-full transition-all relative"
              style={{
                background: config.isActive
                  ? "var(--accent)"
                  : "rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all"
                style={{
                  right: config.isActive ? "4px" : "auto",
                  left: config.isActive ? "auto" : "4px",
                }}
              />
            </button>
          </div>

          <Field label="وضع الرد">
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  value: "manual",
                  label: "يدوي",
                  desc: "يولّد رد مقترح وينتظر موافقتك",
                },
                {
                  value: "auto",
                  label: "تلقائي",
                  desc: "يرد تلقائياً على كل رسالة",
                },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => update("replyMode", mode.value)}
                  className="p-3 rounded-xl text-right transition-all"
                  style={{
                    background:
                      config.replyMode === mode.value
                        ? "rgba(108,99,255,0.12)"
                        : "rgba(255,255,255,0.03)",
                    border: `2px solid ${config.replyMode === mode.value ? "var(--primary)" : "var(--border)"}`,
                  }}
                >
                  <div className="font-semibold text-sm">{mode.label}</div>
                  <div
                    className="text-xs mt-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {mode.desc}
                  </div>
                </button>
              ))}
            </div>
          </Field>
        </Section>

        {/* Business info */}
        <Section title="معلومات المنشأة" Icon={Building2}>
          <Field label="اسم المنشأة">
            <input
              type="text"
              value={config.businessName}
              onChange={(e) => update("businessName", e.target.value)}
              placeholder="مثال: مطعم الريان"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--surface-3)",
                border: "1px solid var(--border)",
              }}
            />
          </Field>
          <Field label="نوع المنشأة">
            <input
              type="text"
              value={config.businessType}
              onChange={(e) => update("businessType", e.target.value)}
              placeholder="مثال: مطعم"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--surface-3)",
                border: "1px solid var(--border)",
              }}
            />
          </Field>
        </Section>

        {/* Dialect */}
        <Section title="اللهجة" Icon={Globe}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DIALECTS.map((d) => (
              <button
                key={d.value}
                onClick={() => update("dialect", d.value)}
                className="p-3 rounded-xl text-right transition-all"
                style={{
                  background:
                    config.dialect === d.value
                      ? "rgba(108,99,255,0.12)"
                      : "rgba(255,255,255,0.03)",
                  border: `2px solid ${config.dialect === d.value ? "var(--primary)" : "var(--border)"}`,
                }}
              >
                <div className="font-semibold text-sm">{d.label}</div>
                <div
                  className="text-xs mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {d.desc}
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Personality */}
        <Section title="الشخصية" Icon={MessageSquare}>
          <div className="grid grid-cols-3 gap-3">
            {PERSONALITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => update("personality", p.value)}
                className="p-3 rounded-xl text-center transition-all"
                style={{
                  background:
                    config.personality === p.value
                      ? "rgba(108,99,255,0.12)"
                      : "rgba(255,255,255,0.03)",
                  border: `2px solid ${config.personality === p.value ? "var(--primary)" : "var(--border)"}`,
                }}
              >
                <p.Icon
                  className="w-5 h-5 mx-auto mb-1"
                  style={{
                    color:
                      config.personality === p.value
                        ? "var(--primary)"
                        : "var(--text-muted)",
                  }}
                />
                <div className="font-semibold text-xs">{p.label}</div>
              </button>
            ))}
          </div>
        </Section>

        {/* Additional settings */}
        <Section title="إعدادات إضافية" Icon={Sparkles}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm">إيموجي</p>
              <p
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                السماح باستخدام إيموجي في الردود
              </p>
            </div>
            <button
              onClick={() => update("includeEmoji", !config.includeEmoji)}
              className="w-12 h-7 rounded-full transition-all relative"
              style={{
                background: config.includeEmoji
                  ? "var(--accent)"
                  : "rgba(255,255,255,0.1)",
              }}
            >
              <div
                className="w-5 h-5 rounded-full bg-white absolute top-1 transition-all"
                style={{
                  right: config.includeEmoji ? "4px" : "auto",
                  left: config.includeEmoji ? "auto" : "4px",
                }}
              />
            </button>
          </div>

          <Field label="التوقيع">
            <input
              type="text"
              value={config.signatureName}
              onChange={(e) => update("signatureName", e.target.value)}
              placeholder="مثال: فريق خدمة العملاء"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--surface-3)",
                border: "1px solid var(--border)",
              }}
            />
          </Field>

          <Field label="أقصى طول للرد (كلمات)">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={50}
                max={300}
                step={10}
                value={config.maxReplyLength}
                onChange={(e) =>
                  update("maxReplyLength", parseInt(e.target.value))
                }
                className="flex-1"
              />
              <span
                className="text-sm font-semibold w-10 text-center"
                style={{ color: "var(--primary)" }}
              >
                {config.maxReplyLength}
              </span>
            </div>
          </Field>

          <Field label="تأخير الرد التلقائي (ثواني)">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={60}
                step={5}
                value={config.autoReplyDelay}
                onChange={(e) =>
                  update("autoReplyDelay", parseInt(e.target.value))
                }
                className="flex-1"
              />
              <span
                className="text-sm font-semibold w-10 text-center"
                style={{ color: "var(--primary)" }}
              >
                {config.autoReplyDelay}
              </span>
            </div>
          </Field>

          <Field label="كلمات ممنوعة">
            <input
              type="text"
              value={config.forbiddenWords}
              onChange={(e) => update("forbiddenWords", e.target.value)}
              placeholder="افصل بين الكلمات بفاصلة"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "var(--surface-3)",
                border: "1px solid var(--border)",
              }}
            />
          </Field>
        </Section>
      </div>
    </div>
  );
}
