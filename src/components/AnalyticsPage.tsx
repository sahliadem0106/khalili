
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, CartesianGrid } from 'recharts';
import { Card } from './ui/Card';
import { Flame, TrendingUp, AlertCircle, Shield, Calendar, Target, X, Trophy, Activity, Info } from 'lucide-react';
import { Prayer, PrayerStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { metricsService, UserMetrics } from '../services/MetricsService';
import { prayerLogService, PrayerLogEntry } from '../services/PrayerLogService';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalyticsPageProps {
  prayers: Prayer[];
}

// Royal Nature Chart Theme
const CHART_THEME = {
  primary: '#047857', // Emerald 700
  secondary: '#D97706', // Amber 600
  accent: '#F59E0B', // Amber 500
  neutral: '#E2E8F0',
  grid: '#F1F5F9',
  tooltipBg: '#FFFFFF',
  tooltipBorder: '#E2E8F0',
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ prayers }) => {
  const { t, language, dir } = useLanguage();
  const [selectedDay, setSelectedDay] = useState<{ day: number, count: number } | null>(null);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [prayerLogs, setPrayerLogs] = useState<PrayerLogEntry[]>([]);
  const [heatmapDays, setHeatmapDays] = useState<7 | 14 | 30>(7);
  const [journeyStartDate, setJourneyStartDate] = useState<string>(() => {
    // Get or set journey start date
    const stored = localStorage.getItem('khalil_journey_start');
    if (stored) return stored;
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('khalil_journey_start', today);
    return today;
  });

  // Load metrics and prayer logs
  useEffect(() => {
    setMetrics(metricsService.getMetrics());
    setPrayerLogs(prayerLogService.getLogs());

    const unsubMetrics = metricsService.subscribe((m) => setMetrics(m));
    const unsubLogs = prayerLogService.subscribe(() => {
      setPrayerLogs(prayerLogService.getLogs());
    });

    return () => {
      unsubMetrics();
      unsubLogs();
    };
  }, []);

  // Calculate real stats from prayer logs (historical)
  const stats = useMemo(() => {
    const completed = prayerLogs.filter(p =>
      p.status === PrayerStatus.Jamaah ||
      p.status === PrayerStatus.Home ||
      p.status === PrayerStatus.Late ||
      p.status === PrayerStatus.QadaDone
    ).length;

    const missed = prayerLogs.filter(p => p.status === PrayerStatus.Missed).length;

    // Khushu Average
    const logsWithKhushu = prayerLogs.filter(p => p.khushuLevel && p.khushuLevel > 0);
    const avgKhushu = logsWithKhushu.length > 0
      ? Math.round((logsWithKhushu.reduce((sum, p) => sum + (p.khushuLevel || 0), 0) / logsWithKhushu.length) * 10) / 10
      : 0;

    return { completed, missed, avgKhushu };
  }, [prayerLogs]);

  // Generate trend data
  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) =>
      new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : language, { weekday: 'short' }).format(new Date(2000, 0, i + 3))
    );
    const last7Days = prayerLogService.getLogsForDays(7);
    const byDay: Record<number, number[]> = {};

    last7Days.forEach(log => {
      if (log.khushuLevel && log.khushuLevel > 0) {
        const dayOfWeek = new Date(log.completedAt).getDay();
        if (!byDay[dayOfWeek]) byDay[dayOfWeek] = [];
        byDay[dayOfWeek].push(log.khushuLevel);
      }
    });

    return days.map((day, i) => {
      const dayIndex = (i + 1) % 7;
      const scores = byDay[dayIndex] || [];
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return { day, score: Math.round(avg * 10) / 10 };
    });
  }, [prayerLogs]);

  // Generate heatmap data starting from journey start date
  const heatmapData = useMemo(() => {
    const startDate = new Date(journeyStartDate);
    const today = new Date();
    const data: { day: number; date: string; dateLabel: string; weekdayLabel: string; count: number; isToday: boolean }[] = [];

    for (let i = 0; i < heatmapDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const summary = prayerLogService.getDailySummary(dateStr);
      const isToday = dateStr === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      data.push({
        day: i + 1,
        date: dateStr,
        dateLabel: date.toLocaleDateString(language === 'ar' ? 'ar-EG' : language, { weekday: 'short', day: 'numeric' }),
        weekdayLabel: date.toLocaleDateString(language === 'ar' ? 'ar-EG' : language, { weekday: 'short' }),
        count: summary.completed,
        isToday
      });
    }
    return data;
  }, [prayerLogs, heatmapDays, journeyStartDate]);

  // Barrier Analysis
  const barrierData = useMemo(() => {
    const barriers: Record<string, number> = {};
    prayerLogs.forEach(p => {
      if (p.barrier) barriers[p.barrier] = (barriers[p.barrier] || 0) + 1;
    });

    const total = Object.values(barriers).reduce((a, b) => a + b, 0) || 1;
    const colors = ['#047857', '#059669', '#10B981', '#6EE7B7']; // Emerald shades

    return Object.entries(barriers).slice(0, 4).map(([name, value], i) => ({
      name,
      value: Math.round((value / total) * 100),
      color: colors[i] || colors[3]
    }));
  }, [prayerLogs]);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-red-500/10 text-red-600 border border-red-200';
    if (count <= 2) return 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30';
    if (count <= 4) return 'bg-brand-primary/50 text-white border border-brand-primary/60';
    return 'bg-brand-primary text-white border border-brand-primary shadow-glow';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-24 relative px-3 sm:px-4 md:px-6 pt-4 mx-auto w-full"
    >
      {/* Selected Day Popup */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-brand-forest/40 backdrop-blur-sm p-4"
            onClick={() => setSelectedDay(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-brand-surface p-6 rounded-2xl shadow-xl w-full max-w-xs border border-brand-primary/10 dark:border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-brand-forest dark:text-white">{t('analytics_day')} {selectedDay.day}</h4>
                <button onClick={() => setSelectedDay(null)} className="p-1 rounded-full hover:bg-brand-sand dark:hover:bg-white/10 text-brand-muted"><X size={18} /></button>
              </div>
              <div className="text-center py-4 bg-brand-sand dark:bg-black/20 rounded-xl border border-brand-primary/5 dark:border-white/5 mb-4">
                <div className="text-4xl font-bold text-brand-primary dark:text-emerald-300">{selectedDay.count}<span className="text-lg text-neutral-400 font-normal">/5</span></div>
                <div className="text-xs uppercase tracking-widest text-brand-muted font-medium mt-1">{t('analytics_prayers_completed')}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between mb-8 mt-4">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black text-brand-forest dark:text-white font-outfit tracking-tight drop-shadow-sm mb-2">{t('insights')}</h2>
          <p className="text-base text-brand-muted dark:text-neutral-300 font-medium">{t('analytics_spiritual_journey')}</p>
        </div>
      </div>

      {/* Hero Stats Staggered Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {/* Streak Card */}
        <motion.div variants={itemVariants} className="col-span-2 relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-soft-xl border-none bg-gradient-to-br from-amber-500 via-brand-primary to-emerald-700 text-white">
          <div className="absolute -top-10 -right-10 p-4 opacity-10"><Flame size={180} /></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4 text-white/90">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Flame size={24} className="fill-white" />
              </div>
              <span className="font-bold text-lg">{t('currentStreak')}</span>
            </div>
            <div className="flex items-end gap-3 mt-4">
              <h3 className="text-7xl font-black tracking-tighter drop-shadow-md">{metrics?.prayerStreak ?? 0}</h3>
              <span className="mb-3 text-xl font-bold opacity-90">{t('analytics_days')}</span>
            </div>
            <p className="text-sm sm:text-base mt-2 text-white/90 font-medium max-w-[85%] leading-relaxed">{t('streakDesc')}</p>
          </div>
        </motion.div>

        {/* Khushu Score */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-brand-surface rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-soft-xl flex flex-col justify-between min-h-[10rem] relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-gradient-to-br from-brand-primary/5 to-brand-primary/10 dark:from-white/5 dark:to-transparent w-32 h-32 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
          <div className="flex items-center gap-2 text-brand-primary dark:text-emerald-300">
            <Activity size={24} />
            <span className="text-sm font-bold uppercase tracking-wider">{t('analytics_focus_score')}</span>
          </div>
          <div className="mt-4">
            <div className="text-5xl font-black text-brand-forest dark:text-white flex items-baseline gap-1 drop-shadow-sm">
              {stats.avgKhushu}
              <span className="text-xl font-bold text-neutral-400">/10</span>
            </div>
            <div className="text-xs font-bold text-brand-muted dark:text-neutral-400 mt-2">{t('analytics_avg_khushu')}</div>
          </div>
        </motion.div>

        {/* Total Prayers */}
        <motion.div variants={itemVariants} className="bg-white dark:bg-brand-surface rounded-3xl p-6 border border-black/5 dark:border-white/10 shadow-soft-xl flex flex-col justify-between min-h-[10rem] relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 bg-gradient-to-br from-brand-secondary/5 to-brand-secondary/10 dark:from-white/5 dark:to-transparent w-32 h-32 rounded-full group-hover:scale-125 transition-transform duration-700"></div>
          <div className="flex items-center gap-2 text-brand-secondary dark:text-amber-400">
            <Trophy size={24} />
            <span className="text-sm font-bold uppercase tracking-wider">{t('analytics_total_done')}</span>
          </div>
          <div className="mt-4">
            <div className="text-5xl font-black text-brand-forest dark:text-white drop-shadow-sm">
              {stats.completed}
            </div>
            <div className="text-xs font-bold text-brand-muted dark:text-neutral-400 mt-2">{t('analytics_prayers_recorded')}</div>
          </div>
        </motion.div>
      </div>

      {/* Consistency Heatmap */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-brand-surface rounded-2xl border border-brand-border dark:border-white/10 shadow-glass p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-sand dark:bg-white/5 rounded-full text-brand-primary dark:text-emerald-300">
              <Calendar size={18} />
            </div>
            <h3 className="font-bold text-brand-forest dark:text-white text-lg">{t('consistencyHeatmap')}</h3>
          </div>
          {/* Removed Last 30 Days pill as requested, keeping period selector */}
          <div className="flex gap-1 bg-brand-sand p-1 rounded-lg">
            {([7, 14, 30] as const).map((days) => (
              <button
                key={days}
                onClick={() => setHeatmapDays(days)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${heatmapDays === days
                  ? 'bg-white text-brand-primary shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-600'
                  }`}
              >
                {days}d
              </button>
            ))}
          </div>
        </div>

        <div className="w-full">
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 w-full">
          {heatmapData.map((day, i) => {
            const showWeekdayLabel = heatmapDays === 7 || i < 7;
            return (
              <div key={day.date} className="flex flex-col items-center gap-1 min-w-0">
                {/* Dynamic Day Label above each bubble */}
                <span className="text-[9px] font-bold text-neutral-300 h-3 leading-none whitespace-nowrap text-center w-full">
                  {showWeekdayLabel ? day.weekdayLabel.slice(0, 3) : ''}
                </span>

                <motion.button
                  layout
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setSelectedDay({ day: day.day, count: day.count })}
                  className={`w-full aspect-square rounded-full flex flex-col items-center justify-center transition-all relative ${getHeatmapColor(day.count)} ${day.isToday ? 'ring-2 ring-offset-1 sm:ring-offset-2 ring-brand-secondary' : ''}`}
                >
                  <span className={`text-[10px] font-bold ${day.count > 2 ? 'text-white/90 shadow-sm' : 'text-brand-primary dark:text-emerald-200'}`}>
                    {new Date(day.date).getDate()}
                  </span>
                </motion.button>
              </div>
            );
          })}
          </div>
        </div>
      </motion.div>

      {/* Focus Trends Chart */}
      <motion.div variants={itemVariants} className="bg-white dark:bg-brand-surface rounded-2xl border border-brand-border dark:border-white/10 shadow-glass overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-sand dark:bg-white/5 rounded-full text-brand-secondary">
              <Target size={18} />
            </div>
            <h3 className="font-bold text-brand-forest dark:text-white text-lg">{t('analytics_focus_trends')}</h3>
          </div>
        </div>
        <div className="h-56 w-full px-2 pb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_THEME.primary} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={CHART_THEME.primary} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_THEME.grid} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94A3B8' }}
                dy={8}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgba(4,120,87,0.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  background: 'white',
                  padding: '8px 12px'
                }}
                cursor={{ stroke: CHART_THEME.primary, strokeWidth: 1, strokeDasharray: '4 4' }}
                formatter={(value: number) => [`${value}/10`, 'Khushu']}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke={CHART_THEME.primary}
                strokeWidth={3}
                fillOpacity={0.3}
                fill="url(#colorScore)"
                dot={{ r: 3, fill: CHART_THEME.primary, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: CHART_THEME.primary, stroke: 'white', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Barrier Breakdown */}
      {barrierData.length > 0 && (
        <motion.div variants={itemVariants} className="bg-white dark:bg-brand-surface rounded-2xl border border-brand-primary/10 dark:border-white/10 shadow-glass p-5">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-brand-sand dark:bg-white/5 rounded-full text-brand-forest dark:text-white">
              <Shield size={18} />
            </div>
            <h3 className="font-bold text-brand-forest dark:text-white text-lg">{t('topBarriers')}</h3>
          </div>

          <div className="flex items-center">
            <div className="w-1/2 h-32 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={barrierData}
                    innerRadius={40}
                    outerRadius={55}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {barrierData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Info size={16} className="text-neutral-300" />
              </div>
            </div>
            <div className="w-1/2 space-y-3 ps-2">
              {barrierData.map((b) => (
                <div key={b.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }}></div>
                    <span className="text-brand-muted dark:text-neutral-300 font-medium">{b.name}</span>
                  </div>
                  <span className="font-bold text-brand-forest dark:text-white">{b.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

    </motion.div>
  );
};

