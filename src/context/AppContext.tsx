import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initDb,
  accountQueries,
  transactionQueries,
  transferQueries,
  type Account,
  type Transaction,
} from '@/services/db';
import { upi } from '@/services/upi';
import type { UpiPaymentEvent } from '@/services/upi';

type AppContextType = {
  accounts: Account[];
  transactions: Transaction[];
  loading: boolean;
  ready: boolean;
  refresh: () => Promise<void>;
  createAccount: (acc: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Promise<string>;
  updateAccount: (id: string, fields: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> & { updateBalance?: boolean }) => Promise<string>;
  updateTransaction: (id: string, fields: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  applyUpcomingPayment: (payment: any, accountId: string) => Promise<void>;
  transfer: (from: string, to: string, amount: number, note?: string) => Promise<void>;
  totalBalance: number;
  dailyIncome: number;
  dailyExpense: number;
  upiReady: boolean;
  notificationGranted: boolean;
  requestNotificationAccess: () => Promise<void>;
  openNotificationSettings: () => Promise<void>;
  pendingPayment: UpiPaymentEvent | null;
  confirmPendingPayment: (accountId: string) => Promise<void>;
  clearPendingPayment: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [upiReady, setUpiReady] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  const refresh = useCallback(async () => {
    const [accs, txs] = await Promise.all([accountQueries.list(), transactionQueries.list()]);
    setAccounts(accs);
    setTransactions(txs);
    setLoading(false);
    setReady(true);
  }, []);

  const [pendingPayment, setPendingPaymentState] = useState<UpiPaymentEvent | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await initDb();
        await refresh();
        const avail = await upi.isAvailable();
        setUpiReady(avail);
        const granted = await upi.isNotificationAccessGranted();
        setNotificationGranted(granted);
      } catch (err) {
        console.error('App init error', err);
        setLoading(false);
        setReady(true);
      }
    })();
    return () => { mounted = false; };
  }, [refresh]);

  useEffect(() => {
    const unsub = upi.onPayment((payment) => {
      if (!mounted) return;
      (async () => {
        const existing = await transactionQueries.existsByReference(payment.reference || null);
        if (existing) return;
        setPendingPaymentState(payment);
      })();
    });
    return () => { mounted = false; };
  }, []);

  const confirmPendingPayment = useCallback(async (accountId: string) => {
    if (!pendingPayment) return;
    await applyUpcomingPayment(pendingPayment, accountId);
    setPendingPaymentState(null);
  }, [pendingPayment, applyUpcomingPayment]);

  const clearPendingPayment = useCallback(() => setPendingPaymentState(null), []);

  const createAccount = useCallback(async (acc) => {
    const id = await accountQueries.create(acc);
    await refresh();
    return id;
  }, [refresh]);

  const updateAccount = useCallback(async (id, fields) => {
    await accountQueries.update(id, fields);
    await refresh();
  }, [refresh]);

  const deleteAccount = useCallback(async (id) => {
    await accountQueries.delete(id);
    await refresh();
  }, [refresh]);

  const addTransaction = useCallback(
    async (tx) => {
      const id = await transactionQueries.create(tx as any);
      if (tx.updateBalance !== false) {
        await accountQueries.updateBalance(tx.account_id, tx.amount, tx.type as any);
      }
      await refresh();
      return id;
    },
    [refresh],
  );

  const updateTransaction = useCallback(async (id, fields) => {
    await transactionQueries.update(id, fields);
    await refresh();
  }, [refresh]);

  const deleteTransaction = useCallback(async (id) => {
    const tx = await transactionQueries.get(id);
    if (tx) {
      // Reverse balance effect before deleting
      await accountQueries.updateBalance(tx.account_id, tx.amount, tx.type === 'income' ? 'expense' : 'income');
    }
    await transactionQueries.delete(id);
    await refresh();
  }, [refresh]);

  const applyUpcomingPayment = useCallback(async (payment: any, accountId: string) => {
    const type = payment.direction === 'incoming' ? 'income' : 'expense';
    await transactionQueries.create({
      account_id: accountId,
      type,
      amount: payment.amount,
      currency: 'INR',
      direction: payment.direction,
      upi_app: payment.upi_app,
      sender: payment.sender,
      receiver: payment.receiver,
      reference: payment.reference,
      note: `UPI ${type} via ${payment.upi_app}`,
      status: 'completed',
      timestamp: payment.timestamp,
      is_manual: 0,
    } as any);
    await accountQueries.updateBalance(accountId, payment.amount, type as any);
    await refresh();
  }, [refresh]);

  const transfer = useCallback(async (from, to, amount, note) => {
    const ts = Date.now();
    await transactionQueries.create({
      account_id: from,
      type: 'expense',
      amount,
      currency: 'INR',
      direction: 'outgoing',
      reference: null,
      note: note || `Transfer to ${accounts.find((a) => a.id === to)?.name || 'account'}`,
      status: 'completed',
      timestamp: ts,
      is_manual: 1,
    } as any);
    await transactionQueries.create({
      account_id: to,
      type: 'income',
      amount,
      currency: 'INR',
      direction: 'incoming',
      reference: null,
      note: note || `Transfer from ${accounts.find((a) => a.id === from)?.name || 'account'}`,
      status: 'completed',
      timestamp: ts,
      is_manual: 1,
    } as any);
    await accountQueries.updateBalance(from, amount, 'expense');
    await accountQueries.updateBalance(to, amount, 'income');
    await transferQueries.create({ from_account_id: from, to_account_id: to, amount, note, timestamp: ts });
    await refresh();
  }, [accounts, refresh]);

  const totalBalance = accounts.reduce((sum, a) => sum + (a.current_balance || 0), 0);
  const today = new Date().setHours(0, 0, 0, 0);
  const dailyIncome = transactions
    .filter((t) => t.type === 'income' && t.timestamp >= today)
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const dailyExpense = transactions
    .filter((t) => t.type === 'expense' && t.timestamp >= today)
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const value = {
    accounts,
    transactions,
    loading,
    ready,
    refresh,
    createAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    applyUpcomingPayment,
    transfer,
    totalBalance,
    dailyIncome,
    dailyExpense,
    upiReady,
    notificationGranted,
    requestNotificationAccess: upi.requestNotificationAccess,
    openNotificationSettings: upi.openNotificationSettings,
    pendingPayment,
    confirmPendingPayment,
    clearPendingPayment,
  };

  return (
    <AppContext.Provider value={value}>{children}</AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
