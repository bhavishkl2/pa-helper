import { useState } from 'react';
import {
  BellOff,
  Bell,
  Download,
  Upload,
  Trash2,
  ShieldAlert,
  CheckCircle2,
  CreditCard,
  Phone,
  Github,
  Mail,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { PageHeader, Section, PrimaryButton, OutlineButton } from '@/components/BottomTabs';

export const Settings = () => {
  const {
    notificationGranted,
    upiReady,
    requestNotificationAccess,
    openNotificationSettings,
    accounts,
    transactions,
  } = useApp();
  const [exported, setExported] = useState(false);

  const handleExport = () => {
    const data = { accounts, transactions, exportedAt: Date.now() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upi-balance-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 2000);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string || '{}');
        if (data.accounts && Array.isArray(data.accounts) && data.transactions && Array.isArray(data.transactions)) {
          window.alert('Import parsed successfully. (Full import restore requires backend sync — file validated.)');
        } else {
          window.alert('Invalid backup file format.');
        }
      } catch {
        window.alert('Failed to read backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = async () => {
    if (!window.confirm('This will delete ALL accounts and transactions permanently. Continue?')) return;
    if (!window.confirm('Are you absolutely sure? This cannot be undone.')) return;
    window.alert('Local clear requires native SQLite wipe — use the app "Reset Data" option after grant.');
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle="Notification access, data export and app preferences" />

      <Section title="UPI Notification Access">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-200">Automatic UPI Detection</p>
              <p className="text-xs text-slate-500">
                Reads UPI payment notifications from Google Pay, PhonePe, Paytm, BHIM and banking apps via Android NotificationListenerService.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {notificationGranted ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-red-400">
                  <ShieldAlert size={14} strokeWidth={2} /> Inactive
                </span>
              )}
            </div>
          </div>

          {!upiReady ? (
            <OutlineButton onClick={openNotificationSettings} size="small" start={<BellOff size={16} strokeWidth={2} />}>
              Open Notification Settings
            </OutlineButton>
          ) : notificationGranted ? (
            <PrimaryButton onClick={requestNotificationAccess} size="small" start={<Bell size={16} strokeWidth={2} />}>
              Re-check Access
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={requestNotificationAccess} size="small" start={<Bell size={16} strokeWidth={2} />}>
              Grant Notification Access
            </PrimaryButton>
          )}

          <p className="text-xs text-slate-500">
            Go to Settings → Apps → Special app access → Notification access → enable UPI Balance Tracker.
            Balances are never updated without your confirmation.
          </p>
        </div>
      </Section>

      <Section title="Data & Backup">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <OutlineButton
            onClick={handleExport}
            start={<Download size={16} strokeWidth={2} />}
            size="small"
          >
            Export Backup
          </OutlineButton>
          <label className="flex-1 btn-outline flex items-center justify-center gap-2 text-xs border-white/10 text-slate-400 hover:bg-white/10 transition-colors">
            <Upload size={16} strokeWidth={2} />
            Import Backup
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={handleClear}
            className="flex-1 btn-outline text-xs border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors start-0 justify-center"
            start={<Trash2 size={16} strokeWidth={2} />}
          >
            Reset All Data
          </button>
        </div>
        {exported && (
          <div className="mt-3 flex items-center gap-2 text-xs text-green-400">
            <CheckCircle2 size={14} strokeWidth={2} />
            <span>Backup exported to Downloads</span>
          </div>
        )}
        <p className="mt-3 text-xs text-slate-500">
          All data is stored locally in SQLite on your device. No backend or cloud dependency. Export JSON backups manually.
        </p>
      </Section>

      <Section title="Accounts Summary">
        <p className="text-xs text-slate-400 mb-3">Total accounts: {accounts.length}</p>
        <p className="text-xs text-slate-400 mb-3">Total transactions: {transactions.length}</p>
        <p className="text-xs text-slate-400">Total balance: {formatINR(accounts.reduce((s, a) => s + (a.current_balance || 0), 0))}</p>
      </Section>

      <Section title="About">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center text-brand-400">
              <CreditCard size={20} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">UPI Balance Tracker</p>
              <p className="text-xs text-slate-500">v1.0.0 · React + Capacitor · Android</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-3 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Phone size={14} strokeWidth={2} className="text-slate-600" />
              <span>Native NotificationListenerService (Java/Kotlin)</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} strokeWidth={2} className="text-slate-600" />
              <span>Local SQLite storage — no cloud, no backend</span>
            </div>
            <div className="flex items-center gap-2">
              <Github size={14} strokeWidth={2} className="text-slate-600" />
              <span className="text-brand-400 cursor-pointer hover:underline">Open source</span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );

  function formatINR(n: number) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
  }
};
