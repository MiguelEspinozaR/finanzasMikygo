package dto

import "time"

type UpdateSplitConfigRequest struct {
	CuentaID           int64   `json:"cuenta_id" binding:"required"`
	Porcentaje         float64 `json:"porcentaje" binding:"required,min=0,max=100"`
	AplicarAPendientes bool    `json:"aplicar_a_pendientes"`
}

type UpdateAllSplitConfigRequest struct {
	Configuraciones []UpdateSplitConfigRequest `json:"configuraciones" binding:"required,min=1"`
}

type MarcarSplitRealizadoRequest struct {
	Realizado bool `json:"realizado"`
}

type UpdateSplitRequest struct {
	MontoEnteros *int64 `json:"monto_enteros"`
}

type SplitConfigResponse struct {
	ID         int64   `json:"id"`
	CuentaID   int64   `json:"cuenta_id"`
	CuentaAlias string `json:"cuenta_alias"`
	CuentaTipo string  `json:"cuenta_tipo"`
	Porcentaje float64 `json:"porcentaje"`
	Orden      int     `json:"orden"`
}

type SplitConfigListResponse struct {
	Data []SplitConfigResponse `json:"data"`
}

type SplitResponse struct {
	ID              int64   `json:"id"`
	IngresoID       int64   `json:"ingreso_id"`
	IngresoMonto    int64   `json:"ingreso_monto"`
	IngresoFechaPago string `json:"ingreso_fecha_pago"`
	CuentaID        int64   `json:"cuenta_id"`
	CuentaAlias     string  `json:"cuenta_alias"`
	CuentaTipo      string  `json:"cuenta_tipo"`
	QrRuta          *string `json:"qr_ruta"`
	Porcentaje      float64 `json:"porcentaje"`
	MontoEnteros    int64   `json:"monto_enteros"`
	MontoDisplay    string  `json:"monto_display"`
	Realizado       bool    `json:"realizado"`
	FechaRealizado  *string `json:"fecha_realizado"`
	CreatedAt       string  `json:"created_at"`
	UpdatedAt       string  `json:"updated_at"`
}

type SplitListResponse struct {
	Data []SplitResponse `json:"data"`
}

func FormatSplitResponse(
	id, ingresoID, ingresoMonto, montoEnteros int64,
	ingresoFechaPago time.Time,
	cuentaID int64, cuentaAlias, cuentaTipo string,
	qrRuta *string,
	porcentaje float64,
	realizado bool,
	fechaRealizado *time.Time,
	createdAt, updatedAt time.Time,
) SplitResponse {
	var fr *string
	if fechaRealizado != nil {
		s := fechaRealizado.Format("2006-01-02T15:04:05Z07:00")
		fr = &s
	}

	return SplitResponse{
		ID:               id,
		IngresoID:        ingresoID,
		IngresoMonto:     ingresoMonto,
		IngresoFechaPago: ingresoFechaPago.Format("2006-01-02"),
		CuentaID:         cuentaID,
		CuentaAlias:      cuentaAlias,
		CuentaTipo:       cuentaTipo,
		QrRuta:           qrRuta,
		Porcentaje:       porcentaje,
		MontoEnteros:     montoEnteros,
		MontoDisplay:     FormatMonto(montoEnteros),
		Realizado:        realizado,
		FechaRealizado:   fr,
		CreatedAt:        createdAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:        updatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
