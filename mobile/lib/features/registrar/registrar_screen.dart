import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import '../../core/providers/providers.dart';
import '../../core/models/ingreso.dart';

class RegistrarScreen extends ConsumerStatefulWidget {
  const RegistrarScreen({super.key});

  @override
  ConsumerState<RegistrarScreen> createState() => _RegistrarScreenState();
}

enum Tool { trabajo, pago, quitar }

class _RegistrarScreenState extends ConsumerState<RegistrarScreen> {
  CalendarFormat _calendarFormat = CalendarFormat.month;
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  Tool _currentTool = Tool.trabajo;

  final Set<DateTime> _diasTrabajo = {};
  DateTime? _diaPago;
  final Set<String> _fechasExistentes = {};

  final _montoController = TextEditingController();
  String _tipo = 'semanal';
  final _comentarioController = TextEditingController();

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('es');
    _loadFechasOcupadas();
  }

  void _loadFechasOcupadas() async {
    final data = await ref.read(apiClientProvider).getFechasOcupadas(_focusedDay.month, _focusedDay.year);
    setState(() {
      _fechasExistentes.clear();
      for (final key in data.keys) {
        _fechasExistentes.add(key);
      }
    });
  }

  void _onDaySelected(DateTime selectedDay, DateTime focusedDay) {
    final dateKey = DateFormat('yyyy-MM-dd').format(selectedDay);
    if (_fechasExistentes.contains(dateKey)) return;

    setState(() {
      _selectedDay = selectedDay;
      _focusedDay = focusedDay;

      switch (_currentTool) {
        case Tool.trabajo:
          _diasTrabajo.removeWhere((d) => isSameDay(d, selectedDay));
          _diasTrabajo.add(selectedDay);
          break;
        case Tool.pago:
          _diaPago = selectedDay;
          break;
        case Tool.quitar:
          _diasTrabajo.removeWhere((d) => isSameDay(d, selectedDay));
          if (_diaPago != null && isSameDay(_diaPago, selectedDay)) {
            _diaPago = null;
          }
          break;
      }
    });
  }

  void _submit() async {
    if (_diasTrabajo.isEmpty || _diaPago == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Selecciona días de trabajo y día de pago')),
      );
      return;
    }

    final montoText = _montoController.text.trim();
    if (montoText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa el monto')),
      );
      return;
    }

    final montoBOB = double.tryParse(montoText);
    if (montoBOB == null || montoBOB <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Monto inválido')),
      );
      return;
    }

    final montoCentavos = (montoBOB * 100).toInt();
    final request = CreateIngresoRequest(
      fechaPago: DateFormat('yyyy-MM-dd').format(_diaPago!),
      montoEnteros: montoCentavos,
      tipo: _tipo,
      comentario: _comentarioController.text.trim().isEmpty ? null : _comentarioController.text.trim(),
      fechasTrabajo: _diasTrabajo.map((d) => DateFormat('yyyy-MM-dd').format(d)).toList(),
    );

    try {
      await ref.read(apiClientProvider).createIngreso(request);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ingreso registrado exitosamente'), backgroundColor: Colors.green),
        );
        setState(() {
          _diasTrabajo.clear();
          _diaPago = null;
          _montoController.clear();
          _comentarioController.clear();
        });
        _loadFechasOcupadas();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Registrar Ingreso'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SegmentedButton<Tool>(
              segments: const [
                ButtonSegment(value: Tool.trabajo, label: Text('Trabajo'), icon: Icon(Icons.work_outline)),
                ButtonSegment(value: Tool.pago, label: Text('Pago'), icon: Icon(Icons.payments_outlined)),
                ButtonSegment(value: Tool.quitar, label: Text('Quitar'), icon: Icon(Icons.remove_circle_outline)),
              ],
              selected: {_currentTool},
              onSelectionChanged: (s) => setState(() => _currentTool = s.first),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              children: [
                _legendDot(Colors.blue, 'Trabajo (${_diasTrabajo.length})'),
                _legendDot(Colors.green, 'Pago${_diaPago != null ? ' (${DateFormat('dd/MM').format(_diaPago!)})' : ''}'),
                if (_fechasExistentes.isNotEmpty) _legendDot(Colors.grey, 'Existente'),
              ],
            ),
            const SizedBox(height: 12),
            TableCalendar(
              locale: 'es',
              firstDay: DateTime(2020),
              lastDay: DateTime(2030),
              focusedDay: _focusedDay,
              calendarFormat: _calendarFormat,
              selectedDayPredicate: (day) => _selectedDay != null && isSameDay(_selectedDay, day),
              onDaySelected: _onDaySelected,
              onFormatChanged: (format) => setState(() => _calendarFormat = format),
              onPageChanged: (focusedDay) {
                _focusedDay = focusedDay;
                _loadFechasOcupadas();
              },
              calendarStyle: CalendarStyle(
                todayDecoration: BoxDecoration(
                  color: theme.colorScheme.primary.withValues(alpha: 0.3),
                  shape: BoxShape.circle,
                ),
                outsideDaysVisible: false,
              ),
              calendarBuilders: CalendarBuilders(
                defaultBuilder: (context, day, focusedDay) {
                  final dateKey = DateFormat('yyyy-MM-dd').format(day);
                  final isTrabajo = _diasTrabajo.any((d) => isSameDay(d, day));
                  final isPago = _diaPago != null && isSameDay(_diaPago, day);
                  final isExistent = _fechasExistentes.contains(dateKey);

                  Color? bgColor;
                  Color? textColor;
                  if (isPago) {
                    bgColor = Colors.green;
                    textColor = Colors.white;
                  } else if (isTrabajo) {
                    bgColor = Colors.blue;
                    textColor = Colors.white;
                  } else if (isExistent) {
                    bgColor = Colors.grey[400];
                    textColor = Colors.white;
                  }

                  return Container(
                    margin: const EdgeInsets.all(4),
                    decoration: BoxDecoration(color: bgColor, shape: BoxShape.circle),
                    alignment: Alignment.center,
                    child: Text('${day.day}', style: TextStyle(color: textColor ?? theme.colorScheme.onSurface)),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _montoController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(
                labelText: 'Monto (BOB)',
                prefixIcon: Icon(Icons.attach_money),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              initialValue: _tipo,
              decoration: const InputDecoration(
                labelText: 'Tipo',
                border: OutlineInputBorder(),
              ),
              items: const [
                DropdownMenuItem(value: 'semanal', child: Text('Semanal')),
                DropdownMenuItem(value: 'diario', child: Text('Diario')),
              ],
              onChanged: (v) => setState(() => _tipo = v ?? 'semanal'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _comentarioController,
              decoration: const InputDecoration(
                labelText: 'Comentario (opcional)',
                prefixIcon: Icon(Icons.comment_outlined),
                border: OutlineInputBorder(),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _submit,
              icon: const Icon(Icons.save),
              label: const Text('Registrar Ingreso'),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildNavBar(context),
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 12)),
      ],
    );
  }

  Widget _buildNavBar(BuildContext context) {
    return NavigationBar(
      selectedIndex: 1,
      onDestinationSelected: (index) {
        switch (index) {
          case 0:
            context.go('/');
            break;
          case 1:
            context.go('/registrar');
            break;
        }
      },
      destinations: const [
        NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Dashboard'),
        NavigationDestination(icon: Icon(Icons.add_circle_outline), selectedIcon: Icon(Icons.add_circle), label: 'Registrar'),
      ],
    );
  }
}
