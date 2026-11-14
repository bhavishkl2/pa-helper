import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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

  @override
  Widget build(BuildContext context) {
    final accent = _torchOn ? const Color(0xFFFFC857) : const Color(0xFFB9A7FF);

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
