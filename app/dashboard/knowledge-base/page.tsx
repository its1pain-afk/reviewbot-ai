"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Search,
  FileText,
  HelpCircle,
  ShoppingBag,
  Shield,
} from "lucide-react";

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: "all", label: "الكل", Icon: BookOpen },
  { id: "general", label: "عام", Icon: FileText },
  { id: "faq", label: "أسئلة شائعة", Icon: HelpCircle },
  { id: "product", label: "منتجات وخدمات", Icon: ShoppingBag },
  { id: "policy", label: "سياسات", Icon: Shield },
];

const CATEGORY_LABELS: Record<string, string> = {
  general: "عام",
  faq: "أسئلة شائعة",
  product: "منتجات وخدمات",
  policy: "سياسات",
};

const CATEGORY_COLORS: Record<string, string> = {
  general: "#6c63ff",
  faq: "#f59e0b",
  product: "#00d4aa",
  policy: "#ef4444",
};

export default function KnowledgeBasePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<KnowledgeEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general",
  });

  useEffect(() => {
    fetchEntries();
  }, [activeCategory]);

  async function fetchEntries() {
    setLoading(true);
    const res = await fetch(
      `/api/knowledge-base?category=${activeCategory}`
    );
    const data = await res.json();
    setEntries(data.entries || []);
    setLoading(false);
  }

  function openAddModal() {
    setEditing(null);
    setForm({ title: "", content: "", category: "general" });
    setShowModal(true);
  }

  function openEditModal(entry: KnowledgeEntry) {
    setEditing(entry);
    setForm({
      title: entry.title,
      content: entry.content,
      category: entry.category,
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("العنوان والمحتوى مطلوبان");
      return;
    }

    setSaving(true);
    try {
      const url = editing
        ? `/api/knowledge-base/${editing.id}`
        : "/api/knowledge-base";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();

      toast.success(editing ? "تم تحديث المقال" : "تم إضافة المقال");
      setShowModal(false);
      fetchEntries();
    } catch {
      toast.error("حدث خطأ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/knowledge-base/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      toast.success("تم حذف المقال");
      fetchEntries();
    } catch {
      toast.error("فشل الحذف");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black mb-2">قاعدة المعرفة</h1>
          <p style={{ color: "var(--text-muted)" }}>
            أضف المعلومات التي يستخدمها البوت للرد على رسائل العملاء
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
          }}
        >
          <Plus className="w-4 h-4" />
          إضافة مقال
        </button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background:
                activeCategory === cat.id
                  ? "var(--primary)"
                  : "rgba(255,255,255,0.05)",
              color: activeCategory === cat.id ? "white" : "var(--text-muted)",
              border: `1px solid ${activeCategory === cat.id ? "var(--primary)" : "var(--border)"}`,
            }}
          >
            <cat.Icon className="w-4 h-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Entries list */}
      {loading ? (
        <div className="grid gap-4">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="h-28 rounded-2xl skeleton" />
            ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            <BookOpen
              className="w-8 h-8"
              style={{ color: "var(--text-muted)" }}
            />
          </div>
          <p className="font-semibold mb-2">لا توجد مقالات بعد</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            أضف معلومات عن منشأتك ليستخدمها البوت في الردود
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2 rounded-xl font-bold text-sm text-white"
            style={{ background: "var(--primary)" }}
          >
            إضافة أول مقال
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl glass p-5 transition-all hover:scale-[1.01]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-bold text-base">{entry.title}</h3>
                    <span
                      className="text-xs px-2.5 py-0.5 rounded-full font-semibold"
                      style={{
                        background: `${CATEGORY_COLORS[entry.category]}20`,
                        color: CATEGORY_COLORS[entry.category],
                      }}
                    >
                      {CATEGORY_LABELS[entry.category] || entry.category}
                    </span>
                  </div>
                  <p
                    className="text-sm line-clamp-2"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {entry.content}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => openEditModal(entry)}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ background: "rgba(108,99,255,0.12)" }}
                  >
                    <Pencil
                      className="w-4 h-4"
                      style={{ color: "var(--primary)" }}
                    />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleting === entry.id}
                    className="p-2 rounded-lg transition-colors hover:opacity-80"
                    style={{ background: "rgba(239,68,68,0.12)" }}
                  >
                    {deleting === entry.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-8"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black mb-1">
                  {editing ? "تعديل المقال" : "إضافة مقال جديد"}
                </h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {editing ? "عدّل محتوى المقال ثم احفظ التغييرات" : "أضف معلومات يستخدمها البوت في الردود"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg hover:opacity-70 transition-opacity"
                style={{ color: "var(--text-muted)" }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">العنوان</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: ساعات العمل"
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">التصنيف</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setForm({ ...form, category: cat.id })}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background:
                          form.category === cat.id
                            ? "var(--primary)"
                            : "rgba(255,255,255,0.06)",
                        color:
                          form.category === cat.id ? "white" : "var(--text-muted)",
                        border: `1px solid ${form.category === cat.id ? "var(--primary)" : "rgba(255,255,255,0.1)"}`,
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">المحتوى</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={5}
                  placeholder="اكتب المعلومات التي سيستخدمها البوت للرد على العملاء..."
                  className="w-full px-4 py-3 rounded-xl text-white outline-none resize-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--primary), #8b5cf6)" }}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing ? "تحديث" : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
