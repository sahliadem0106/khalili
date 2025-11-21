
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card } from './ui/Card';
import { Flame, TrendingUp, AlertCircle, Shield, Calendar, Target, X } from 'lucide-react';
import { Prayer, PrayerStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalyticsPageProps {
  prayers: Prayer[];
}

// Mock historical data for visualizations
const KHUSHU_DATA = [
  { day: 'Mon', score: 3.2 },
  { day: 'Tue', score: 4.1 },
  { day: 'Wed', score: 2.8 },
  { day: 'Thu', score: 4.5 },
  { day: 'Fri', score: 4.8 },
  { day: 'Sat', score: 3.5 },
  { day: 'Sun', score: 4.0 },
];

const BARRIER_DATA = [
  { name: 'Sleep', value: 45, color: '#E35D5D' },
  { name: 'Work', value: 30, color: '#F2A33A' },
  { name: 'Travel', value: 15, color: '#3AA1FF' },
  { name: 'Other', value: 10, color: '#E9ECEB' },
];

// Updated Mock data for heatmap with specific counts (0-5)
const HEATMAP_DATA = Array.from({ length: 35 }, (_, i) => {
  const r = Math.random();
  let count = 5;
  
  // Distribution logic
  if (r < 0.1) count = 0;          // 10% Missed (Red)
  else if (r < 0.3) count = 1 + Math.floor(Math.random() * 2); // 20% Light Green (1-2)
  else if (r < 0.6) count = 3 + Math.floor(Math.random() * 2); // 30% Medium Green (3-4)
  else count = 5;                  // 40% Perfect (Dark Green)
  
  return { day: i + 1, count };
});

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ prayers }) => {
  const { t } = useLanguage();
  const [selectedDay, setSelectedDay] = useState<{ day: number, count: number } | null>(null);
  
  // Dynamic Weakness Logic
  const getWeakestPrayer = () => {
    const missed = prayers.find(p => p.status === PrayerStatus.Missed);
    const late = prayers.find(p => p.status === PrayerStatus.Late);
    
    if (missed) return { name: missed.name, reason: missed.barrier || 'Unknown', type: 'critical' };
    if (late) return { name: late.name, reason: late.barrier || 'Time Mgmt', type: 'warning' };
    
    return { name: 'None', reason: 'Keep it up!', type: 'success' };
  };

  const weakness = getWeakestPrayer();

  // Helper to determine color based on count
  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-red-500';
    if (count <= 2) return 'bg-emerald-200'; // Light Green
    if (count <= 4) return 'bg-emerald-400'; // Medium Green
    return 'bg-brand-forest'; // Dark Green (Perfect)
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 relative">
      
      {/* Selected Day Popup Overlay */}
      {selectedDay && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4"
          onClick={() => setSelectedDay(null)}
        >
          <div 
            className="bg-white p-6 rounded-2xl shadow-2xl border border-neutral-line w-full max-w-xs transform scale-100 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="flex justify-between items-start mb-4">
                <div>
                   <h4 className="text-xl font-bold text-neutral-primary">Day {selectedDay.day}</h4>
                   <p className="text-xs text-neutral-muted">Daily Performance</p>
                </div>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="p-1 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600"
                >
                  <X size={20} />
                </button>
             </div>
             
             <div className="flex flex-col items-center justify-center py-6 space-y-2 bg-neutral-50 rounded-2xl border border-neutral-100 mb-4">
                 <div className={`text-6xl font-bold tracking-tighter ${selectedDay.count === 5 ? 'text-brand-forest' : selectedDay.count === 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                   {selectedDay.count}<span className="text-2xl text-neutral-300 font-normal">/5</span>
                 </div>
                 <span className="text-sm font-medium text-neutral-500 uppercase tracking-widest">Prayers Done</span>
             </div>

             {/* Visual Dot Indicator */}
             <div className="flex justify-center space-x-2">
                {[1, 2, 3, 4, 5].map((i) => (
                   <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full transition-colors ${
                        i <= selectedDay.count 
                          ? (selectedDay.count === 5 ? 'bg-brand-forest' : 'bg-emerald-400') 
                          : 'bg-neutral-200'
                      }`} 
                   />
                ))}
             </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-neutral-primary">{t('insights')}</h2>
        <div className="text-xs text-neutral-muted bg-white px-3 py-1 rounded-full border shadow-sm">{t('last30days')}</div>
      </div>

      {/* Streak Hero */}
      <div id="analytics-streak" className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-200 flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
            <Flame className="fill-white text-white" size={20} />
            <span className="font-bold text-sm opacity-90">{t('currentStreak')}</span>
          </div>
          <h3 className="text-4xl font-bold">12 Days</h3>
          <p className="text-xs opacity-80 mt-1">{t('streakDesc')}</p>
        </div>
        <div className="relative z-10 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
          <span className="text-2xl font-bold">All</span>
        </div>
        {/* Decorative */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>

      {/* Weakness Identification */}
      <div id="analytics-weakness">
        {weakness.name !== 'None' ? (
          <Card className={`border-s-4 ${weakness.type === 'critical' ? 'border-s-red-400' : 'border-s-orange-400'}`}>
            <div className="flex items-start space-x-4 rtl:space-x-reverse">
              <div className={`p-2 rounded-full ${weakness.type === 'critical' ? 'bg-red-50' : 'bg-orange-50'}`}>
                <AlertCircle size={20} className={weakness.type === 'critical' ? 'text-red-500' : 'text-orange-500'} />
              </div>
              <div>
                <h3 className="font-bold text-neutral-primary">Focus Area: {weakness.name}</h3>
                <p className="text-sm text-neutral-muted mt-1">
                  Primary barrier identified is <span className="font-semibold text-neutral-primary">{weakness.reason}</span>.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="bg-brand-mint/30 border-s-4 border-s-brand-forest">
             <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Shield size={20} className="text-brand-forest" />
                <div>
                  <h3 className="font-bold text-brand-forest">No Weaknesses Detected</h3>
                  <p className="text-xs text-neutral-muted">Perfect consistency today. MashaAllah!</p>
                </div>
             </div>
          </Card>
        )}
      </div>

      {/* Monthly Consistency Heatmap */}
      <Card>
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
               <Calendar size={18} className="text-neutral-600" />
               <h3 className="font-bold text-neutral-primary">{t('consistencyHeatmap')}</h3>
            </div>
         </div>
         
         <div className="grid grid-cols-7 gap-2 mb-2">
            {['M','T','W','T','F','S','S'].map(d => (
               <div key={d} className="text-center text-[10px] text-neutral-400 font-medium">{d}</div>
            ))}
         </div>
         
         <div className="grid grid-cols-7 gap-2">
            {HEATMAP_DATA.map((day) => (
               <button 
                  key={day.day} 
                  onClick={() => setSelectedDay(day)}
                  className={`
                    aspect-square rounded-md transition-all hover:scale-110 hover:shadow-md active:scale-95
                    ${getHeatmapColor(day.count)}
                  `}
                  title={`Day ${day.day}: ${day.count} Prayers`}
               />
            ))}
         </div>
         
         {/* Updated Legend */}
         <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-100">
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
               <div className="w-3 h-3 bg-red-500 rounded"></div>
               <span className="text-[10px] text-neutral-500 font-medium">0</span>
            </div>
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
               <div className="w-3 h-3 bg-emerald-200 rounded"></div>
               <span className="text-[10px] text-neutral-500 font-medium">1-2</span>
            </div>
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
               <div className="w-3 h-3 bg-emerald-400 rounded"></div>
               <span className="text-[10px] text-neutral-500 font-medium">3-4</span>
            </div>
            <div className="flex items-center space-x-1.5 rtl:space-x-reverse">
               <div className="w-3 h-3 bg-brand-forest rounded"></div>
               <span className="text-[10px] text-neutral-500 font-bold">5</span>
            </div>
         </div>
      </Card>

      {/* Khushu Trends */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <TrendingUp size={18} className="text-brand-forest rtl:flip-x" />
            <h3 className="font-bold text-neutral-primary">{t('khushuQuality')}</h3>
          </div>
          <span className="text-xs font-bold text-brand-forest bg-brand-mint px-2 py-1 rounded">Avg 3.8</span>
        </div>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={KHUSHU_DATA}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                cursor={{stroke: '#E9ECEB', strokeWidth: 2}}
              />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#0F6B4A" 
                strokeWidth={3} 
                dot={{r: 4, fill: '#0F6B4A', strokeWidth: 2, stroke: '#fff'}} 
                activeDot={{r: 6, fill: '#0F6B4A'}}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-center text-neutral-muted mt-4">
          "Success is attained by the believers who are humble in their prayers." (23:1-2)
        </p>
      </Card>

      {/* Barrier Analysis */}
      <Card className="overflow-hidden">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              <Shield size={18} className="text-neutral-600" />
              <h3 className="font-bold text-neutral-primary">{t('topBarriers')}</h3>
            </div>
         </div>
         <div className="flex items-center">
            <div className="w-1/2 h-32 relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie 
                        data={BARRIER_DATA} 
                        innerRadius={35} 
                        outerRadius={50} 
                        paddingAngle={5} 
                        dataKey="value"
                     >
                        {BARRIER_DATA.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Pie>
                  </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-neutral-400">TOTAL</span>
               </div>
            </div>
            <div className="w-1/2 space-y-2 ps-2">
               {BARRIER_DATA.map((b) => (
                  <div key={b.name} className="flex items-center justify-between text-xs">
                     <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full me-2" style={{backgroundColor: b.color}}></div>
                        <span className="text-neutral-600">{b.name}</span>
                     </div>
                     <span className="font-bold text-neutral-800">{b.value}%</span>
                  </div>
               ))}
            </div>
         </div>
      </Card>

      {/* Goals Teaser */}
      <Card className="bg-neutral-primary text-white">
         <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold flex items-center"><Target size={16} className="me-2"/> {t('activeGoal')}</h3>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Level 1</span>
         </div>
         <p className="text-sm font-medium mb-3">{t('prayerGuardian')}</p>
         <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-brand-home w-[80%]"></div>
         </div>
         <p className="text-xs text-neutral-400 mt-2 text-end">5 / 7 Days Completed</p>
      </Card>

    </div>
  );
};
