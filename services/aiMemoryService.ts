
import { supabase } from './supabaseClient';
import { ChatMessage } from '../types';

/**
 * This function builds the "Brain" of Al-Murshid.
 * It calls the RPC function defined in backend_setup.sql to get 
 * optimized context without downloading massive history arrays.
 */
export const buildMurshidContext = async (userId: string): Promise<string> => {
  
  // 1. Call the database RPC function
  const { data, error } = await supabase.rpc('get_ai_context', { target_user_id: userId });

  if (error) {
    console.error("Error fetching context:", error);
    // Fail gracefully - return empty context so chat still works
    return "";
  }

  const context = data as any;

  // 2. Format Habit Stats
  let habitText = "User's Habits (Last 30 Days):\n";
  if (context.habits && context.habits.length > 0) {
    context.habits.forEach((h: any) => {
      habitText += `- ${h.title}: Completed ${h.success_count} times.\n`;
    });
  } else {
    habitText += "No active habits tracked yet.\n";
  }

  // 3. Format Prayer Struggles
  let prayerText = "Recent Prayer Struggles (Last 7 Days):\n";
  if (context.struggles && context.struggles.length > 0) {
    context.struggles.forEach((p: any) => {
      prayerText += `- ${p.prayer_name}: Status '${p.status}'. Main Barrier: ${p.barrier}.\n`;
    });
  } else {
    prayerText += "Prayer record is good or empty.\n";
  }

  // 4. Combine into a System Prompt
  return `
    ${habitText}
    
    ${prayerText}
    
    INSTRUCTIONS:
    - Use this information to understand the user's current spiritual state.
    - If they are struggling with a specific habit mentioned above, offer encouragement.
    - If their prayer consistency is low, offer tips to improve focus based on their barriers.
    - Do NOT mention this data explicitly as a list (e.g. "I see your database says..."), but integrate it naturally (e.g. "Since you mentioned struggling with sleep...").
  `;
};

/**
 * Saves a message to the "30 Day Consciousness" history
 */
export const saveChatMessage = async (userId: string, message: ChatMessage) => {
  await supabase.from('chat_history').insert({
    user_id: userId,
    role: message.role,
    content: message.text
  });
  // The SQL Trigger 'prune_old_chats' will automatically run here
  // and delete anything older than 30 days.
};
