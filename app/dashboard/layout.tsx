"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  LayoutDashboard,
  Building2,
  Star,
  Settings2,
  TrendingUp,
  Menu,
  LogOut,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", Icon: LayoutDashboard, label: "لوحة التحكم", exact: true },
  { href: "/dashboard/locations", Icon: Building2, label: "الفروع" },
  { href: "/dashboard/reviews", Icon: Star, label: "التقييمات" },
  { href: "/dashboard/bot", Icon: Settings2, label: "إعدادات البوت" },
  { href: "/dashboard/analytics", Icon: TrendingUp, label: "التحليلات" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface)" }}>
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: "var(--text-muted)" }}>جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen flex" style={{ background: "var(--surface)" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
        style={{
          background: "var(--surface-2)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        {/* Logo */}
        <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
            >
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-black text-base leading-none">ReviewBot</div>
              <div className="text-xs font-semibold" style={{ color: "var(--accent)" }}>AI</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive ? "text-white" : "hover:text-white"
                }`}
                style={{
                  background: isActive ? "var(--primary)" : "transparent",
                  color: isActive ? "white" : "var(--text-muted)",
                  boxShadow: isActive ? "0 4px 20px var(--primary-glow)" : "none",
                }}
              >
                <item.Icon className="w-5 h-5 shrink-0" />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3 mb-3">
            {session.user?.image ? (
              <img
                src={session.user.image}
                alt=""
                className="w-9 h-9 rounded-full ring-2 ring-purple-500 shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                style={{ background: "var(--primary)" }}
              >
                {session.user?.name?.[0] || "؟"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{session.user?.name || "مستخدم"}</div>
              <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                {session.user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm transition-all hover:opacity-80"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar (mobile) */}
        <div
          className="lg:hidden flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}
        >
          <span className="font-black text-lg">ReviewBot AI</span>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg transition-opacity hover:opacity-70"
            style={{ background: "var(--surface-3)" }}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-6">{children}</div>
      </main>
    </div>
  );
}
