// app/dashboard/locations/page.tsx
"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

interface DiscoveredLocation {
  accountId: string;
  accountName: string;
  locationId: string;
  name: string;
  address: string;
  phone?: string;
  category?: string;
  mapsUrl?: string;
}

interface SavedLocation {
  id: string;
  name: string;
  address?: string;
  category?: string;
  botEnabled: boolean;
  isActive: boolean;
  totalReviews: number;
  avgRating: number;
  repliedCount: number;
  lastSyncAt?: string;
  botConfig?: { isActive: boolean; dialect: string; replySpeed: string };
}

interface ManualForm {
  name: string;
  address: string;
  phone: string;
  category: string;
}

export default function LocationsPage() {
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [discoveredLocations, setDiscoveredLocations] = useState<DiscoveredLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [showManualForm, setShowManualForm] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [manualForm, setManualForm] = useState<ManualForm>({
    name: "",
    address: "",
    phone: "",
    category: "",
  });

  useEffect(() => {
    fetchSavedLocations();
  }, []);

  async function fetchSavedLocations() {
    const res = await fetch("/api/locations");
    const { locations } = await res.json();
    setSavedLocations(locations || []);
    setLoading(false);
  }

  async function discoverLocations() {
    setDiscovering(true);
    try {
      const res = await fetch("/api/locations/discover");
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setDiscoveredLocations(data.locations || []);
      if (data.locations?.length === 0) {
        toast("لم يتم العثور على فروع في حساب Google My Business", { icon: "ℹ️" });
      }
    } catch (e) {
      toast.error("حدث خطأ أثناء البحث عن الفروع");
    } finally {
      setDiscovering(false);
    }
  }

  async function addLocation(loc: DiscoveredLocation) {
    setAdding(loc.locationId);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmbAccountId: loc.accountId,
          gmbLocationId: loc.locationId,
          name: loc.name,
          address: loc.address,
          phone: loc.phone,
          category: loc.category,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل إضافة الفرع");
        return;
      }
      toast.success(`تم إضافة "${loc.name}" بنجاح! 🎉`);
      fetchSavedLocations();
    } catch (e) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setAdding(null);
    }
  }

  async function saveManualLocation() {
    if (!manualForm.name.trim()) {
      toast.error("اسم الفرع مطلوب");
      return;
    }
    setSavingManual(true);
    try {
      const res = await fetch("/api/locations/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "فشل إضافة الفرع");
        return;
      }
      toast.success(`تم إضافة "${manualForm.name}" بنجاح! 🎉`);
      setShowManualForm(false);
      setManualForm({ name: "", address: "", phone: "", category: "" });
      fetchSavedLocations();
    } catch (e) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setSavingManual(false);
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black mb-1">الفروع</h1>
          <p style={{ color: "var(--text-muted)" }}>
            ربط فروعك من Google My Business
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowManualForm(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            ✏️ إضافة يدوية
          </button>
          <button
            onClick={discoverLocations}
            disabled={discovering}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, var(--primary), #8b5cf6)",
              boxShadow: "0 4px 20px var(--primary-glow)",
            }}
          >
            {discovering ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "🔍"
            )}
            {discovering ? "جاري البحث..." : "اكتشاف الفروع"}
          </button>
        </div>
      </div>

      {/* Manual Add Dialog */}
      {showManualForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="w-full max-w-md rounded-3xl p-8"
            style={{
              background: "var(--surface)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <h2 className="text-2xl font-black mb-2">إضافة فرع يدوياً</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              أضف بيانات فرعك يدوياً لتجربة بوت الردود
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">
                  اسم الفرع <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="مثال: مطعم دار تاج الهندي - الرياض"
                  value={manualForm.name}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">العنوان</label>
                <input
                  type="text"
                  placeholder="مثال: شارع الملك فهد، الرياض"
                  value={manualForm.address}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, address: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">رقم الهاتف</label>
                <input
                  type="text"
                  placeholder="مثال: 0501234567"
                  value={manualForm.phone}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2">نوع النشاط</label>
                <input
                  type="text"
                  placeholder="مثال: مطعم هندي"
                  value={manualForm.category}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, category: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl text-white outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowManualForm(false)}
                className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                إلغاء
              </button>
              <button
                onClick={saveManualLocation}
                disabled={savingManual}
                className="flex-1 py-3 rounded-xl font-bold transition-all hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, var(--primary), #8b5cf6)",
                }}
              >
                {savingManual ? "⏳ جاري الحفظ..." : "حفظ الفرع ✓"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discovered Locations */}
      {discoveredLocations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            فروع متاحة للإضافة ({discoveredLocations.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discoveredLocations.map((loc) => {
              const alreadyAdded = savedLocations.some(
                (s) => s.name === loc.name
              );
              return (
                <div
                  key={loc.locationId}
                  className="rounded-2xl p-5 glass flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold mb-1 truncate">{loc.name}</div>
                    {loc.address && (
                      <div className="text-xs mb-1 truncate" style={{ color: "var(--text-muted)" }}>
                        📍 {loc.address}
                      </div>
                    )}
                    {loc.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(108,99,255,0.2)", color: "#a78bfa" }}>
                        {loc.category}
                      </span>
                    )}
                  </div>
                  {alreadyAdded ? (
                    <span className="text-xs px-3 py-1.5 rounded-xl shrink-0"
                      style={{ background: "rgba(0,212,170,0.15)", color: "var(--accent)" }}>
                      ✓ مضاف
                    </span>
                  ) : (
                    <button
                      onClick={() => addLocation(loc)}
                      disabled={adding === loc.locationId}
                      className="text-sm px-4 py-2 rounded-xl font-bold shrink-0 transition-all hover:scale-[1.02]"
                      style={{ background: "var(--primary)", color: "white" }}
                    >
                      {adding === loc.locationId ? "⏳" : "إضافة +"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Saved Locations */}
      <div>
        <h2 className="text-lg font-bold mb-4">فروعك المرتبطة ({savedLocations.length})</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="h-40 rounded-2xl skeleton" />
            ))}
          </div>
        ) : savedLocations.length === 0 ? (
          <div className="text-center py-20 rounded-2xl glass">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-bold mb-2">لا توجد فروع بعد</h3>
            <p className="mb-6" style={{ color: "var(--text-muted)" }}>
              اضغط على "اكتشاف الفروع" أو أضف فرعك يدوياً
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowManualForm(true)}
                className="px-6 py-3 rounded-xl font-bold"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                ✏️ إضافة يدوية
              </button>
              <button
                onClick={discoverLocations}
                className="px-6 py-3 rounded-xl font-bold"
                style={{ background: "var(--primary)" }}
              >
                ابدأ الآن
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedLocations.map((loc) => (
              <div key={loc.id} className="rounded-2xl p-5 glass">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{loc.name}</h3>
                    {loc.address && (
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        📍 {loc.address}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
                    style={{
                      background: loc.botEnabled ? "rgba(0,212,170,0.15)" : "rgba(239,68,68,0.15)",
                      color: loc.botEnabled ? "var(--accent)" : "#ef4444",
                    }}>
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ background: loc.botEnabled ? "var(--accent)" : "#ef4444" }} />
                    {loc.botEnabled ? "البوت نشط" : "البوت متوقف"}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { label: "تقييمات", value: loc.totalReviews },
                    { label: "ردود", value: loc.repliedCount },
                    { label: "المعدل", value: loc.avgRating > 0 ? `${loc.avgRating.toFixed(1)}⭐` : "—" },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="font-bold">{s.value}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Bot config info */}
                {loc.botConfig && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "rgba(108,99,255,0.2)", color: "#a78bfa" }}>
                      {loc.botConfig.dialect === "saudi" ? "🇸🇦 سعودي" : loc.botConfig.dialect}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)" }}>
                      ⏱ {loc.botConfig.replySpeed}
                    </span>
                  </div>
                )}

                {loc.lastSyncAt && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    آخر مزامنة:{" "}
                    {new Date(loc.lastSyncAt).toLocaleString("ar-SA")}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
