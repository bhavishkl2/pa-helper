import { useState, useEffect } from 'react';
import { X, Bell, Clock, Phone, CreditCard } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { UpiPaymentEvent } from '@/services/upi';

type Props = {
  open: boolean;
  onClose: () => void;
  payment: UpiPaymentEvent | null;
  accounts: any[];
  onAccountSelected: (accountId: string, direction: 'incoming' | 'outgoing') => void;
};

export const ConfirmPaymentModal = ({
  open,
  onClose,
  payment,
  accounts,
  onAccountSelected,
}: Props) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (payment && accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [payment, accounts, selectedAccountId]);

  if (!open || !payment) return null;

  const directionLabel = payment.direction === 'incoming' ? 'Received' : 'Sent';
  const isIncome = payment.direction === 'incoming';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="glass-card w-full max-w-md p-6 relative z-10 scale-100 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-100">UPI Payment Detected</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-slate-800">
            <Phone size={20} strokeWidth={2} className="text-slate-300" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment via {payment.upi_app}</p>
            <p className="text-sm font-medium text-slate-200">{directionLabel} payment</p>
            <p className="text-xs text-slate-500 mt-0.5">{payment.reference || 'No reference'}</p>
          </div>
        </div>

        <div className="text-right mb-6">
          <span className={`text-3xl font-bold ${isIncome ? 'text-green-400' : 'text-red-400'}`}>
            {isIncome ? '+' : '–'}{formatINR(payment.amount)}
          </span>
        </div>

        <div className="space-y-3 mb-6">
          <label className="label">Update Account</label>
          <div className="space-y-2">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-colors ${
                  selectedAccountId === acc.id
                    ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <span className="text-sm font-medium">{acc.name}</span>
                <span className="text-xs text-slate-500">{formatINR(acc.current_balance)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-3 mb-6 border border-white/10">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Sender / Receiver</span>
            <span className="text-slate-200">{payment.sender || payment.receiver || '—'}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Timestamp</span>
            <span>{new Date(payment.timestamp).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Reference</span>
            <span className="text-slate-200 truncate max-w-xs">{payment.reference || '—'}</span>
          </div>
        </div>

        <p className="text-xs text-slate-500 mb-6">
          Balances are never updated without your confirmation.
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={confirming}
            className="flex-1 btn-outline"
          >
            Dismiss
          </button>
          <button
            onClick={() => {
              if (!selectedAccountId) return;
              setConfirming(true);
              onAccountSelected(selectedAccountId, payment.direction);
              onClose();
            }}
            disabled={!selectedAccountId || confirming}
            className="flex-1 btn-primary"
          >
            {confirming ? 'Updating…' : `Confirm ${directionLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
};

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}
