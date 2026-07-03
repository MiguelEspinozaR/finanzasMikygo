import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../core/theme/app_theme.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/registrar/registrar_screen.dart';
import '../features/ingresos/ingresos_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(
        path: '/',
        builder: (context, state) => const DashboardScreen(),
      ),
      GoRoute(
        path: '/registrar',
        builder: (context, state) => const RegistrarScreen(),
      ),
      GoRoute(
        path: '/ingresos',
        builder: (context, state) => const IngresosScreen(),
      ),
    ],
  );
});

class FinanzasMikygoApp extends ConsumerWidget {
  const FinanzasMikygoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Finanzas Mikygo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
