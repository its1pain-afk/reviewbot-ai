// workers/reviewWorker.js
// يعمل بشكل مستقل كـ cron job كل ساعتين

const cron = require("node-cron");

// نفذ كل ساعتين
cron.schedule("0 */2 * * *", async () => {
  console.log("🔄 بدء مزامنة التقييمات...", new Date().toISOString());

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/cron/sync-reviews`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();
    console.log("✅ مزامنة ناجحة:", result);
  } catch (error) {
    console.error("❌ فشل المزامنة:", error);
  }
});

console.log("🤖 ReviewBot Worker شغّال وجاهز للمزامنة كل ساعتين");
