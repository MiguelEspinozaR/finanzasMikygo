import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:image_picker/image_picker.dart';
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
  final Map<String, List<String>> _fechasOcupadas = {};

  final _montoController = TextEditingController();
  String _tipo = 'semanal';
  final _comentarioController = TextEditingController();
  File? _imagen;
  String? _imagenPreview;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('es');
    _loadFechasOcupadas();
  }

  void _loadFechasOcupadas() async {
    final data = await ref.read(apiClientProvider).getFechasOcupadas(_focusedDay.month, _focusedDay.year);
    setState(() {
      _fechasOcupadas.clear();
      _fechasOcupadas.addAll(data);
    });
  }

  bool _isOcupada(DateTime day) {
    final dateKey = DateFormat('yyyy-MM-dd').format(day);
    final tipos = _fechasOcupadas[dateKey];
    return tipos != null && tipos.isNotEmpty;
  }

  List<String> _getTiposOcupada(DateTime day) {
    final dateKey = DateFormat('yyyy-MM-dd').format(day);
    return _fechasOcupadas[dateKey] ?? [];
  }

  void _onDaySelected(DateTime selectedDay, DateTime focusedDay) {
    if (_isOcupada(selectedDay)) return;

    setState(() {
      _selectedDay = selectedDay;
      _focusedDay = focusedDay;

      switch (_currentTool) {
        case Tool.trabajo:
          final exists = _diasTrabajo.any((d) => isSameDay(d, selectedDay));
          if (exists) {
            _diasTrabajo.removeWhere((d) => isSameDay(d, selectedDay));
          } else {
            _diasTrabajo.add(selectedDay);
          }
          break;
        case Tool.pago:
          if (_diaPago != null && isSameDay(_diaPago, selectedDay)) {
            _diaPago = null;
          } else {
            _diaPago = selectedDay;
          }
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

  void _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked != null) {
      setState(() {
        _imagen = File(picked.path);
        _imagenPreview = picked.path;
      });
    }
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

    setState(() => _isSubmitting = true);

    try {
      final sortedDays = _diasTrabajo.toList()..sort();
      final request = CreateIngresoRequest(
        fechaPago: DateFormat('yyyy-MM-dd').format(_diaPago!),
        montoEnteros: (montoBOB * 100).toInt(),
        tipo: _tipo,
        comentario: _comentarioController.text.trim().isEmpty ? null : _comentarioController.text.trim(),
        fechasTrabajo: sortedDays.map((d) => {'fecha': DateFormat('yyyy-MM-dd').format(d)}).toList(),
      );

      final api = ref.read(apiClientProvider);
      final ingreso = await api.createIngreso(request);

      if (_imagen != null) {
        await api.uploadImage(_imagen!.path, ingresoId: ingreso.id);
      }

      if (mounted) {
        ref.invalidate(ingresosProvider);
        ref.invalidate(fechasOcupadasProvider);
        ref.invalidate(dashboardSummaryProvider);
        ref.invalidate(dashboardWeeklyProvider);
        ref.invalidate(dashboardMonthlyProvider);
        ref.invalidate(dashboardYearlyProvider);
        ref.invalidate(dashboardHistoryProvider);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Ingreso registrado exitosamente'), backgroundColor: Colors.green),
        );
        setState(() {
          _diasTrabajo.clear();
          _diaPago = null;
          _montoController.clear();
          _comentarioController.clear();
          _imagen = null;
          _imagenPreview = null;
        });
        _loadFechasOcupadas();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
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
              runSpacing: 4,
              children: [
                _legendDot(Colors.blue, 'Trabajo (${_diasTrabajo.length})'),
                _legendDot(Colors.green, 'Pago${_diaPago != null ? ' (${DateFormat('dd/MM').format(_diaPago!)})' : ''}'),
                _legendDot(Colors.blue, 'Existente', border: true),
                _legendDot(Colors.green, 'Pago existente', border: true),
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
                  final isTrabajo = _diasTrabajo.any((d) => isSameDay(d, day));
                  final isPago = _diaPago != null && isSameDay(_diaPago, day);
                  final tipos = _getTiposOcupada(day);
                  final isExistentTrabajo = tipos.contains('trabajo');
                  final isExistentPago = tipos.contains('pago');

                  Color? bgColor;
                  Color? borderColor;
                  Color? textColor;

                  if (isPago && isTrabajo) {
                    bgColor = Colors.green;
                    borderColor = Colors.blue;
                    textColor = Colors.white;
                  } else if (isPago) {
                    bgColor = Colors.green;
                    textColor = Colors.white;
                  } else if (isTrabajo) {
                    borderColor = Colors.blue;
                    textColor = Colors.blue;
                  } else if (isExistentTrabajo && isExistentPago) {
                    bgColor = Colors.blue[200];
                    borderColor = Colors.green;
                    textColor = Colors.blue[900];
                  } else if (isExistentTrabajo) {
                    bgColor = Colors.blue[200];
                    textColor = Colors.blue[900];
                  } else if (isExistentPago) {
                    borderColor = Colors.green;
                    textColor = Colors.green;
                  }

                  return Container(
                    margin: const EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: bgColor,
                      shape: BoxShape.circle,
                      border: borderColor != null ? Border.all(color: borderColor, width: 2) : null,
                    ),
                    alignment: Alignment.center,
                    child: Text('${day.day}', style: TextStyle(color: textColor ?? theme.colorScheme.onSurface, fontWeight: FontWeight.w500)),
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
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _pickImage,
              icon: const Icon(Icons.image_outlined),
              label: Text(_imagen != null ? 'Imagen seleccionada' : 'Seleccionar imagen'),
            ),
            if (_imagenPreview != null) ...[
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.file(_imagen!, height: 150, fit: BoxFit.cover),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _isSubmitting ? null : _submit,
              icon: _isSubmitting
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.save),
              label: Text(_isSubmitting ? 'Registrando...' : 'Registrar Ingreso'),
              style: FilledButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildNavBar(context),
    );
  }

  Widget _legendDot(Color color, String label, {bool border = false}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: border ? null : color,
            shape: BoxShape.circle,
            border: border ? Border.all(color: color, width: 2) : null,
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 11)),
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
