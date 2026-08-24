package handler

import (
	"net/http"
	"strconv"

	"finanzasMikygo/internal/dto"
	"finanzasMikygo/internal/service"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	svc *service.DashboardService
}

func NewDashboardHandler(svc *service.DashboardService) *DashboardHandler {
	return &DashboardHandler{svc: svc}
}

// parseFuenteID extrae el query param opcional fuente_id.
// Retorna nil si no está presente o es inválido (sin filtro).
func parseFuenteID(c *gin.Context) *int64 {
	s := c.Query("fuente_id")
	if s == "" {
		return nil
	}
	v, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return nil
	}
	return &v
}

// GetSummary godoc
// @Summary      Resumen del dashboard
// @Description  Obtener días trabajados y de pago del mes
// @Tags         Dashboard
// @Accept       json
// @Produce      json
// @Param        mes        query     int      true  "Mes"
// @Param        anio       query     int      true  "Año"
// @Param        fuente_id  query     int      false "Filtro por fuente (opcional)"
// @Success      200    {object}  dto.DashboardSummaryResponse
// @Router       /dashboard/summary [get]
func (h *DashboardHandler) GetSummary(c *gin.Context) {
	mes, _ := strconv.Atoi(c.Query("mes"))
	anio, _ := strconv.Atoi(c.Query("anio"))

	resp, err := h.svc.GetSummary(c.Request.Context(), anio, mes, parseFuenteID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetWeekly godoc
// @Summary      Ingresos semanales
// @Description  Obtener ingresos de la semana
// @Tags         Dashboard
// @Accept       json
// @Produce      json
// @Param        fecha      query     string   false "Fecha de referencia (YYYY-MM-DD)"
// @Param        fuente_id  query     int      false "Filtro por fuente (opcional)"
// @Success      200    {array}   dto.DashboardWeeklyResponse
// @Router       /dashboard/weekly [get]
func (h *DashboardHandler) GetWeekly(c *gin.Context) {
	fecha := c.Query("fecha")

	resp, err := h.svc.GetWeekly(c.Request.Context(), fecha, parseFuenteID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetMonthly godoc
// @Summary      Ingresos mensuales
// @Description  Obtener ingresos del mes
// @Tags         Dashboard
// @Accept       json
// @Produce      json
// @Param        mes        query     int      true  "Mes"
// @Param        anio       query     int      true  "Año"
// @Param        fuente_id  query     int      false "Filtro por fuente (opcional)"
// @Success      200    {array}   dto.DashboardMonthlyResponse
// @Router       /dashboard/monthly [get]
func (h *DashboardHandler) GetMonthly(c *gin.Context) {
	mes, _ := strconv.Atoi(c.Query("mes"))
	anio, _ := strconv.Atoi(c.Query("anio"))

	resp, err := h.svc.GetMonthly(c.Request.Context(), anio, mes, parseFuenteID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetYearly godoc
// @Summary      Ingresos anuales
// @Description  Obtener ingresos del año
// @Tags         Dashboard
// @Accept       json
// @Produce      json
// @Param        anio       query     int      true  "Año"
// @Param        fuente_id  query     int      false "Filtro por fuente (opcional)"
// @Success      200    {array}   dto.DashboardYearlyResponse
// @Router       /dashboard/yearly [get]
func (h *DashboardHandler) GetYearly(c *gin.Context) {
	anio, _ := strconv.Atoi(c.Query("anio"))

	resp, err := h.svc.GetYearly(c.Request.Context(), anio, parseFuenteID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetHistory godoc
// @Summary      Histórico de ingresos
// @Description  Obtener histórico completo de ingresos
// @Tags         Dashboard
// @Accept       json
// @Produce      json
// @Param        fuente_id  query     int      false "Filtro por fuente (opcional)"
// @Success      200  {array}   dto.DashboardHistoryResponse
// @Router       /dashboard/history [get]
func (h *DashboardHandler) GetHistory(c *gin.Context) {
	resp, err := h.svc.GetHistory(c.Request.Context(), parseFuenteID(c))
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
