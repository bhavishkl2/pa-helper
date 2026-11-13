package com.upibalancetracker.app;

import java.lang.ref.WeakReference;
import java.util.Map;

/**
 * Static bridge between the NotificationListenerService and the Capacitor plugin.
 * The NotificationListenerService lives in the same process and can invoke
 * the plugin to emit events to the JavaScript layer.
 */
public final class UpiPaymentDispatcher {
    private static WeakReference<UpiBalanceTrackerPlugin> pluginRef = new WeakReference<>(null);

    private UpiPaymentDispatcher() {}

    public static void setPlugin(UpiBalanceTrackerPlugin plugin) {
        pluginRef = new WeakReference<>(plugin);
    }

    public static void clearPlugin() {
        pluginRef = new WeakReference<>(null);
    }

    public static void onPayment(Map<String, Object> payment) {
        UpiBalanceTrackerPlugin plugin = pluginRef.get();
        if (plugin != null) {
            plugin.notifyPayment(payment);
        }
    }
}
