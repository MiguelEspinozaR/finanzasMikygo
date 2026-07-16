package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"finanzasMikygo/internal/config"
	"finanzasMikygo/internal/dto"
	"finanzasMikygo/internal/service"

	"github.com/gin-gonic/gin"
)

type IngresoHandler struct {
	svc *service.IngresoService
}

func NewIngresoHandler(svc *service.IngresoService) *IngresoHandler {
	return &IngresoHandler{svc: svc}
}

// Create godoc
// @Summary      Crear ingreso
// @Description  Crear un nuevo ingreso
// @Tags         Ingresos
// @Accept       json
// @Produce      json
// @Param        ingreso  body      dto.CreateIngresoRequest  true  "Ingreso a crear"
// @Success      201      {object}  dto.IngresoResponse
// @Failure      400      {object}  dto.ErrorResponse
// @Router       /ingresos [post]
func (h *IngresoHandler) Create(c *gin.Context) {
	var req dto.CreateIngresoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// GetAll godoc
// @Summary      Listar ingresos
// @Description  Listar todos los ingresos con filtros
// @Tags         Ingresos
// @Accept       json
// @Produce      json
// @Param        fecha_inicio  query     string  false  "Fecha inicio (YYYY-MM-DD)"
// @Param        fecha_fin     query     string  false  "Fecha fin (YYYY-MM-DD)"
// @Param        tipo          query     string  false  "Tipo de ingreso"
// @Param        page          query     int     false  "Página"
// @Param        page_size     query     int     false  "Tamaño de página"
// @Success      200           {object}  dto.IngresoListResponse
// @Router       /ingresos [get]
func (h *IngresoHandler) GetAll(c *gin.Context) {
	var fechaInicio, fechaFin *time.Time
	var tipo *string

	if fi := c.Query("fecha_inicio"); fi != "" {
		t, err := time.ParseInLocation("2006-01-02", fi, config.Location)
		if err == nil {
			fechaInicio = &t
		}
	}
	if ff := c.Query("fecha_fin"); ff != "" {
		t, err := time.ParseInLocation("2006-01-02", ff, config.Location)
		if err == nil {
			fechaFin = &t
		}
	}
	if t := c.Query("tipo"); t != "" {
		tipo = &t
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	resp, err := h.svc.GetAll(c.Request.Context(), fechaInicio, fechaFin, tipo, page, pageSize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetByID godoc
// @Summary      Obtener ingreso
// @Description  Obtener un ingreso por ID
// @Tags         Ingresos
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "ID del ingreso"
// @Success      200  {object}  dto.IngresoResponse
// @Router       /ingresos/{id} [get]
func (h *IngresoHandler) GetByID(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	resp, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Update godoc
// @Summary      Actualizar ingreso
// @Description  Actualizar un ingreso existente
// @Tags         Ingresos
// @Accept       json
// @Produce      json
// @Param        id        path      int                       true  "ID del ingreso"
// @Param        ingreso   body      dto.UpdateIngresoRequest   true  "Datos a actualizar"
// @Success      200       {object}  dto.IngresoResponse
// @Router       /ingresos/{id} [put]
func (h *IngresoHandler) Update(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	var req dto.UpdateIngresoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.svc.Update(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// Delete godoc
// @Summary      Eliminar ingreso
// @Description  Eliminar un ingreso por ID
// @Tags         Ingresos
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "ID del ingreso"
// @Success      200  {object}  dto.SuccessResponse
// @Router       /ingresos/{id} [delete]
func (h *IngresoHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "Ingreso eliminado"})
}

// GetFechasOcupadas godoc
// @Summary      Obtener fechas ocupadas
// @Description  Obtener fechas ocupadas en el calendario
// @Tags         Ingresos
// @Accept       json
// @Produce      json
// @Param        mes    query     int  true  "Mes"
// @Param        anio   query     int  true  "Año"
// @Success      200    {object}  map[string][]string
// @Router       /ingresos/fechas-ocupadas [get]
func (h *IngresoHandler) GetFechasOcupadas(c *gin.Context) {
	mes, _ := strconv.Atoi(c.Query("mes"))
	anio, _ := strconv.Atoi(c.Query("anio"))

	fechas, err := h.svc.GetFechasOcupadas(c.Request.Context(), mes, anio)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, fechas)
}

// Upload godoc
// @Summary      Subir imagen
// @Description  Subir una imagen de comprobante
// @Tags         Ingresos
// @Accept       multipart/form-data
// @Produce      json
// @Param        file  formData  file  true  "Imagen a subir"
// @Success      200   {object}  dto.SuccessResponse
// @Router       /ingresos/upload [post]
func (h *IngresoHandler) Upload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "File is required"})
		return
	}

	// Validate file size (10MB max)
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "File size exceeds 10MB"})
		return
	}

	// Get file extension
	ext := ""
	for i := len(file.Filename) - 1; i >= 0; i-- {
		if file.Filename[i] == '.' {
			ext = file.Filename[i:]
			break
		}
	}

	// Check for ingreso_id in form
	ingresoID := c.PostForm("ingreso_id")
	var filename string
	if ingresoID != "" {
		filename = fmt.Sprintf("pago_%s%s", ingresoID, ext)
	} else {
		filename = strconv.FormatInt(time.Now().UnixNano(), 10) + "_" + file.Filename
	}

	dst := "./uploads/" + filename
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: "Failed to save file"})
		return
	}

	if ingresoID != "" {
		if id, err := strconv.ParseInt(ingresoID, 10, 64); err == nil {
			_ = h.svc.UpdateImagenRuta(c.Request.Context(), id, "/uploads/"+filename)
		}
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "/uploads/" + filename})
}
