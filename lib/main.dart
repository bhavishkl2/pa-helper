import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:torch_light/torch_light.dart';

void main() {
  runApp(const FlutterApp());
}

class FlutterApp extends StatelessWidget {
  const FlutterApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PA Helper',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6750A4),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF101014),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  bool _torchOn = false;
  bool _busy = false;
  String? _error;

  Future<void> _toggleTorch() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });

    try {
      if (_torchOn) {
        await TorchLight.disableTorch();
      } else {
        await TorchLight.enableTorch();
      }
      if (!mounted) return;
      setState(() => _torchOn = !_torchOn);
    } on PlatformException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message ?? 'Could not control the flashlight.';
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Flashlight is unavailable on this device.';
      });
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  final List<_PermissionItem> _permissions = [
    _PermissionItem(
      permission: Permission.systemAlertWindows,
      label: 'Display over other apps',
      subtitle: 'Show content above other apps',
      icon: Icons.screen_share_rounded,
      special: true,
    ),
    _PermissionItem(
      permission: Permission.camera,
      label: 'Camera',
      subtitle: 'Take photos and record video',
      icon: Icons.camera_alt_rounded,
    ),
    _PermissionItem(
      permission: Permission.microphone,
      label: 'Microphone',
      subtitle: 'Record audio',
      icon: Icons.mic_rounded,
    ),
    _PermissionItem(
      permission: Permission.location,
      label: 'Location',
      subtitle: 'Access device location',
      icon: Icons.location_on_rounded,
    ),
    _PermissionItem(
      permission: Permission.storage,
      label: 'Storage',
      subtitle: 'Read and write files',
      icon: Icons.folder_rounded,
    ),
    _PermissionItem(
      permission: Permission.contacts,
      label: 'Contacts',
      subtitle: 'Read and modify contacts',
      icon: Icons.contacts_rounded,
    ),
    _PermissionItem(
      permission: Permission.phone,
      label: 'Phone',
      subtitle: 'Make and manage phone calls',
      icon: Icons.phone_rounded,
    ),
    _PermissionItem(
      permission: Permission.sms,
      label: 'SMS',
      subtitle: 'Send and view text messages',
      icon: Icons.sms_rounded,
    ),
    _PermissionItem(
      permission: Permission.calendar,
      label: 'Calendar',
      subtitle: 'Read and modify calendar events',
      icon: Icons.calendar_today_rounded,
    ),
    _PermissionItem(
      permission: Permission.sensors,
      label: 'Sensors',
      subtitle: 'Access motion and environment sensors',
      icon: Icons.sensors_rounded,
    ),
    _PermissionItem(
      permission: Permission.activityRecognition,
      label: 'Activity recognition',
      subtitle: 'Detect physical activity',
      icon: Icons.directions_run_rounded,
    ),
    _PermissionItem(
      permission: Permission.bluetooth,
      label: 'Bluetooth',
      subtitle: 'Connect to Bluetooth devices',
      icon: Icons.bluetooth_rounded,
    ),
    _PermissionItem(
      permission: Permission.notification,
      label: 'Notifications',
      subtitle: 'Show notifications',
      icon: Icons.notifications_rounded,
    ),
  ];

  final Map<Permission, PermissionStatus> _statuses = {};
  bool _permLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStatuses();
  }

  Future<void> _loadStatuses() async {
    final statuses = await Permission.statuses(
      _permissions.map((p) => p.permission).toList(),
    );
    if (!mounted) return;
    setState(() {
      _statuses.addAll(statuses);
      _permLoading = false;
    });
  }

  Future<void> _onRequest(_PermissionItem item) async {
    final current = _statuses[item.permission];
    if (item.special || current == PermissionStatus.permanentlyDenied) {
      await openAppSettings();
    } else {
      final status = await item.permission.request();
      if (!mounted) return;
      setState(() => _statuses[item.permission] = status);
    }
  }

  Future<void> _requestAll() async {
    for (final item in _permissions) {
      final current = _statuses[item.permission];
      if (item.special || current == PermissionStatus.permanentlyDenied) {
        await openAppSettings();
        return;
      }
      await item.permission.request();
    }
    if (!mounted) return;
    _loadStatuses();
  }

  Widget _statusChip(PermissionStatus status) {
    final enabled = status.isGranted;
    final accent = enabled ? const Color(0xFF34D399) : const Color(0xFFB9A7FF);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: accent.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: accent, width: 1),
      ),
      child: Text(
        enabled ? 'Enabled' : 'Disabled',
        style: TextStyle(color: accent, fontSize: 12, fontWeight: FontWeight.w700),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final accent = _torchOn ? const Color(0xFFFFC857) : const Color(0xFFB9A7FF);
    const permAccent = Color(0xFFB9A7FF);

    return Scaffold(
      appBar: AppBar(
        title: const Text('PA Helper', style: TextStyle(fontWeight: FontWeight.w700)),
        centerTitle: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 12),
              Text('Quick tools', style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(
                'Useful phone controls, right from one place.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 28),
              Card(
                color: const Color(0xFF1D1B24),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                  side: BorderSide(color: accent.withValues(alpha: 0.35)),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 48,
                            height: 48,
                            decoration: BoxDecoration(
                              color: accent.withValues(alpha: 0.14),
                              borderRadius: BorderRadius.circular(15),
                            ),
                            child: Icon(Icons.flashlight_on_rounded, color: accent, size: 27),
                          ),
                          const SizedBox(width: 14),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Flashlight', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                                SizedBox(height: 3),
                                Text('Use your phone camera flash', style: TextStyle(color: Colors.white60)),
                              ],
                            ),
                          ),
                          Switch(
                            value: _torchOn,
                            onChanged: _busy ? null : (_) => _toggleTorch(),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 54,
                        child: FilledButton.icon(
                          onPressed: _busy ? null : _toggleTorch,
                          icon: Icon(_torchOn ? Icons.flashlight_off_rounded : Icons.flashlight_on_rounded),
                          label: Text(_busy ? 'Please wait…' : (_torchOn ? 'Turn flashlight off' : 'Turn flashlight on')),
                          style: FilledButton.styleFrom(
                            backgroundColor: accent,
                            foregroundColor: const Color(0xFF19151F),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Center(
                        child: Text(
                          _torchOn ? 'Flashlight is ON' : 'Flashlight is OFF',
                          style: TextStyle(color: accent, fontWeight: FontWeight.w600),
                        ),
                      ),
                      if (_error != null) ...[
                        const SizedBox(height: 12),
                        Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 28),
              Text(
                'Permissions',
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                'All app permissions and their current state. Tap "Request" to grant a disabled permission.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Colors.white70),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 44,
                child: FilledButton.icon(
                  onPressed: _permLoading ? null : _requestAll,
                  icon: const Icon(Icons.add_rounded, size: 20),
                  label: const Text('Request all permissions'),
                  style: FilledButton.styleFrom(
                    backgroundColor: permAccent,
                    foregroundColor: const Color(0xFF19151F),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Expanded(
                child: _permLoading
                    ? const Center(child: CircularProgressIndicator())
                    : ListView.builder(
                        itemCount: _permissions.length,
                        itemBuilder: (context, index) {
                          final item = _permissions[index];
                          final status = _statuses[item.permission] ?? PermissionStatus.denied;
                          final enabled = status.isGranted;
                          final itemAccent = enabled ? const Color(0xFF34D399) : permAccent;
                          return Card(
                            color: const Color(0xFF1D1B24),
                            elevation: 0,
                            margin: const EdgeInsets.only(bottom: 10),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(color: itemAccent.withValues(alpha: 0.3)),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: itemAccent.withValues(alpha: 0.14),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(item.icon, color: itemAccent, size: 24),
                                  ),
                                  const SizedBox(width: 14),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.label,
                                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                                        ),
                                        const SizedBox(height: 3),
                                        Text(
                                          item.subtitle,
                                          style: TextStyle(color: Colors.white60, fontSize: 13),
                                        ),
                                      ],
                                    ),
                                  ),
                                  _statusChip(status),
                                  if (!enabled) ...[
                                    const SizedBox(width: 10),
                                    FilledButton(
                                      onPressed: () => _onRequest(item),
                                      style: FilledButton.styleFrom(
                                        backgroundColor: permAccent,
                                        foregroundColor: const Color(0xFF19151F),
                                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                                      ),
                                      child: Text(
                                        item.special || status == PermissionStatus.permanentlyDenied
                                            ? 'Open settings'
                                            : 'Request',
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          );
                        },
                      ),
              ),
              const SizedBox(height: 12),
              const Center(
                child: Text(
                  'Display over other apps and permanently denied permissions require opening system settings.',
                  style: TextStyle(color: Colors.white38, fontSize: 12),
                ),
              ),
              const SizedBox(height: 8),
              const Spacer(),
              const Center(
                child: Text(
                  'More quick tools can be added here.',
                  style: TextStyle(color: Colors.white38),
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}

class _PermissionItem {
  final Permission permission;
  final String label;
  final String subtitle;
  final IconData icon;
  final bool special;

  _PermissionItem({
    required this.permission,
    required this.label,
    required this.subtitle,
    required this.icon,
    this.special = false,
  });
}
