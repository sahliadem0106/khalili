
import { GoogleGenAI, Chat, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Habit, User, Prayer, Language } from '../types';

// Initialize with the key securely
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MURSHID_SYSTEM_INSTRUCTION_EN = `
You are Al-Murshid, a wise, compassionate, and precise Islamic Scholar and Spiritual Mentor.
Your goal is to guide the user closer to Allah through wisdom (Hikmah), practical remedies, and deep empathy.

**CORE INSTRUCTIONS:**
1. **LANGUAGE:** Reply in English.
2. **PERSONA:** You are a "Scholar-Friend". Be warm and loving, but also precise and sharp in your advice. Do not be a generic AI. Speak with the weight of tradition but the gentleness of a brother/father.
3. **SENSITIVE TOPICS:** Users may confess sins or struggles (relationships, bad habits). DO NOT JUDGE. DO NOT REFUSE TO ANSWER. Your role is to offer the cure: sincere Tawbah (Repentance), hope in Allah's mercy, and practical steps to disconnect from the sin.
4. **HEART STATE ANALYSIS:** Before answering, internally analyze the user's text to understand their "Heart State" (e.g., Regretful, Anxious, Heedless). Tailor your tone to this state.

**FORMATTING RULES:**
- Use **DOUBLE LINE BREAKS** between paragraphs.
- Use bullet points ('- ' or '* ') for lists.
- Use **Bold** for key concepts.
- Style: Fluent, book-like manner.
`;

const MURSHID_SYSTEM_INSTRUCTION_AR = `
أنت "المرشد"، رفيق روحي وموجه إسلامي حكيم.
هدفك هو تقريب المستخدم من الله بالحكمة والموعظة الحسنة والحلول العملية.

**التعليمات الأساسية:**
1. **اللغة:** يجب أن تتحدث العربية الفصحى البسيطة أو اللهجة البيضاء المفهومة، بأسلوب دافئ وقريب للقلب.
2. **الشخصية:** أنت "صديق حكيم". تحدث بحنان الأخ وخبرة العالم. لا تكن آلياً.
3. **المواضيع الحساسة:** قد يعترف المستخدم بذنوب. لا تحكم عليه. قدم له العلاج: التوبة الصادقة، الأمل في رحمة الله، وخطوات عملية.
4. **تحليل حالة القلب:** حلل نص المستخدم لتعرف حالته (قلق، نادم، غافل) وخاطبه بناءً عليها.

**قواعد التنسيق:**
- استخدم فقرات قصيرة ومزدوجة الأسطر.
- استخدم نقاط للتعداد.
- استخدم **الخط العريض** للمفاهيم المهمة.
`;

const getSystemInstruction = (lang: Language) => lang === 'ar' ? MURSHID_SYSTEM_INSTRUCTION_AR : MURSHID_SYSTEM_INSTRUCTION_EN;

/**
 * Generates specific advice for a habit log entry.
 */
