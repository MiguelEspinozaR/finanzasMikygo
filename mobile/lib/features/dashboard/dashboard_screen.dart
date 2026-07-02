import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'dart:math' as math;
import '../../core/providers/providers.dart';
import '../../core/models/ingreso.dart';
import 'widgets/summary_cards.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  DateTime _currentMonth = DateTime.now();
  DateTime _currentWeekStart = DateTime.now();
  int _currentYear = DateTime.now().year;

  @override
  void initState() {
    super.initState();
    initializeDateFormatting('es');
    final now = DateTime.now();
    _currentWeekStart = now.subtract(Duration(days: now.weekday - 1));
  }

  String get _weekKey {
    final d = _currentWeekStart;
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final summaryAsync = ref.watch(dashboardSummaryProvider((mes: _currentMonth.month, anio: _currentMonth.year)));
    final weeklyAsync = ref.watch(dashboardWeeklyProvider(_weekKey));
    final monthlyAsync = ref.watch(dashboardMonthlyProvider((mes: _currentMonth.month, anio: _currentMonth.year)));
    final yearlyAsync = ref.watch(dashboardYearlyProvider(_currentYear));
    final historyAsync = ref.watch(dashboardHistoryProvider);

    final colorScheme = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardSummaryProvider);
          ref.invalidate(dashboardWeeklyProvider);
          ref.invalidate(dashboardMonthlyProvider);
          ref.invalidate(dashboardYearlyProvider);
          ref.invalidate(dashboardHistoryProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              summaryAsync.when(
                data: (s) => SummaryCards(summary: s, month: _currentMonth),
                loading: () => const SizedBox(height: 120, child: Center(child: CircularProgressIndicator())),
                error: (e, _) => Card(child: Padding(padding: const EdgeInsets.all(16), child: Text('Error: $e'))),
              ),
              const SizedBox(height: 16),
              _buildWeeklyChart(weeklyAsync, colorScheme),
              const SizedBox(height: 16),
              _buildMonthlyChart(monthlyAsync, colorScheme),
              const SizedBox(height: 16),
              _buildYearlyChart(yearlyAsync, colorScheme),
              const SizedBox(height: 16),
              _buildHistoryChart(historyAsync, colorScheme),
            ],
          ),
        ),
      ),
      bottomNavigationBar: _buildNavBar(context),
    );
  }

  Widget _buildWeeklyChart(AsyncValue<List<DashboardWeeklyData>> data, ColorScheme colorScheme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => setState(() => _currentWeekStart = _currentWeekStart.subtract(const Duration(days: 7))),
                ),
                Expanded(
                  child: Text(
                    'Sem ${_getWeekNumber(_currentWeekStart)} · ${_currentWeekStart.year}',
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () => setState(() => _currentWeekStart = _currentWeekStart.add(const Duration(days: 7))),
                ),
              ],
            ),
            const SizedBox(height: 8),
            data.when(
              data: (weekly) => _buildBarChart<DashboardWeeklyData>(
                data: weekly,
                getXLabel: (d) => d.dia.substring(0, 2),
                getYValue: (d) => d.montoBOB,
                getAvg: (d) => d.promedioBOB,
                color: colorScheme.primary,
              ),
              loading: () => const SizedBox(height: 200, child: Center(child: CircularProgressIndicator())),
              error: (e, _) => Text('Error: $e'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMonthlyChart(AsyncValue<List<DashboardMonthlyData>> data, ColorScheme colorScheme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => setState(() {
                    _currentMonth = DateTime(_currentMonth.year, _currentMonth.month - 1);
                  }),
                ),
                Expanded(
                  child: Text(
                    DateFormat('MMMM yyyy', 'es').format(_currentMonth),
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () => setState(() {
                    _currentMonth = DateTime(_currentMonth.year, _currentMonth.month + 1);
                  }),
                ),
              ],
            ),
            const SizedBox(height: 8),
            data.when(
              data: (monthly) => _buildBarChart<DashboardMonthlyData>(
                data: monthly,
                getXLabel: (d) => d.semana,
                getYValue: (d) => d.montoBOB,
                getAvg: (d) => d.promedioBOB,
                color: colorScheme.secondary,
              ),
              loading: () => const SizedBox(height: 200, child: Center(child: CircularProgressIndicator())),
              error: (e, _) => Text('Error: $e'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildYearlyChart(AsyncValue<List<DashboardYearlyData>> data, ColorScheme colorScheme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () => setState(() => _currentYear--),
                ),
                Expanded(
                  child: Text(
                    '$_currentYear',
                    style: Theme.of(context).textTheme.titleMedium,
                    textAlign: TextAlign.center,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () => setState(() => _currentYear++),
                ),
              ],
            ),
            const SizedBox(height: 8),
            data.when(
              data: (yearly) => _buildBarChart<DashboardYearlyData>(
                data: yearly,
                getXLabel: (d) => d.mes.substring(0, math.min(3, d.mes.length)),
                getYValue: (d) => d.montoBOB,
                getAvg: (d) => d.promedioBOB,
                color: colorScheme.tertiary,
              ),
              loading: () => const SizedBox(height: 200, child: Center(child: CircularProgressIndicator())),
              error: (e, _) => Text('Error: $e'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBarChart<T>({
    required List<T> data,
    required String Function(T) getXLabel,
    required double Function(T) getYValue,
    required double Function(T) getAvg,
    required Color color,
  }) {
    if (data.isEmpty) return const SizedBox(height: 200, child: Center(child: Text('Sin datos')));
    final avg = getAvg(data.first);

    return SizedBox(
      height: 200,
      child: BarChart(
        BarChartData(
          gridData: const FlGridData(show: true, drawVerticalLine: false),
          titlesData: FlTitlesData(
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 50,
                getTitlesWidget: (value, meta) => Text(
                  value >= 1000 ? '${(value / 1000).toStringAsFixed(0)}k' : value.toInt().toString(),
                  style: const TextStyle(fontSize: 10),
                ),
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 25,
                getTitlesWidget: (value, meta) {
                  final idx = value.toInt();
                  if (idx < 0 || idx >= data.length) return const SizedBox();
                  return Text(getXLabel(data[idx]), style: const TextStyle(fontSize: 9));
                },
              ),
            ),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          borderData: FlBorderData(show: false),
          barGroups: data.asMap().entries.map((e) {
            return BarChartGroupData(
              x: e.key,
              barRods: [
                BarChartRodData(
                  toY: getYValue(e.value),
                  color: color,
                  width: math.max(4, 200 / data.length - 4),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                ),
              ],
            );
          }).toList(),
          extraLinesData: ExtraLinesData(
            horizontalLines: [
              HorizontalLine(
                y: avg,
                color: Colors.green,
                strokeWidth: 1.5,
                dashArray: [5, 5],
                label: HorizontalLineLabel(
                  show: true,
                  labelResolver: (_) => 'Prom: ${avg.toStringAsFixed(2)} BOB',
                  style: const TextStyle(fontSize: 10, color: Colors.green),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHistoryChart(AsyncValue<List<DashboardHistoryData>> data, ColorScheme colorScheme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Histórico', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            data.when(
              data: (history) {
                if (history.isEmpty) return const SizedBox(height: 200, child: Center(child: Text('Sin datos')));
                return SizedBox(
                  height: 250,
                  child: LineChart(
                    LineChartData(
                      gridData: const FlGridData(show: true, drawVerticalLine: false),
                      titlesData: FlTitlesData(
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 50,
                            getTitlesWidget: (value, meta) => Text(
                              value >= 1000 ? '${(value / 1000).toStringAsFixed(0)}k' : value.toInt().toString(),
                              style: const TextStyle(fontSize: 10),
                            ),
                          ),
                        ),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 30,
                            interval: math.max(1, (history.length / 8).floorToDouble()),
                            getTitlesWidget: (value, meta) {
                              final idx = value.toInt();
                              if (idx < 0 || idx >= history.length) return const SizedBox();
                              return Text(history[idx].fecha.substring(5, 10), style: const TextStyle(fontSize: 9));
                            },
                          ),
                        ),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      borderData: FlBorderData(show: false),
                      lineBarsData: [
                        LineChartBarData(
                          spots: history.asMap().entries.map((e) => FlSpot(e.key.toDouble(), e.value.montoBOB)).toList(),
                          isCurved: true,
                          color: colorScheme.primary,
                          barWidth: 2,
                          dotData: const FlDotData(show: false),
                          belowBarData: BarAreaData(show: true, color: colorScheme.primary.withValues(alpha: 0.1)),
                        ),
                      ],
                      extraLinesData: history.isNotEmpty
                          ? ExtraLinesData(
                              horizontalLines: [
                                HorizontalLine(
                                  y: history.first.promedioBOB,
                                  color: Colors.green,
                                  strokeWidth: 1.5,
                                  dashArray: [5, 5],
                                  label: HorizontalLineLabel(
                                    show: true,
                                    labelResolver: (_) => 'Prom: ${history.first.promedioBOB.toStringAsFixed(2)} BOB',
                                    style: const TextStyle(fontSize: 10, color: Colors.green),
                                  ),
                                ),
                              ],
                            )
                          : null,
                    ),
                  ),
                );
              },
              loading: () => const SizedBox(height: 200, child: Center(child: CircularProgressIndicator())),
              error: (e, _) => Text('Error: $e'),
            ),
          ],
        ),
      ),
    );
  }

  int _getWeekNumber(DateTime date) {
    final beginningOfYear = DateTime(date.year, 1, 1);
    final days = date.difference(beginningOfYear).inDays;
    return ((days + beginningOfYear.weekday - 1) / 7).ceil();
  }

  Widget _buildNavBar(BuildContext context) {
    return NavigationBar(
      selectedIndex: 0,
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
