import { useState } from 'react';
import { X, ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet, Banknote, SendHorizontal } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { Account } from '@/services/db';

const MODES: [string, string, any][] = [
  ['income', 'Income', ArrowUpRight],
  ['expense', 'Expense', ArrowDownLeft],
  ['transfer', 'Transfer', SendHorizontal],
];

type Props = {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  onAdded: () => void;
};

export const AddTransactionModal = ({ open, onClose, accounts, onAdded }: Props) => {
  const [mode, setMode] = useState<'income' | 'expense' | 'transfer'>('income');
  const [accountId, setAccountId] = useState<string>('');
  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { addTransaction, transfer } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'transfer') {
      if (!fromAccountId || !toAccountId || !amount) return;
      if (fromAccountId === toAccountId) {
        window.alert('From and To accounts must be different.');
        return;
      }
      await transfer(fromAccountId, toAccountId, Number(amount), note || undefined);
    } else {
      if (!accountId || !amount) return;
      await addTransaction({
        account_id: accountId,
        type: mode,
        amount: Number(amount),
        currency: 'INR',
        direction: mode === 'income' ? 'incoming' : 'outgoing',
        note: note || null,
        status: 'completed',
        timestamp: Date.now(),
        is_manual: 1,
      } as any);
    }
    setSubmitting(false);
    setAmount('');
    setNote('');
    onAdded();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="glass-card w-full max-w-md p-6 relative z-10 scale-100 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-100">Add Transaction</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          {MODES.map(([value, label, Icon]) => (
            <button
              key={value}
              onClick={() => setMode(value as any)}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl border py-2 text-xs font-medium transition-colors ${
                mode === value ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              <Icon size={14} strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'transfer' ? (
            <>
              <div>
                <label className="label">From Account</label>
                <select
                  className="input"
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">To Account</label>
                <select
                  className="input"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                >
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="label">Account</label>
              <select
                className="input"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
              >
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">Amount (₹)</label>
            <input
              className="input"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="label">Note</label>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="flex-1 btn-primary">
              {submitting ? 'Adding…' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
