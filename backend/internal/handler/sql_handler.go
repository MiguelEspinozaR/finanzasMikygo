package handler

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"finanzasMikygo/internal/dto"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type SQLHandler struct {
	db *pgxpool.Pool
}

func NewSQLHandler(db *pgxpool.Pool) *SQLHandler {
	return &SQLHandler{db: db}
}

// Execute godoc
// @Summary      Ejecutar SQL
// @Description  Ejecutar una consulta SQL (solo desarrollo)
// @Tags         SQL
// @Accept       json
// @Produce      json
// @Param        query  body      dto.SQLExecuteRequest  true  "Query SQL"
// @Success      200    {object}  dto.SQLExecuteResponse
// @Router       /sql/execute [post]
func (h *SQLHandler) Execute(c *gin.Context) {
	var req dto.SQLExecuteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}

	start := time.Now()

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx, req.Query)
	if err != nil {
		c.JSON(http.StatusBadRequest, dto.ErrorResponse{Error: err.Error()})
		return
	}
	defer rows.Close()

	columns := make([]string, len(rows.FieldDescriptions()))
	for i, desc := range rows.FieldDescriptions() {
		columns[i] = desc.Name
	}

	var allRows [][]interface{}
	for rows.Next() {
		values, err := rows.Values()
		if err != nil {
			c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
			return
		}
		// Convert monetary values to BOB display
		for i, v := range values {
			if val, ok := v.(int64); ok {
				// Check if this might be a monetary column (heuristic: column name contains 'monto')
				if len(columns) > i && (columns[i] == "monto_enteros" || columns[i] == "monto") {
					values[i] = dto.FormatMonto(val)
				}
			}
		}
		allRows = append(allRows, values)
	}

	elapsed := time.Since(start)

	c.JSON(http.StatusOK, dto.SQLExecuteResponse{
		Columns: columns,
		Rows:    allRows,
		Time:    fmt.Sprintf("%.2fms", elapsed.Seconds()*1000),
	})
}

// GetSchema godoc
// @Summary      Obtener esquema
// @Description  Obtener información del esquema de tablas
// @Tags         SQL
// @Accept       json
// @Produce      json
// @Success      200  {object}  dto.SQLSchemaResponse
// @Router       /sql/schema [get]
func (h *SQLHandler) GetSchema(c *gin.Context) {
	ctx, cancel := context.WithTimeout(c.Request.Context(), 10*time.Second)
	defer cancel()

	rows, err := h.db.Query(ctx,
		`SELECT table_name FROM information_schema.tables
		 WHERE table_schema = 'public' ORDER BY table_name`)
	if err != nil {
		c.JSON(http.StatusInternalServerError, dto.ErrorResponse{Error: err.Error()})
		return
	}
	defer rows.Close()

	var tables []dto.SQLTableInfo
	for rows.Next() {
		var tableName string
		if err := rows.Scan(&tableName); err != nil {
			continue
		}

		colRows, err := h.db.Query(ctx,
			`SELECT column_name, data_type, is_nullable
			 FROM information_schema.columns
			 WHERE table_name = $1 AND table_schema = 'public'
			 ORDER BY ordinal_position`, tableName)
		if err != nil {
			continue
		}

		var columns []dto.SQLColumnInfo
		for colRows.Next() {
			var col dto.SQLColumnInfo
			if err := colRows.Scan(&col.Name, &col.Type, &col.Nullable); err != nil {
				continue
			}
			columns = append(columns, col)
		}
		colRows.Close()

		tables = append(tables, dto.SQLTableInfo{
			Name:    tableName,
			Columns: columns,
		})
	}

	c.JSON(http.StatusOK, dto.SQLSchemaResponse{Tables: tables})
}
