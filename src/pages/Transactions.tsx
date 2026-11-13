import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Plus,
  Clock,
  Trash2,
  Edit2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, Section, PrimaryButton, OutlineButton, Chevron } from '@/components/BottomTabs';
import { AddTransactionModal } from '@/components/AddTransactionModal';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

export const Transactions = () => {
  const { transactions, accounts, addTransaction, deleteTransaction, updateTransaction, refresh } = useApp();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{ amount: string; note: string } | null>(null);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchQuery =
          !query ||
          (t.reference || '').toLowerCase().includes(query.toLowerCase()) ||
          (t.note || '').toLowerCase().includes(query.toLowerCase()) ||
          (t.upi_app || '').toLowerCase().includes(query.toLowerCase()) ||
          (t.sender || '').toLowerCase().includes(query.toLowerCase()) ||
          (t.receiver || '').toLowerCase().includes(query.toLowerCase());
        const matchFilter = filter === 'all' || t.type === filter;
        return matchQuery && matchFilter;
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions, query, filter]);

  useEffect(() => {
    if (editingId) {
      const tx = transactions.find((t) => t.id === editingId);
      if (tx) setEditDraft({ amount: String(tx.amount), note: tx.note || '' });
    } else {
      setEditDraft(null);
    }
  }, [editingId, transactions]);

  const handleSaveEdit = async () => {
    if (!editingId || !editDraft) return;
    await updateTransaction(editingId, {
      amount: Number(editDraft.amount) || 0,
      note: editDraft.note || null,
    } as any);
    setEditingId(null);
    setEditDraft(null);
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this transaction?')) return;
    await deleteTransaction(id);
  };

  const accMap = useMemo(() => Object.fromEntries(accounts.map((a) => [a.id, a.name])), [accounts]);

  return (
    <div className="space-y-5">
      <PageHeader title="Transactions" subtitle="History, search, filters and manual corrections" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="relative w-full md:w-72">
          <Search size={16} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="input pl-10"
            placeholder="Search reference, note, UPI app, sender/receiver…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <OutlineButton
            onClick={() => setOpen(true)}
            start={<Plus size={16} strokeWidth={2} />}
          >
            Add Transaction
          </OutlineButton>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
              filter === 'all' ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            All
          </button>
          {FILTERS.slice(1).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium transition-colors ${
                filter === f.value ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Section>
        <div className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase">Reference / Note</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase w-20">App</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase text-right w-24">Amount</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase w-20">Account</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 uppercase w-16">Date</th>
                <th className="pb-3 text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-xs text-slate-500">
                    No matching transactions
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="py-3 text-slate-200">
                      <div className="font-medium">{tx.reference || tx.note || 'UPI Payment'}</div>
                      {tx.upi_app && <div className="text-xs text-slate-500 mt-0.5">{tx.upi_app} · {tx.direction}</div>}
                      {tx.is_manual && <span className="text-xs text-brand-400 mt-0.5 block">Manual</span>}
                    </td>
                    <td className="py-3 text-xs text-slate-500">{tx.upi_app || 'Manual'}</td>
                    <td className="py-3 text-right font-medium">
                      <span className={tx.type === 'income' ? 'text-green-400' : tx.type === 'expense' ? 'text-red-400' : 'text-brand-400'}>
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '–' : '⇄'}{formatINR(tx.amount)}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500">{accMap[tx.account_id] || '—'}</td>
                    <td className="py-3 text-xs text-slate-500">{new Date(tx.timestamp).toLocaleDateString()}</td>
                    <td className="py-3 text-right">
                      {editingId === tx.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="input text-xs w-20"
                            value={editDraft?.amount || ''}
                            onChange={(e) => setEditDraft({ ...editDraft!, amount: e.target.value })}
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="text-xs text-brand-400 font-semibold hover:underline"
                            disabled={!editDraft}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-slate-500 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingId(tx.id)}
                            className="text-slate-400 hover:text-brand-400 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors ml-1"
                            title="Delete"
                          >
                            <Trash2 size={16} strokeWidth={2} />
                          </button>
                          <a href={`/accounts/${tx.account_id}`} className="ml-2 text-xs text-brand-400 hover:underline">
                            Account <Chevron size={12} strokeWidth={2} />
                          </a>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <AddTransactionModal
        open={open}
        onClose={() => setOpen(false)}
        accounts={accounts}
        onAdded={async () => {
          setOpen(false);
          await refresh();
        }}
      />
    </div>
  );

  function formatINR(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
  }
};