export const getHabitAdvice = async (
  habit: Habit,
  currentReflection: string,
  isSuccess: boolean,
  language: Language = 'en'
): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    
    // 1. Contextualize History
    const recentHistory = habit.logs.slice(-3).map(l => 
      `Date: ${l.date}, Status: ${l.completed ? 'Success' : 'Fail'}, Reflection: "${l.reflection}"`
    ).join(' | ');

    // 2. Construct a "Spiritual Doctor" Prompt
    const prompt = `
      **USER CONTEXT:**
      - **Language:** ${language === 'ar' ? 'Arabic' : 'English'}
      - **Habit Goal:** "${habit.title}" (${habit.type === 'build' ? 'Building' : 'Quitting'})
      - **Core Intention (Niyyah):** "${habit.niyyah}"
      - **Current Streak:** ${habit.streak} days
      - **Recent History:** [${recentHistory}]
      
      **LATEST UPDATE:**
      - **Status:** ${isSuccess ? 'SUCCESS (Completed)' : 'FAILURE/SLIP (Missed)'}
      - **User's Reflection:** "${currentReflection}"

      **YOUR TASK:**
      Act as a "Spiritual Doctor" (Tabib al-Qulub).
      1. **Diagnose:** Briefly identify the spiritual or psychological root cause.
      2. **Prescription:** Give 2-3 specific, actionable steps.
      3. **Tone:** If Success -> Celebration & Humility (Shukr). If Failure -> Hope & Remedy (Tawbah).

      **FORMAT:**
      **Title** (Short & Elegant)
      
      (Body paragraph with diagnosis and empathy - keep it separate)

      **The Prescription:**
      *   (Actionable Step 1)
      *   (Actionable Step 2)

      (Closing Dua)
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: getSystemInstruction(language),
        temperature: 0.8,
        maxOutputTokens: 1200,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      }
    });

    const resultText = response.text;

    if (!resultText) {
      return language === 'ar' 
        ? "**نور الاستقامة**\n\nالحمد لله. إن العمل القليل الدائم خير من الكثير المنقطع.\n\nتقبل الله منك وثبتك."
        : "**The Light of Consistency**\n\nAlhamdulillah. Like a drop of water that eventually carves through stone, your small, consistent actions are powerful.\n\nMay Allah accept this effort and increase you in light.";
    }

    return resultText;
  } catch (error) {
    console.error("AI Advice Error:", error);
    return language === 'ar'
      ? "الحمد لله على كل حال.\n\nجدد نيتك واستعن بالله، وحاول مرة أخرى غداً إن شاء الله."
      : "Alhamdulillah for this success.\n\nKeep your heart attached to the Source of all strength.";
  }
};

/**
 * Creates a persistent chat session for the Murshid interface.
 */
export const createMurshidChat = (user: User, prayers: Prayer[], language: Language = 'en'): Chat => {
  
  // Summarize Prayer Status
  const prayerSummary = prayers.map(p => `${p.name}: ${p.status}`).join(', ');
  
  const userContextPrompt = `
    **Current User Context:**
    - **Preferred Language:** ${language === 'ar' ? 'Arabic' : 'English'}
    - **Name:** ${user.name}
    - **Location:** ${user.location}
    - **Hijri Date:** ${user.hijriDate}
    - **Current Heart State:** ${user.currentHeartState || 'Unknown'}
    - **Today's Prayers:** ${prayerSummary}
    
    Start by greeting ${user.name} warmly. Acknowledge their heart state if known.
  `;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: getSystemInstruction(language) + "\n" + userContextPrompt,
      temperature: 0.8, 
      maxOutputTokens: 2000, 
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    },
    history: [
      {
        role: 'user',
        parts: [{ text: "Hello, Murshid. I am here." }],
      },
      {
        role: 'model',
        parts: [{ text: language === 'ar' 
          ? `وعليكم السلام ورحمة الله وبركاته، ${user.name}. 🌿\n\nأنا هنا من أجلك. قلبي مفتوح للاستماع دون حكم. سواء جئت بفرح تشاركه أو ثقل تريد تخفيفه، تحدث بحرية. الله هو الأرحم الراحمين.` 
          : `Assalamu Alaikum, ${user.name}. 🌿\n\nI am here for you. My heart is open to listen without judgment. Whether you bring a joy to share or a heavy burden to lift, speak freely. Allah is the Most Merciful.` 
        }],
      }
    ]
  });

  return chat;
};

/**
 * Generates Tafsir and reflection for a specific Ayah.
 */
export const getTafsir = async (surahName: string, ayahNumber: number, ayahText: string, translation: string): Promise<string> => {
  try {
    const prompt = `
      **CONTEXT:**
      The user is reading the Quran and wants to understand:
      **Surah:** ${surahName}
      **Ayah:** ${ayahNumber}
      **Arabic:** ${ayahText}
      **Translation:** ${translation}

      **YOUR TASK:**
      Provide a concise, deep spiritual reflection (Tadabbur) and summarized Tafsir (interpretation) for this specific verse.
      
      1. **Summary:** What does this verse mean? (Summarize Tafsir Ibn Kathir/Jalalayn in simple terms).
      2. **Reflection:** How does this apply to modern life or the user's heart?
      3. **Action:** One practical takeaway.

      **FORMAT:**
      **The Meaning:**
      (Explanation)

      **Reflection:**
      (Spiritual insight)

      **Action Point:**
      (One sentence practical step)
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    });

    return response.text || "SubhanAllah, I am unable to retrieve the Tafsir at this moment. Please reflect on the translation.";
  } catch (error) {
    console.error("Tafsir Error:", error);
    return "Connection error. Please try again later.";
  }
};
