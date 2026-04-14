
import React, { useState, useEffect, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Coins, RefreshCw, Info, Check, X, DollarSign, Wifi, WifiOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

// Fallback prices (used only when API is unavailable)
const FALLBACK_PRICES = {
  gold: 95.00, // USD per gram (updated 2025 approximate)
  silver: 1.05, // USD per gram (updated 2025 approximate)
};

const NISAB_GOLD_GRAMS = 87.48;
const NISAB_SILVER_GRAMS = 612.36;

// Fetch live metal prices from a free API
async function fetchMetalPrices(): Promise<{ gold: number; silver: number } | null> {
  try {
    // Use the free metals price endpoint (goldapi.io free tier or similar)
    // Fallback strategy: try multiple endpoints
    const apiKey = import.meta.env.VITE_METAL_PRICE_API_KEY || (import.meta.env.DEV ? 'demo' : '');
    if (!apiKey) return null; // No key in production = skip API call, use fallbacks
    const res = await fetch(`https://api.metalpriceapi.com/v1/latest?api_key=${apiKey}&base=USD&currencies=XAU,XAG`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.rates?.XAU && data.rates?.XAG) {
        // XAU and XAG are troy ounces per USD; we need USD per gram
        // 1 troy ounce = 31.1035 grams
        const goldPerGram = (1 / data.rates.XAU) / 31.1035;
        const silverPerGram = (1 / data.rates.XAG) / 31.1035;
        return { gold: Math.round(goldPerGram * 100) / 100, silver: Math.round(silverPerGram * 100) / 100 };
      }
    }
  } catch {
    // API unavailable — fall through to null
  }
  return null;
}

