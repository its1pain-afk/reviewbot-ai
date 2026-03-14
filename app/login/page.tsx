"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Bot, Zap, Globe, Building2, Sparkles } from "lucide-react";

const FEATURES = [
  { Icon: Zap, text: "ردود تلقائية كل ساعتين" },
  { Icon: Globe, text: "لهجة سعودية أصيلة" },
  { Icon: Building2, text: "دعم فروع متعددة" },
  { Icon: Sparkles, text: "ذكاء اصطناعي متقدم" },
];

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) router.push("/dashboard");
  }, [session, router]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at top, #1a1040 0%, #0f0f23 60%)" }}
    >
      {/* Background blobs */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--primary)" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
        style={{ background: "var(--accent)" }}
      />

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 animate-pulse-glow"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}
          >
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
            ReviewBot AI
          </h1>
          <p className="text-lg" style={{ color: "var(--text-muted)" }}>
            ردود تلقائية ذكية على تقييمات Google
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-8 glass">
          <h2 className="text-2xl font-bold text-center mb-2">ابدأ مجاناً</h2>
          <p className="text-center text-sm mb-8" style={{ color: "var(--text-muted)" }}>
            ربط حساب Google My Business في أقل من دقيقة
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {FEATURES.map(({ Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(108,99,255,0.15)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "var(--primary)" }} />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Sign in button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
            style={{
              background: loading
                ? "rgba(108,99,255,0.5)"
                : "linear-gradient(135deg, var(--primary), #8b5cf6)",
              boxShadow: "0 8px 32px rgba(108,99,255,0.4)",
            }}
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            {loading ? "جاري التحميل..." : "ربط حساب Google My Business"}
          </button>

          <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)" }}>
            بالتسجيل، أنت توافق على شروط الاستخدام وسياسة الخصوصية
          </p>
        </div>
      </div>
    </div>
  );
}
