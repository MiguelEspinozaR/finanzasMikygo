import 'package:flutter/material.dart';

class SummaryCards extends StatelessWidget {
  final dynamic summary;
  final int totalSemanal;
  final int totalMensual;

  const SummaryCards({
    super.key,
    required this.summary,
    required this.totalSemanal,
    required this.totalMensual,
  });

  @override
  Widget build(BuildContext context) {
    String formatMonto(int centavos) {
      return '${(centavos / 100).toStringAsFixed(2)} BOB';
    }

    return Column(
      children: [
        Row(
          children: [
            _buildCard(
              context,
              label: 'Días Trabajados',
              value: summary.diasTrabajados.length.toString(),
              icon: Icons.calendar_today,
              color: Colors.blue,
            ),
            const SizedBox(width: 8),
            _buildCard(
              context,
              label: 'Días de Pago',
              value: summary.diasPago.length.toString(),
              icon: Icons.payments_outlined,
              color: Colors.green,
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            _buildCard(
              context,
              label: 'Total Semanal',
              value: formatMonto(totalSemanal),
              icon: Icons.trending_up,
              color: Colors.purple,
            ),
            const SizedBox(width: 8),
            _buildCard(
              context,
              label: 'Total Mensual',
              value: formatMonto(totalMensual),
              icon: Icons.bar_chart,
              color: Colors.orange,
            ),
          ],
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
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
                textAlign: TextAlign.center,
              ),
              Text(
                label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 11,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
