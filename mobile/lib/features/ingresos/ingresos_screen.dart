import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../../core/providers/providers.dart';
import '../../core/models/ingreso.dart';

class IngresosScreen extends ConsumerStatefulWidget {
  const IngresosScreen({super.key});

  @override
  ConsumerState<IngresosScreen> createState() => _IngresosScreenState();
}

class _IngresosScreenState extends ConsumerState<IngresosScreen> {
  String _tipoFilter = '';
  DateTime? _fechaInicio;
  DateTime? _fechaFin;
  final Set<int> _collapsedYears = {};

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('es');
  }

  Map<int, List<Ingreso>> _groupByYear(List<Ingreso> ingresos) {
    final map = <int, List<Ingreso>>{};
    for (final ing in ingresos) {
      final year = ing.fechaPago.year;
      map.putIfAbsent(year, () => []).add(ing);
    }
    final sorted = map.entries.toList()..sort((a, b) => b.key.compareTo(a.key));
    return Map.fromEntries(sorted);
  }

  void _showEditDialog(Ingreso ingreso) {
    final montoController = TextEditingController(text: (ingreso.montoEnteros / 100).toString());
    String tipo = ingreso.tipo;
    final comentarioController = TextEditingController(text: ingreso.comentario ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Editar Ingreso #${ingreso.id}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: montoController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Monto (BOB)', prefixIcon: Icon(Icons.attach_money)),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: tipo,
              decoration: const InputDecoration(labelText: 'Tipo'),
              items: const [
                DropdownMenuItem(value: 'semanal', child: Text('Semanal')),
                DropdownMenuItem(value: 'diario', child: Text('Diario')),
              ],
              onChanged: (v) => tipo = v ?? tipo,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: comentarioController,
              decoration: const InputDecoration(labelText: 'Comentario'),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () async {
              final montoBOB = double.tryParse(montoController.text);
              if (montoBOB == null || montoBOB <= 0) {
                if (!mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Monto inválido')),
                );
                return;
              }
              try {
                await ref.read(apiClientProvider).updateIngreso(
                      ingreso.id,
                      UpdateIngresoRequest(
                        montoEnteros: (montoBOB * 100).toInt(),
                        tipo: tipo,
                        comentario: comentarioController.text.trim().isEmpty ? null : comentarioController.text.trim(),
                      ),
                    );
                ref.invalidate(ingresosProvider);
                if (mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Ingreso actualizado'), backgroundColor: Colors.green),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                  );
                }
              }
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(Ingreso ingreso) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Eliminar ingreso'),
        content: Text('¿Eliminar el ingreso #${ingreso.id}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () async {
              try {
                await ref.read(apiClientProvider).deleteIngreso(ingreso.id);
                ref.invalidate(ingresosProvider);
                ref.invalidate(fechasOcupadasProvider);
                if (mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Ingreso eliminado'), backgroundColor: Colors.green),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                  );
                }
              }
            },
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ingresosAsync = ref.watch(ingresosProvider(const IngresosParams()));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Ingresos'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          _buildFilters(),
          Expanded(
            child: ingresosAsync.when(
              data: (response) {
                final ingresos = response.data;
                if (ingresos.isEmpty) {
                  return const Center(child: Text('No hay ingresos registrados'));
                }
                final grouped = _groupByYear(ingresos);
                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: grouped.entries.map((entry) {
                    final year = entry.key;
                    final items = entry.value;
                    final isCollapsed = _collapsedYears.contains(year);
                    final yearTotal = items.fold<int>(0, (sum, i) => sum + i.montoEnteros);

                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: Column(
                        children: [
                          InkWell(
                            onTap: () => setState(() {
                              if (isCollapsed) {
                                _collapsedYears.remove(year);
                              } else {
                                _collapsedYears.add(year);
                              }
                            }),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Row(
                                children: [
                                  Icon(isCollapsed ? Icons.expand_more : Icons.expand_less),
                                  const SizedBox(width: 8),
                                  Text(
                                    '$year',
                                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                                  ),
                                  const Spacer(),
                                  Flexible(
                                    child: Text(
                                      '${items.length} registros · ${(yearTotal / 100).toStringAsFixed(2)} BOB',
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                            color: Theme.of(context).colorScheme.onSurfaceVariant,
                                          ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          if (!isCollapsed) ...[
                            const Divider(height: 1),
                            ...items.map((ing) => _buildIngresoRow(ing)),
                          ],
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildNavBar(context),
    );
  }

  Widget _buildFilters() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Wrap(
        spacing: 8,
        runSpacing: 8,
        children: [
          DropdownButton<String>(
            value: _tipoFilter.isEmpty ? null : _tipoFilter,
            hint: const Text('Tipo'),
            items: const [
              DropdownMenuItem(value: '', child: Text('Todos')),
              DropdownMenuItem(value: 'diario', child: Text('Diario')),
              DropdownMenuItem(value: 'semanal', child: Text('Semanal')),
            ],
            onChanged: (v) => setState(() => _tipoFilter = v ?? ''),
          ),
          SizedBox(
            width: 120,
            child: TextField(
              readOnly: true,
              decoration: const InputDecoration(
                labelText: 'Desde',
                isDense: true,
                suffixIcon: Icon(Icons.calendar_today, size: 16),
              ),
              onTap: () async {
                final picked = await showDatePicker(context: context, initialDate: _fechaInicio ?? DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime(2030));
                if (picked != null) setState(() => _fechaInicio = picked);
              },
              controller: TextEditingController(text: _fechaInicio != null ? DateFormat('dd/MM/yyyy').format(_fechaInicio!) : ''),
            ),
          ),
          SizedBox(
            width: 120,
            child: TextField(
              readOnly: true,
              decoration: const InputDecoration(
                labelText: 'Hasta',
                isDense: true,
                suffixIcon: Icon(Icons.calendar_today, size: 16),
              ),
              onTap: () async {
                final picked = await showDatePicker(context: context, initialDate: _fechaFin ?? DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime(2030));
                if (picked != null) setState(() => _fechaFin = picked);
              },
              controller: TextEditingController(text: _fechaFin != null ? DateFormat('dd/MM/yyyy').format(_fechaFin!) : ''),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.clear),
            onPressed: () => setState(() {
              _tipoFilter = '';
              _fechaInicio = null;
              _fechaFin = null;
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildIngresoRow(Ingreso ing) {
    return InkWell(
      onTap: () => _showEditDialog(ing),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('#${ing.id}', style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(width: 8),
                Text(DateFormat('dd/MM/yyyy').format(ing.fechaPago), style: const TextStyle(fontSize: 13)),
                const Spacer(),
                Flexible(
                  child: Text(
                    ing.montoDisplay,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: ing.tipo == 'diario' ? Colors.blue.withValues(alpha: 0.1) : Colors.purple.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    ing.tipo,
                    style: TextStyle(
                      fontSize: 10,
                      color: ing.tipo == 'diario' ? Colors.blue : Colors.purple,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  icon: const Icon(Icons.edit, size: 18),
                  onPressed: () => _showEditDialog(ing),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                  onPressed: () => _confirmDelete(ing),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
              ],
            ),
            if (ing.fechasTrabajo.isNotEmpty) ...[
              const SizedBox(height: 6),
              Wrap(
                spacing: 4,
                runSpacing: 4,
                children: ing.fechasTrabajo.map((f) {
                  final dia = f.fecha.day;
                  final mes = f.fecha.month;
                  final monto = (f.montoEnteros / 100).toStringAsFixed(0);
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.blue.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '$dia/$mes ($monto)',
                      style: const TextStyle(fontSize: 11, color: Colors.blue),
                    ),
                  );
                }).toList(),
              ),
            ],
            if (ing.comentario != null && ing.comentario!.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                ing.comentario!,
                style: TextStyle(fontSize: 12, color: Theme.of(context).colorScheme.onSurfaceVariant),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildNavBar(BuildContext context) {
    return NavigationBar(
      selectedIndex: 2,
      onDestinationSelected: (index) {
        switch (index) {
          case 0:
            context.go('/');
            break;
          case 1:
            context.go('/registrar');
            break;
          case 2:
            context.go('/ingresos');
            break;
        }
      },
      destinations: const [
        NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
        NavigationDestination(icon: Icon(Icons.add_circle_outline), selectedIcon: Icon(Icons.add_circle), label: 'Registrar'),
        NavigationDestination(icon: Icon(Icons.list_outlined), selectedIcon: Icon(Icons.list), label: 'Ingresos'),
      ],
    );
  }
}
