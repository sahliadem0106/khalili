
import React, { useState, useEffect, useRef } from 'react';
import { Send, X, Sparkles, User, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { ChatMessage, User as UserType, Prayer } from '../types';
import { createMurshidChat } from '../services/genAiService';
import { Chat, GenerateContentResponse } from "@google/genai";
import { useLanguage } from '../contexts/LanguageContext';

interface MurshidChatProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  prayers: Prayer[];
}

export const MurshidChat: React.FC<MurshidChatProps> = ({ isOpen, onClose, user, prayers }) => {
  const { dir } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && !chatSession) {
      const session = createMurshidChat(user, prayers);
      setChatSession(session);
      
      // Load initial history (which includes the greeting)
      // We manually set the first message for UI consistency
      setMessages([
        {
          id: 'init-1',
          role: 'model',
          text: `Assalamu Alaikum, ${user.name}. 🌿\n\nMy heart is open to yours. Whether you bring a heavy burden or a joyful spirit today, know that this is a safe space. How is your heart feeling in this moment?`,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, user, prayers]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Stream the response for a "typing" feel
      const result = await chatSession.sendMessageStream({ message: userMsg.text });
      
      let fullText = "";
      const botMsgId = (Date.now() + 1).toString();
      
      // Create placeholder for bot message
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: "",
        timestamp: new Date()
      }]);

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text || "";
        fullText += textChunk;
        
        // Update the last message with partial text
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, text: fullText } : m
        ));
      }

    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "My dear friend, the connection seems weak right now. Please forgive me and try again in a moment. 🍂",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-[#f8f5f0] dark:bg-[#1a1a1a] flex flex-col animate-in slide-in-from-bottom duration-500">
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-amber-100 dark:border-neutral-800 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center">
           <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 me-3 shadow-inner">
              <Sparkles size={20} className="fill-current animate-pulse" />
           </div>
           <div>
              <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 font-serif tracking-wide">Al-Murshid</h2>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Spiritual Companion</p>
           </div>
        </div>
        <button 
          onClick={onClose} 
          className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-neutral-500"
        >
          <X size={20} />
        </button>
      </div>

      {/* Chat Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')]">
         {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
               <div className={`max-w-[85%] flex ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 ${msg.role === 'user' ? 'bg-brand-forest text-white' : 'bg-white dark:bg-neutral-800 border border-amber-200 dark:border-neutral-700 text-amber-600'}`}>
                     {msg.role === 'user' ? <User size={14} /> : <Sparkles size={14} className="fill-current" />}
                  </div>

                  {/* Bubble */}
                  <div 
                    className={`
                      p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                      ${msg.role === 'user' 
                        ? 'bg-brand-forest text-white rounded-br-none' 
                        : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-bl-none border border-amber-50 dark:border-neutral-700'
                      }
                    `}
                  >
                     <div className="whitespace-pre-wrap font-sans">
                       {msg.text || <span className="animate-pulse">...</span>}
                     </div>
                     <div className={`text-[9px] mt-2 opacity-60 text-end ${msg.role === 'user' ? 'text-brand-mint' : 'text-neutral-400'}`}>
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </div>
                  </div>
               </div>
            </div>
         ))}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
         <div className="relative flex items-end bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 focus-within:ring-2 focus-within:ring-amber-200 dark:focus-within:ring-amber-900/50 transition-all p-2 shadow-sm">
            <textarea
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder="Pour your heart out..."
               className="w-full bg-transparent border-none resize-none max-h-32 min-h-[3rem] p-2 text-sm focus:ring-0 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400"
               disabled={isLoading}
            />
            <button 
               onClick={handleSend}
               disabled={!input.trim() || isLoading}
               className={`p-3 rounded-xl mb-0.5 transition-all duration-200 ${input.trim() ? 'bg-brand-forest text-white shadow-md hover:bg-brand-teal' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400'}`}
            >
               {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />}
            </button>
         </div>
         <p className="text-center text-[10px] text-neutral-300 mt-2">Al-Murshid AI can make mistakes. Rely on Allah first.</p>
      </div>

    </div>
  );
};
