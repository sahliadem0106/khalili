
import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Coins, RefreshCw, Info, Check, X, DollarSign } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Approximate market rates (static defaults)
const CURRENCIES = {
  USD: { symbol: '$', gold: 76.50, silver: 0.95, name: 'US Dollar' },
  EUR: { symbol: '€', gold: 70.20, silver: 0.88, name: 'Euro' },
  GBP: { symbol: '£', gold: 60.10, silver: 0.75, name: 'British Pound' },
  SAR: { symbol: '﷼', gold: 287.00, silver: 3.60, name: 'Saudi Riyal' },
  AED: { symbol: 'د.إ', gold: 281.00, silver: 3.50, name: 'UAE Dirham' },
  PKR: { symbol: '₨', gold: 21500.00, silver: 260.00, name: 'Pakistani Rupee' },
  INR: { symbol: '₹', gold: 6400.00, silver: 80.00, name: 'Indian Rupee' },
  IDR: { symbol: 'Rp', gold: 1200000, silver: 15000, name: 'Indonesian Rupiah' },
};

const NISAB_GOLD_GRAMS = 87.48;
const NISAB_SILVER_GRAMS = 612.36;

export const ZakatCalculator: React.FC = () => {
  const { t } = useLanguage();
  
  // Config State with Persistence
  const [currency, setCurrency] = useState<keyof typeof CURRENCIES>(() => {
    const saved = localStorage.getItem('muslimDaily_zakat_currency');
    return (saved as keyof typeof CURRENCIES) || 'USD';
  });

  // Initialize prices based on saved or default currency
  const [goldPrice, setGoldPrice] = useState<number>(CURRENCIES[currency].gold);
  const [silverPrice, setSilverPrice] = useState<number>(CURRENCIES[currency].silver);

  // Assets State
  const [cash, setCash] = useState<number>(0);
  const [goldGrams, setGoldGrams] = useState<number>(0);
  const [silverGrams, setSilverGrams] = useState<number>(0);
  const [otherAssets, setOtherAssets] = useState<number>(0); 
  const [liabilities, setLiabilities] = useState<number>(0);

  // When currency changes, update default prices and save preference
  const handleCurrencyChange = (newCurrency: keyof typeof CURRENCIES) => {
    setCurrency(newCurrency);
    localStorage.setItem('muslimDaily_zakat_currency', newCurrency);
    setGoldPrice(CURRENCIES[newCurrency].gold);
    setSilverPrice(CURRENCIES[newCurrency].silver);
  };

  const handleReset = () => {
    setCash(0);
    setGoldGrams(0);
    setSilverGrams(0);
    setOtherAssets(0);
    setLiabilities(0);
    // Reset prices to default for current currency
    setGoldPrice(CURRENCIES[currency].gold);
    setSilverPrice(CURRENCIES[currency].silver);
  };

  // Calculations
  const goldValue = goldGrams * goldPrice;
  const silverValue = silverGrams * silverPrice;
  
  const totalAssets = cash + goldValue + silverValue + otherAssets;
  const netAssets = Math.max(0, totalAssets - liabilities);
  
  // Nisab Thresholds
  const nisabSilverValue = NISAB_SILVER_GRAMS * silverPrice;
  
  const isEligible = netAssets >= nisabSilverValue;
  const zakatPayable = isEligible ? netAssets * 0.025 : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-300 pb-24">
      <div className="flex items-center justify-between mb-2">
         <h2 className="text-2xl font-bold text-neutral-primary">{t('action_zakat')} Calculator</h2>
         
         {/* Currency Selector */}
         <select 
            value={currency} 
            onChange={(e) => handleCurrencyChange(e.target.value as keyof typeof CURRENCIES)}
            className="bg-neutral-100 dark:bg-neutral-800 text-xs font-bold px-3 py-1.5 rounded-full border-none focus:ring-2 focus:ring-brand-forest outline-none cursor-pointer text-neutral-700 dark:text-neutral-300"
         >
            {Object.keys(CURRENCIES).map((c) => (
               <option key={c} value={c}>{c}</option>
            ))}
         </select>
      </div>

      {/* SUMMARY CARD */}
      <Card id="zakat-summary" className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none shadow-lg">
         <div className="flex justify-between items-start mb-6">
            <div>
               <p className="text-amber-100 text-xs font-medium uppercase tracking-wider mb-1">Zakat Payable</p>
               <h3 className="text-4xl font-bold">{formatCurrency(zakatPayable)}</h3>
            </div>
            <div className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center ${isEligible ? 'bg-white/20 text-white' : 'bg-black/20 text-white/70'}`}>
               {isEligible ? <Check size={14} className="me-1" /> : <X size={14} className="me-1" />}
               {isEligible ? 'Eligible' : 'Below Nisab'}
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
            <div>
               <p className="text-amber-100 text-[10px] uppercase">Total Net Assets</p>
               <p className="font-mono font-bold text-lg">{formatCurrency(netAssets)}</p>
            </div>
            <div>
               <p className="text-amber-100 text-[10px] uppercase">Nisab (Silver)</p>
               <p className="font-mono font-bold text-lg">{formatCurrency(nisabSilverValue)}</p>
            </div>
         </div>
      </Card>

      {/* INPUTS FORM */}
      <div id="zakat-inputs" className="space-y-4">
         <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-wider px-1">Your Assets</h3>
         
         {/* Cash */}
         <div id="zakat-cash-input" className="bg-neutral-card p-4 rounded-2xl border border-neutral-line shadow-sm flex items-center justify-between">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
               <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                  <DollarSign size={20} />
               </div>
               <div>
                  <p className="font-bold text-neutral-primary text-sm">Cash & Bank</p>
                  <p className="text-[10px] text-neutral-400">Savings, cash on hand</p>
               </div>
            </div>
            <div className="flex items-center">
               <span className="text-sm font-bold text-neutral-400 me-1">{CURRENCIES[currency].symbol}</span>
               <input 
                  type="number" 
                  value={cash || ''} 
                  onChange={e => setCash(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-28 text-right bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-brand-forest outline-none font-mono font-bold text-neutral-primary"
               />
            </div>
         </div>

         {/* Metals Section Group for Tour Targeting */}
         <div id="zakat-metals-section" className="space-y-4">
             {/* Gold */}
             <div className="bg-neutral-card p-4 rounded-2xl border border-neutral-line shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                       <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                          <div className="w-4 h-4 bg-current rounded-sm rotate-45"></div>
                       </div>
                       <div>
                          <p className="font-bold text-neutral-primary text-sm">Gold (Grams)</p>
                          <div className="flex items-center text-[10px] text-neutral-400">
                             <span>Price: {CURRENCIES[currency].symbol}</span>
                             <input 
                               type="number" 
                               value={goldPrice}
                               onChange={(e) => setGoldPrice(parseFloat(e.target.value) || 0)}
                               className="w-16 bg-transparent border-b border-neutral-300 mx-1 text-center focus:outline-none font-bold" 
                             />
                             <span>/g</span>
                          </div>
                       </div>
                    </div>
                    <input 
                       type="number" 
                       value={goldGrams || ''} 
                       onChange={e => setGoldGrams(parseFloat(e.target.value) || 0)}
                       placeholder="0g"
                       className="w-24 text-right bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-brand-forest outline-none font-mono font-bold text-neutral-primary"
                    />
                </div>
             </div>

             {/* Silver */}
             <div className="bg-neutral-card p-4 rounded-2xl border border-neutral-line shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                       <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                          <div className="w-4 h-4 bg-current rounded-full"></div>
                       </div>
                       <div>
                          <p className="font-bold text-neutral-primary text-sm">Silver (Grams)</p>
                          <div className="flex items-center text-[10px] text-neutral-400">
                             <span>Price: {CURRENCIES[currency].symbol}</span>
                             <input 
                               type="number" 
                               value={silverPrice}
                               onChange={(e) => setSilverPrice(parseFloat(e.target.value) || 0)}
                               className="w-16 bg-transparent border-b border-neutral-300 mx-1 text-center focus:outline-none font-bold" 
                             />
                             <span>/g</span>
                          </div>
                       </div>
                    </div>
                    <input 
                       type="number" 
                       value={silverGrams || ''} 
                       onChange={e => setSilverGrams(parseFloat(e.target.value) || 0)}
                       placeholder="0g"
                       className="w-24 text-right bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-brand-forest outline-none font-mono font-bold text-neutral-primary"
                    />
                </div>
             </div>
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
            <div className="flex items-center">
               <span className="text-sm font-bold text-red-400 me-1">{CURRENCIES[currency].symbol}</span>
               <input 
                  type="number" 
                  value={liabilities || ''} 
                  onChange={e => setLiabilities(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-28 text-right bg-transparent border-b border-neutral-200 dark:border-neutral-700 focus:border-red-500 outline-none font-mono font-bold text-red-500"
               />
            </div>
         </div>
      </div>

      <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500">
         <div className="flex items-start">
            <Info size={16} className="me-2 mt-0.5 shrink-0" />
            <p>
               Calculations use the Silver Nisab ({formatCurrency(nisabSilverValue)}) as the safer threshold for eligibility. 
               Ensure gold/silver prices are current.
            </p>
         </div>
         <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="mt-2 text-brand-forest hover:bg-transparent p-0 h-auto"
         >
            <RefreshCw size={12} className="me-1" /> Reset All
         </Button>
      </div>

    </div>
  );
};
