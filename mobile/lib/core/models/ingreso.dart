class Ingreso {
  final int id;
  final DateTime fechaPago;
  final int montoEnteros;
  final String montoDisplay;
  final String tipo;
  final String? comentario;
  final String? imagenRuta;
  final List<DateTime> fechasTrabajo;
  final DateTime createdAt;
  final DateTime updatedAt;

  Ingreso({
    required this.id,
    required this.fechaPago,
    required this.montoEnteros,
    required this.montoDisplay,
    required this.tipo,
    this.comentario,
    this.imagenRuta,
    required this.fechasTrabajo,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Ingreso.fromJson(Map<String, dynamic> json) {
    return Ingreso(
      id: json['id'] as int,
      fechaPago: DateTime.parse(json['fecha_pago'] as String),
      montoEnteros: json['monto_enteros'] as int,
      montoDisplay: json['monto_display'] as String,
      tipo: json['tipo'] as String,
      comentario: json['comentario'] as String?,
      imagenRuta: json['imagen_ruta'] as String?,
      fechasTrabajo: (json['fechas_trabajo'] as List<dynamic>)
          .map((e) => DateTime.parse(e as String))
          .toList(),
      createdAt: DateTime.parse(json['created_at'] as String),
      updatedAt: DateTime.parse(json['updated_at'] as String),
    );
  }

  double get montoBOB => montoEnteros / 100.0;
}

class IngresoListResponse {
  final List<Ingreso> data;
  final int total;
  final int page;
  final int pageSize;

  IngresoListResponse({
    required this.data,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  factory IngresoListResponse.fromJson(Map<String, dynamic> json) {
    return IngresoListResponse(
      data: (json['data'] as List<dynamic>)
          .map((e) => Ingreso.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int,
      page: json['page'] as int,
      pageSize: json['page_size'] as int,
    );
  }
}

class DashboardSummary {
  final List<String> diasTrabajados;
  final List<String> diasPago;

  DashboardSummary({required this.diasTrabajados, required this.diasPago});

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      diasTrabajados: List<String>.from(json['dias_trabajados'] ?? []),
      diasPago: List<String>.from(json['dias_pago'] ?? []),
    );
  }
}

class DashboardWeeklyData {
  final String dia;
  final int monto;
  final int promedio;

  DashboardWeeklyData({required this.dia, required this.monto, required this.promedio});

  factory DashboardWeeklyData.fromJson(Map<String, dynamic> json) {
    return DashboardWeeklyData(
      dia: json['dia'] as String,
      monto: json['monto'] as int,
      promedio: json['promedio'] as int,
    );
  }

  double get montoBOB => monto / 100.0;
  double get promedioBOB => promedio / 100.0;
}

class DashboardMonthlyData {
  final String semana;
  final int monto;
  final int promedio;

  DashboardMonthlyData({required this.semana, required this.monto, required this.promedio});

  factory DashboardMonthlyData.fromJson(Map<String, dynamic> json) {
    return DashboardMonthlyData(
      semana: json['semana'] as String,
      monto: json['monto'] as int,
      promedio: json['promedio'] as int,
    );
  }

  double get montoBOB => monto / 100.0;
  double get promedioBOB => promedio / 100.0;
}

class DashboardYearlyData {
  final String mes;
  final int monto;
  final int promedio;

  DashboardYearlyData({required this.mes, required this.monto, required this.promedio});

  factory DashboardYearlyData.fromJson(Map<String, dynamic> json) {
    return DashboardYearlyData(
      mes: json['mes'] as String,
      monto: json['monto'] as int,
      promedio: json['promedio'] as int,
    );
  }

  double get montoBOB => monto / 100.0;
  double get promedioBOB => promedio / 100.0;
}

class DashboardHistoryData {
  final String fecha;
  final int monto;
  final int promedio;

  DashboardHistoryData({required this.fecha, required this.monto, required this.promedio});

  factory DashboardHistoryData.fromJson(Map<String, dynamic> json) {
    return DashboardHistoryData(
      fecha: json['fecha'] as String,
      monto: json['monto'] as int,
      promedio: json['promedio'] as int,
    );
  }

  double get montoBOB => monto / 100.0;
  double get promedioBOB => promedio / 100.0;
}

class CreateIngresoRequest {
  final String fechaPago;
  final int montoEnteros;
  final String tipo;
  final String? comentario;
  final String? imagenRuta;
  final List<String> fechasTrabajo;

  CreateIngresoRequest({
    required this.fechaPago,
    required this.montoEnteros,
    required this.tipo,
    this.comentario,
    this.imagenRuta,
    required this.fechasTrabajo,
  });

  Map<String, dynamic> toJson() => {
        'fecha_pago': fechaPago,
        'monto_enteros': montoEnteros,
        'tipo': tipo,
        if (comentario != null) 'comentario': comentario,
        if (imagenRuta != null) 'imagen_ruta': imagenRuta,
        'fechas_trabajo': fechasTrabajo,
      };
}
