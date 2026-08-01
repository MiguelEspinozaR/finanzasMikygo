package handler

import (
	"net/http"
	"strconv"

	"finanzasMikygo/internal/dto"
	"finanzasMikygo/internal/service"

	"github.com/gin-gonic/gin"
)

type SplitHandler struct {
	svc *service.SplitService
}

func NewSplitHandler(svc *service.SplitService) *SplitHandler {
	return &SplitHandler{svc: svc}
}

func (h *SplitHandler) GetConfiguraciones(c *gin.Context) {
	resp, err := h.svc.GetConfiguraciones(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SplitConfigListResponse{Data: resp})
}

func (h *SplitHandler) GetConfiguracionesByFuente(c *gin.Context) {
	fuenteIDStr := c.Query("fuente_id")
	var fuenteID *int64
	if fuenteIDStr != "" {
		id, err := strconv.ParseInt(fuenteIDStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid fuente_id"})
			return
		}
		fuenteID = &id
	}

	resp, err := h.svc.GetConfiguracionesByFuente(c.Request.Context(), fuenteID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SplitConfigListResponse{Data: resp})
}

func (h *SplitHandler) UpdateConfiguraciones(c *gin.Context) {
	var req dto.UpdateAllSplitConfigRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.svc.UpdateConfiguraciones(c.Request.Context(), req); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "configuracion actualizada"})
}

func (h *SplitHandler) GetAll(c *gin.Context) {
	resp, err := h.svc.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SplitListResponse{Data: resp})
}

func (h *SplitHandler) GetByIngresoID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	resp, err := h.svc.GetByIngresoID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SplitListResponse{Data: resp})
}

func (h *SplitHandler) MarcarRealizado(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	var req dto.MarcarSplitRealizadoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if err := h.svc.MarcarRealizado(c.Request.Context(), id, req.Realizado); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "split actualizado"})
}

func (h *SplitHandler) UpdateMonto(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	var req dto.UpdateSplitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	if req.MontoEnteros == nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "monto_enteros required"})
		return
	}

	if *req.MontoEnteros < 0 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "monto_enteros must be positive"})
		return
	}

	if err := h.svc.UpdateMonto(c.Request.Context(), id, *req.MontoEnteros); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "split actualizado"})
}

func (h *SplitHandler) DeleteSplit(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	if err := h.svc.DeleteSplit(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "split eliminado"})
}

func (h *SplitHandler) CreateCuenta(c *gin.Context) {
	var req dto.CreateCuentaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.svc.CreateCuenta(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *SplitHandler) GetAllCuentas(c *gin.Context) {
	resp, err := h.svc.GetAllCuentas(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.CuentaListResponse{Data: resp})
}

func (h *SplitHandler) GetCuentaByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	resp, err := h.svc.GetCuentaByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *SplitHandler) UpdateCuenta(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	var req dto.UpdateCuentaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.svc.UpdateCuenta(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *SplitHandler) DeleteCuenta(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	if err := h.svc.DeleteCuenta(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "cuenta eliminada"})
}

func (h *SplitHandler) UpdateQr(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	file, err := c.FormFile("qr")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "archivo qr requerido"})
		return
	}

	ext := ""
	for i := len(file.Filename) - 1; i >= 0; i-- {
		if file.Filename[i] == '.' {
			ext = file.Filename[i+1:]
			break
		}
	}

	filename := "cuenta_qr_" + strconv.FormatInt(id, 10) + "." + ext
	if err := c.SaveUploadedFile(file, "uploads/"+filename); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "error guardando archivo"})
		return
	}

	qrRuta := &filename
	if err := h.svc.UpdateQr(c.Request.Context(), id, qrRuta); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "qr actualizado"})
}

func (h *SplitHandler) DeleteQr(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	if err := h.svc.UpdateQr(c.Request.Context(), id, nil); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "qr eliminado"})
}

func (h *SplitHandler) GetIngresosConSplits(c *gin.Context) {
	ids, err := h.svc.GetIngresosConSplits(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": ids})
}

func (h *SplitHandler) GenerarPorIngreso(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	if err := h.svc.GenerarPorIngreso(c.Request.Context(), id); err != nil {
		if err.Error() == "ya tiene splits" {
			c.JSON(http.StatusConflict, dto.ErrorResponse{Error: err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, dto.SuccessResponse{Message: "splits generados"})
}
