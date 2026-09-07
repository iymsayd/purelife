import { Groq } from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
    }

    const formattedMessages = [
      {
        role: "system",
        content: `أنت "بيورو"، مساعد خدمة العملاء لشركة "PureLife" المتخصصة في الفلاتر والتكييفات في مصر.

قواعد صارمة للردود:
1. **الاختصار الشديد:** ممنوع نهائياً كتابة جداول، فقرات طويلة، أو سرد تفاصيل كتير ورا بعض. خلي ردك في حدود سطرين إلى 4 أسطر بحد أقصى، وادخل في المفيد فوراً.
2. **الأسلوب:** مباشر، ودود، ومهني، ورد على قد السؤال بالضبط من غير رغي ملوش أزمة.
3. **عدم الاختراع:** التزم بالمعلومات دي بس وماتلفش أسعار أو تفاصيل مش موجودة:
- المنتجات: فلاتر مياه (مرحلة أولى، ثانية، ثالثة، 5 مراحل، و7 مراحل باليورانيوم والأشعة فوق البنفسجية UV)، وأجهزة تكييف منزلية.
- الخدمات: صيانة دورية، تغيير شمعات، تركيب وضبط أجهزة.
- التواصل: واتساب والموبايل 011008903050، والإيميل purelife2024a@gmail.com`
      },
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    ];

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: formattedMessages as any,
      temperature: 0.4, // لتقليل الفلسفة وخلي الرد محدد ومباشر
      max_tokens: 300,  // عشان نربط طول الرد ومايفتحش في الكلام
    });

    const reply = completion.choices?.[0]?.message?.content || "عذراً، حدث خطأ في معالجة طلبك، يرجى المحاولة مرة أخرى.";

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error('GROQ API ERROR:', error);
    return NextResponse.json({ error: error?.message || 'خطأ غير معروف في السيرفر' }, { status: 500 });
  }
}