
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card } from './ui/Card';
import { Flame, TrendingUp, AlertCircle, Shield, Calendar, Target, X, Activity, CheckCircle2, Sprout, ListCheck, Award, Clock } from 'lucide-react';
import { Prayer, PrayerStatus, Habit } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface AnalyticsPageProps {
  prayers: Prayer[];
}

type TimeRange = '7d' | '15d' | '30d';

const BARRIER_DATA = [
  { name: 'Sleep', value: 45, color: '#E35D5D' },
  { name: 'Work', value: 30, color: '#F2A33A' },
  { name: 'Travel', value: 15, color: '#3AA1FF' },
  { name: 'Other', value: 10, color: '#E9ECEB' },
];

// Custom Tooltip for Khushu Graph
const CustomKhushuTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-card p-2 border border-neutral-line rounded-lg shadow-lg text-xs animate-in fade-in zoom-in-95 duration-150">
        <p className="font-bold text-neutral-primary mb-1">{label}</p>
        <p className="text-brand-forest font-medium flex items-center">
           Quality: <span className="font-bold ms-1">{payload[0].value}</span>
           <span className="text-neutral-400 ms-0.5">/5</span>
        </p>
      </div>
    );
  }
  return null;
};

// Subcomponent for Habit Analytics
const HabitStats = ({ timeRange }: { timeRange: TimeRange }) => {
  const [habits] = useState<Habit[]>(() => {
    const saved = localStorage.getItem('muslimDaily_habits');
    return saved ? JSON.parse(saved) : [];
  });
  const { language } = useLanguage();

  const stats = useMemo(() => {
    if (habits.length === 0) return null;

    const daysCount = timeRange === '7d' ? 7 : timeRange === '15d' ? 15 : 30;
    
    // Calculate cutoff date (set to start of day)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysCount);
    cutoffDate.setHours(0, 0, 0, 0);

    // Helper to check if a log is within range
    const isInRange = (dateStr: string) => {
        const d = new Date(dateStr);
        return d >= cutoffDate;
    };

    const totalHabits = habits.length;
    const buildingCount = habits.filter(h => h.type === 'build').length;
    const quittingCount = habits.filter(h => h.type === 'quit').length;
    
    // --- METRICS BASED ON TIME RANGE ---
    
    let totalLogsInRange = 0;
    let totalSuccessLogsInRange = 0;
    
    habits.forEach(h => {
        const filteredLogs = h.logs.filter(l => isInRange(l.date));
        totalLogsInRange += filteredLogs.length;
        totalSuccessLogsInRange += filteredLogs.filter(l => l.completed).length;
    });

    const completionRate = totalLogsInRange > 0 ? Math.round((totalSuccessLogsInRange / totalLogsInRange) * 100) : 0;
    
    // Find best streak (overall)
    const longestStreakHabit = habits.reduce((prev, current) => (prev.streak > current.streak) ? prev : current, habits[0]);

    // --- CHART DATA ---
    const activityData = Array.from({length: daysCount}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - ((daysCount - 1) - i)); // Order: Oldest to Newest
        const dateStr = d.toISOString().split('T')[0];
        const dayName = new Intl.DateTimeFormat(language, { weekday: 'short' }).format(d);
        
        let count = 0;
        habits.forEach(h => {
            if (h.logs.some(l => l.date.startsWith(dateStr) && l.completed)) {
                count++;
            }
        });
        
        return { 
            // For 30 days, show date number instead of day name for space
            label: daysCount > 15 ? d.getDate().toString() : dayName, 
            fullDate: dateStr,
            count 
        };
    });

    // Data for Pie Chart (Success vs Fail/Slip IN RANGE)
    const pieData = [
      { name: 'Success', value: totalSuccessLogsInRange, color: '#1FA66A' },
      { name: 'Struggles', value: totalLogsInRange - totalSuccessLogsInRange, color: '#E35D5D' }
    ];

    // Top 3 Habits (sorted by success count in this range)
    const topHabits = [...habits].map(h => {
        const successCount = h.logs.filter(l => isInRange(l.date) && l.completed).length;
        return { ...h, rangeSuccess: successCount };
    }).sort((a,b) => b.rangeSuccess - a.rangeSuccess).slice(0, 3);

    return {
      totalHabits,
      buildingCount,
      quittingCount,
      totalLogs: totalLogsInRange,
      completionRate,
      longestStreakHabit,
      pieData,
      activityData,
      topHabits
    };
  }, [habits, timeRange, language]);

  if (!stats) {
    return (
      <div className="text-center py-12 bg-neutral-card rounded-2xl border border-neutral-line">
        <Sprout size={48} className="mx-auto mb-3 text-neutral-400" />
        <p className="text-neutral-muted font-medium">No habits tracked yet.</p>
        <p className="text-xs text-neutral-400 mt-1">Go to "Habits" to start your journey.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-right duration-300">
      {/* Top KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 flex flex-col items-center justify-center">
           <span className="text-2xl font-bold text-brand-forest">{stats.completionRate}%</span>
           <span className="text-[9px] text-neutral-400 uppercase tracking-wider text-center">Success Rate</span>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center">
           <span className="text-2xl font-bold text-orange-500">{stats.longestStreakHabit.streak}</span>
           <span className="text-[9px] text-neutral-400 uppercase tracking-wider text-center">Best Streak</span>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center">
           <span className="text-2xl font-bold text-blue-500">{stats.totalLogs}</span>
           <span className="text-[9px] text-neutral-400 uppercase tracking-wider text-center">Logs ({timeRange})</span>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
         <h3 className="font-bold text-neutral-primary mb-4 flex items-center text-sm justify-between">
            <div className="flex items-center">
                <Calendar size={16} className="me-2 text-neutral-500" /> 
                Activity ({timeRange === '7d' ? 'Week' : timeRange === '15d' ? '15 Days' : 'Month'})
            </div>
         </h3>
         <div className="w-full h-32">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={stats.activityData}>
                  <XAxis 
                     dataKey="label" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{fontSize: 9, fill: '#9CA3AF'}} 
                     dy={5}
                     interval={timeRange === '30d' ? 2 : 0} // Skip ticks for 30d view
                  />
                  <Tooltip 
                     cursor={{fill: 'rgba(0,0,0,0.05)'}}
                     contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', fontSize: '12px'}}
                  />
                  <Bar dataKey="count" radius={[4, 4, 4, 4]} fill="#0F6B4A" barSize={timeRange === '30d' ? 6 : 16} />
               </BarChart>
            </ResponsiveContainer>
         </div>
      </Card>

      {/* Success Breakdown & Habit Counts */}
      <div className="grid grid-cols-2 gap-3">
         {/* Breakdown Chart */}
         <Card className="flex flex-col justify-center items-center">
            <h4 className="text-xs font-bold text-neutral-500 uppercase mb-2">Performance</h4>
            <div className="w-24 h-24 relative pointer-events-none">
               {stats.totalLogs > 0 ? (
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie 
                            data={stats.pieData} 
                            innerRadius={25} 
                            outerRadius={40} 
                            paddingAngle={5} 
                            dataKey="value"
                         >
                            {stats.pieData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                         </Pie>
                      </PieChart>
                   </ResponsiveContainer>
               ) : (
                   <div className="w-full h-full rounded-full border-4 border-neutral-100 dark:border-neutral-700 flex items-center justify-center text-xs text-neutral-300">
                       No Data
                   </div>
               )}
               {/* Center Dot */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-1 h-1 bg-neutral-300 rounded-full"></div>
               </div>
            </div>
            <div className="flex space-x-3 mt-2 text-[10px] text-neutral-500">
               <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-status-jamaah me-1"></span> Done</span>
               <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-status-missed me-1"></span> Missed</span>
            </div>
         </Card>

         {/* Counts */}
         <div className="space-y-3">
            <div className="bg-neutral-card p-3 rounded-2xl border border-neutral-line shadow-sm flex flex-col justify-center h-[calc(50%-6px)]">
               <div className="flex items-center space-x-2 mb-1 text-brand-forest">
                  <Sprout size={16} />
                  <span className="text-xs font-bold">Building</span>
               </div>
               <span className="text-2xl font-bold text-neutral-primary">{stats.buildingCount}</span>
            </div>
            <div className="bg-neutral-card p-3 rounded-2xl border border-neutral-line shadow-sm flex flex-col justify-center h-[calc(50%-6px)]">
               <div className="flex items-center space-x-2 mb-1 text-red-500">
                  <Shield size={16} />
                  <span className="text-xs font-bold">Quitting</span>
               </div>
               <span className="text-2xl font-bold text-neutral-primary">{stats.quittingCount}</span>
            </div>
         </div>
      </div>

      {/* Top Performing Habits in Period */}
      <Card>
         <h3 className="font-bold text-neutral-primary mb-3 text-sm flex items-center">
            <ListCheck size={16} className="me-2 text-neutral-500" /> Top Habits ({timeRange})
         </h3>
         <div className="space-y-3">
            {stats.topHabits.length > 0 ? stats.topHabits.map((h, i) => (
               <div key={h.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                     <span className="w-5 text-xs font-bold text-neutral-400">#{i+1}</span>
                     <div className="ms-2">
                        <p className="text-sm font-bold text-neutral-primary truncate max-w-[150px]">{h.title}</p>
                        <p className="text-[10px] text-neutral-400">{h.type === 'build' ? 'Building' : 'Quitting'}</p>
                     </div>
                  </div>
                  <div className="flex items-center text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                     <CheckCircle2 size={10} className="me-1" /> {h.rangeSuccess}
                  </div>
               </div>
            )) : (
                <p className="text-xs text-neutral-400 italic">No data for this period.</p>
            )}
         </div>
      </Card>

    </div>
  );
};

interface HeatmapDay {
  day: number;
  count: number;
  gregorian: string;
  hijri: string;
}

// Main Component
export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ prayers }) => {
  const { t, language } = useLanguage();
  const [selectedDay, setSelectedDay] = useState<HeatmapDay | null>(null);
  const [activeTab, setActiveTab] = useState<'prayers' | 'habits'>('prayers');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  
  // Dynamic Khushu Data Generator
  const khushuData = useMemo(() => {
    const today = new Date();
    return Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (6 - i)); // Last 7 days including today
        return {
            day: new Intl.DateTimeFormat(language, { weekday: 'short' }).format(d),
            score: (Math.random() * 2 + 3).toFixed(1) // Random score 3.0 - 5.0
        };
    });
  }, [language]);

  // Mock data generator for Heatmap based on timeRange
  const heatmapData = useMemo(() => {
      const daysCount = timeRange === '7d' ? 7 : timeRange === '15d' ? 15 : 30;
      const today = new Date();

      return Array.from({ length: daysCount }, (_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (daysCount - 1 - i));
        
        const r = Math.random();
        let count = 5;
        if (r < 0.1) count = 0;
        else if (r < 0.3) count = 1 + Math.floor(Math.random() * 2);
        else if (r < 0.6) count = 3 + Math.floor(Math.random() * 2);
        
        // Date Formatting using Intl
        const gregorian = new Intl.DateTimeFormat(language, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }).format(d);

        let hijri = "";
        try {
            // Try to use Islamic calendar if supported
            const hijriFormatter = new Intl.DateTimeFormat(language + '-u-ca-islamic', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            hijri = hijriFormatter.format(d);
        } catch (e) {
            hijri = "Hijri Date Unavailable";
        }

        return { day: i + 1, count, gregorian, hijri };
      });
  }, [timeRange, language]);

  // Dynamic Weakness Logic (Prayers)
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
    if (count <= 2) return 'bg-emerald-200 dark:bg-emerald-900'; // Light Green
    if (count <= 4) return 'bg-emerald-400 dark:bg-emerald-700'; // Medium Green
    return 'bg-brand-forest'; // Dark Green (Perfect)
  };

  // Dynamic Title for Heatmap
  const getConsistencyTitle = () => {
    switch (timeRange) {
      case '7d': return t('consistency_7d');
      case '15d': return t('consistency_15d');
      case '30d': return t('consistency_30d');
      default: return t('dailyPerformance');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 relative">
      
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-neutral-primary">{t('insights')}</h2>
      </div>

      {/* Time Range Selector */}
      <div className="flex p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-2">
         {(['7d', '15d', '30d'] as TimeRange[]).map((r) => (
             <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg transition-all ${timeRange === r ? 'bg-white dark:bg-neutral-700 text-brand-forest shadow-sm' : 'text-neutral-400'}`}
             >
                {r.replace('d', ' Days')}
             </button>
         ))}
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-neutral-200 dark:bg-neutral-800 rounded-xl mb-4">
         <button 
            onClick={() => setActiveTab('prayers')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'prayers' ? 'bg-white dark:bg-neutral-700 shadow text-brand-forest' : 'text-neutral-500 dark:text-neutral-400'}`}
         >
            Prayers
         </button>
         <button 
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'habits' ? 'bg-white dark:bg-neutral-700 shadow text-brand-forest' : 'text-neutral-500 dark:text-neutral-400'}`}
         >
            Habits
         </button>
      </div>

      {activeTab === 'habits' ? (
         <HabitStats timeRange={timeRange} />
      ) : (
         /* PRAYER ANALYTICS CONTENT */
         <div className="space-y-6 animate-in fade-in slide-in-from-left duration-300">
            {/* Selected Day Popup Overlay */}
            {selectedDay && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4"
                onClick={() => setSelectedDay(null)}
              >
                <div 
                  className="bg-neutral-card p-6 rounded-2xl shadow-2xl border border-neutral-line w-full max-w-xs transform scale-100 animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <h4 className="text-lg font-bold text-neutral-primary leading-snug">{selectedDay.gregorian}</h4>
                         <p className="text-sm text-brand-forest font-medium mt-0.5">{selectedDay.hijri}</p>
                         <div className="h-px bg-neutral-100 dark:bg-neutral-700 my-2 w-full"></div>
                         <p className="text-xs text-neutral-muted uppercase tracking-wider">Daily Performance</p>
                      </div>
                      <button 
                        onClick={() => setSelectedDay(null)}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-neutral-600"
                      >
                        <X size={20} />
                      </button>
                   </div>
                   
                   <div className="flex flex-col items-center justify-center py-6 space-y-2 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-line mb-4">
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
                                : 'bg-neutral-200 dark:bg-neutral-700'
                            }`} 
                         />
                      ))}
                   </div>
                </div>
              </div>
            )}

            {/* Streak Hero */}
            <div id="analytics-streak" className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-200 dark:shadow-none flex justify-between items-center relative overflow-hidden">
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
                    <div className={`p-2 rounded-full ${weakness.type === 'critical' ? 'bg-red-50 text-red-500' : 'bg-orange-50 text-orange-500'}`}>
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

            {/* Consistency Heatmap (Dynamic) */}
            <Card>
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                     <Calendar size={18} className="text-neutral-500" />
                     <h3 className="font-bold text-neutral-primary">{getConsistencyTitle()}</h3>
                  </div>
                  <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded text-neutral-500">Last {timeRange.replace('d', ' Days')}</span>
               </div>
               
               <div className="flex flex-wrap gap-2 justify-center">
                  {heatmapData.map((day) => (
                     <button 
                        key={day.day} 
                        onClick={() => setSelectedDay(day)}
                        className={`
                          ${timeRange === '7d' ? 'w-10 h-10' : timeRange === '15d' ? 'w-8 h-8' : 'w-6 h-6'}
                          rounded-md transition-all hover:scale-110 hover:shadow-md active:scale-95
                          ${getHeatmapColor(day.count)}
                        `}
                        title={`${day.gregorian} (${day.count}/5)`}
                     />
                  ))}
               </div>
            </Card>

            {/* Khushu Trends - Fixed container height */}
            <Card>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <TrendingUp size={18} className="text-brand-forest rtl:flip-x" />
                  <h3 className="font-bold text-neutral-primary">{t('khushuQuality')}</h3>
                </div>
                <span className="text-xs font-bold text-brand-forest bg-brand-mint px-2 py-1 rounded">Avg 3.8</span>
              </div>
              <div className="w-full h-[200px] min-w-[200px]">
                <ResponsiveContainer width="99%" height="100%">
                  <LineChart data={khushuData}>
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                    <Tooltip 
                      content={<CustomKhushuTooltip />} 
                      cursor={{ stroke: 'var(--color-primary-dark)', strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="rgb(var(--color-primary))" 
                      strokeWidth={3} 
                      dot={{r: 4, fill: 'rgb(var(--color-primary))', strokeWidth: 2, stroke: '#fff'}} 
                      activeDot={{r: 6, fill: 'rgb(var(--color-primary))', stroke: '#fff', strokeWidth: 2}}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-center text-neutral-muted mt-4">
                "Success is attained by the believers who are humble in their prayers." (23:1-2)
              </p>
            </Card>

            {/* Barrier Analysis - Fixed container height */}
            <Card className="overflow-hidden">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Shield size={18} className="text-neutral-500" />
                    <h3 className="font-bold text-neutral-primary">{t('topBarriers')}</h3>
                  </div>
               </div>
               <div className="flex items-center w-full pointer-events-none">
                  <div className="w-1/2 h-[140px] min-w-[120px]">
                     <ResponsiveContainer width="99%" height="100%">
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
                  </div>
                  <div className="w-1/2 space-y-2 ps-2">
                     {BARRIER_DATA.map((b) => (
                        <div key={b.name} className="flex items-center justify-between text-xs">
                           <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full me-2" style={{backgroundColor: b.color}}></div>
                              <span className="text-neutral-muted">{b.name}</span>
                           </div>
                           <span className="font-bold text-neutral-primary">{b.value}%</span>
                        </div>
                     ))}
                  </div>
               </div>
            </Card>
         </div>
      )}

    </div>
  );
};
