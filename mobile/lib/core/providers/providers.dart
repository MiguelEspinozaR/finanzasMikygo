import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../network/api_client.dart';
import '../models/ingreso.dart';

final apiClientProvider = Provider<ApiClient>((ref) => ApiClient());

// Ingresos list
class IngresosParams {
  final int page;
  final int pageSize;
  final String? tipo;
  final String? fechaInicio;
  final String? fechaFin;

  const IngresosParams({
    this.page = 1,
    this.pageSize = 1000,
    this.tipo,
    this.fechaInicio,
    this.fechaFin,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is IngresosParams &&
          page == other.page &&
          pageSize == other.pageSize &&
          tipo == other.tipo &&
          fechaInicio == other.fechaInicio &&
          fechaFin == other.fechaFin;

  @override
  int get hashCode => Object.hash(page, pageSize, tipo, fechaInicio, fechaFin);
}

final ingresosProvider = FutureProvider.autoDispose.family<IngresoListResponse, IngresosParams>((ref, params) async {
  final api = ref.read(apiClientProvider);
  return api.getIngresos(
    page: params.page,
    pageSize: params.pageSize,
    tipo: params.tipo,
    fechaInicio: params.fechaInicio,
    fechaFin: params.fechaFin,
  );
});

// Ingreso by ID
final ingresoByIdProvider = FutureProvider.autoDispose.family<Ingreso, int>((ref, id) async {
  final api = ref.read(apiClientProvider);
  return api.getIngresoById(id);
});

// Fechas ocupadas
final fechasOcupadasProvider = FutureProvider.autoDispose.family<Map<String, List<String>>, ({int mes, int anio})>((ref, params) async {
  final api = ref.read(apiClientProvider);
  return api.getFechasOcupadas(params.mes, params.anio);
});

// Dashboard summary
final dashboardSummaryProvider = FutureProvider.autoDispose.family<DashboardSummary, ({int mes, int anio})>((ref, params) async {
  final api = ref.read(apiClientProvider);
  return api.getDashboardSummary(params.mes, params.anio);
});

// Dashboard weekly
final dashboardWeeklyProvider = FutureProvider.autoDispose.family<List<DashboardWeeklyData>, String>((ref, fecha) async {
  final api = ref.read(apiClientProvider);
  return api.getWeekly(fecha.isEmpty ? null : fecha);
});

// Dashboard monthly
final dashboardMonthlyProvider = FutureProvider.autoDispose.family<List<DashboardMonthlyData>, ({int mes, int anio})>((ref, params) async {
  final api = ref.read(apiClientProvider);
  return api.getMonthly(params.mes, params.anio);
});

// Dashboard yearly
final dashboardYearlyProvider = FutureProvider.autoDispose.family<List<DashboardYearlyData>, int>((ref, anio) async {
  final api = ref.read(apiClientProvider);
  return api.getYearly(anio);
});

// Dashboard history
final dashboardHistoryProvider = FutureProvider.autoDispose<List<DashboardHistoryData>>((ref) async {
  final api = ref.read(apiClientProvider);
  return api.getHistory();
});
