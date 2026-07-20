package dto

import (
	"fmt"
	"time"
)

type FechaTrabajoRequest struct {
	Fecha string `json:"fecha" binding:"required"`
}

type CreateIngresoRequest struct {
	FechaPago     string                  `json:"fecha_pago" binding:"required"`
	MontoEnteros  int64                   `json:"monto_enteros" binding:"required,gt=0"`
	Tipo          string                  `json:"tipo" binding:"required,oneof=qr efectivo"`
	Comentario    *string                 `json:"comentario"`
	ImagenRuta    *string                 `json:"imagen_ruta"`
	FechasTrabajo []FechaTrabajoRequest   `json:"fechas_trabajo" binding:"required,min=1"`
}

type UpdateIngresoRequest struct {
	FechaPago     *string                 `json:"fecha_pago"`
	MontoEnteros  *int64                  `json:"monto_enteros"`
	Tipo          *string                 `json:"tipo" binding:"omitempty,oneof=qr efectivo"`
	Comentario    *string                 `json:"comentario"`
	ImagenRuta    *string                 `json:"imagen_ruta"`
	FechasTrabajo []FechaTrabajoRequest   `json:"fechas_trabajo"`
}

type FechaTrabajoResponse struct {
	Fecha        time.Time `json:"fecha"`
	MontoEnteros int64     `json:"monto_enteros"`
	MontoDisplay string    `json:"monto_display"`
}

type IngresoResponse struct {
	ID            int64                   `json:"id"`
	FechaPago     time.Time               `json:"fecha_pago"`
	MontoEnteros  int64                   `json:"monto_enteros"`
	MontoDisplay  string                  `json:"monto_display"`
	Tipo          string                  `json:"tipo"`
	Comentario    *string                 `json:"comentario"`
	ImagenRuta    *string                 `json:"imagen_ruta"`
	FechasTrabajo []FechaTrabajoResponse  `json:"fechas_trabajo"`
	CreatedAt     time.Time               `json:"created_at"`
	UpdatedAt     time.Time               `json:"updated_at"`
}

type IngresoListResponse struct {
	Data       []IngresoResponse `json:"data"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	PageSize   int               `json:"page_size"`
}

type DashboardSummaryResponse struct {
	DiasTrabajados []string `json:"dias_trabajados"`
	DiasPago       []string `json:"dias_pago"`
}

type DashboardWeeklyResponse struct {
	Dia      string `json:"dia"`
	Monto    int64  `json:"monto"`
	Promedio int64  `json:"promedio"`
}

type DashboardMonthlyDayResponse struct {
	Fecha string `json:"fecha"`
	Monto int64  `json:"monto"`
}

type DashboardMonthlyResponse struct {
	Semana   string                       `json:"semana"`
	Monto    int64                        `json:"monto"`
	Promedio int64                        `json:"promedio"`
	Dias     []DashboardMonthlyDayResponse `json:"dias"`
}

type DashboardYearlyResponse struct {
	Mes      string `json:"mes"`
	Monto    int64  `json:"monto"`
	Promedio int64  `json:"promedio"`
}

type DashboardHistoryResponse struct {
	Mes            string `json:"mes"`
	Monto          int64  `json:"monto"`
	Promedio       int64  `json:"promedio"`
	TendenciaGlobal int64 `json:"tendencia_global"`
}

type SQLExecuteRequest struct {
	Query string `json:"query" binding:"required"`
}

type SQLExecuteResponse struct {
	Columns []string        `json:"columns"`
	Rows    [][]interface{} `json:"rows"`
	Time    string          `json:"time"`
}

type SQLSchemaResponse struct {
	Tables []SQLTableInfo `json:"tables"`
}

type SQLTableInfo struct {
	Name    string         `json:"name"`
	Columns []SQLColumnInfo `json:"columns"`
}

type SQLColumnInfo struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	Nullable string `json:"nullable"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

type SuccessResponse struct {
	Message string `json:"message"`
}

func FormatMonto(montoEnteros int64) string {
	whole := montoEnteros / 100
	fraction := montoEnteros % 100
	if fraction < 0 {
		fraction = -fraction
	}
	return fmt.Sprintf("%d.%02d BOB", whole, fraction)
}
