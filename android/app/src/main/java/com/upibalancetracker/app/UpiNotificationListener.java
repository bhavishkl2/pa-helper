package com.upibalancetracker.app;

import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.Log;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Detects incoming/outgoing UPI payment notifications from Google Pay, PhonePe,
 * Paytm, BHIM and banking apps.
 *
 * The user must grant "Notification access" to this app in Android Settings.
 * When a matching notification is posted, key details are extracted and
 * forwarded to the Capacitor plugin (and hence the JS layer) via
 * {@link UpiPaymentDispatcher}.
 */
public class UpiNotificationListener extends NotificationListenerService {

    private static final String TAG = "UpiNotificationListener";

    // Known UPI / banking app package names.
    private static final String[] UPI_PACKAGES = {
        "com.google.android.apps.nbu.paisa.user",   // Google Pay
        "com.phonepe.app",                          // PhonePe
        "net.one97.paytm",                          // Paytm
        "org.npci.upi.bhim",                        // BHIM
        "com.in.axis.bhim",                         // BHIM (Axis)
        "com.axis.mobile",                          // Axis Bank
        "com.hdfc.mobilebanking",                   // HDFC
        "com.icici.imobile",                        // ICICI
        "com.sbi.mobile",                           // SBI YONO
        "com.baroda.mpbanking",                     // BOB
        "com.pnb.mobilebanking",                    // PNB
        "com.canarabank.canara",                    // Canara
        "com.unionbank.mobile",                     // Union Bank
        "com.indusind.mobile",                      // IndusInd
        "com.federal.mobile",                       // Federal Bank
        "com.idbi.mobile",                          // IDBI
        "com.kotak.mobilebanking",                  // Kotak
        "com.idfcfirstbank.mobile",                 // IDFC
        "com.rblbank.mobile",                       // RBL
        "com.dcbc.mobile",                          // DCB
        "com.yesbank.mobile",                       // Yes Bank
    };

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
        "(?:₹|Rs\\.?|INR|Rupess?|Rupees?)\\s*([0-9][0-9,]*(?:\\.[0-9]{1,2})?)|" +
        "([0-9][0-9,]*(?:\\.[0-9]{1,2})?)\\s*(?:₹|Rs\\.?|INR)",
        Pattern.CASE_INSENSITIVE
    );

    private static final Pattern REF_PATTERN = Pattern.compile(
        "(?:UPI ref|ref|reference|txn|transaction|UPI ID|UPI transaction ID|UTR)[^\\d]{0,20}([A-Za-z0-9]{6,})",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            String pkg = sbn.getPackageName();
            if (!isUpiPackage(pkg)) return;

            Bundle extras = sbn.getNotification().extras;
            if (extras == null) return;

            CharSequence title = extras.getCharSequence(android.app.Notification.EXTRA_TITLE);
            CharSequence text = extras.getCharSequence(android.app.Notification.EXTRA_TEXT);
            CharSequence subText = extras.getCharSequence(android.app.Notification.EXTRA_SUB_TEXT);
            CharSequence bigText = extras.getCharSequence(android.app.Notification.EXTRA_BIG_TEXT);
            CharSequence summary = extras.getCharSequence("android.summaryText");

            String combined = joinNonNull(title, text, subText, bigText, summary);
            if (TextUtils.isEmpty(combined)) return;

            String lower = combined.toLowerCase(Locale.ROOT);
            if (!isPaymentRelated(lower)) return;

            Map<String, Object> payment = new HashMap<>();
            payment.put("package_name", pkg);
            payment.put("upi_app", appNameFor(pkg));
            payment.put("raw_title", title == null ? null : title.toString());
            payment.put("raw_body", text == null ? null : text.toString());
            payment.put("timestamp", sbn.getPostTimeMillis());

            String direction = detectDirection(lower);
            payment.put("direction", direction);

            String amount = extractAmount(combined);
            if (amount != null) {
                payment.put("amount", Double.parseDouble(amount.replace(",", "")));
            } else {
                payment.put("amount", 0.0);
            }

            String reference = extractReference(combined);
            payment.put("reference", reference);

            Map<String, String> parties = extractParties(combined, lower, direction);
            payment.put("sender", parties.get("sender"));
            payment.put("receiver", parties.get("receiver"));

            String id = sbn.getId() + "-" + sbn.getPostTimeMillis() + "-" + (reference != null ? reference : pkg);
            payment.put("id", id);

            Log.d(TAG, "UPI payment detected: " + payment);
            UpiPaymentDispatcher.onPayment(payment);
        } catch (Exception e) {
            Log.e(TAG, "Error processing notification", e);
        }
    }

    @Override
    public void onNotificationRemoved(StatusBarNotification sbn) {
        // Intentionally empty.
    }

    private boolean isUpiPackage(String pkg) {
        if (TextUtils.isEmpty(pkg)) return false;
        for (String known : UPI_PACKAGES) {
            if (known.equalsIgnoreCase(pkg)) return true;
        }
        // Generic banking app heuristic.
        String l = pkg.toLowerCase(Locale.ROOT);
        return l.contains("bank") || l.contains("upi") || l.contains("pay") || l.contains("paisa");
    }

    private String appNameFor(String pkg) {
        switch (pkg) {
            case "com.google.android.apps.nbu.paisa.user": return "Google Pay";
            case "com.phonepe.app": return "PhonePe";
            case "net.one97.paytm": return "Paytm";
            case "org.npci.upi.bhim":
            case "com.in.axis.bhim": return "BHIM";
            default:
                if (pkg.contains("axis")) return "Axis Bank";
                if (pkg.contains("hdfc")) return "HDFC Bank";
                if (pkg.contains("icici")) return "ICICI Bank";
                if (pkg.contains("sbi")) return "SBI";
                if (pkg.contains("baroda")) return "Bank of Baroda";
                if (pkg.contains("pnb")) return "PNB";
                if (pkg.contains("canara")) return "Canara Bank";
                if (pkg.contains("unionbank")) return "Union Bank";
                if (pkg.contains("indusind")) return "IndusInd Bank";
                if (pkg.contains("federal")) return "Federal Bank";
                if (pkg.contains("idbi")) return "IDBI Bank";
                if (pkg.contains("kotak")) return "Kotak Bank";
                if (pkg.contains("idfc")) return "IDFC First Bank";
                if (pkg.contains("rbl")) return "RBL Bank";
                if (pkg.contains("dcbc")) return "DCB Bank";
                if (pkg.contains("yesbank")) return "Yes Bank";
                return "UPI App";
        }
    }

    private boolean isPaymentRelated(String lower) {
        return lower.contains("upi") ||
               lower.contains("₹") ||
               lower.contains("rs") ||
               lower.contains("inr") ||
               lower.contains("debited") ||
               lower.contains("credited") ||
               lower.contains("received") ||
               lower.contains("paid") ||
               lower.contains("transfer") ||
               lower.contains("transaction") ||
               lower.contains("payment");
    }

    private String detectDirection(String lower) {
        boolean incoming = lower.contains("credited") ||
                           lower.contains("received") ||
                           lower.contains("received ₹") ||
                           lower.contains("money received") ||
                           lower.contains("has sent") ||
                           lower.contains("sent you") ||
                           lower.contains("collect request accepted") ||
                           lower.contains("auto pay") == false && lower.contains("added to your account");

        boolean outgoing = lower.contains("debited") ||
                           lower.contains("paid") ||
                           lower.contains("you paid") ||
                           lower.contains("you sent") ||
                           lower.contains("sent to") ||
                           lower.contains("payment of") ||
                           lower.contains("transaction of") ||
                           lower.contains("withdrawal") ||
                           lower.contains("atm");

        if (incoming && !outgoing) return "incoming";
        if (outgoing && !incoming) return "outgoing";
        // Default ambiguous UPI credit notifications to incoming (conservative: user confirms anyway).
        if (lower.contains("upi") && (lower.contains("received") || lower.contains("credited"))) return "incoming";
        return "incoming";
    }

    private String extractAmount(String text) {
        Matcher m = AMOUNT_PATTERN.matcher(text);
        if (m.find()) {
            String val = m.group(1);
            if (val == null) val = m.group(2);
            if (val != null) return val;
        }
        // Fallback: first currency-like number.
        Pattern fb = Pattern.compile("([0-9][0-9,]*(?:\\.[0-9]{1,2})?)");
        Matcher fm = fb.matcher(text);
        if (fm.find()) return fm.group(1);
        return null;
    }

    private String extractReference(String text) {
        Matcher m = REF_PATTERN.matcher(text);
        if (m.find()) {
            return m.group(1);
        }
        // Generic: look for 12-char alphanumeric UPI ref tokens.
        Pattern fb = Pattern.compile("\\b([A-Z0-9]{12,22})\\b");
        Matcher fm = fb.matcher(text);
        if (fm.find()) return fm.group(1);
        return null;
    }

    private Map<String, String> extractParties(String combined, String lower, String direction) {
        Map<String, String> parties = new HashMap<>();
        parties.put("sender", null);
        parties.put("receiver", null);

        // Common patterns: "₹500 received from Ravi", "paid ₹200 to Shop", "debited ... to ..."
        String from = extractAfterKeyword(lower, new String[]{"from ", "by ", "sender: "});
        String to = extractAfterKeyword(lower, new String[]{"to ", "receiver: ", "payee: "});

        if ("incoming".equals(direction)) {
            parties.put("sender", from);
            parties.put("receiver", to);
        } else {
            parties.put("sender", to != null ? to : from);
            parties.put("receiver", from);
        }
        return parties;
    }

    private String extractAfterKeyword(String text, String[] keywords) {
        for (String kw : keywords) {
            int idx = text.indexOf(kw);
            if (idx >= 0) {
                String rest = text.substring(idx + kw.length());
                int end = rest.length();
                for (char c : new char[]{'.', ',', '\n', ':', '-', ';'}) {
                    int e = rest.indexOf(c);
                    if (e >= 0 && e < end) end = e;
                }
                String name = rest.substring(0, end).trim();
                if (name.length() > 0 && name.length() < 60) return name;
            }
        }
        return null;
    }

    private String joinNonNull(CharSequence... parts) {
        StringBuilder sb = new StringBuilder();
        for (CharSequence p : parts) {
            if (p != null) {
                if (sb.length() > 0) sb.append(" | ");
                sb.append(p);
            }
        }
        return sb.toString();
    }
}
