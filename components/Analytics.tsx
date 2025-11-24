
import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Cell } from 'recharts';
import { Card } from './ui/Card';
import { WEEKLY_STATS_DATA } from '../constants';
import { Trophy } from 'lucide-react';

export const Analytics: React.FC = () => {
  return (
    <Card className="mb-24"> {/* Extra margin bottom for nav bar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-lg text-neutral-primary">Weekly Consistency</h3>
          <p className="text-xs text-neutral-muted">You're doing great! top 5%.</p>
        </div>
        <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600 shadow-sm">
          <Trophy size={20} />
        </div>
      </div>

      {/* 
         Use width 99% instead of 100% to prevent a specific Recharts resize loop bug 
         where container width might be initially 0 or -1 in flex layouts.
         Also enforce min-height.
      */}
      <div className="w-full h-32 min-h-[128px]">
        <ResponsiveContainer width="99%" height="100%">
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
