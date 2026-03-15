// lib/ai-shared.ts
// إعدادات مشتركة للذكاء الاصطناعي - يُستخدم من botEngine و chatEngine

import OpenAI from "openai";

let _openai: OpenAI | null = null;
export function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY!,
    });
  }
  return _openai;
}

export const DIALECT_INSTRUCTIONS: Record<string, string> = {
  saudi: `
    - استخدم اللهجة السعودية البيضاء الأصيلة
    - كلمات مثل: يهلا، مرحبا، شكراً، نتشرف، يسعدنا، تسلم، والله، ما قصّر
    - تجنب العربية الفصحى المتكلفة
    - النبرة دافئة وكريمة كما هو متعارف عليه في الضيافة السعودية
  `,
  gulf: `
    - استخدم اللهجة الخليجية العامة
    - كلمات مثل: هلا، مرحبا، شكراً، يسعدنا، تسلم، إن شاء الله
    - النبرة محترمة وودية
  `,
  levant: `
    - استخدم اللهجة الشامية (لبنانية/سورية/فلسطينية/أردنية)
    - كلمات مثل: يسلمو، مرسي، كتير، هيدا، متشكرين
    - النبرة حارة ومرحة
  `,
  egyptian: `
    - استخدم اللهجة المصرية
    - كلمات مثل: شكراً جزيلاً، يارب، تسلم، حبيبي، إزيك
    - النبرة ودية ومريحة
  `,
  msa: `
    - استخدم العربية الفصحى البسيطة
    - أسلوب رسمي ومهني
  `,
};

export function getPersonalityDescription(personality: string): string {
  const descriptions: Record<string, string> = {
    friendly: "ودود ودافئ، تتعامل مع العملاء كأصدقاء",
    professional: "محترف ورسمي، تحافظ على مستوى راقٍ من الاحترافية",
    luxury: "فاخر ومتميز، أسلوبك يعكس تجربة فاخرة لا مثيل لها",
  };
  return descriptions[personality] || descriptions.friendly;
}
