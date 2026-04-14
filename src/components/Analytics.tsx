import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from 'recharts';
import { Card } from './ui/Card';
import { WEEKLY_STATS_DATA } from '../constants';
import { Trophy } from 'lucide-react';

export const Analytics: React.FC = () => {
  return (
    <Card className="mb-24 border border-brand-border"> {/* Extra margin bottom for nav bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-lg text-brand-forest">Weekly Consistency</h3>
          <p className="text-xs text-brand-muted">You're doing great! top 5%.</p>
        </div>
        <div className="w-10 h-10 bg-brand-secondary/15 rounded-full flex items-center justify-center text-brand-secondary shadow-sm">
          <Trophy size={20} />
        </div>
      </div>

      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={WEEKLY_STATS_DATA}>
            <XAxis 
              dataKey="day" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: '#9CA3AF' }} 
              dy={10}
            />
            <Bar dataKey="completion" radius={[4, 4, 4, 4]}>
              {WEEKLY_STATS_DATA.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.completion >= 100 ? '#0F6B4A' : entry.completion < 50 ? '#E35D5D' : '#7EDB9B'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};