export const ZakatCalculator: React.FC = () => {
  const { t } = useLanguage();
  
  // Assets State
  const [cash, setCash] = useState<number>(0);
  const [goldGrams, setGoldGrams] = useState<number>(0);
  const [silverGrams, setSilverGrams] = useState<number>(0);
  const [otherAssets, setOtherAssets] = useState<number>(0); // Stocks, merchandise
  const [liabilities, setLiabilities] = useState<number>(0); // Debts due immediately

  // Config State
  const [goldPrice, setGoldPrice] = useState<number>(FALLBACK_PRICES.gold);
  const [silverPrice, setSilverPrice] = useState<number>(FALLBACK_PRICES.silver);
  const [currency, setCurrency] = useState<string>('USD');
  const [pricesLive, setPricesLive] = useState<boolean>(false);
  const [pricesLoading, setPricesLoading] = useState<boolean>(true);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);

  // Fetch live prices on mount
  useEffect(() => {
    let cancelled = false;
    setPricesLoading(true);
    fetchMetalPrices().then(prices => {
      if (cancelled) return;
      if (prices) {
        setGoldPrice(prices.gold);
        setSilverPrice(prices.silver);
        setPricesLive(true);
        setLastPriceUpdate(new Date().toLocaleTimeString());
      } else {
        setPricesLive(false);
      }
      setPricesLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Calculations
  const goldValue = goldGrams * goldPrice;
  const silverValue = silverGrams * silverPrice;
  
  const totalAssets = cash + goldValue + silverValue + otherAssets;
  const netAssets = Math.max(0, totalAssets - liabilities);
  
  // Nisab Thresholds (Value)
  const nisabGoldValue = NISAB_GOLD_GRAMS * goldPrice;
  const nisabSilverValue = NISAB_SILVER_GRAMS * silverPrice;
  
  // Determine Eligibility (Using Gold is safer/standard for wealth, Silver for caution)
  // Most scholars recommend using the lower value (Silver) to be safer for the poor, 
  // but Gold is often used for currency. We'll show both or default to Gold for simplicity 
  // but show a toggle/warning. Let's stick to Silver as it's the lower threshold (safer).
  const isEligible = netAssets >= nisabSilverValue;
  
  const zakatPayable = isEligible ? netAssets * 0.025 : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300 pb-32 w-full px-2">
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-3xl font-black text-brand-forest font-outfit tracking-tight">{t('zakat')}</h2>
         <div className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center shadow-inner">
            <Coins size={14} className="me-1.5" /> 2.5% Rate
         </div>
      </div>

      {/* SUMMARY CARD */}
      <motion.div 
         initial={{ scale: 0.95, opacity: 0 }}
         animate={{ scale: 1, opacity: 1 }}
         className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-soft-xl bg-gradient-to-br from-emerald-600 via-brand-primary to-emerald-900 border-none text-white block w-full"
      >
         <div className="absolute -top-24 -right-24 bg-white/10 w-64 h-64 rounded-full blur-3xl pointer-events-none"></div>
         <div className="absolute -bottom-24 -left-24 bg-emerald-300/20 w-64 h-64 rounded-full blur-3xl pointer-events-none"></div>
         
         <div className="relative z-10 flex justify-between items-start mb-6">
            <div>
               <p className="text-emerald-100/80 text-[11px] font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]"></span>
                  Zakat Payable
               </p>
               <motion.h3 
                  key={zakatPayable} 
                  initial={{ y: -5, opacity: 0 }} 
                  animate={{ y: 0, opacity: 1 }}
                  className="text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-md font-mono"
               >
                  {currency} {zakatPayable.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
               </motion.h3>
            </div>
            
            <motion.div 
               animate={{ scale: isEligible ? [1, 1.05, 1] : 1 }}
               transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
               className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center shadow-lg border backdrop-blur-md ${isEligible ? 'bg-white/20 text-white border-white/20' : 'bg-black/30 text-white/50 border-black/20'}`}
            >
               {isEligible ? <Check size={14} className="me-1" strokeWidth={3} /> : <X size={14} className="me-1" strokeWidth={3} />}
               {isEligible ? 'Eligible' : 'Below Nisab'}
            </motion.div>
         </div>

         <div className="flex bg-black/10 backdrop-blur-md rounded-2xl p-4 mt-6 border border-white/10 shadow-inner">
             <div className="flex-1 border-r border-white/10 pr-4">
                <p className="text-emerald-100/60 text-[10px] uppercase font-bold tracking-wider mb-1">Total Net Assets</p>
                <p className="font-mono font-bold text-lg">{currency} {netAssets.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
             </div>
             <div className="flex-1 pl-4">
                <p className="text-emerald-100/60 text-[10px] uppercase font-bold tracking-wider mb-1">Nisab (Silver)</p>
                <p className="font-mono font-bold text-lg">{currency} {nisabSilverValue.toLocaleString(undefined, {maximumFractionDigits:0})}</p>
             </div>
         </div>
         
         {/* Progress Bar for Nisab */}
         {!isEligible && netAssets > 0 && (
             <div className="mt-5 w-full bg-black/20 h-2 rounded-full overflow-hidden">
                 <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${Math.min(100, (netAssets / nisabSilverValue) * 100)}%` }}
                     className="h-full bg-gradient-to-r from-amber-400 to-amber-300 rounded-full"
                 />
             </div>
         )}
      </motion.div>

      {/* INPUTS FORM */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
         {/* Cash */}
         <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-xl p-5 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-soft-xl transition-all duration-300 group">
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/40 dark:to-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner transition-transform group-hover:scale-105">
                  <DollarSign size={24} strokeWidth={2.5} />
               </div>
               <div>
                  <p className="font-black text-brand-forest dark:text-white text-base">Cash & Bank</p>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Savings & On Hand</p>
               </div>
            </div>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-bold text-lg">{currency}</span>
               <input 
                  type="number" 
                  value={cash || ''} 
                  onChange={e => setCash(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-white dark:bg-neutral-900 border-none pl-12 p-4 rounded-2xl text-lg font-mono font-black text-brand-forest dark:text-white placeholder-neutral-300 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none shadow-inner"
               />
            </div>
         </div>

         {/* Gold */}
         <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-xl p-5 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-soft-xl transition-all duration-300 group">
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-200 dark:from-amber-900/40 dark:to-yellow-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner transition-transform group-hover:scale-105">
                  <div className="w-5 h-5 bg-current rounded-sm rotate-45"></div>
               </div>
               <div>
                  <p className="font-black text-brand-forest dark:text-white text-base">Gold Assets</p>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">${goldPrice}/g</p>
               </div>
            </div>
            <div className="relative flex items-center gap-2">
               <input 
                  type="number" 
                  value={goldGrams || ''} 
                  onChange={e => setGoldGrams(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-white dark:bg-neutral-900 border-none px-4 p-4 rounded-2xl text-lg font-mono font-black text-brand-forest dark:text-white placeholder-neutral-300 focus:ring-4 focus:ring-amber-500/10 transition-all outline-none shadow-inner"
               />
               <span className="text-neutral-400 font-bold px-2 uppercase tracking-wider text-xs">Grams</span>
            </div>
         </div>

         {/* Silver */}
         <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-xl p-5 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-soft-xl transition-all duration-300 group">
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-inner transition-transform group-hover:scale-105">
                  <div className="w-5 h-5 bg-current rounded-full"></div>
               </div>
               <div>
                  <p className="font-black text-brand-forest dark:text-white text-base">Silver Assets</p>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">${silverPrice}/g</p>
               </div>
            </div>
            <div className="relative flex items-center gap-2">
               <input 
                  type="number" 
                  value={silverGrams || ''} 
                  onChange={e => setSilverGrams(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-white dark:bg-neutral-900 border-none px-4 p-4 rounded-2xl text-lg font-mono font-black text-brand-forest dark:text-white placeholder-neutral-300 focus:ring-4 focus:ring-slate-500/10 transition-all outline-none shadow-inner"
               />
               <span className="text-neutral-400 font-bold px-2 uppercase tracking-wider text-xs">Grams</span>
            </div>
         </div>

         {/* Liabilities */}
         <div className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-xl p-5 rounded-3xl border border-black/5 dark:border-white/5 shadow-sm hover:shadow-soft-xl transition-all duration-300 group">
            <div className="flex items-center space-x-3 rtl:space-x-reverse mb-4">
               <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center text-red-500 shadow-inner transition-transform group-hover:scale-105">
                  <X size={24} strokeWidth={3} />
               </div>
               <div>
                  <p className="font-black text-red-600 dark:text-red-400 text-base">Immediate Debts</p>
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">Deducted from assets</p>
               </div>
            </div>
            <div className="relative">
               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-mono font-bold text-lg">{currency}</span>
               <input 
                  type="number" 
                  value={liabilities || ''} 
                  onChange={e => setLiabilities(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-white dark:bg-neutral-900 border-none pl-12 p-4 rounded-2xl text-lg font-mono font-black text-red-500 placeholder-red-200 focus:ring-4 focus:ring-red-500/10 transition-all outline-none shadow-inner"
               />
            </div>
         </div>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500">
         <div className="flex items-start">
            <Info size={16} className="me-2 mt-0.5 shrink-0" />
            <p>
               Calculations use the Silver Nisab (${nisabSilverValue.toFixed(0)}) as the safer threshold for eligibility. 
               Ensure gold/silver prices are current for your region.
            </p>
         </div>
         <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-1.5">
               {pricesLoading ? (
                  <span className="flex items-center gap-1 text-amber-500">
                     <RefreshCw size={12} className="animate-spin" /> Fetching prices...
                  </span>
               ) : pricesLive ? (
                  <span className="flex items-center gap-1 text-emerald-600">
                     <Wifi size={12} /> Live prices{lastPriceUpdate ? ` (${lastPriceUpdate})` : ''}
                  </span>
               ) : (
                  <span className="flex items-center gap-1 text-amber-500">
                     <WifiOff size={12} /> Using fallback prices
                  </span>
               )}
            </div>
            <Button 
               variant="ghost" 
               size="sm" 
               onClick={() => {
                  setGoldPrice(FALLBACK_PRICES.gold);
                  setSilverPrice(FALLBACK_PRICES.silver);
                  setPricesLive(false);
               }}
               className="text-brand-forest hover:bg-transparent p-0 h-auto"
            >
               <RefreshCw size={12} className="me-1" /> Reset
            </Button>
         </div>
      </div>

    </div>
  );
};
