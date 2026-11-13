# UPI Balance Tracker

A complete offline-first Android app built with **JavaScript, React, TypeScript, Vite and Capacitor** that automatically detects incoming/outgoing UPI payments via Android's native `NotificationListenerService` and updates local SQLite balances only after user confirmation.

## Tech stack

- **Frontend:** React 18 + React Router + Vite + Tailwind CSS + Lucide icons
- **Native bridge:** Capacitor 8 (Android)
- **Local storage:** `@capacitor-community/sqlite` (SQLite on device, no backend/cloud)
- **Native detection:** Java `NotificationListenerService` + Capacitor plugin (`UpiBalanceTracker`)

## Core features

1. Multiple account management (name, opening balance, current balance, type, currency, color).
2. Automatic UPI payment detection from Google Pay, PhonePe, Paytm, BHIM and banking apps via `NotificationListenerService`.
3. On detection, a confirmation modal prompts the user to select which account to update.
4. Incoming → increases balance; Outgoing → decreases balance.
5. No balance is updated without explicit user confirmation.
6. Duplicate-transaction prevention (by UPI reference).
7. Dashboard: total balance, per-account balances, daily income/expense.
8. Transaction history with search, filters, manual edit/delete.
9. Manual income, expense and inter-account transfers.
10. All data stored locally in SQLite. JSON backup/export. No backend.

## Project structure

```
src/
  main.jsx                # React entry
  index.css               # Tailwind utilities
  App.tsx                 # Router + global payment-confirmation modal
  context/AppContext.tsx  # Global state, SQLite access, UPI listener wiring
  services/db.ts          # SQLite schema + account/transaction/transfer queries
  services/upi.ts         # Capacitor plugin bridge (isAvailable, request access, listeners)
  components/             # BottomTabs, ConfirmPaymentModal, AddTransactionModal
  pages/                  # Dashboard, Accounts, Transactions, Analytics, Settings
android/
  app/src/main/AndroidManifest.xml   # permissions + NotificationListenerService declaration
  app/src/main/java/com/upibalancetracker/app/
    MainActivity.java          # Capacitor BridgeActivity
    UpiBalanceTrackerPlugin.java # Capacitor plugin (isAvailable, request access, events)
    UpiNotificationListener.java # NotificationListenerService + UPI parsing
    UpiPaymentDispatcher.java    # Service <-> plugin bridge
```

## Native UPI detection (how it works)

- `UpiNotificationListener` extends Android's `NotificationListenerService`. It is declared in `AndroidManifest.xml` with the `BIND_NOTIFICATION_LISTENER_SERVICE` permission so only the system can bind to it.
- The user must grant **Notification access** to the app via Android Settings (the app opens `ACTION_NOTIFICATION_LISTENER_SETTINGS`).
- When a matching notification is posted, the service extracts amount, direction (incoming/outgoing), sender/receiver, UPI app, reference and timestamp using regex heuristics tailored to Google Pay, PhonePe, Paytm, BHIM and common banking packages.
- The event is forwarded to the Capacitor plugin via `UpiPaymentDispatcher`, which emits a `upiPayment` event to the JavaScript layer.
- The UI shows a confirmation modal where the user picks an account. Only on confirm is the transaction written to SQLite and the account balance adjusted.

## Prerequisites

- Node.js (v18+) and npm
- Android SDK (to compile/build the APK): set `ANDROID_HOME`/`ANDROID_SDK_ROOT`, SDK platforms & build-tools installed

## Setup & build

```bash
# install JS dependencies
npm install

# build the React web app
npm run build

# sync web assets into the Capacitor Android project
npx cap sync

# open in Android Studio to build/sign the APK or AAB
npx cap open android
```

Scripts:
- `npm run dev` — start Vite dev server
- `npm run build` — production web build to `www/`
- `npx cap sync` — copy `www/` into `android/app/src/main/assets/public`
- `npx cap open android` — open the Android project in Android Studio

## Granting notification access (required for auto-detection)

1. Install the app on a device/emulator.
2. Open the **Settings** tab and tap **Grant Notification Access** (or Open Notification Settings).
3. In Android Settings → Apps → Special app access → Notification access, enable **UPI Balance Tracker**.
4. Return to the app; detection status should become **Active**.
5. When a UPI payment notification arrives, confirm the account to update in the popup.

## Notes

- No backend or cloud dependency. All data lives in a local SQLite database on the device.
- This repository contains the full source; an Android SDK is required to compile the native code into an installable APK. The web frontend builds and lints standalone via `npm run build`.
