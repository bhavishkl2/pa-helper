import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  List,
  BarChart3,
  Settings,
  BellOff,
  Bell,
  Plus,
  ChevronRight,
} from 'lucide-react';

const TABS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/accounts', label: 'Accounts', icon: CreditCard },
  { path: '/transactions', label: 'Transactions', icon: List },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export const BottomTabs = () => {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 border-t border-white/10 bg-slate-950/80 backdrop-blur-md z-50">
      <div className="flex items-center justify-center gap-1 h-full px-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path));
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive: active }) =>
                `flex flex-col items-center justify-center w-12 h-full gap-1 text-xs transition-colors ${
                  active ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
              end={tab.path === '/'}
            >
              <Icon size={18} strokeWidth={2} />
              <span className={isActive ? 'font-medium' : 'font-normal'}>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export const PageHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="flex flex-col gap-1">
    <h1 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</h1>
    {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
  </div>
);

export const Section = ({ children, title }: { children: React.ReactNode; title?: string }) => (
  <section className="glass-card p-5">
    {title && (
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{title}</span>
      </div>
    )}
    <div className="relative">{children}</div>
  </section>
);

export const PrimaryButton = ({ children, ...props }: any) => (
  <button className="btn-primary" {...props}>
    {children}
  </button>
);

export const OutlineButton = ({ children, ...props }: any) => (
  <button className="btn-outline" {...props}>
    {children}
  </button>
);

export const Chevron = () => <ChevronRight size={14} strokeWidth={2} className="text-slate-500" />;

export const BellIndicator = ({ granted }: { granted: boolean }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white/5 border-white/10 text-xs">
    {granted ? <Bell size={14} className="text-green-400" /> : <BellOff size={14} className="text-slate-500" />}
    <span className={granted ? 'text-green-400 font-semibold' : 'text-slate-400'}>
      {granted ? 'Notification access granted' : 'Notification access required'}
    </span>
  </div>
);
