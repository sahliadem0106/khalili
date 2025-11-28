import React, { useState, useEffect, useRef, memo } from 'react';
import { Send, X, Sparkles, User, Loader2, BookOpen, Moon, Heart } from 'lucide-react';
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

const LOADING_MESSAGES = [
  "Connecting to the source...",
  "Reflecting on wisdom...",
  "Consulting the Quran...",
  "Seeking light...",
  "Formulating guidance...",
  "Opening the heart..."
];

// --- ELEGANT MARKDOWN RENDERER ---
const ElegantMarkdown = memo(({ text, isUser }: { text: string, isUser: boolean }) => {
  if (!text) return null;

  const parseContent = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className={`font-bold ${!isUser ? 'text-amber-700 dark:text-amber-500' : ''}`}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  if (isUser) {
    return <div className="font-sans text-sm leading-relaxed whitespace-pre-wrap">{parseContent(text)}</div>;
  }

  const blocks = text.split(/\n\n+/);

  return (
    <div className="font-serif text-[15px] leading-loose text-neutral-800 dark:text-neutral-200 space-y-4">
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (!trimmed) return null;
        
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
           const items = trimmed.split(/\n/).map(line => line.replace(/^[\*\-]\s*/, ''));
           return (
             <ul key={index} className="my-3 space-y-2 pl-2">
               {items.map((item, i) => (
                 <li key={i} className="relative pl-6 text-sm">
                   <span className="absolute left-0 top-[0.6em] w-1.5 h-1.5 bg-amber-400 rounded-full opacity-80"></span>
                   {parseContent(item)}
                 </li>
               ))}
             </ul>
           );
        }

        return (
           <p key={index} className="min-h-[1em]">
              {parseContent(trimmed)}
           </p>
        );
      })}
    </div>
  );
});

// --- TYPEWRITER COMPONENT (FIXED) ---
const Typewriter = ({ text, onTypingEnd }: { text: string, onTypingEnd?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // We monitor 'text' prop changes (streaming updates)
  useEffect(() => {
    // If the full text is longer than what we have displayed/processed
    if (indexRef.current < text.length) {
        
        // Function to type next character
        const type = () => {
            const currentIndex = indexRef.current;
            
            // Double check bounds
            if (currentIndex < text.length) {
                // Slice safely
                setDisplayedText(text.slice(0, currentIndex + 1));
                indexRef.current++;
                
                // Schedule next char
                timerRef.current = setTimeout(type, 15); 
            } else {
                // We caught up to the current stream chunk
                if (onTypingEnd && currentIndex >= text.length) onTypingEnd();
            }
        };

        // If timer not already running, start it
        if (!timerRef.current) {
            type();
        }
    }
    
    // Cleanup on unmount or re-render
    return () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    };
  }, [text, onTypingEnd]);

  return <ElegantMarkdown text={displayedText} isUser={false} />;
};

// --- LOADING INDICATOR ---
const SpiritualLoader = () => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-500">
       <div className="relative">
          <div className="w-3 h-3 bg-amber-400 rounded-full animate-ping absolute"></div>
          <div className="w-3 h-3 bg-amber-500 rounded-full relative"></div>
       </div>
       <span className="text-xs font-medium tracking-widest uppercase animate-pulse">
         {LOADING_MESSAGES[msgIndex]}
       </span>
    </div>
  );
};

