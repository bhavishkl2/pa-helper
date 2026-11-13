import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Banknote,
  Wallet,
  Percent,
  ArrowUpRight,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, Section, PrimaryButton, OutlineButton, Chevron } from '@/components/BottomTabs';
import type { Account } from '@/services/db';

const TYPES = [
  { value: 'savings', label: 'Savings', icon: Banknote },
  { value: 'current', label: 'Current', icon: Wallet },
  { value: 'credit', label: 'Credit Card', icon: Percent },
  { value: 'investment', label: 'Investment', icon: ArrowUpRight },
];

export const Accounts = () => {
  const { accounts, transactions, createAccount, updateAccount, deleteAccount, refresh } = useApp();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form, setForm] = useState({ name: '', type: 'savings', opening_balance: '', color: '#3B82F6', icon: 'wallet' });

  const account = id ? accounts.find((a) => a.id === id) : null;

  useEffect(() => {
    if (account) {
      setForm({
        name: account.name,
        type: account.type,
        opening_balance: String(account.opening_balance),
        color: account.color,
        icon: account.icon,
      });
    } else {
      setForm({ name: '', type: 'savings', opening_balance: '', color: '#3B82F6', icon: 'wallet' });
    }
    setEditing(account || null);
  }, [account, id]);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const opening = Number(form.opening_balance || 0);
    if (editing) {
      await updateAccount(editing.id, {
        name: form.name,
        type: form.type,
        opening_balance: opening,
        color: form.color,
        icon: form.icon,
      });
    } else {
      await createAccount({ name: form.name, type: form.type, opening_balance: opening, color: form.color, icon: form.icon });
    }
    setFormOpen(false);
    setForm({ name: '', type: 'savings', opening_balance: '', color: '#3B82F6', icon: 'wallet' });
    setEditing(null);
  };

  const handleDelete = async () => {
    if (!editing) return;
    if (!window.confirm(`Delete account "${editing.name}"?`)) return;
    const hasTx = transactions.some((t) => t.account_id === editing.id);
    if (hasTx) {
      window.alert('Cannot delete account with existing transactions.');
      return;
    }
    await deleteAccount(editing.id);
    setEditing(null);
    navigate('/accounts');
  };

  return (
    <div className="space-y-5">
      {!editing ? (
        <PageHeader title="Accounts" subtitle="Manage your bank/UPI accounts and balances" />
      ) : (
        <PageHeader title="Account Details" subtitle="View and edit a single account" />
      )}

      {!editing && (
        <Section title="Your Accounts">
          <div className="flex items-center justify-between mb-4">
            <PrimaryButton onClick={() => setFormOpen(true)}>
              <Plus size={16} strokeWidth={2} /> Add Account
            </PrimaryButton>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.length === 0 ? (
              <div className="col-span-3 flex flex-col items-center justify-center py-10 rounded-2xl border-2 border-dashed border-white/10 bg-white/5">
                <Plus size={32} strokeWidth={2} className="text-slate-500 mb-3" />
                <p className="text-xs text-slate-400">No accounts created yet</p>
              </div>
            ) : (
              accounts.map((acc) => {
                const txCount = transactions.filter((t) => t.account_id === acc.id).length;
                return (
                  <div key={acc.id} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-slate-100">{acc.name}</p>
                      <span className="px-2 py-0.5 rounded border border-white/10 text-xs text-slate-400 capitalize">{acc.type}</span>
                    </div>
                    <p className="text-lg font-bold text-slate-100 mb-1">{formatINR(acc.current_balance)}</p>
                    <p className="text-xs text-slate-500">Opening {formatINR(acc.opening_balance)} · {txCount} transactions</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/accounts/${acc.id}`); }}
                        className="btn-outline text-xs"
                      >
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setForm({
                            name: acc.name,
                            type: acc.type,
                            opening_balance: String(acc.opening_balance),
                            color: acc.color,
                            icon: acc.icon,
                          });
                          setEditing(acc);
                          setFormOpen(true);
                        }}
                        className="btn-outline text-xs"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Section>
      )}

      {editing && (
        <Section title="Account Details">
          <div className="flex items-center justify-between mb-4">
            <OutlineButton onClick={() => { setEditing(null); navigate('/accounts'); }} size="small">
              <ArrowLeft size={16} strokeWidth={2} className="mr-1" /> Back
            </OutlineButton>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Current Balance</p>
              <p className="text-2xl font-bold text-slate-100">{formatINR(editing.current_balance)}</p>
              <p className="text-xs text-slate-500 mt-1">Opening: {formatINR(editing.opening_balance)}</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Type</p>
              <p className="text-sm font-medium text-slate-200 capitalize">{editing.type}</p>
            </div>
            <div className="glass-card p-5 flex flex-col justify-between">
              <p className="text-xs font-semibold text-slate-400 uppercase">Transactions</p>
              <p className="text-sm font-medium text-slate-200">{transactions.filter((t) => t.account_id === editing.id).length}</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PrimaryButton onClick={() => { setForm({ name: editing.name, type: editing.type, opening_balance: String(editing.opening_balance), color: editing.color, icon: editing.icon }); setFormOpen(true); }}>
              <svg className="mr-1" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg> Edit Details
            </PrimaryButton>
            <button
              onClick={handleDelete}
              className="btn-outline text-xs border-red-500/20 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 size={16} strokeWidth={2} className="mr-1" /> Delete
            </button>
          </div>
        </Section>
      )}

      <AccountFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        editing={editing}
        onSubmit={handleAccountSubmit}
      />
    </div>
  );
};

function formatINR(n: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
}

const AccountFormModal = ({ open, onClose, editing, onSubmit }: { open: boolean; onClose: () => void; editing: Account | null; onSubmit: (e: React.FormEvent) => void }) => {
  const [form, setForm] = useState({ name: '', type: 'savings', opening_balance: '', color: '#3B82F6', icon: 'wallet' });

  useEffect(() => {
    if (editing) {
      setForm({ name: editing.name, type: editing.type, opening_balance: String(editing.opening_balance), color: editing.color, icon: editing.icon });
    } else {
      setForm({ name: '', type: 'savings', opening_balance: '', color: '#3B82F6', icon: 'wallet' });
    }
  }, [editing]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="glass-card w-full max-w-md p-6 relative z-10 scale-100 border border-white/20 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-100">{editing ? 'Edit Account' : 'New Account'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} strokeWidth={2} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Account Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. HDFC Savings"
              required
            />
          </div>
          <div>
            <label className="label">Account Type</label>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="savings">Savings</option>
              <option value="current">Current</option>
              <option value="credit">Credit Card</option>
              <option value="investment">Investment</option>
            </select>
          </div>
          <div>
            <label className="label">Opening Balance (₹)</label>
            <input
              className="input"
              type="number"
              value={form.opening_balance}
              onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
              placeholder="0"
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 btn-outline">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary">
              {editing ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
