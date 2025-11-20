import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card } from './ui/Card';
import { Flame, TrendingUp, AlertCircle, Shield, Calendar, Target } from 'lucide-react';
import { Prayer, PrayerStatus } from '../types';

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

// Mock data for heatmap (1 = full, 0.5 = partial, 0 = missed)
const HEATMAP_DATA = Array.from({ length: 28 }, (_, i) => ({
  day: i + 1,
  status: Math.random() > 0.8 ? 'missed' : Math.random() > 0.3 ? 'full' : 'partial'
}));

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ prayers }) => {
  
  // Dynamic Weakness Logic
  // In a real app, this would aggregate huge datasets. 
  // Here we check today's prayers to find the "worst" one for demo purposes.
  const getWeakestPrayer = () => {
    const missed = prayers.find(p => p.status === PrayerStatus.Missed);
    const late = prayers.find(p => p.status === PrayerStatus.Late);
    
    if (missed) return { name: missed.name, reason: missed.barrier || 'Unknown', type: 'critical' };
    if (late) return { name: late.name, reason: late.barrier || 'Time Mgmt', type: 'warning' };
    
    return { name: 'None', reason: 'Keep it up!', type: 'success' };
  };

  const weakness = getWeakestPrayer();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-neutral-primary">Insights</h2>
        <div className="text-xs text-neutral-muted bg-white px-3 py-1 rounded-full border shadow-sm">Last 30 Days</div>
      </div>

      {/* Streak Hero */}
      <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-200 flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-1">
            <Flame className="fill-white text-white" size={20} />
            <span className="font-bold text-sm opacity-90">Current Streak</span>
          </div>
          <h3 className="text-4xl font-bold">12 Days</h3>
          <p className="text-xs opacity-80 mt-1">You're 80% consistent this week!</p>
        </div>
        <div className="relative z-10 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30">
          <span className="text-2xl font-bold">All</span>
        </div>
        {/* Decorative */}
        <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full"></div>
      </div>

      {/* Weakness Identification (Behavioral) */}
      {weakness.name !== 'None' ? (
        <Card className={`border-l-4 ${weakness.type === 'critical' ? 'border-l-red-400' : 'border-l-orange-400'}`}>
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-full ${weakness.type === 'critical' ? 'bg-red-50' : 'bg-orange-50'}`}>
              <AlertCircle size={20} className={weakness.type === 'critical' ? 'text-red-500' : 'text-orange-500'} />
            </div>
            <div>
              <h3 className="font-bold text-neutral-primary">Focus Area: {weakness.name}</h3>
              <p className="text-sm text-neutral-muted mt-1">
                Primary barrier identified is <span className="font-semibold text-neutral-primary">{weakness.reason}</span>. 
                {weakness.reason.toLowerCase().includes('sleep') 
                  ? ' Try setting an alarm 15 mins earlier.' 
                  : ' Try preparing for wudu 10 mins before.'}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-brand-mint/30 border-l-4 border-l-brand-forest">
           <div className="flex items-center space-x-3">
              <Shield size={20} className="text-brand-forest" />
              <div>
                <h3 className="font-bold text-brand-forest">No Weaknesses Detected</h3>
                <p className="text-xs text-neutral-muted">Perfect consistency today. MashaAllah!</p>
              </div>
           </div>
        </Card>
      )}

      {/* Consistency Heatmap */}
      <Card>
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
               <Calendar size={18} className="text-neutral-600" />
               <h3 className="font-bold text-neutral-primary">Monthly Consistency</h3>
            </div>
         </div>
         <div className="grid grid-cols-7 gap-1.5">
            {['M','T','W','T','F','S','S'].map(d => (
               <div key={d} className="text-center text-[10px] text-neutral-400 font-medium mb-1">{d}</div>
            ))}
            {HEATMAP_DATA.map((day, i) => (
               <div 
                  key={i} 
                  className={`
                    aspect-square rounded-md transition-all hover:scale-110 cursor-pointer
                    ${day.status === 'full' ? 'bg-brand-forest' : day.status === 'partial' ? 'bg-brand-home' : 'bg-neutral-200'}
                  `}
                  title={`Day ${day.day}: ${day.status}`}
               ></div>
            ))}
         </div>
         <div className="flex items-center justify-end space-x-3 mt-3 text-[10px] text-neutral-400">
            <div className="flex items-center"><div className="w-2 h-2 bg-neutral-200 rounded mr-1"></div> Missed</div>
            <div className="flex items-center"><div className="w-2 h-2 bg-brand-home rounded mr-1"></div> Partial</div>
            <div className="flex items-center"><div className="w-2 h-2 bg-brand-forest rounded mr-1"></div> Perfect</div>
         </div>
      </Card>

      {/* Khushu Trends */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp size={18} className="text-brand-forest" />
            <h3 className="font-bold text-neutral-primary">Khushu Quality</h3>
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
            <div className="flex items-center space-x-2">
              <Shield size={18} className="text-neutral-600" />
              <h3 className="font-bold text-neutral-primary">Top Barriers</h3>
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
            <div className="w-1/2 space-y-2 pl-2">
               {BARRIER_DATA.map((b) => (
                  <div key={b.name} className="flex items-center justify-between text-xs">
                     <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: b.color}}></div>
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
            <h3 className="font-bold flex items-center"><Target size={16} className="mr-2"/> Active Goal</h3>
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Level 1</span>
         </div>
         <p className="text-sm font-medium mb-3">Prayer Guardian: 7 Day Streak</p>
         <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-brand-home w-[80%]"></div>
         </div>
         <p className="text-xs text-neutral-400 mt-2 text-right">5 / 7 Days Completed</p>
      </Card>

    </div>
  );
};