export const MurshidChat: React.FC<MurshidChatProps> = ({ isOpen, onClose, user, prayers }) => {
  const { dir, language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false); // True while AI is generating
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Chat
  useEffect(() => {
    if (isOpen && !chatSession) {
      const session = createMurshidChat(user, prayers, language);
      setChatSession(session);
      
      setMessages([
        {
          id: 'init-1',
          role: 'model',
          text: language === 'ar' 
            ? `وعليكم السلام ورحمة الله وبركاته، ${user.name}. 🌿\n\nأنا هنا من أجلك. قلبي مفتوح للاستماع دون حكم. سواء جئت بفرح تشاركه أو ثقل تريد تخفيفه، تحدث بحرية. الله هو الأرحم الراحمين.`
            : `Assalamu Alaikum, ${user.name}. 🌿\n\nI am here for you. My heart is open to listen without judgment. Whether you bring a joy to share or a heavy burden to lift, speak freely. Allah is the Most Merciful.`,
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, user, prayers, language]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chatSession || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      const result = await chatSession.sendMessageStream({ message: userMsg.text });
      
      const botMsgId = (Date.now() + 1).toString();
      
      // Create placeholder for bot message
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: "", // Will be filled by stream
        timestamp: new Date()
      }]);

      let fullText = "";

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text || "";
        fullText += textChunk;
        
        // Update the specific message in state
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, text: fullText } : m
        ));
      }

    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "My dear friend, I am having trouble connecting at this moment. Please forgive me and try again shortly. 🍂",
        timestamp: new Date()
      }]);
    } finally {
      setIsStreaming(false);
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
    <div className="fixed inset-0 z-[60] bg-[#f9f7f2] dark:bg-[#121212] flex flex-col animate-in slide-in-from-bottom duration-500">
      
      {/* Header */}
      <div className="bg-[#f9f7f2]/90 dark:bg-[#121212]/90 backdrop-blur-md border-b border-amber-100 dark:border-neutral-800 p-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center">
           <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center text-amber-600 dark:text-amber-400 me-3 shadow-inner border border-amber-50 dark:border-amber-900">
              <Sparkles size={20} className="fill-current animate-pulse" />
           </div>
           <div>
              <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 font-serif tracking-wide">Al-Murshid</h2>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium">Spiritual Companion</p>
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
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] bg-fixed"
      >
         {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const isLast = idx === messages.length - 1;
            
            // Only use Typewriter effect for the VERY LAST message if it's from the model AND we are actively streaming
            // Or if it's the model message and it's the last one (even if finished streaming, it looks nice to type out if user just opened)
            // But strictly: type out if it's the last message from model.
            const useTypewriter = !isUser && isLast && msg.text.length > 0;

            return (
              <div 
                key={msg.id} 
                className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                 <div className={`max-w-[95%] sm:max-w-[85%] flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                    
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-2 shadow-sm ${isUser ? 'bg-brand-forest text-white' : 'bg-[#fffcf5] dark:bg-[#1e1e1e] border border-amber-200 dark:border-amber-900 text-amber-600'}`}>
                       {isUser ? <User size={14} /> : <Sparkles size={14} className="fill-current" />}
                    </div>

                    {/* Bubble */}
                    <div 
                      className={`
                        px-5 py-4 shadow-sm relative
                        ${isUser 
                          ? 'bg-brand-forest text-white rounded-2xl rounded-br-none' 
                          : 'bg-[#fffcf5] dark:bg-[#1e1e1e] text-neutral-800 dark:text-neutral-200 rounded-2xl rounded-bl-none border border-amber-100 dark:border-neutral-800'
                        }
                      `}
                    >
                       {useTypewriter ? (
                          <Typewriter text={msg.text} />
                       ) : (
                          <ElegantMarkdown text={msg.text} isUser={isUser} />
                       )}
                       
                       <div className={`text-[9px] mt-2 opacity-60 text-end font-sans ${isUser ? 'text-brand-mint' : 'text-neutral-400'}`}>
                          {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                       </div>
                    </div>
                 </div>
              </div>
            );
         })}

         {/* Loading State */}
         {isStreaming && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
            <div className="flex justify-start w-full animate-in fade-in duration-500">
               <div className="max-w-[80%] flex flex-row items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#fffcf5] dark:bg-[#1e1e1e] border border-amber-200 dark:border-amber-900 text-amber-600 flex items-center justify-center shrink-0 mb-2">
                     <Sparkles size={14} className="fill-current" />
                  </div>
                  <div className="px-5 py-4 rounded-2xl bg-[#fffcf5] dark:bg-[#1e1e1e] border border-amber-100 dark:border-neutral-800 rounded-bl-none">
                     <SpiritualLoader />
                  </div>
               </div>
            </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#f9f7f2] dark:bg-[#121212] border-t border-amber-100 dark:border-neutral-800">
         <div className="relative flex items-end bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-700 focus-within:ring-2 focus-within:ring-amber-200 dark:focus-within:ring-amber-900/50 transition-all p-2 shadow-sm">
            <textarea
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={handleKeyDown}
               placeholder="Pour your heart out..."
               className="w-full bg-transparent border-none resize-none max-h-32 min-h-[3rem] p-3 text-sm focus:ring-0 text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 font-sans"
               disabled={isStreaming}
            />
            <button 
               onClick={handleSend}
               disabled={!input.trim() || isStreaming}
               className={`p-3 rounded-full mb-0.5 transition-all duration-200 ${input.trim() ? 'bg-brand-forest text-white shadow-md hover:bg-brand-teal' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-300'}`}
            >
               {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={dir === 'rtl' ? 'rotate-180' : ''} />}
            </button>
         </div>
         <p className="text-center text-[10px] text-neutral-400 mt-3 font-medium">Al-Murshid provides spiritual guidance, not legal fatwas.</p>
      </div>

    </div>
  );
};