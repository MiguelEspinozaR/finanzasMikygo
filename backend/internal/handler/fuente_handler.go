package handler

import (
	"net/http"
	"strconv"

	"finanzasMikygo/internal/dto"
	"finanzasMikygo/internal/service"

	"github.com/gin-gonic/gin"
)

type FuenteHandler struct {
	svc *service.FuenteService
}

func NewFuenteHandler(svc *service.FuenteService) *FuenteHandler {
	return &FuenteHandler{svc: svc}
}

func (h *FuenteHandler) GetAll(c *gin.Context) {
	resp, err := h.svc.GetAll(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.FuenteListResponse{Data: resp})
}

func (h *FuenteHandler) GetByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	resp, err := h.svc.GetByID(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, dto.ErrorResponse{Error: "fuente not found"})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *FuenteHandler) Create(c *gin.Context) {
	var req dto.CreateFuenteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.svc.Create(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *FuenteHandler) Update(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	var req dto.UpdateFuenteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	resp, err := h.svc.Update(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

func (h *FuenteHandler) Delete(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: "invalid id"})
		return
	}

	if err := h.svc.Delete(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}

	c.JSON(http.StatusOK, dto.SuccessResponse{Message: "fuente eliminada"})
}
