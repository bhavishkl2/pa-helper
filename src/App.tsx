import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider, useApp } from '@/context/AppContext';
import { BottomTabs } from '@/components/BottomTabs';
import { Dashboard } from '@/pages/Dashboard';
import { Accounts } from '@/pages/Accounts';
import { Transactions } from '@/pages/Transactions';
import { Analytics } from '@/pages/Analytics';
import { Settings } from '@/pages/Settings';
import { ConfirmPaymentModal } from '@/components/ConfirmPaymentModal';

const TabPages = () => {
  const { ready, loading, pendingPayment, accounts, confirmPendingPayment, clearPendingPayment } = useApp();
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-400">Loading…</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen pb-20">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<Accounts />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <BottomTabs />
      {pendingPayment && (
        <ConfirmPaymentModal
          open={true}
          payment={pendingPayment}
          accounts={accounts}
          onClose={clearPendingPayment}
          onAccountSelected={confirmPendingPayment}
        />
      )}
    </div>
  );
};

export default function App() {
  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-400">Initializing database…</p>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <AppProvider>
        <TabPages />
      </AppProvider>
    </BrowserRouter>
  );
}
