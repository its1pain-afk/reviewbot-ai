"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquareReply, Star, Zap, Bot, ArrowLeft } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30">
            {/* Background gradients */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full" />
            </div>

            {/* Navigation */}
            <nav className="relative z-10 border-b border-white/5 bg-gray-950/50 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-l from-white to-gray-400 bg-clip-text text-transparent">
                            ReviewBot AI
                        </span>
                    </div>
                    <div>
                        <Link
                            href="/login"
                            className="px-6 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium text-sm flex items-center gap-2"
                        >
                            تسجيل الدخول
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 container mx-auto px-6 pt-32 pb-24 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl mx-auto space-y-8"
                >
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.2]">
                        ردود ذكية،{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            باللهجة السعودية
                        </span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        ارتقِ بتجربة عملائك مع نظام ذكاء اصطناعي يقرأ، يحلل، ويرد على تقييمات قوقل ماب تلقائياً بأسلوب احترافي وودود.
                    </p>

                    <div className="flex justify-center gap-4 pt-8">
                        <Link
                            href="/login"
                            className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)] hover:shadow-[0_0_60px_-15px_rgba(79,70,229,0.7)] flex items-center gap-2"
                        >
                            ابدأ الآن مجاناً
                        </Link>
                        <Link
                            href="mailto:support@example.com"
                            className="px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold transition-all"
                        >
                            تواصل معنا
                        </Link>
                    </div>
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-32 text-right">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm"
                    >
                        <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">ردود فورية</h3>
                        <p className="text-gray-400 leading-relaxed">
                            لا تدع عملاءك ينتظرون. النظام يتفاعل مع التقييمات فور كتابتها ليعكس احترافية عملك.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm"
                    >
                        <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                            <MessageSquareReply className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">لهجة طبيعية</h3>
                        <p className="text-gray-400 leading-relaxed">
                            ردود مخصصة تماماً وتفهم السياق وتتفاعل باللهجة السعودية وكأن فرداً من فريقك يرد.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm"
                    >
                        <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mb-6">
                            <Star className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold mb-3">تحليل ذكي للتقييم</h3>
                        <p className="text-gray-400 leading-relaxed">
                            يفهم الرضا والشكاوى بدقة ويقدم تقارير تحليلية واضحة لأداء فروعك.
                        </p>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
