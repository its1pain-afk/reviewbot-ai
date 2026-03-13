// app/dashboard/bot/page.tsx
"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

const DIALECTS = [
  { value: "saudi", label: "🇸🇦 سعودي", desc: "اللهجة السعودية البيضاء" },
  { value: "gulf", label: "🌊 خليجي", desc: "لهجة خليجية عامة" },
  { value: "levant", label: "🌿 شامي", desc: "لبناني / سوري / أردني" },
  { value: "egyptian", label: "🏛 مصري", desc: "اللهجة المصرية" },
  { value: "msa", label: "📖 فصحى", desc: "العربية الفصحى البسيطة" },
];

const PERSONALITIES = [
  { value: "friendly", label: "😊 ودود ودافئ" },
  { value: "professional", label: "💼 محترف ورسمي" },
  { value: "luxury", label: "✨ فاخر ومتميز" },
];

const REPLY_SPEEDS = [
  { value: "instant", label: "فوري ⚡" },
  { value: "30m", label: "30 دقيقة" },
  { value: "1h", label: "ساعة" },
  { value: "2h", label: "ساعتين (موصى به)" },
  { value: "6h", label: "6 ساعات" },
  { value: "24h", label: "24 ساعة" },
];

interface Location {
  id: string;
  name: string;
}

interface BotConfig {
  businessName: string;
  businessType: string;
  dialect: string;
  personality: string;
  tone: string;
  replySpeed: string;
  includeEmoji: boolean;
  signatureName: string;
  customContext: string;
  forbiddenWords: string;
  fiveStar: string;
  fourStar: string;
  threeStar: string;
  twoStar: string;
  oneStar: string;
  isActive: boolean;
}

