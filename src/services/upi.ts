import { Capacitor } from '@capacitor/core';

const { UpiBalanceTracker } = (Capacitor as any).Plugins;

export type UpiPaymentEvent = {
  id: string;
  upi_app: string;
  sender?: string | null;
  receiver?: string | null;
  amount: number;
  direction: 'incoming' | 'outgoing';
  reference?: string | null;
  timestamp: number;
  raw_title?: string | null;
  raw_body?: string | null;
  package_name?: string | null;
};

type PaymentListener = (event: UpiPaymentEvent) => void;

const listeners = new Set<PaymentListener>();

let registered = false;

export const upi = {
  isAvailable: async (): Promise<boolean> => {
    try {
      const res = await UpiBalanceTracker.isAvailable();
      return Boolean(res.available);
    } catch {
      return false;
    }
  },

  isNotificationAccessGranted: async (): Promise<boolean> => {
    try {
      const res = await UpiBalanceTracker.isNotificationAccessGranted();
      return Boolean(res.granted);
    } catch {
      return false;
    }
  },

  requestNotificationAccess: async (): Promise<void> => {
    await UpiBalanceTracker.requestNotificationAccess();
  },

  openNotificationSettings: async (): Promise<void> => {
    await UpiBalanceTracker.openNotificationSettings();
  },

  startListening: async (): Promise<void> => {
    await UpiBalanceTracker.startListening();
  },

  stopListening: async (): Promise<void> => {
    await UpiBalanceTracker.stopListening();
  },

  onPayment: (cb: PaymentListener): (() => void) => {
    listeners.add(cb);
    if (!registered) {
      registered = true;
      UpiBalanceTracker.addListener('upiPayment', (data: any) => {
        const event: UpiPaymentEvent = {
          id: data.id || crypto.randomUUID(),
          upi_app: data.upi_app || 'Unknown',
          sender: data.sender ?? null,
          receiver: data.receiver ?? null,
          amount: Number(data.amount || 0),
          direction: (data.direction || 'incoming') as 'incoming' | 'outgoing',
          reference: data.reference ?? null,
          timestamp: Number(data.timestamp || Date.now()),
          raw_title: data.raw_title ?? null,
          raw_body: data.raw_body ?? null,
          package_name: data.package_name ?? null,
        };
        for (const cb of listeners) cb(event);
      });
    }
    return () => {
      listeners.delete(cb);
    };
  },
};
