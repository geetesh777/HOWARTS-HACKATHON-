import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import { Balance, User } from '../types';

interface BalanceChartProps {
  balances: Balance[];
  users: User[];
}

const BalanceChart: React.FC<BalanceChartProps> = ({ balances, users }) => {
  const data = balances.map(b => {
    const user = users.find(u => u.id === b.userId);
    return {
      name: user ? user.name : 'Unknown',
      amount: b.amount,
      color: b.amount >= 0 ? '#10b981' : '#ef4444'
    };
  });

  if (data.length === 0) return <div className="text-gray-500 text-center py-4">No data available</div>;

  return (
    <div className="h-64 w-full bg-white rounded-lg shadow-sm p-4">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">Net Balances</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5,
            right: 30,
            left: 40,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={60} />
          <Tooltip 
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Balance']}
            cursor={{fill: 'transparent'}}
          />
          <ReferenceLine x={0} stroke="#666" />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BalanceChart;