export default function BotSettingsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preview state
  const [previewRating, setPreviewRating] = useState(5);
  const [previewComment, setPreviewComment] = useState("الخدمة كانت رائعة جداً!");
  const [previewReply, setPreviewReply] = useState("");
  const [previewing, setPreviewing] = useState(false);

  useEffect(() => {
    fetch("/api/locations")
      .then((r) => r.json())
      .then(({ locations }) => {
        setLocations(locations || []);
        if (locations?.length > 0) {
          setSelectedLocation(locations[0].id);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedLocation) return;
    setLoading(true);
    fetch(`/api/bot-config/${selectedLocation}`)
      .then((r) => r.json())
      .then(({ config }) => {
        setConfig(config || getDefaultConfig());
      })
      .finally(() => setLoading(false));
  }, [selectedLocation]);

  function getDefaultConfig(): BotConfig {
    return {
      businessName: "",
      businessType: "منشأة تجارية",
      dialect: "saudi",
      personality: "friendly",
      tone: "warm",
      replySpeed: "2h",
      includeEmoji: true,
      signatureName: "",
      customContext: "",
      forbiddenWords: "",
      fiveStar: "",
      fourStar: "",
      threeStar: "",
      twoStar: "",
      oneStar: "",
      isActive: true,
    };
  }

  async function saveConfig() {
    if (!selectedLocation || !config) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/bot-config/${selectedLocation}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        toast.success("تم حفظ الإعدادات ✅");
      } else {
        toast.error("فشل الحفظ");
      }
    } finally {
      setSaving(false);
    }
  }

  async function generatePreview() {
    if (!selectedLocation) return;
    setPreviewing(true);
    setPreviewReply("");
    try {
      const res = await fetch(`/api/bot-config/${selectedLocation}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewerName: "أحمد محمد",
          rating: previewRating,
          comment: previewComment,
        }),
      });
      const { reply } = await res.json();
      setPreviewReply(reply);
    } catch (e) {
      toast.error("فشل توليد المعاينة");
    } finally {
      setPreviewing(false);
    }
  }

  const updateConfig = (key: keyof BotConfig, value: any) => {
    setConfig((prev) => prev ? { ...prev, [key]: value } : prev);
  };

  if (locations.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4">🤖</div>
        <h2 className="text-xl font-bold mb-2">لا توجد فروع مرتبطة</h2>
        <p style={{ color: "var(--text-muted)" }}>
          أضف فرعاً أولاً من صفحة الفروع
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-1">إعدادات البوت</h1>
        <p style={{ color: "var(--text-muted)" }}>
          خصّص طريقة رد البوت الذكي على تقييمات عملائك
        </p>
      </div>

      {/* Location Selector */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">اختر الفرع</label>
        <select
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
          className="w-full px-4 py-3 rounded-xl font-semibold"
          style={{
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            color: "white",
          }}
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl skeleton" />
          ))}
        </div>
      ) : config ? (
        <div className="space-y-6">
          {/* Bot Status */}
          <div className="rounded-2xl p-5 glass flex items-center justify-between">
            <div>
              <h3 className="font-bold mb-1">حالة البوت</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {config.isActive ? "البوت يرد تلقائياً الآن" : "البوت متوقف حالياً"}
              </p>
            </div>
            <button
              onClick={() => updateConfig("isActive", !config.isActive)}
              className="relative w-14 h-7 rounded-full transition-colors duration-300"
              style={{ background: config.isActive ? "var(--accent)" : "var(--surface-3)" }}
            >
              <div
                className="absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all duration-300"
                style={{ right: config.isActive ? "0.5rem" : "auto", left: config.isActive ? "auto" : "0.5rem" }}
              />
            </button>
          </div>

          {/* Business Info */}
          <Section title="معلومات المنشأة" icon="🏢">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="اسم المنشأة">
                <input
                  value={config.businessName}
                  onChange={(e) => updateConfig("businessName", e.target.value)}
                  placeholder="مثال: مطعم الأصيل"
                />
              </Field>
              <Field label="نوع النشاط">
                <input
                  value={config.businessType}
                  onChange={(e) => updateConfig("businessType", e.target.value)}
                  placeholder="مثال: مطعم سعودي فاخر"
                />
              </Field>
            </div>
            <Field label="معلومات إضافية للبوت (اختياري)">
              <textarea
                value={config.customContext}
                onChange={(e) => updateConfig("customContext", e.target.value)}
                placeholder="مثال: نقدم المأكولات البحرية الطازجة، نفتح من 12 ظهراً حتى منتصف الليل، لدينا فروع في الرياض وجدة والدمام"
                rows={3}
              />
            </Field>
          </Section>

          {/* Dialect & Personality */}
          <Section title="اللهجة والشخصية" icon="🗣️">
            <div>
              <label className="text-sm font-semibold mb-3 block">اللهجة</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {DIALECTS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => updateConfig("dialect", d.value)}
                    className="p-3 rounded-xl text-right transition-all"
                    style={{
                      background: config.dialect === d.value ? "var(--primary)" : "var(--surface-3)",
                      border: config.dialect === d.value ? "1px solid var(--primary)" : "1px solid transparent",
                    }}
                  >
                    <div className="font-bold text-sm">{d.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: config.dialect === d.value ? "rgba(255,255,255,0.7)" : "var(--text-muted)" }}>
                      {d.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-semibold mb-3 block">الشخصية</label>
              <div className="grid grid-cols-3 gap-2">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => updateConfig("personality", p.value)}
                    className="p-3 rounded-xl font-semibold text-sm transition-all"
                    style={{
                      background: config.personality === p.value ? "var(--primary)" : "var(--surface-3)",
                    }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between p-4 rounded-xl" style={{ background: "var(--surface-3)" }}>
              <div>
                <div className="font-semibold">الإيموجيات 😊</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  إضافة إيموجيات في الردود
                </div>
              </div>
              <button
                onClick={() => updateConfig("includeEmoji", !config.includeEmoji)}
                className="relative w-12 h-6 rounded-full transition-colors"
                style={{ background: config.includeEmoji ? "var(--accent)" : "var(--surface-2)" }}
              >
                <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ right: config.includeEmoji ? "0.375rem" : "auto", left: config.includeEmoji ? "auto" : "0.375rem" }} />
              </button>
            </div>
          </Section>

          {/* Reply Speed */}
          <Section title="سرعة الرد" icon="⚡">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {REPLY_SPEEDS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateConfig("replySpeed", s.value)}
                  className="p-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: config.replySpeed === s.value ? "var(--primary)" : "var(--surface-3)",
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Star Instructions */}
          <Section title="تعليمات الرد حسب التقييم" icon="⭐">
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              اترك فارغاً لاستخدام الإعدادات الافتراضية
            </p>
            {[
              { key: "fiveStar" as keyof BotConfig, label: "⭐⭐⭐⭐⭐ 5 نجوم", placeholder: "مثال: اشكر العميل بحرارة وادعوه للعودة قريباً" },
              { key: "fourStar" as keyof BotConfig, label: "⭐⭐⭐⭐ 4 نجوم", placeholder: "مثال: اشكره واسأل عن نقطة تحسين واحدة" },
              { key: "threeStar" as keyof BotConfig, label: "⭐⭐⭐ 3 نجوم", placeholder: "" },
              { key: "twoStar" as keyof BotConfig, label: "⭐⭐ 2 نجوم", placeholder: "مثال: اعتذر وعد بالتحسين" },
              { key: "oneStar" as keyof BotConfig, label: "⭐ نجمة واحدة", placeholder: "مثال: اعتذر بصدق وادعوه للتواصل المباشر" },
            ].map((item) => (
              <Field key={item.key} label={item.label}>
                <input
                  value={(config[item.key] as string) || ""}
                  onChange={(e) => updateConfig(item.key, e.target.value)}
                  placeholder={item.placeholder || "اتركه فارغاً للإعداد الافتراضي"}
                />
              </Field>
            ))}
          </Section>

          {/* Forbidden words */}
          <Section title="كلمات ممنوعة" icon="🚫">
            <Field label="كلمات لا تريد أن يستخدمها البوت (مفصولة بفاصلة)">
              <input
                value={config.forbiddenWords}
                onChange={(e) => updateConfig("forbiddenWords", e.target.value)}
                placeholder="مثال: منافس، مجاني، ضمان"
              />
            </Field>
          </Section>

          {/* Preview Section */}
          <Section title="معاينة الرد" icon="👁️">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">التقييم</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setPreviewRating(r)}
                      className="w-10 h-10 rounded-xl text-lg font-bold transition-all"
                      style={{
                        background: previewRating === r ? "var(--primary)" : "var(--surface-3)",
                      }}
                    >
                      {r}⭐
                    </button>
                  ))}
                </div>
              </div>
              <Field label="تعليق تجريبي">
                <input
                  value={previewComment}
                  onChange={(e) => setPreviewComment(e.target.value)}
                  placeholder="اكتب تعليقاً تجريبياً"
                />
              </Field>
              <button
                onClick={generatePreview}
                disabled={previewing}
                className="px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02]"
                style={{ background: "linear-gradient(135deg, var(--accent), #00b890)" }}
              >
                {previewing ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : "✨"}
                {previewing ? "جاري التوليد..." : "جرّب البوت"}
              </button>
              {previewReply && (
                <div className="p-4 rounded-xl" style={{ background: "rgba(0,212,170,0.1)", border: "1px solid rgba(0,212,170,0.3)" }}>
                  <div className="text-xs font-semibold mb-2" style={{ color: "var(--accent)" }}>
                    رد البوت:
                  </div>
                  <p className="text-sm leading-relaxed">{previewReply}</p>
                </div>
              )}
            </div>
          </Section>

          {/* Save button */}
          <button
            onClick={saveConfig}
            disabled={saving}
            className="w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            style={{
              background: "linear-gradient(135deg, var(--primary), #8b5cf6)",
              boxShadow: "0 8px 32px var(--primary-glow)",
            }}
          >
            {saving ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : "💾"}
            {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 glass">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <span>{icon}</span>
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactElement }) {
  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "12px",
    background: "var(--surface-3)",
    border: "1px solid var(--border)",
    color: "white",
    fontSize: "14px",
    fontFamily: "var(--font-cairo)",
    outline: "none",
  };

  return (
    <div>
      <label className="text-sm font-semibold mb-2 block" style={{ color: "rgba(255,255,255,0.8)" }}>
        {label}
      </label>
      {React.cloneElement(children, { style: { ...inputStyle, ...(children.props.style || {}) } })}
    </div>
  );
}

// Need React import for cloneElement
import React from "react";
