import { useNavigate } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  RefreshCw,
  ChevronRight,
  Plus,
  Phone,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, Section, PrimaryButton, OutlineButton, Chevron } from '@/components/BottomTabs';
import type { Account } from '@/services/db';

const CURRENCY = '₹';

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

export const Dashboard = () => {
  const { accounts, transactions, totalBalance, dailyIncome, dailyExpense, refresh, upiReady, notificationGranted, requestNotificationAccess, openNotificationSettings } = useApp();
  const navigate = useNavigate();

  const incoming7d = transactions.filter((t) => t.type === 'income').length;
  const outgoing7d = transactions.filter((t) => t.type === 'expense').length;

  return (
    <div className="space-y-5">
      <PageHeader title="Dashboard" subtitle="Overview of your UPI accounts and balances" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Balance"
          value={fmt(totalBalance)}
          change={totalBalance >= 0 ? `+${fmt(totalBalance)}` : fmt(totalBalance)}
          icon={<Wallet size={22} strokeWidth={2} className="text-brand-400" />}
          gradient="from-brand-600/20 to-brand-900/20"
          border="border-brand-500/20"
        />
        <StatCard
          label="Daily Income"
          value={fmt(dailyIncome)}
          icon={<TrendingUp size={22} strokeWidth={2} className="text-green-400" />}
          gradient="from-green-600/20 to-green-900/20"
          border="border-green-500/20"
        />
        <StatCard
          label="Daily Expense"
          value={fmt(dailyExpense)}
          icon={<ArrowDownLeft size={22} strokeWidth={2} className="text-red-400" />}
          gradient="from-red-600/20 to-red-900/20"
          border="border-red-500/20"
        />
        <StatCard
          label="Transactions"
          value={transactions.length.toLocaleString()}
          sub={`${incoming7d} in / ${outgoing7d} out`}
          icon={<Plus size={22} strokeWidth={2} className="text-slate-400" />}
          gradient="from-slate-700/20 to-slate-900/20"
          border="border-slate-600/20"
        />
      </div>

      <Section title="UPI Detection Status">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-slate-200">Automatic payment detection</p>
            <p className="text-xs text-slate-500">Detects UPI payments from Google Pay, PhonePe, Paytm, BHIM & banking apps</p>
          </div>
          <div className="flex items-center gap-2">
            {notificationGranted ? (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Active
              </span>
            ) : (
              <span className="text-xs text-slate-400">Inactive</span>
            )}
            {!notificationGranted && (
              <PrimaryButton onClick={() => (upiReady ? requestNotificationAccess() : openNotificationSettings())} size="small">
                {notificationGranted ? 'Re-check' : 'Grant Access'}
              </PrimaryButton>
            )}
          </div>
        </div>
        {!notificationGranted && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-sm text-red-200">
              Notification access is required to detect incoming UPI payments. Tap "Grant Access" to open Android settings
              and enable notification access for UPI Balance Tracker.
            </p>
          </div>
        )}
      </Section>

      <Section title="Accounts">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} strokeWidth={2} className="text-slate-400 animate-spin" />
            <span className="text-xs text-slate-400">Tap an account to view transactions</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {accounts.length === 0 ? (
            <div className="col-span-2 flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-white/10 bg-white/5">
              <Plus size={24} strokeWidth={2} className="text-slate-500 mb-2" />
              <p className="text-xs text-slate-400">No accounts yet</p>
              <OutlineButton onClick={() => navigate('/accounts')} size="small" className="mt-2">
                Add Account
              </OutlineButton>
            </div>
          ) : (
            accounts.map((acc) => (
              <AccountRow key={acc.id} account={acc} onPress={() => navigate(`/accounts/${acc.id}`)} />
            ))
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <OutlineButton onClick={() => navigate('/accounts')} size="small">Manage Accounts <Chevron /></OutlineButton>
        </div>
      </Section>

      <Section title="Recent Transactions">
        <div className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-2 text-xs font-semibold text-slate-400 uppercase">Reference</th>
                <th className="pb-2 text-xs font-semibold text-slate-400 uppercase">App</th>
                <th className="pb-2 text-xs font-semibold text-slate-400 uppercase text-right">Amount</th>
                <th className="pb-2 text-xs font-semibold text-slate-400 uppercase">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 8).map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="py-3 text-slate-200">{tx.reference || tx.note || 'UPI Payment'}</td>
                  <td className="py-3 text-xs text-slate-500">{tx.upi_app || '—'}</td>
                  <td className="py-3 text-right font-medium">
                    <span className={tx.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                      {tx.type === 'income' ? '+' : '–'}{fmt(tx.amount)}
                    </span>
                  </td>
                  <td className="py-3 text-xs text-slate-500">{new Date(tx.timestamp).toLocaleDateString()}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-xs text-slate-500">No transactions yet</td></tr>
              )}
              {transactions.length > 8 && (
                <tr><td colSpan={4} className="py-2 text-center text-xs text-slate-500">View all in Transactions</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex justify-end">
          <OutlineButton onClick={() => navigate('/transactions')} size="small">View All <Chevron /></OutlineButton>
        </div>
      </Section>
    </div>
  );
};

const StatCard = ({ label, value, change, icon, gradient, border, sub }: any) => (
  <div className="glass-card p-4 rounded-2xl relative overflow-hidden">
    <div className="absolute top-0 right-0 p-3 opacity-20">{icon}</div>
    <div className="relative z-10 flex flex-col">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-xl font-bold text-slate-100">{value}</span>
        {sub && <span className="text-xs text-slate-500">{sub}</span>}
      </div>
      {change && <p className="text-xs text-slate-500 mt-1">{change}</p>}
    </div>
  </div>
);

const AccountRow = ({ account, onPress }: { account: Account; onPress: () => void }) => (
  <button
    onClick={onPress}
    className="glass-card p-4 flex items-center justify-between group cursor-pointer"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center text-brand-400">
        <Phone size={18} strokeWidth={2} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-100">{account.name}</p>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{account.type}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-bold text-slate-100">{fmt(account.current_balance)}</p>
      <p className="text-xs text-slate-500">Opening: {fmt(account.opening_balance)}</p>
    </div>
    <Chevron />
  </button>
);
