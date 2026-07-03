import 'package:dio/dio.dart';
import '../models/ingreso.dart';

class ApiClient {
  late final Dio _dio;

  ApiClient({String baseUrl = 'http://10.0.2.2:8080/api/v1'}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 7),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Accept': 'application/json'},
    ));
  }

  Dio get dio => _dio;

  // Ingresos
  Future<IngresoListResponse> getIngresos({
    int page = 1,
    int pageSize = 1000,
    String? tipo,
    String? fechaInicio,
    String? fechaFin,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'page_size': pageSize,
    };
    if (tipo != null && tipo.isNotEmpty) params['tipo'] = tipo;
    if (fechaInicio != null && fechaInicio.isNotEmpty) params['fecha_inicio'] = fechaInicio;
    if (fechaFin != null && fechaFin.isNotEmpty) params['fecha_fin'] = fechaFin;

    final response = await _dio.get('/ingresos', queryParameters: params);
    return IngresoListResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Ingreso> getIngresoById(int id) async {
    final response = await _dio.get('/ingresos/$id');
    return Ingreso.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Ingreso> createIngreso(CreateIngresoRequest request) async {
    final response = await _dio.post('/ingresos', data: request.toJson());
    return Ingreso.fromJson(response.data as Map<String, dynamic>);
  }

  Future<Ingreso> updateIngreso(int id, UpdateIngresoRequest request) async {
    final response = await _dio.put('/ingresos/$id', data: request.toJson());
    return Ingreso.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> deleteIngreso(int id) async {
    await _dio.delete('/ingresos/$id');
  }

  Future<Map<String, dynamic>> uploadImage(String filePath, {int? ingresoId}) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath),
      if (ingresoId != null) 'ingreso_id': ingresoId.toString(),
    });
    final response = await _dio.post('/ingresos/upload', data: formData);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, List<String>>> getFechasOcupadas(int mes, int anio) async {
    final response = await _dio.get('/ingresos/fechas-ocupadas', queryParameters: {'mes': mes, 'anio': anio});
    final raw = response.data as Map<String, dynamic>;
    return raw.map((key, value) => MapEntry(key, List<String>.from(value as List)));
  }

  // Dashboard
  Future<DashboardSummary> getDashboardSummary(int mes, int anio) async {
    final response = await _dio.get('/dashboard/summary', queryParameters: {'mes': mes, 'anio': anio});
    return DashboardSummary.fromJson(response.data as Map<String, dynamic>);
  }

  Future<List<DashboardWeeklyData>> getWeekly(String? fecha) async {
    final response = await _dio.get('/dashboard/weekly', queryParameters: fecha != null ? {'fecha': fecha} : {});
    return (response.data as List<dynamic>)
        .map((e) => DashboardWeeklyData.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<DashboardMonthlyData>> getMonthly(int mes, int anio) async {
    final response = await _dio.get('/dashboard/monthly', queryParameters: {'mes': mes, 'anio': anio});
    return (response.data as List<dynamic>)
        .map((e) => DashboardMonthlyData.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<DashboardYearlyData>> getYearly(int anio) async {
    final response = await _dio.get('/dashboard/yearly', queryParameters: {'anio': anio});
    return (response.data as List<dynamic>)
        .map((e) => DashboardYearlyData.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<DashboardHistoryData>> getHistory() async {
    final response = await _dio.get('/dashboard/history');
    return (response.data as List<dynamic>)
        .map((e) => DashboardHistoryData.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
