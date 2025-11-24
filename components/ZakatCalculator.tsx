
import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Coins, RefreshCw, Info, Check, X, DollarSign } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Defaults (can be updated via API in a real app)
const DEFAULT_PRICES = {
  gold: 65.50, // USD per gram
  silver: 0.85, // USD per gram
};

const NISAB_GOLD_GRAMS = 87.48;
const NISAB_SILVER_GRAMS = 612.36;

export const ZakatCalculator: React.FC = () => {
  const { t } = useLanguage();
  
  // Assets State
  const [cash, setCash] = useState<number>(0);
  const [goldGrams, setGoldGrams] = useState<number>(0);
  const [silverGrams, setSilverGrams] = useState<number>(0);
  const [otherAssets, setOtherAssets] = useState<number>(0); // Stocks, merchandise
  const [liabilities, setLiabilities] = useState<number>(0); // Debts due immediately

  // Config State
  const [goldPrice, setGoldPrice] = useState<number>(DEFAULT_PRICES.gold);
  const [silverPrice, setSilverPrice] = useState<number>(DEFAULT_PRICES.silver);
  const [currency, setCurrency] = useState<string>('USD');

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
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300 pb-24">
      <div className="flex items-center justify-between mb-2">
         <h2 className="text-2xl font-bold text-neutral-primary">{t('zakat')} Calculator</h2>
         <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <Coins size={14} className="me-1.5" /> 2.5%
         </div>
      </div>

      {/* SUMMARY CARD */}
      <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-lg">
         <div className="flex justify-between items-start mb-6">
            <div>
               <p className="text-amber-100 text-xs font-medium uppercase tracking-wider mb-1">Zakat Payable</p>
               <h3 className="text-4xl font-bold">{currency} {zakatPayable.toFixed(2)}</h3>
            </div>
            <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center ${isEligible ? 'bg-white/20 text-white' : 'bg-black/20 text-white/70'}`}>
               {isEligible ? <Check size={14} className="me-1" /> : <X size={14} className="me-1" />}
               {isEligible ? 'Eligible' : 'Below Nisab'}
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
            <div>
               <p className="text-amber-100 text-[10px] uppercase">Total Net Assets</p>
               <p className="font-mono font-bold text-lg">{currency} {netAssets.toLocaleString()}</p>
            </div>
            <div>
               <p className="text-amber-100 text-[10px] uppercase">Nisab Threshold (Silver)</p>
               <p className="font-mono font-bold text-lg">{currency} {nisabSilverValue.toFixed(0)}</p>
            </div>
         </div>
      </Card>

      {/* INPUTS FORM */}
      <div className="space-y-4">
         <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider px-1">Your Assets</h3>
         
         {/* Cash */}
         <div className="bg-neutral-card p-4 rounded-2xl border border-neutral-line shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
               <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <DollarSign size={20} />
               </div>
               <div>
                  <p className="font-bold text-neutral-primary text-sm">Cash & Bank</p>
                  <p className="text-[10px] text-neutral-400">Savings, cash on hand</p>
               </div>
            </div>
            <input 
               type="number" 
               value={cash || ''} 
               onChange={e => setCash(parseFloat(e.target.value) || 0)}
               placeholder="0"
               className="w-32 text-right bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-brand-forest outline-none font-mono font-bold text-neutral-primary"
            />
         </div>

         {/* Gold */}
         <div className="bg-neutral-card p-4 rounded-2xl border border-neutral-line shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
               <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                  <div className="w-4 h-4 bg-current rounded-sm rotate-45"></div>
               </div>
               <div>
                  <p className="font-bold text-neutral-primary text-sm">Gold (Grams)</p>
                  <p className="text-[10px] text-neutral-400">Price: ${goldPrice}/g</p>
               </div>
            </div>
            <input 
               type="number" 
               value={goldGrams || ''} 
               onChange={e => setGoldGrams(parseFloat(e.target.value) || 0)}
               placeholder="0g"
               className="w-32 text-right bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-brand-forest outline-none font-mono font-bold text-neutral-primary"
            />
         </div>

         {/* Silver */}
         <div className="bg-neutral-card p-4 rounded-2xl border border-neutral-line shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
               <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <div className="w-4 h-4 bg-current rounded-full"></div>
               </div>
               <div>
                  <p className="font-bold text-neutral-primary text-sm">Silver (Grams)</p>
                  <p className="text-[10px] text-neutral-400">Price: ${silverPrice}/g</p>
               </div>
            </div>
            <input 
               type="number" 
               value={silverGrams || ''} 
               onChange={e => setSilverGrams(parseFloat(e.target.value) || 0)}
               placeholder="0g"
               className="w-32 text-right bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-brand-forest outline-none font-mono font-bold text-neutral-primary"
            />
         </div>

         {/* Liabilities */}
         <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider px-1 pt-4">Liabilities</h3>
         <div className="bg-neutral-card p-4 rounded-2xl border border-neutral-line shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
               <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500">
                  <X size={20} />
               </div>
               <div>
                  <p className="font-bold text-neutral-primary text-sm">Immediate Debts</p>
                  <p className="text-[10px] text-neutral-400">Deductible from assets</p>
               </div>
            </div>
            <input 
               type="number" 
               value={liabilities || ''} 
               onChange={e => setLiabilities(parseFloat(e.target.value) || 0)}
               placeholder="0"
               className="w-32 text-right bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-red-500 outline-none font-mono font-bold text-red-500"
            />
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
         <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
               setGoldPrice(DEFAULT_PRICES.gold);
               setSilverPrice(DEFAULT_PRICES.silver);
            }}
            className="mt-2 text-brand-forest hover:bg-transparent p-0 h-auto"
         >
            <RefreshCw size={12} className="me-1" /> Reset Prices to Default
         </Button>
      </div>

    </div>
  );
};
