package com.upibalancetracker.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;

import com.getcapacitor.Bridge;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "UpiBalanceTracker")
public class UpiBalanceTrackerPlugin extends Plugin {

    private static final String PACKAGE_NAME = "com.upibalancetracker.app";

    @Override
    public void load() {
        UpiPaymentDispatcher.setPlugin(this);
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void isNotificationAccessGranted(PluginCall call) {
        boolean granted = isListenerEnabled(getContext());
        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationAccess(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("no_activity");
            return;
        }
        try {
            Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("failed_to_open_settings", e);
        }
    }

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        requestNotificationAccess(call);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        // The NotificationListenerService is declared in the manifest and is
        // started by the system once the user grants notification access.
        // We just ensure the dispatcher reference is set.
        UpiPaymentDispatcher.setPlugin(this);
        call.resolve();
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        UpiPaymentDispatcher.clearPlugin();
        call.resolve();
    }

    /**
     * Called by the NotificationListenerService when a UPI payment is detected.
     */
    public void notifyPayment(Map<String, Object> payment) {
        JSObject data = new JSObject();
        for (Map.Entry<String, Object> entry : payment.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Number) {
                data.put(entry.getKey(), ((Number) value).doubleValue());
            } else if (value instanceof Boolean) {
                data.put(entry.getKey(), (Boolean) value);
            } else {
                data.put(entry.getKey(), String.valueOf(value));
            }
        }
        notifyListeners("upiPayment", data);
    }

    private boolean isListenerEnabled(Context context) {
        if (context == null) return false;
        String enabled = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_NOTIFICATION_LISTENERS);
        if (TextUtils.isEmpty(enabled)) return false;
        String[] parts = enabled.split(":");
        for (String part : parts) {
            String pkg = part;
            int idx = pkg.indexOf('/');
            if (idx >= 0) pkg = pkg.substring(0, idx);
            if (PACKAGE_NAME.equals(pkg)) return true;
        }
        return false;
    }
}
