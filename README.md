# PA Helper
A Flutter application with a browser interface and mobile flashlight control.

## Requirements
- Flutter SDK: https://docs.flutter.dev/get-started/install

## Run
```bash
flutter pub get
flutter run -d chrome
```

In a remote development environment without Chrome, run `flutter run -d web-server`
and open the forwarded local URL in your browser. The flashlight requires a
supported mobile device and is unavailable in the web app.
