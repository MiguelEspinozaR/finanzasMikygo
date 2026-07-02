import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'dart:math' as math;

class SummaryCards extends StatelessWidget {
  final dynamic summary;
  final DateTime month;

  const SummaryCards({super.key, required this.summary, required this.month});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Row(
      children: [
        _buildCard(
          context,
          label: 'Trabajados',
          value: summary.diasTrabajados.length.toString(),
          icon: Icons.work_outline,
          color: colorScheme.primary,
        ),
        const SizedBox(width: 8),
        _buildCard(
          context,
          label: 'Pagos',
          value: summary.diasPago.length.toString(),
          icon: Icons.payments_outlined,
          color: Colors.green,
        ),
      ],
    );
  }

  Widget _buildCard(BuildContext context, {
    required String label,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Expanded(
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            children: [
              Icon(icon, color: color, size: 24),
              const SizedBox(height: 4),
              Text(
                value,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class ChartPanel<T> extends StatelessWidget {
  final List<T> data;
  final String Function(T) getXLabel;
  final double Function(T) getYValue;
  final double Function(T) getAvg;
  final Color color;

  const ChartPanel({
    super.key,
    required this.data,
    required this.getXLabel,
    required this.getYValue,
    required this.getAvg,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
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
                  return Text(
                    getXLabel(data[idx]),
                    style: const TextStyle(fontSize: 9),
                  );
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
}
