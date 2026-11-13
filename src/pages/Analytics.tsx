import { useMemo } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  ArrowDownLeft,
  Wallet,
  Banknote,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, Section } from '@/components/BottomTabs';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const Analytics = () => {
  const { transactions, accounts, dailyIncome, dailyExpense, totalBalance } = useApp();

  const now = Date.now();
  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthStartMs = monthStart.getTime();

  const monthTx = transactions.filter((t) => t.timestamp >= monthStartMs);
  const monthIncome = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
  const monthExpense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);

  const byType = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
    const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
    return [
      { name: 'Income', value: income, color: '#22c55e' },
      { name: 'Expense', value: expense, color: '#ef4444' },
    ];
  }, [transactions]);

  const byAccount = useMemo(() => {
    return accounts
      .map((a) => ({ name: a.name, value: a.current_balance || 0, color: a.color || '#3B82F6' }))
      .sort((a, b) => b.value - a.value);
  }, [accounts]);

  const monthly = useMemo(() => {
    const data: { month: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      d.setMonth(d.getMonth() + 1);
      const end = d.getTime();
      const mTx = transactions.filter((t) => t.timestamp >= start && t.timestamp < end);
      const inc = mTx.filter((t) => t.type === 'income').reduce((s, t) => s + (t.amount || 0), 0);
      const exp = mTx.filter((t) => t.type === 'expense').reduce((s, t) => s + (t.amount || 0), 0);
      data.push({ month: MONTHS[d.getMonth()], income: inc, expense: exp });
    }
    return data;
  }, [transactions]);

  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" subtitle="Spending insights and balance trends" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard label="Month-to-date Income" value={formatINR(monthIncome)} icon={<TrendingUp size={20} strokeWidth={2} className="text-green-400" />} />
        <StatCard label="Month-to-date Expense" value={formatINR(monthExpense)} icon={<ArrowDownLeft size={20} strokeWidth={2} className="text-red-400" />} />
        <StatCard label="Net Savings" value={formatINR(monthIncome - monthExpense)} icon={<Wallet size={20} strokeWidth={2} className="text-brand-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Income vs Expense (All time)">
          <div className="h-48 w-full flex items-end gap-2 px-4 pb-4">
            {byType.map((item) => {
              const max = Math.max(byType[0].value, byType[1].value) || 1;
              const height = Math.max((item.value / max) * 100, 8);
              return (
                <div key={item.name} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg transition-colors duration-700 ${item.color}`}
                    style={{ height: `${height}%` }}
                  ></div>
                  <span className="text-xs text-slate-400 mt-2 font-medium">{item.name}</span>
                  <span className="text-xs text-slate-200">{formatINR(item.value)}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span>Income: {formatINR(byType[0].value)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>Expense: {formatINR(byType[1].value)}</span>
            </div>
          </div>
        </Section>

        <Section title="Balance by Account">
          <div className="space-y-3">
            {byAccount.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No accounts</p>
            ) : (
              byAccount.map((acc) => {
                const max = byAccount[0]?.value || 1;
                const width = Math.max((acc.value / max) * 100, 6);
                return (
                  <div key={acc.name} className="group">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{acc.name}</span>
                      <span className="font-medium text-slate-100">{formatINR(acc.value)}</span>
                    </div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${acc.color}`} style={{ width: `${width}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Section>
      </div>

      <Section title="Monthly Trend (Last 6 Months)">
        <div className="h-48 w-full flex items-end gap-2 px-4 pb-4 relative">
          {monthly.map((m) => {
            const maxInc = Math.max(...monthly.map((x) => x.income), 1);
            const maxExp = Math.max(...monthly.map((x) => x.expense), 1);
            const maxAll = Math.max(maxInc, maxExp);
            const ih = Math.max((m.income / maxAll) * 100, 6);
            const eh = Math.max((m.expense / maxAll) * 100, 6);
            return (
              <div key={m.month} className="flex flex-col items-center gap-1 w-full">
                <div className="w-1/2 h-full bg-green-500/20 rounded-t-lg relative group" style={{ height: `${ih}%` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[4px] h-[6px] bg-green-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="w-1/2 h-full bg-red-500/20 rounded-t-lg relative group" style={{ height: `${eh}%` }}>
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-[4px] h-[6px] bg-red-400 rounded opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <span className="text-[10px] text-slate-500">{m.month}</span>
              </div>
            );
          })}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded"></span>
              <span className="text-slate-400">Income</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 bg-red-400 rounded"></span>
              <span className="text-slate-400">Expense</span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
};

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="glass-card p-4 flex items-center justify-between">
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-100">{value}</p>
    </div>
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400">{icon}</div>
  </div>
);

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}
