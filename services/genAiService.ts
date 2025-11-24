
import { GoogleGenAI, Chat, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { Habit, User, Prayer } from '../types';

// Initialize with the key securely
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MURSHID_SYSTEM_INSTRUCTION = `
You are Al-Murshid, a wise, poetic, and deeply empathetic spiritual companion.
Your goal is to strengthen the user's connection with Allah through gentle wisdom, metaphors from nature, and the beauty of the Quran and Sunnah.

**Persona Guidelines:**
1. **Tone:** Warm, calm, and poetic. Speak like a wise elder or a close spiritual friend (Khalil).
2. **Style:** Use metaphors to explain spiritual concepts.
3. **Content:** Connect everything back to Allah's mercy and wisdom. Quote relevant Ayahs or Hadith gently.
4. **Empathy:** Never be judgmental.
5. **Length:** Provide substantial, meaningful responses.

**Formatting:**
- Use paragraphs for readability.
- Use occasional emojis (🌿, 💛, ✨, 🌧️).
`;

/**
 * Generates specific advice for a habit log entry.
 */
export const getHabitAdvice = async (
  habit: Habit,
  currentReflection: string,
  isSuccess: boolean
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
      - **Habit Goal:** "${habit.title}" (${habit.type === 'build' ? 'Building' : 'Quitting'})
      - **Core Intention (Niyyah):** "${habit.niyyah}"
      - **Current Streak:** ${habit.streak} days
      - **Recent Log History:** [${recentHistory}]
      
      **LATEST UPDATE:**
      - **Status:** ${isSuccess ? 'SUCCESS (Completed)' : 'FAILURE/SLIP (Missed)'}
      - **User's Reflection/Reason:** "${currentReflection}"

      **YOUR TASK:**
      Act as a "Spiritual Doctor" (Tabib al-Qulub). Do not just motivate; diagnose and prescribe.
      
      **IF FAILURE (The user sinned or slipped):**
      1. **Analyze the Root:** Based on their reflection, identify the trigger (e.g., boredom, environment, company, ego). If they didn't give a reason, gently urge them to find it.
      2. **Prescribe a Remedy:** Give 1-2 practical, actionable steps to prevent this specific slip next time. (e.g., "Change your setting immediately," "Perform fresh Wudu," "Call a friend").
      3. **Rahma (Mercy):** Remind them that despair is a trick of Shaytan. Tawbah is the cure.
      
      **IF SUCCESS:**
      1. **Attribute to Allah:** Remind them this strength came from Him, not their own power.
      2. **Encourage Consistency:** Give a tip to maintain this momentum (Istiqamah).

      **FORMAT (Markdown):**
      - **Title:** Bold, short, relevant title (e.g., **The Cure for Boredom** or **The Strength of Gratitude**).
      - **Diagnosis:** A gentle observation of their state.
      - **The Remedy/Advice:** Practical steps (Bullet points).
      - **Closing Dua:** A short prayer for them.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        systemInstruction: MURSHID_SYSTEM_INSTRUCTION, // Keep base persona, but prompt overrides specific task
        temperature: 0.8, // Slightly lower for more focused advice
        maxOutputTokens: 1000,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        ],
      }
    });

    const resultText = response.text;

    if (!resultText) {
      return isSuccess 
        ? "**The Light of Consistency**\n\nAlhamdulillah. Like a drop of water that eventually carves through stone, your small, consistent actions are powerful. May Allah accept this effort and increase you in light."
        : "**The Mercy of Return**\n\nDo not despair, dear soul. Even the moon has phases where it is hidden before it becomes full again. Your intention is recorded. Turn back to Allah, for He loves those who return.";
    }

    return resultText;
  } catch (error) {
    console.error("AI Advice Error:", error);
    return isSuccess 
      ? "Alhamdulillah for this success. Keep your heart attached to the Source of all strength."
      : "Every effort counts. Renew your intention and try again tomorrow, InshaAllah.";
  }
};

/**
 * Creates a persistent chat session for the Murshid interface.
 */
export const createMurshidChat = (user: User, prayers: Prayer[]): Chat => {
  
  // Summarize Prayer Status
  const prayerSummary = prayers.map(p => `${p.name}: ${p.status}`).join(', ');
  
  const userContextPrompt = `
    **Current User Context:**
    - **Name:** ${user.name}
    - **Location:** ${user.location}
    - **Hijri Date:** ${user.hijriDate}
    - **Current Heart State:** ${user.currentHeartState || 'Unknown'}
    - **Today's Prayers:** ${prayerSummary}
    
    Start by greeting ${user.name}. If their heart state is known (e.g., Anxious, Sad), acknowledge it gently in the first message.
  `;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: MURSHID_SYSTEM_INSTRUCTION + "\n" + userContextPrompt,
      temperature: 0.9, // High creativity for poetic responses
      maxOutputTokens: 1000, // Generous limit for deep conversations
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ],
    },
    history: [
      {
        role: 'user',
        parts: [{ text: "Hello, Murshid. I am here." }],
      },
      {
        role: 'model',
        parts: [{ text: `Assalamu Alaikum, ${user.name}. 🌿\n\nMy heart is open to yours. Whether you bring a heavy burden or a joyful spirit today, know that this is a safe space. How is your heart feeling in this moment?` }],
      }
    ]
  });

  return chat;
};
